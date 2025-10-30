import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Get NextAuth token (unified for both social and credentials)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  console.log("🔍 [Middleware] Checking path:", pathname, {
    hasToken: !!token,
    role: token?.role,
  });

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/about",
    "/contact",
    "/reset-password",
    "/complete-profile",
    "/activate",
  ];

  // Admin routes
  const adminRoutes = ["/admin"];

  // Protected routes
  const protectedRoutes = [
    "/dashboard",
    "/checkout",
    "/dashboard/dns-management",
  ];

  // Check if the current path is public
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check if the current path requires authentication
  if (protectedRoutes.includes(pathname) || adminRoutes.includes(pathname)) {
    // Check for NextAuth token (works for both social and credentials login)
    if (!token) {
      console.log("🚫 [Middleware] No session - redirecting to login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    console.log("✅ [Middleware] Session found - allowing access");
  }

  // Check if admin routes require admin role
  if (adminRoutes.includes(pathname) || pathname.startsWith("/admin")) {
    if (!token) {
      console.log("🚫 [Middleware] Admin route - no session");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Check if user has admin role
    if (token.role !== "admin") {
      console.log("🚫 [Middleware] Admin route - not admin user");
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    console.log("✅ [Middleware] Admin access granted");
  }

  // Protect admin API routes
  if (pathname.startsWith("/api/admin/")) {
    if (!token || token.role !== "admin") {
      console.log("🚫 [Middleware] Admin API - access denied");
      return NextResponse.json(
        {
          error: "Access denied. Admin authentication required.",
          code: "ADMIN_ACCESS_DENIED",
        },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
  runtime: "nodejs",
};
