import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";

// Force dynamic rendering - required for API routes
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const archived = searchParams.get("archived");

    let query = {};
    if (archived === "true") {
      // Fetch only archived orders
      query = { isDeleted: true };
    } else {
      // Fetch only active orders (default behavior)
      query = { isDeleted: { $ne: true } };
    }

    // Fetch orders with user details
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(100) // Limit to last 100 orders
      .populate("userId", "firstName lastName email", User);

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Failed to fetch admin orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
