import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Find orders with failed domain registrations
    const ordersWithFailedDomains = await Order.find({
      "domains.status": "failed",
      status: "completed", // Payment was successful but domains failed
    })
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(50); // Limit to recent 50 orders

    // Process the data to extract failed domains
    const failedDomainData = ordersWithFailedDomains.map((order) => {
      const failedDomains = order.domains.filter(
        (domain: any) => domain.status === "failed"
      );
      const successfulDomains = order.domains.filter(
        (domain: any) => domain.status === "registered"
      );

      return {
        orderId: order.orderId,
        invoiceNumber: order.invoiceNumber,
        customerName: order.userId
          ? `${order.userId.firstName} ${order.userId.lastName}`
          : "Unknown",
        customerEmail: order.userId ? order.userId.email : "Unknown",
        amount: order.amount,
        currency: order.currency,
        failedDomains: failedDomains.map((domain: any) => ({
          domainName: domain.domainName,
          error: domain.error || "Registration failed",
          failedAt: domain.updatedAt || order.updatedAt,
        })),
        successfulDomains: successfulDomains.map(
          (domain: any) => domain.domainName
        ),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        paymentVerification: order.paymentVerification,
      };
    });

    // Get summary statistics
    const totalFailedOrders = failedDomainData.length;
    const totalFailedDomains = failedDomainData.reduce(
      (sum, order) => sum + order.failedDomains.length,
      0
    );
    const totalSuccessfulDomains = failedDomainData.reduce(
      (sum, order) => sum + order.successfulDomains.length,
      0
    );

    return NextResponse.json({
      success: true,
      data: failedDomainData,
      summary: {
        totalFailedOrders,
        totalFailedDomains,
        totalSuccessfulDomains,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to fetch failed domain registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch failed domain registrations" },
      { status: 500 }
    );
  }
}
