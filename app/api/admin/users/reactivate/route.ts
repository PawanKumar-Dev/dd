import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { AuthService } from "@/lib/auth";

// POST - Reactivate a deactivated user (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is actually deactivated
    if (!targetUser.isDeleted) {
      return NextResponse.json(
        { error: "User is not deactivated" },
        { status: 400 }
      );
    }

    // Reactivate the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        isActive: true,
        isDeleted: false,
        deletedAt: null,
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(
      `✅ [ADMIN] User reactivated: ${updatedUser.email} by admin: ${user.email}`
    );

    return NextResponse.json({
      success: true,
      message: "User reactivated successfully",
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    console.error("Error reactivating user:", error);
    return NextResponse.json(
      { error: "Failed to reactivate user" },
      { status: 500 }
    );
  }
}
