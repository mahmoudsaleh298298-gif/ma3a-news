import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { row } from '@/lib/db';
import { COOKIE, cookieOptions, signToken } from '@/lib/auth';
import { fail, sameOrigin } from '@/lib/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// حد بسيط للمحاولات الخاطئة لكل عنوان IP (يعمل بأفضل جهد داخل الخادم)
const tries = globalThis.__loginTries || (globalThis.__loginTries = new Map());
let dummy;
const getDummy = () => dummy || (dummy = bcrypt.hashSync('not-a-real-password', 10));

export async function POST(req) {
  if (!sameOrigin(req)) return fail('طلب مرفوض.', 403);
  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  const now = Date.now();
  const t = tries.get(ip);
  if (t && t.until > now) return fail('محاولات كثيرة. انتظر بضع دقائق ثم حاول مجددًا.', 429);

  let body;
  try { body = await req.json(); } catch { return fail('بيانات غير صالحة.'); }
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) return fail('أدخل البريد وكلمة المرور.');

  const u = await row(
    `SELECT u.id, u.password_hash, p.is_active
       FROM public.users u JOIN public.profiles p ON p.id = u.id WHERE u.email = $1`,
    [email]
  );
  const ok = await bcrypt.compare(password, u?.password_hash || getDummy());
  if (!u || !ok || !u.is_active) {
    const n = (t && t.until <= now ? 0 : t?.n || 0) + 1;
    tries.set(ip, { n, until: n >= 8 ? now + 10 * 60 * 1000 : 0 });
    return fail('البريد الإلكتروني أو كلمة المرور غير صحيحة.', 401);
  }
  tries.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await signToken(u.id), cookieOptions);
  return res;
}
