import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { AuthService } from "@/lib/auth";
import { rateLimiters } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for login attempts
    const rateLimit = rateLimiters.login.isAllowed(request);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again later.",
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is deactivated" },
        { status: 401 }
      );
    }

    // Check if user account is activated
    if (!user.isActivated) {
      return NextResponse.json(
        {
          error: "Account not activated",
          requiresActivation: true,
          message:
            "Please check your email and click the activation link to activate your account.",
        },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate token with remember me option
    const token = AuthService.generateToken(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      false
    ); // We'll get rememberMe from request body

    return NextResponse.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActivated: user.isActivated,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
