import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { row, tx } from '@/lib/db';
import { authorize, fail, UUID, ROLES } from '@/lib/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// إنشاء حساب دخول جديد (للمدير فقط). يمكن ربطه بملف صحفي قديم (linkId) لتبقى أخباره منسوبة إليه.
export async function POST(req) {
  const { error } = await authorize(req, ['admin']);
  if (error) return error;
  let b;
  try { b = await req.json(); } catch { return fail('بيانات غير صالحة.'); }

  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  const name = String(b.name || '').trim() || null;
  const role = ROLES.includes(b.role) ? b.role : 'writer';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail('البريد الإلكتروني غير صالح.');
  if (password.length < 8) return fail('كلمة المرور يجب ألا تقل عن 8 أحرف.');
  if (await row(`SELECT 1 FROM public.users WHERE email = $1`, [email])) return fail('هذا البريد مسجّل من قبل.');

  const linkId = b.linkId ? String(b.linkId) : null;
  if (linkId) {
    if (!UUID.test(linkId)) return fail('معرّف الربط غير صالح.');
    if (!(await row(`SELECT 1 FROM public.profiles WHERE id = $1`, [linkId]))) return fail('الملف المطلوب ربطه غير موجود.');
    if (await row(`SELECT 1 FROM public.users WHERE id = $1`, [linkId])) return fail('هذا الملف لديه حساب دخول بالفعل.');
  }

  const hash = await bcrypt.hash(password, 10);
  const id = await tx(async (c) => {
    const uid = linkId || crypto.randomUUID();
    if (linkId) {
      await c.query(`UPDATE public.profiles SET full_name = COALESCE($2, full_name), role = $3, is_active = true WHERE id = $1`, [uid, name, role]);
    } else {
      await c.query(`INSERT INTO public.profiles (id, full_name, role, is_active) VALUES ($1,$2,$3,true)`, [uid, name, role]);
    }
    await c.query(`INSERT INTO public.users (id, email, password_hash) VALUES ($1,$2,$3)`, [uid, email, hash]);
    return uid;
  });
  return NextResponse.json({ ok: true, id });
}
