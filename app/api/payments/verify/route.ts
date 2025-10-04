import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { RazorpayService } from "@/lib/razorpay";
import { ResellerClubWrapper } from "@/lib/resellerclub-wrapper";
import { EmailService } from "@/lib/email";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      cartItems,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Payment verification data is required" },
        { status: 400 }
      );
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { error: "Cart items are required" },
        { status: 400 }
      );
    }

    // Verify payment signature
    const isPaymentValid = RazorpayService.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isPaymentValid) {
      console.error("❌ [PAYMENT-VERIFY] Invalid payment signature");
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Additional verification: Fetch payment details from Razorpay to confirm payment status
    let paymentDetails;
    try {
      paymentDetails = await RazorpayService.getPaymentDetails(
        razorpay_payment_id
      );
      console.log("✅ [PAYMENT-VERIFY] Payment details fetched:", {
        paymentId: paymentDetails.id,
        status: paymentDetails.status,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        orderId: paymentDetails.order_id,
      });
    } catch (error) {
      console.error(
        "❌ [PAYMENT-VERIFY] Failed to fetch payment details:",
        error
      );
      return NextResponse.json(
        { error: "Failed to verify payment status" },
        { status: 400 }
      );
    }

    // Verify payment status is captured
    if (paymentDetails.status !== "captured") {
      console.error(
        "❌ [PAYMENT-VERIFY] Payment not captured. Status:",
        paymentDetails.status
      );
      return NextResponse.json(
        { error: "Payment not captured" },
        { status: 400 }
      );
    }

    // Verify payment amount matches expected amount
    const expectedAmount =
      cartItems.reduce(
        (total, item) => total + item.price * item.registrationPeriod,
        0
      ) * 100; // Convert to paise

    if (paymentDetails.amount !== expectedAmount) {
      console.error(
        "❌ [PAYMENT-VERIFY] Amount mismatch. Expected:",
        expectedAmount,
        "Received:",
        paymentDetails.amount
      );
      return NextResponse.json(
        { error: "Payment amount mismatch" },
        { status: 400 }
      );
    }

    // Verify order ID matches
    if (paymentDetails.order_id !== razorpay_order_id) {
      console.error(
        "❌ [PAYMENT-VERIFY] Order ID mismatch. Expected:",
        razorpay_order_id,
        "Received:",
        paymentDetails.order_id
      );
      return NextResponse.json({ error: "Order ID mismatch" }, { status: 400 });
    }

    console.log(
      "✅ [PAYMENT-VERIFY] Payment verification successful. Proceeding with domain registration..."
    );

    // Check if testing mode is enabled
    const testingMode = request.headers.get("x-testing-mode") === "true";

    // Connect to database
    await connectDB();

    // Check if this payment has already been processed to prevent duplicate registrations
    const existingOrder = await Order.findOne({
      razorpayPaymentId: razorpay_payment_id,
    });

    if (existingOrder) {
      console.warn(
        "⚠️ [PAYMENT-VERIFY] Payment already processed. Order ID:",
        existingOrder.orderId
      );
      return NextResponse.json({
        success: true,
        message: "Payment already processed",
        orderId: existingOrder.orderId,
        invoiceNumber: existingOrder.invoiceNumber,
        registrationResults: existingOrder.domains.map((d) => ({
          domainName: d.domainName,
          status: d.status,
          orderId: d.orderId,
          error: d.error,
        })),
        successfulDomains: existingOrder.successfulDomains,
        failedDomains: existingOrder.failedDomains,
      });
    }

    // Generate order ID
    const orderId = `ord_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    const paymentId = `pay_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    // Calculate total amount
    const totalAmount = cartItems.reduce(
      (total, item) => total + item.price * item.registrationPeriod,
      0
    );

    // Register domains with ResellerClub - ONLY AFTER PAYMENT CONFIRMATION
    console.log("🚀 [PAYMENT-VERIFY] Starting domain registration process...");
    console.log(
      "🚀 [PAYMENT-VERIFY] Payment confirmed. Amount:",
      paymentDetails.amount,
      "Status:",
      paymentDetails.status
    );

    const registrationResults = [];
    const successfulDomains = [];
    const failedDomains = [];
    const orderDomains = [];

    for (const item of cartItems) {
      console.log(`🔄 [PAYMENT-VERIFY] Registering domain: ${item.domainName}`);
      try {
        const result = await ResellerClubWrapper.registerDomain(
          {
            domainName: item.domainName,
            years: item.registrationPeriod || 1,
            customerId: user._id,
          },
          testingMode
        );

        if (result.status === "success") {
          console.log(
            `✅ [PAYMENT-VERIFY] Domain registration successful: ${item.domainName}`
          );
          const expiresAt = new Date(
            Date.now() +
              (item.registrationPeriod || 1) * 365 * 24 * 60 * 60 * 1000
          );

          successfulDomains.push(item.domainName);

          registrationResults.push({
            domainName: item.domainName,
            status: "success",
            orderId: result.data?.orderid,
          });

          orderDomains.push({
            domainName: item.domainName,
            price: item.price,
            currency: item.currency || "INR",
            registrationPeriod: item.registrationPeriod || 1,
            status: "registered",
            orderId: result.data?.orderid,
            expiresAt,
          });
        } else {
          console.error(
            `❌ [PAYMENT-VERIFY] Domain registration failed: ${item.domainName} - ${result.message}`
          );
          failedDomains.push(item.domainName);

          registrationResults.push({
            domainName: item.domainName,
            status: "failed",
            error: result.message,
          });

          orderDomains.push({
            domainName: item.domainName,
            price: item.price,
            currency: item.currency || "INR",
            registrationPeriod: item.registrationPeriod || 1,
            status: "failed",
            error: result.message,
          });
        }
      } catch (error) {
        console.error(
          `Domain registration error for ${item.domainName}:`,
          error
        );

        failedDomains.push(item.domainName);

        registrationResults.push({
          domainName: item.domainName,
          status: "failed",
          error: "Registration failed",
        });

        orderDomains.push({
          domainName: item.domainName,
          price: item.price,
          currency: item.currency || "INR",
          registrationPeriod: item.registrationPeriod || 1,
          status: "failed",
          error: "Registration failed",
        });
      }
    }

    // Log domain registration summary
    console.log("📊 [PAYMENT-VERIFY] Domain registration summary:", {
      totalDomains: cartItems.length,
      successful: successfulDomains.length,
      failed: failedDomains.length,
      successfulDomains: successfulDomains,
      failedDomains: failedDomains,
    });

    // Determine order status
    const orderStatus = successfulDomains.length > 0 ? "completed" : "failed";

    // Create order record with payment verification details
    const order = new Order({
      orderId,
      userId: user._id,
      paymentId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      amount: totalAmount,
      currency: "INR",
      status: orderStatus,
      domains: orderDomains,
      successfulDomains: successfulDomains,
      failedDomains: failedDomains,
      // Store payment verification details for audit trail
      paymentVerification: {
        verifiedAt: new Date(),
        paymentStatus: paymentDetails.status,
        paymentAmount: paymentDetails.amount,
        paymentCurrency: paymentDetails.currency,
        razorpayOrderId: paymentDetails.order_id,
      },
    });

    await order.save();
    console.log(`✅ [PAYMENT-VERIFY] Order saved to database: ${orderId}`);

    console.log(`✅ Order created: ${orderId} with status: ${orderStatus}`);

    // Send order confirmation email
    try {
      const emailSent = await EmailService.sendOrderConfirmationEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        {
          orderId: order.orderId,
          invoiceNumber: order.invoiceNumber || "",
          amount: order.amount,
          currency: order.currency,
          successfulDomains: orderDomains
            .filter((d) => d.status === "registered")
            .map((d) => ({
              domainName: d.domainName,
              price: d.price,
              registrationPeriod: d.registrationPeriod,
            })),
          failedDomains: orderDomains
            .filter((d) => d.status === "failed")
            .map((d) => ({
              domainName: d.domainName,
              error: d.error || "Registration failed",
            })),
          paymentId: order.paymentId,
          createdAt: order.createdAt,
        }
      );

      if (emailSent) {
        console.log(`✅ Order confirmation email sent to ${user.email}`);
      } else {
        console.error(
          `❌ Failed to send order confirmation email to ${user.email}`
        );
      }
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Don't fail the payment verification if email fails
    }

    // Send admin notification email
    try {
      const adminEmailSent = await EmailService.sendAdminNotification(
        process.env.ADMIN_EMAIL || "sales@exceltechnologies.in",
        "New Domain Order",
        `A new domain order has been placed by ${user.firstName} ${user.lastName} (${user.email})`,
        {
          orderId: order.orderId,
          invoiceNumber: order.invoiceNumber,
          customerName: `${user.firstName} ${user.lastName}`,
          customerEmail: user.email,
          amount: order.amount,
          currency: order.currency,
          successfulDomains: successfulDomains.map((d) => d.domainName),
          failedDomains: failedDomains.map((d) => d.domainName),
          orderStatus: orderStatus,
        }
      );

      if (adminEmailSent) {
        console.log(`✅ Admin notification email sent`);
      } else {
        console.error(`❌ Failed to send admin notification email`);
      }
    } catch (adminEmailError) {
      console.error("Admin email sending error:", adminEmailError);
      // Don't fail the payment verification if admin email fails
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and domains registered",
      orderId,
      invoiceNumber: order.invoiceNumber,
      registrationResults,
      successfulDomains,
      failedDomains,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
