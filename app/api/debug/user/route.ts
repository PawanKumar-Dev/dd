import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";

// Force dynamic rendering - required for API routes
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromRequest(request);

    return NextResponse.json({
      debug: true,
      user: user
        ? {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActivated: user.isActivated,
            isActive: user.isActive,
          }
        : null,
      headers: {
        authorization: request.headers.get("authorization"),
        cookie: request.headers.get("cookie"),
      },
    });
  } catch (error) {
    console.error("Debug user error:", error);
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
