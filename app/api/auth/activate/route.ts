import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { AuthService } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Activation token is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user with the activation token
    const user = await User.findOne({
      activationToken: token,
      activationTokenExpiry: { $gt: new Date() }, // Token not expired
    });

    if (!user) {
      // Check if token exists but is expired
      const expiredUser = await User.findOne({
        activationToken: token,
        activationTokenExpiry: { $lte: new Date() },
      });

      if (expiredUser) {
        return NextResponse.json({ error: "Token expired" }, { status: 400 });
      }

      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    // Check if user is already activated
    if (user.isActivated) {
      return NextResponse.json(
        { error: "Account is already activated" },
        { status: 400 }
      );
    }

    // Activate the user
    user.isActivated = true;
    user.activationToken = undefined;
    user.activationTokenExpiry = undefined;
    await user.save();

    // Generate JWT token for immediate login
    const jwtToken = AuthService.generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      message:
        "Account activated successfully! You can now access your dashboard.",
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActivated: user.isActivated,
      },
    });
  } catch (error) {
    console.error("Activation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
