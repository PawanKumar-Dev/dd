import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { EmailService } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is already activated
    if (user.isActivated) {
      return NextResponse.json(
        { error: "Account is already activated" },
        { status: 400 }
      );
    }

    // Generate new activation token
    const activationToken = crypto.randomBytes(32).toString("hex");
    const activationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new activation token
    user.activationToken = activationToken;
    user.activationTokenExpiry = activationTokenExpiry;
    await user.save();

    // Send activation email
    const emailSent = await EmailService.sendActivationEmail(
      user.email,
      `${user.firstName} ${user.lastName}`,
      activationToken
    );

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send activation email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Activation email sent successfully",
    });
  } catch (error) {
    console.error("Resend activation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
