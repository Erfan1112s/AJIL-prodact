// proxy.ts
// در Next.js 16، فایل middleware به proxy تغییر نام داده و تابع باید proxy نام بگیرد

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import {
  CUSTOMER_SESSION_COOKIE,
  verifyCustomerSession,
} from "@/lib/auth/customer-session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============ مسیرهای ادمین ============
  if (pathname.startsWith("/admin")) {
    // مسیرهای عمومی ادمین (بدون نیاز به لاگین)
    const publicAdminPaths = ["/admin/login"];
    const isPublic = publicAdminPaths.some((p) => pathname.startsWith(p));
    if (isPublic) {
      return NextResponse.next();
    }

    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const userId = token ? await verifySessionToken(token) : null;

    if (!userId) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // ============ مسیرهای محافظت‌شدهٔ مشتری ============
  const customerProtectedPaths = ["/profile", "/checkout"];
  const needsCustomerAuth = customerProtectedPaths.some((p) =>
    pathname.startsWith(p)
  );

  if (needsCustomerAuth) {
    const token = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
    const customerId = token ? await verifyCustomerSession(token) : null;

    if (!customerId) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*", "/checkout/:path*"],
};