import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";
import { AuthService } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get user from JWT token
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const totalSpent = orders.reduce((sum, order) => sum + order.amount, 0);

    // Get recent orders
    const recentOrders = orders.slice(0, 5).map((order) => ({
      orderId: order.orderId,
      domains: order.domains.length,
      amount: order.amount,
      status: order.status,
      date: new Date(order.createdAt).toLocaleDateString(),
    }));

    // Get upcoming renewals (domains expiring in next 30 days)
    const upcomingRenewals = orders
      .flatMap((order) =>
        order.domains
          .filter(
            (domain) => domain.status === "registered" && domain.expiresAt
          )
          .map((domain) => {
            const daysLeft = Math.ceil(
              (new Date(domain.expiresAt).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return {
              domain: domain.domainName,
              expiryDate: new Date(domain.expiresAt).toLocaleDateString(),
              daysLeft,
            };
          })
      )
      .filter((renewal) => renewal.daysLeft <= 30 && renewal.daysLeft > 0)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5);

    const dashboardData = {
      stats: {
        totalDomains,
        activeDomains,
        totalOrders: orders.length,
        recentOrders,
        upcomingRenewals,
      },
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
