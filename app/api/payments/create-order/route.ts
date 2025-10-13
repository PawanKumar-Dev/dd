import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { RazorpayService } from "@/lib/razorpay";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cartItems } = await request.json();

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Validate cart items
    for (const item of cartItems) {
      if (!item.domainName || !item.price || !item.currency) {
        return NextResponse.json(
          { error: "Invalid cart item data" },
          { status: 400 }
        );
      }
    }

    // Calculate total amount
    const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0);

    console.log("💰 [CREATE-ORDER] Cart items:", cartItems);
    console.log("💰 [CREATE-ORDER] Total amount:", totalAmount);

    // Validate total amount
    if (!totalAmount || totalAmount <= 0 || isNaN(totalAmount)) {
      console.error("❌ [CREATE-ORDER] Invalid total amount:", totalAmount);
      return NextResponse.json(
        { error: "Invalid total amount calculated" },
        { status: 400 }
      );
    }

    // Additional validation for Razorpay requirements
    if (totalAmount < 1) {
      console.error("❌ [CREATE-ORDER] Amount too small:", totalAmount);
      return NextResponse.json(
        { error: "Minimum payment amount is ₹1" },
        { status: 400 }
      );
    }

    if (totalAmount > 1000000) {
      console.error("❌ [CREATE-ORDER] Amount too large:", totalAmount);
      return NextResponse.json(
        { error: "Maximum payment amount is ₹10,00,000" },
        { status: 400 }
      );
    }

    // Generate order ID (Razorpay receipt must be max 40 characters)
    const orderId = `ord_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    // Create Razorpay order
    try {
      const razorpayOrder = await RazorpayService.createOrder(
        totalAmount,
        "INR",
        orderId
      );

      return NextResponse.json({
        success: true,
        orderId,
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount,
        currency: "INR",
        domains: cartItems.map((item) => ({
          domainName: item.domainName,
          price: item.price,
          registrationPeriod: item.registrationPeriod,
        })),
      });
    } catch (razorpayError: any) {
      console.error(
        "❌ [CREATE-ORDER] Razorpay order creation failed:",
        razorpayError
      );

      // Handle specific Razorpay errors
      if (razorpayError.message?.includes("Invalid amount")) {
        return NextResponse.json(
          { error: "Invalid payment amount. Please refresh and try again." },
          { status: 400 }
        );
      } else if (razorpayError.message?.includes("Amount too small")) {
        return NextResponse.json(
          { error: "Payment amount is too small. Minimum amount is ₹1." },
          { status: 400 }
        );
      } else if (razorpayError.message?.includes("Amount too large")) {
        return NextResponse.json(
          {
            error: "Payment amount is too large. Maximum amount is ₹10,00,000.",
          },
          { status: 400 }
        );
      } else if (razorpayError.message?.includes("Network error")) {
        return NextResponse.json(
          {
            error:
              "Payment gateway is temporarily unavailable. Please try again in a few minutes.",
          },
          { status: 503 }
        );
      } else if (razorpayError.message?.includes("Gateway error")) {
        return NextResponse.json(
          {
            error:
              "Payment gateway error. Please try again or use a different payment method.",
          },
          { status: 502 }
        );
      } else {
        return NextResponse.json(
          { error: "Failed to create payment order. Please try again." },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("❌ [CREATE-ORDER] Create order error:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
