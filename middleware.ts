import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  console.log("[MIDDLEWARE] Request to:", pathname);

  // Get NextAuth token (unified for both social and credentials)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  console.log("[MIDDLEWARE] Token found:", !!token);
  if (token) {
    console.log("[MIDDLEWARE] Token email:", token.email);
    console.log("[MIDDLEWARE] Token role:", token.role);
  }

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

  // Redirect authenticated users away from auth pages
  if (token && (pathname === "/login" || pathname === "/register")) {
    console.log(
      "[MIDDLEWARE] Authenticated user on login page, redirecting to dashboard"
    );
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Check if the current path is public
  if (publicRoutes.includes(pathname)) {
    console.log("[MIDDLEWARE] Public route, allowing access");
    return NextResponse.next();
  }

  // Check if the current path requires authentication
  if (protectedRoutes.includes(pathname) || adminRoutes.includes(pathname)) {
    // Check for NextAuth token (works for both social and credentials login)
    if (!token) {
      console.log(
        "[MIDDLEWARE] Protected route without token, redirecting to login"
      );
      return NextResponse.redirect(new URL("/login", request.url));
    }
    console.log(
      "[MIDDLEWARE] Protected route with valid token, allowing access"
    );
  }

  // Check if admin routes require admin role
  if (adminRoutes.includes(pathname) || pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Check if user has admin role
    if (token.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Protect admin API routes
  if (pathname.startsWith("/api/admin/")) {
    if (!token || token.role !== "admin") {
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
