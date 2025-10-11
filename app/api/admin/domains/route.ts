import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Connect to database
    await connectDB();

    // Get all orders with domains
    const orders = await Order.find({})
      .populate("userId", "firstName lastName email phone companyName")
      .sort({ createdAt: -1 });

    // Flatten domains with customer information
    const domains = [];
    for (const order of orders) {
      for (const domain of order.domains) {
        domains.push({
          id: domain._id.toString(),
          name: domain.domainName || domain.name,
          price: domain.price,
          currency: domain.currency,
          registrationPeriod: domain.registrationPeriod,
          status: domain.status,
          expiresAt: domain.expiresAt,
          resellerClubOrderId: domain.resellerClubOrderId,
          resellerClubCustomerId: domain.resellerClubCustomerId,
          resellerClubContactId: domain.resellerClubContactId,
          dnsActivated: domain.dnsActivated,
          dnsActivatedAt: domain.dnsActivatedAt,
          customerName: order.userId
            ? `${order.userId.firstName} ${order.userId.lastName}`
            : "Unknown",
          customerEmail: order.userId?.email || "Unknown",
          orderId: order.orderId,
          createdAt: order.createdAt,
        });
      }
    }

    return NextResponse.json({
      success: true,
      domains,
      total: domains.length,
    });
  } catch (error) {
    console.error("Admin domains fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch domains" },
      { status: 500 }
    );
  }
}
