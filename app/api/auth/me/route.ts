import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({
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
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
