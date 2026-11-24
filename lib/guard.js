import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const STAFF = ['admin', 'chief', 'editor', 'writer'];
export const EDITORS = ['admin', 'chief', 'editor'];
export const ROLES = ['admin', 'chief', 'editor', 'writer', 'viewer'];

export const fail = (message, status = 400) => NextResponse.json({ error: message }, { status });

// حماية بسيطة من الطلبات القادمة من مواقع أخرى
export function sameOrigin(req) {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.get('host');
  } catch {
    return false;
  }
}

// يعيد { session } أو { error: Response }
export async function authorize(req, roles) {
  if (!sameOrigin(req)) return { error: fail('طلب مرفوض.', 403) };
  const session = await getSession();
  if (!session) return { error: fail('انتهت الجلسة. سجّل الدخول من جديد.', 401) };
  if (!roles.includes(session.role)) return { error: fail('ليست لديك صلاحية لهذا الإجراء.', 403) };
  return { session };
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
