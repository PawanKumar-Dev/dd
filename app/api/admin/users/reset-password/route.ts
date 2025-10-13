import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { AuthService } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { EmailService } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { userId, newPassword, sendEmail = true } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: "User ID and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent admin from resetting another admin's password
    if (targetUser.role === "admin") {
      return NextResponse.json(
        { error: "Cannot reset admin user passwords" },
        { status: 403 }
      );
    }

    // Prevent admin from resetting their own password through this endpoint
    if (user._id.toString() === userId) {
      return NextResponse.json(
        { error: "Use the admin settings to reset your own password" },
        { status: 400 }
      );
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    targetUser.password = hashedPassword;
    
    // Clear any existing reset tokens
    targetUser.resetToken = undefined;
    targetUser.resetTokenExpiry = undefined;
    
    await targetUser.save();

    // Send email notification to user if requested
    if (sendEmail) {
      try {
        await EmailService.sendPasswordResetNotificationEmail(
          targetUser.email,
          `${targetUser.firstName} ${targetUser.lastName}`,
          newPassword
        );
      } catch (emailError) {
        console.error("Failed to send password reset notification email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "User password has been reset successfully",
      emailSent: sendEmail,
    });
  } catch (error) {
    console.error("Admin user password reset error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
