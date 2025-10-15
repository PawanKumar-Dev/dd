import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromRequest(request);

    if (!user) {
      console.log("🔍 Server Debug - /api/auth/me: User not authenticated");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("🔍 Server Debug - /api/auth/me: User found:", {
      id: user._id,
      email: user.email,
      role: user.role,
      profileCompleted: user.profileCompleted,
      isActivated: user.isActivated,
    });

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActivated: user.isActivated,
        isActive: user.isActive,
        profileCompleted: user.profileCompleted,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
