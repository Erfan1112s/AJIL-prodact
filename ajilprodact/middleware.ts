// middleware.ts
// محافظت از مسیرهای پنل ادمین

import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // مسیرهای عمومی ادمین
  const publicAdminPaths = ['/admin/login'];
  const isPublic = publicAdminPaths.some((p) => pathname.startsWith(p));

  if (isPublic) {
    return NextResponse.next();
  }

  // خواندن کوکی
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  // بررسی async
  const userId = token ? await verifySessionToken(token) : null;

  if (!userId) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};