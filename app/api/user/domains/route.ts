import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get user from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Verify token and get user
    const user = await User.findOne({
      $or: [{ token: token }, { "tokens.token": token }],
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get all orders for the user
    const orders = await Order.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .populate("userId", "email firstName lastName");

    // Extract domains from orders
    const domains = [];
    const domainMap = new Map();

    orders.forEach((order) => {
      order.domains.forEach((domain) => {
        const domainKey = domain.domainName;

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
            registrar: "Domain Registrar",
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
