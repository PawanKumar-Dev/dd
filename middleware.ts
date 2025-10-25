import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Get token from both NextAuth and custom JWT
  const nextAuthToken = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const customToken = request.cookies.get("token")?.value;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/about",
    "/contact",
    "/reset-password",
    "/complete-profile",
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
    // Check for either NextAuth token or custom token
    if (!nextAuthToken && !customToken) {
      console.log('🚫 No tokens found - redirecting to login');
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // For social login users with NextAuth token but no custom token,
    // allow access - AuthSync component will handle token creation client-side
    // This prevents redirect loops
    if (nextAuthToken && !customToken) {
      console.log('✅ Social login user - allowing access, AuthSync will handle token');
      return NextResponse.next();
    }
  }

  // Check if admin routes require admin role
  if (adminRoutes.includes(pathname) || pathname.startsWith("/admin")) {
    // For admin pages, check if user is admin
    if (!customToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Additional check: prevent social login users from accessing admin
    if (nextAuthToken && !customToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Protect admin API routes
  if (pathname.startsWith("/api/admin/")) {
    if (!customToken) {
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
