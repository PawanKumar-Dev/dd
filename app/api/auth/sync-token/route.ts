import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import jwt from "jsonwebtoken";

// Force dynamic rendering - required for API routes
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      // Check if this is an API call or redirect
      const isApiCall = request.headers.get('accept')?.includes('application/json');
      if (isApiCall) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Create a proper JWT token for API compatibility
    const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";
    
    const token = jwt.sign({
      userId: (session.user as any).id,
      email: session.user.email || "",
      role: (session.user as any).role || "user",
      jti: `${(session.user as any).id}_${Date.now()}`,
      iat: Math.floor(Date.now() / 1000),
    }, JWT_SECRET, {
      expiresIn: '24h',
      issuer: 'excel-technologies',
      audience: 'domain-management-system',
      algorithm: 'HS256'
    });

    // Check if this is an API call or redirect
    const isApiCall = request.headers.get('accept')?.includes('application/json');
    
    if (isApiCall) {
      // Return JSON response with token
      const response = NextResponse.json({ token, success: true });
      response.cookies.set('token', token, {
        path: '/',
        maxAge: 24 * 60 * 60, // 24 hours
        httpOnly: false, // Allow JavaScript access for localStorage
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      return response;
    }

    // Redirect with token cookie
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set('token', token, {
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
      httpOnly: false, // Allow JavaScript access for localStorage  
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return response;
  } catch (error) {
    console.error("Token sync error:", error);
    const isApiCall = request.headers.get('accept')?.includes('application/json');
    if (isApiCall) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
