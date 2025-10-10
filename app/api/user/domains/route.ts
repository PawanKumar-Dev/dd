import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get all orders for the user
    const orders = await Order.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .populate("userId", "email firstName lastName");

    console.log(
      `[DOMAINS-API] Found ${orders.length} orders for user ${user.email}`
    );

    // Extract domains from orders
    const domains = [];
    const domainMap = new Map();

    orders.forEach((order) => {
      console.log(
        `[DOMAINS-API] Processing order ${order.orderId} with ${order.domains.length} domains`
      );
      order.domains.forEach((domain) => {
        const domainKey = domain.domainName;
        console.log(
          `[DOMAINS-API] Processing domain: ${domainKey} with status: ${domain.status}`
        );

        // Only add if not already processed or if this is a more recent status
        if (
          !domainMap.has(domainKey) ||
          (domain.status === "registered" &&
            domainMap.get(domainKey).status !== "registered")
        ) {
          domainMap.set(domainKey, {
            id: `${order._id}_${domain.domainName}`,
            name: domain.domainName,
            status: domain.status,
            registrationDate: order.createdAt.toISOString().split("T")[0],
            expiryDate: domain.expiresAt
              ? domain.expiresAt.toISOString().split("T")[0]
              : null,
            registrar: "Domain Services",
            nameservers: [], // Will be populated from DNS records if needed
            autoRenew: false,
            bookingStatus: domain.bookingStatus || [],
            orderId: order.orderId,
            resellerClubOrderId: domain.resellerClubOrderId,
            resellerClubCustomerId: domain.resellerClubCustomerId,
            resellerClubContactId: domain.resellerClubContactId,
            error: domain.error,
          });
        }
      });
    });

    // Convert map to array
    const domainArray = Array.from(domainMap.values());

    console.log(
      `[DOMAINS-API] Returning ${domainArray.length} domains for user ${user.email}`
    );

    return NextResponse.json({
      success: true,
      domains: domainArray,
      total: domainArray.length,
    });
  } catch (error) {
    console.error("Error fetching user domains:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
