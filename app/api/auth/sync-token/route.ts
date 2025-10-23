import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
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

    // Set the token cookie
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set('token', token, {
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return response;
  } catch (error) {
    console.error("Token sync error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
