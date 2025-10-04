import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export interface AuthResult {
  valid: boolean;
  error?: string;
  user?: any;
}

/**
 * Verify if the request is from an authenticated admin user
 */
export async function verifyAdminAuth(
  request: NextRequest
): Promise<AuthResult> {
  try {
    // Get token from cookies
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return {
        valid: false,
        error: "No authentication token provided. Please log in.",
      };
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || "fallback-secret"
    ) as any;

    if (!decoded.userId) {
      return {
        valid: false,
        error: "Invalid token format",
      };
    }

    // Connect to database and verify user exists
    await connectDB();
    const user = await User.findById(decoded.userId);

    if (!user) {
      return {
        valid: false,
        error: "User not found",
      };
    }

    if (!user.isActive) {
      return {
        valid: false,
        error: "Account is deactivated",
      };
    }

    if (user.role !== "admin") {
      return {
        valid: false,
        error: "Access denied. Admin privileges required.",
      };
    }

    return {
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Admin auth verification error:", error);
    return {
      valid: false,
      error: "Invalid or expired authentication token",
    };
  }
}

/**
 * Verify if the request is from any authenticated user (admin or regular user)
 */
export async function verifyUserAuth(
  request: NextRequest
): Promise<AuthResult> {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return {
        valid: false,
        error: "No authentication token provided",
      };
    }

    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || "fallback-secret"
    ) as any;

    if (!decoded.userId) {
      return {
        valid: false,
        error: "Invalid token format",
      };
    }

    await connectDB();
    const user = await User.findById(decoded.userId);

    if (!user) {
      return {
        valid: false,
        error: "User not found",
      };
    }

    if (!user.isActive) {
      return {
        valid: false,
        error: "Account is deactivated",
      };
    }

    return {
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("User auth verification error:", error);
    return {
      valid: false,
      error: "Invalid or expired authentication token",
    };
  }
}
