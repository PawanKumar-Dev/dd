import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get user from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // For now, we'll use a simple token validation
    // In production, you should verify the JWT token properly
    const user = await User.findOne({ email: token }).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's orders and domains
    const orders = await Order.find({ userId: user._id })
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    // Calculate dashboard statistics
    const totalDomains = orders.reduce(
      (sum, order) => sum + order.domains.length,
      0
    );
    const activeDomains = orders.reduce(
      (sum, order) =>
        sum +
        order.domains.filter((domain) => domain.status === "registered").length,
      0
    );
    const pendingDomains = orders.reduce(
      (sum, order) =>
        sum +
        order.domains.filter(
          (domain) =>
            domain.status === "pending" || domain.status === "processing"
        ).length,
      0
    );
    const totalSpent = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // Get recent orders
    const recentOrders = orders.slice(0, 5).map((order) => ({
      id: order.orderId,
      domains: order.domains.map((domain) => domain.domainName),
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
    }));

    // Get recent domains
    const recentDomains = orders
      .flatMap((order) =>
        order.domains.map((domain) => ({
          name: domain.domainName,
          status: domain.status,
          registrationDate: order.createdAt,
          expiryDate: domain.expiresAt,
          registrar: "Domain Services",
        }))
      )
      .slice(0, 5);

    const dashboardData = {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      stats: {
        totalDomains,
        activeDomains,
        pendingDomains,
        totalSpent,
        totalOrders: orders.length,
      },
      recentOrders,
      recentDomains,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
