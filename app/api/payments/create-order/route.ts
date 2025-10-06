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
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.price * item.registrationPeriod,
      0
    );

    console.log("💰 [CREATE-ORDER] Cart items:", cartItems);
    console.log("💰 [CREATE-ORDER] Total amount calculated:", totalAmount);

    // Validate total amount
    if (!totalAmount || totalAmount <= 0 || isNaN(totalAmount)) {
      console.error("❌ [CREATE-ORDER] Invalid total amount:", totalAmount);
      return NextResponse.json(
        { error: "Invalid total amount calculated" },
        { status: 400 }
      );
    }

    // Generate order ID (Razorpay receipt must be max 40 characters)
    const orderId = `ord_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    // Create Razorpay order
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
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
