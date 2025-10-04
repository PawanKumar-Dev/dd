import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    if (!RAZORPAY_WEBHOOK_SECRET) {
      console.error("❌ [WEBHOOK] Razorpay webhook secret not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      console.error("❌ [WEBHOOK] Missing Razorpay signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("❌ [WEBHOOK] Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log("🔔 [WEBHOOK] Received Razorpay webhook:", event.type);

    // Connect to database
    await connectDB();

    switch (event.type) {
      case "payment.captured":
        await handlePaymentCaptured(event);
        break;
      case "payment.failed":
        await handlePaymentFailed(event);
        break;
      case "order.paid":
        await handleOrderPaid(event);
        break;
      default:
        console.log(`ℹ️ [WEBHOOK] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ [WEBHOOK] Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(event: any) {
  try {
    const { payment } = event.payload;
    console.log("💰 [WEBHOOK] Payment captured:", {
      paymentId: payment.id,
      orderId: payment.order_id,
      amount: payment.amount,
      status: payment.status,
    });

    // Update order status if payment is captured
    const order = await Order.findOne({ razorpayPaymentId: payment.id });
    if (order) {
      // Additional verification that payment is actually captured
      if (payment.status === "captured") {
        console.log("✅ [WEBHOOK] Payment confirmed for order:", order.orderId);
        // Order status should already be updated in the payment verification endpoint
        // This is just for additional confirmation
      }
    } else {
      console.warn("⚠️ [WEBHOOK] Order not found for payment ID:", payment.id);
    }
  } catch (error) {
    console.error("❌ [WEBHOOK] Error handling payment captured:", error);
  }
}

async function handlePaymentFailed(event: any) {
  try {
    const { payment } = event.payload;
    console.log("❌ [WEBHOOK] Payment failed:", {
      paymentId: payment.id,
      orderId: payment.order_id,
      error: payment.error,
    });

    // Update order status to failed
    const order = await Order.findOne({ razorpayPaymentId: payment.id });
    if (order) {
      order.status = "failed";
      await order.save();
      console.log(
        "✅ [WEBHOOK] Order status updated to failed:",
        order.orderId
      );
    }
  } catch (error) {
    console.error("❌ [WEBHOOK] Error handling payment failed:", error);
  }
}

async function handleOrderPaid(event: any) {
  try {
    const { order } = event.payload;
    console.log("✅ [WEBHOOK] Order paid:", {
      orderId: order.id,
      amount: order.amount,
      status: order.status,
    });

    // This is an additional confirmation that the order is paid
    // The main processing happens in the payment verification endpoint
  } catch (error) {
    console.error("❌ [WEBHOOK] Error handling order paid:", error);
  }
}
