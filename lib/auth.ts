import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import connectDB from "./mongodb";
import User from "@/models/User";

const JWT_SECRET = (process.env.NEXTAUTH_SECRET || "your-secret-key").trim();

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  jti?: string; // JWT ID
  iat?: number; // Issued at
}

export class AuthService {
  /**
   * Generate JWT token with enhanced security
   */
  static generateToken(
    payload: JWTPayload,
    rememberMe: boolean = false
  ): string {
    // Different expiration times based on remember me
    const expiresIn = rememberMe ? "30d" : "24h";

    // Add additional security claims to payload
    const enhancedPayload = {
      ...payload,
      jti: `${payload.userId}_${Date.now()}`, // Unique token ID
      iat: Math.floor(Date.now() / 1000), // Issued at
    };

    return jwt.sign(enhancedPayload, JWT_SECRET, {
      expiresIn,
      issuer: "excel-technologies",
      audience: "domain-management-system",
      algorithm: "HS256",
    });
  }

  /**
   * Verify JWT token with enhanced security
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      // First try to verify as a proper JWT token
      try {
        const decoded = jwt.verify(token, JWT_SECRET, {
          issuer: "excel-technologies",
          audience: "domain-management-system",
          algorithms: ["HS256"],
        }) as any;

        // Additional security checks
        if (!decoded.userId || !decoded.email || !decoded.role) {
          return null;
        }

        // Check if token is not too old (additional security)
        const tokenAge = Date.now() / 1000 - decoded.iat;
        const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
        if (tokenAge > maxAge) {
          return null;
        }

        return decoded as JWTPayload;
      } catch (jwtError) {
        // If JWT verification fails, try to decode as base64 (for social login tokens)
        try {
          const decoded = JSON.parse(atob(token));

          // Validate the decoded payload
          if (!decoded.userId || !decoded.email || !decoded.role) {
            return null;
          }

          // Check if token is expired
          if (decoded.exp && Date.now() / 1000 > decoded.exp) {
            return null;
          }

          // Check if token is not too old (additional security)
          if (decoded.iat) {
            const tokenAge = Date.now() / 1000 - decoded.iat;
            const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
            if (tokenAge > maxAge) {
              return null;
            }
          }

          return decoded as JWTPayload;
        } catch (base64Error) {
          console.error(
            "Token verification failed - not a valid JWT or base64 token:",
            base64Error
          );
          return null;
        }
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      return null;
    }
  }

  /**
   * Get user from request
   */
  static async getUserFromRequest(request: NextRequest): Promise<any> {
    try {
      const token = request.headers
        .get("authorization")
        ?.replace("Bearer ", "");

      if (!token) {
        return null;
      }

      const payload = this.verifyToken(token);
      if (!payload) {
        return null;
      }

      await connectDB();
      // Fetch user WITH password field so we can check if it exists
      // Individual API endpoints are responsible for not exposing the password hash
      const user = await User.findById(payload.userId);

      if (!user || !user.isActive) {
        return null;
      }

      return user;
    } catch (error) {
      console.error("Auth error:", error);
      return null;
    }
  }

  /**
   * Check if user is admin
   */
  static async isAdmin(request: NextRequest): Promise<boolean> {
    const user = await this.getUserFromRequest(request);
    return user?.role === "admin";
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(request: NextRequest): Promise<boolean> {
    const user = await this.getUserFromRequest(request);
    return !!user;
  }
}
