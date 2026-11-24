import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { row, tx } from '@/lib/db';
import { COOKIE, cookieOptions, signToken } from '@/lib/auth';
import { fail, sameOrigin } from '@/lib/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// إنشاء أول مدير. يعمل فقط إذا لم يوجد أي حساب دخول بعد، ويحتاج مفتاح SETUP_KEY.
export async function POST(req) {
  if (!sameOrigin(req)) return fail('طلب مرفوض.', 403);
  const expected = process.env.SETUP_KEY || '';
  if (expected.length < 8) return fail('SETUP_KEY غير مضبوط في Vercel.', 500);

  let b;
  try { b = await req.json(); } catch { return fail('بيانات غير صالحة.'); }
  if (!safeEqual(b.key || '', expected)) return fail('مفتاح الإعداد غير صحيح.', 403);

  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  const name = String(b.name || '').trim() || null;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail('البريد الإلكتروني غير صالح.');
  if (password.length < 8) return fail('كلمة المرور يجب ألا تقل عن 8 أحرف.');

  const existing = await row(`SELECT count(*)::int AS n FROM public.users`);
  if (existing.n > 0) return fail('تم الإعداد من قبل. سجّل الدخول من الصفحة العادية.', 403);

  const hash = await bcrypt.hash(password, 10);
  const id = await tx(async (c) => {
    // إن كان في قاعدة البيانات ملف مدير قديم واحد، نربط الحساب الجديد به فتبقى أخبارك منسوبة إليك
    const admins = (await c.query(`SELECT id FROM public.profiles WHERE role = 'admin'`)).rows;
    let uid;
    if (admins.length === 1) {
      uid = admins[0].id;
      await c.query(`UPDATE public.profiles SET full_name = COALESCE($2, full_name), is_active = true WHERE id = $1`, [uid, name]);
    } else {
      uid = crypto.randomUUID();
      await c.query(`INSERT INTO public.profiles (id, full_name, role, is_active) VALUES ($1, $2, 'admin', true)`, [uid, name]);
    }
    await c.query(`INSERT INTO public.users (id, email, password_hash) VALUES ($1, $2, $3)`, [uid, email, hash]);
    return uid;
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await signToken(id), cookieOptions);
  return res;
}
