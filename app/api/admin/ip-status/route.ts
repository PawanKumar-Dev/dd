import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import IPCheck from "@/models/IPCheck";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await connectDB();

    // Get the latest IP check result
    const latestIPCheck = await IPCheck.findOne()
      .sort({ checkedAt: -1 })
      .populate("checkedBy", "firstName lastName email", User);

    if (!latestIPCheck) {
      return NextResponse.json({
        success: false,
        message: "No IP check data available",
        data: null,
        lastChecked: null,
        checkedBy: null,
      });
    }

    return NextResponse.json({
      success: latestIPCheck.success,
      message: latestIPCheck.message,
      data: latestIPCheck.data,
      error: latestIPCheck.error,
      lastChecked: latestIPCheck.checkedAt,
      checkedBy: latestIPCheck.checkedBy,
    });
  } catch (error) {
    console.error("Failed to get IP status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get IP status",
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
