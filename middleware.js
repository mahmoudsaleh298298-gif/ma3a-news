import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// يتحقق من توقيع الجلسة فقط (الدور والتفعيل تتحقق منهما الصفحات والـAPI من قاعدة البيانات).
export async function middleware(request) {
  const path = request.nextUrl.pathname;
  if (path === '/admin/login' || path === '/admin/setup') return NextResponse.next();
  const token = request.cookies.get('ma3a_session')?.value;
  let ok = false;
  if (token && (process.env.AUTH_SECRET || '').length >= 32) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
      ok = true;
    } catch {}
  }
  if (!ok) return NextResponse.redirect(new URL('/admin/login', request.url));
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
