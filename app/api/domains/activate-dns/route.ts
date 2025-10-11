import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domainName } = await request.json();

    if (!domainName) {
      return NextResponse.json(
        { error: "Domain name is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the order containing this domain
    const order = await Order.findOne({
      userId: user._id,
      "domains.domainName": domainName,
    });

    if (!order) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    // Find the specific domain in the order
    const domain = order.domains.find((d) => d.domainName === domainName);

    if (!domain) {
      return NextResponse.json(
        { error: "Domain not found in order" },
        { status: 404 }
      );
    }

    // Check if domain is registered
    if (domain.status !== "registered") {
      return NextResponse.json(
        { error: "Domain must be registered to activate DNS management" },
        { status: 400 }
      );
    }

    // Check if DNS is already activated
    if (domain.dnsActivated) {
      return NextResponse.json(
        { error: "DNS management is already activated for this domain" },
        { status: 400 }
      );
    }

    // Activate DNS management
    domain.dnsActivated = true;
    domain.dnsActivatedAt = new Date();

    // Add to booking status
    if (!domain.bookingStatus) {
      domain.bookingStatus = [];
    }

    domain.bookingStatus.push({
      step: "dns_activated",
      message: "DNS management activated successfully",
      timestamp: new Date(),
      progress: 100,
    });

    // Save the updated order
    await order.save();

    return NextResponse.json({
      success: true,
      message: "DNS management activated successfully",
      domainName,
      dnsActivated: true,
      dnsActivatedAt: domain.dnsActivatedAt,
    });
  } catch (error) {
    console.error("DNS activation error:", error);
    return NextResponse.json(
      { error: "Failed to activate DNS management" },
      { status: 500 }
    );
  }
}
