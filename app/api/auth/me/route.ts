import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";

// Force dynamic rendering - required for API routes
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromRequest(request);

    if (!user) {
      console.log("🔍 Server Debug - /api/auth/me: User not authenticated");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const hasPassword = !!user.password;

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
        provider: user.provider,
        password: hasPassword, // Boolean indicating if password exists
        // Include complete profile data to prevent data loss
        phone: user.phone,
        phoneCc: user.phoneCc,
        companyName: user.companyName,
        address: user.address,
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
