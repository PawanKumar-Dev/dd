import { NextRequest, NextResponse } from "next/server";
import { ResellerClubWrapper } from "@/lib/resellerclub-wrapper";
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

    const { searchParams } = new URL(request.url);
    const domainName = searchParams.get("domainName");
    const years = parseInt(searchParams.get("years") || "1");

    if (!domainName) {
      return NextResponse.json(
        { error: "Domain name is required" },
        { status: 400 }
      );
    }

    // Check if testing mode is enabled
    const testingMode = request.headers.get("x-testing-mode") === "true";

    // Get renewal pricing
    const pricingResult = await (ResellerClubWrapper as any).getRenewalPricing(
      domainName,
      years,
      testingMode
    );

    if (pricingResult.status === "error") {
      return NextResponse.json(
        { error: pricingResult.message },
        { status: 500 }
      );
    }

    // Get domain expiry date
    const expiryResult = await (ResellerClubWrapper as any).getDomainExpiry(
      domainName,
      testingMode
    );

    return NextResponse.json({
      success: true,
      domainName,
      years,
      pricing: pricingResult.data,
      expiry: expiryResult.data,
    });
  } catch (error) {
    console.error("Domain renewal info error:", error);
    return NextResponse.json(
      { error: "Failed to get domain renewal information" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domainName, years, paymentId } = await request.json();

    if (!domainName || !years || !paymentId) {
      return NextResponse.json(
        { error: "Domain name, years, and payment ID are required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if testing mode is enabled
    const testingMode = request.headers.get("x-testing-mode") === "true";

    // Renew domain
    const result = await (ResellerClubWrapper as any).renewDomain(
      domainName,
      years,
      testingMode
    );

    if (result.status === "error") {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    // Create order record for renewal
    const order = new Order({
      orderId: `RENEW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user._id,
      paymentId,
      amount: result.data?.price || 0,
      currency: "INR",
      status: "completed",
      domains: [
        {
          domainName,
          price: result.data?.price || 0,
          currency: "INR",
          registrationPeriod: years,
          status: "registered",
          orderId: result.data?.orderid,
          expiresAt: new Date(Date.now() + years * 365 * 24 * 60 * 60 * 1000),
        },
      ],
      successfulDomains: [domainName],
    });

    await order.save();

    // Update user's domain list
    await User.findByIdAndUpdate(user._id, {
      $push: {
        domains: {
          domainName,
          price: result.data?.price || 0,
          currency: "INR",
          registrationPeriod: years,
          status: "registered",
          orderId: result.data?.orderid,
          expiresAt: new Date(Date.now() + years * 365 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Domain renewed successfully",
      orderId: order.orderId,
      domainName,
      years,
      newExpiryDate: new Date(Date.now() + years * 365 * 24 * 60 * 60 * 1000),
    });
  } catch (error) {
    console.error("Domain renewal error:", error);
    return NextResponse.json(
      { error: "Failed to renew domain" },
      { status: 500 }
    );
  }
}
