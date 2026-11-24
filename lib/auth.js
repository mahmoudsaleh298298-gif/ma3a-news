import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { row } from '@/lib/db';

export const COOKIE = 'ma3a_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 أيام

const secret = () => {
  const s = process.env.AUTH_SECRET || '';
  if (s.length < 32) throw new Error('AUTH_SECRET غير مضبوط أو أقصر من 32 حرفًا');
  return new TextEncoder().encode(s);
};

export async function signToken(userId) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.sub || null;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE,
};

// الجلسة الحالية (أو null). الدور والتفعيل يُقرآن من قاعدة البيانات في كل طلب،
// فإيقاف أي حساب يسري فورًا.
export async function getSession() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const id = await verifyToken(token);
  if (!id) return null;
  const u = await row(
    `SELECT u.id, u.email, p.full_name, p.role, p.is_active
       FROM public.users u JOIN public.profiles p ON p.id = u.id WHERE u.id = $1`,
    [id]
  );
  if (!u || !u.is_active) return null;
  return { id: u.id, email: u.email, name: u.full_name, role: u.role };
}
