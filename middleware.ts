import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/about",
    "/contact",
    "/reset-password",
  ];

  // Admin routes
  const adminRoutes = ["/admin"];

  // Protected routes
  const protectedRoutes = [
    "/dashboard",
    "/checkout",
    "/dashboard/domain-management",
  ];

  // Check if the current path is public
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check if the current path requires authentication
  if (protectedRoutes.includes(pathname) || adminRoutes.includes(pathname)) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Check if admin routes require admin role
  if (adminRoutes.includes(pathname)) {
    // For admin pages, just check if token exists
    // The page itself will handle role verification
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Protect admin API routes - simplified check
  if (pathname.startsWith("/api/admin/")) {
    if (!token) {
      return NextResponse.json(
        {
          error: "Access denied. Authentication required.",
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
