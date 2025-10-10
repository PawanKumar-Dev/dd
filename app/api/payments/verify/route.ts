import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { RazorpayService } from "@/lib/razorpay";
import { ResellerClubWrapper } from "@/lib/resellerclub-wrapper";
import { ResellerClubAPI } from "@/lib/resellerclub";
import { EmailService } from "@/lib/email";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import {
  isDomainSupported,
  requiresAdditionalDetails,
  getDomainRequirements,
} from "@/lib/domainRequirements";

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
    // Note: item.price is already the total price for the registration period
    const expectedAmount =
      Math.round(cartItems.reduce((total, item) => total + item.price, 0)) *
      100; // Convert to paise

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
        registrationResults: existingOrder.domains.map((d: any) => ({
          domainName: d.domainName,
          status: d.status,
          orderId: d.orderId,
          error: d.error,
        })),
        successfulDomains: existingOrder.successfulDomains,
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

    // Validate domains before processing
    const restrictedDomains = [];
    for (const item of cartItems) {
      if (
        requiresAdditionalDetails(item.domainName) ||
        !isDomainSupported(item.domainName)
      ) {
        restrictedDomains.push({
          domainName: item.domainName,
          requirements: getDomainRequirements(item.domainName),
        });
      }
    }

    // If any restricted domains found, reject the payment
    if (restrictedDomains.length > 0) {
      console.error(
        "❌ [PAYMENT-VERIFY] Payment rejected due to restricted domains:",
        restrictedDomains
      );

      return NextResponse.json(
        {
          success: false,
          error: "Payment rejected",
          message:
            "Some domains in your order require additional verification and cannot be processed automatically.",
          restrictedDomains: restrictedDomains.map((d) => ({
            domainName: d.domainName,
            reason:
              d.requirements?.warningMessage ||
              "Additional verification required",
          })),
          supportContact:
            "Please contact support@exceltechnologies.com for assistance with these domains.",
        },
        { status: 400 }
      );
    }

    const registrationResults = [];
    const successfulDomains = [];
    const orderDomains = [];

    for (const item of cartItems) {
      console.log(`🔄 [PAYMENT-VERIFY] Registering domain: ${item.domainName}`);
      try {
        // Get user's nameserver configuration (if any)
        let nameServers: string[] | undefined;
        try {
          // In a real implementation, you might store this in the database
          // For now, we'll use ResellerClub defaults as configured in the API
          console.log(
            `🌐 [PAYMENT-VERIFY] Using ResellerClub default nameservers for ${item.domainName}`
          );
        } catch (error) {
          console.warn(
            `⚠️ [PAYMENT-VERIFY] Could not fetch nameserver config, using defaults:`,
            error
          );
        }

        // Get or create ResellerClub customer and contact IDs
        const customerResult =
          await ResellerClubAPI.getOrCreateCustomerAndContact({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            phoneCc: user.phoneCc,
            companyName: user.companyName,
            address: user.address
              ? {
                  line1: user.address.line1,
                  city: user.address.city,
                  state: user.address.state,
                  country: user.address.country,
                  zipcode: user.address.zipcode,
                }
              : undefined,
          });

        if (
          customerResult.status !== "success" ||
          !customerResult.customerId ||
          !customerResult.contactId
        ) {
          console.error(
            `❌ [PAYMENT-VERIFY] Failed to get ResellerClub customer/contact IDs for user ${user.email}:`,
            customerResult.error
          );
          throw new Error("Failed to get ResellerClub customer/contact IDs");
        }

        const result = await ResellerClubWrapper.registerDomain(
          {
            domainName: item.domainName,
            years: item.registrationPeriod || 1,
            customerId: customerResult.customerId, // Use ResellerClub customer ID
            adminContactId: customerResult.contactId, // Use ResellerClub contact ID for admin
            techContactId: customerResult.contactId, // Use same contact ID for tech
            billingContactId: customerResult.contactId, // Use same contact ID for billing
            nameServers: nameServers, // Will use ResellerClub defaults if undefined
          },
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
      successfulDomains: successfulDomains,
    });

    // Determine order status - always "completed" if payment succeeded
    const orderStatus = "completed";

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
      let adminEmailSent = false;

      // Send regular notification for orders
      adminEmailSent = await EmailService.sendAdminNotification(
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
          orderStatus: orderStatus,
        }
      );

      if (adminEmailSent) {
        console.log(
          `✅ [ADMIN-NOTIFICATION] Order notification sent for order ${order.orderId}`
        );
      }

      if (!adminEmailSent) {
        console.error(
          `❌ [ADMIN-NOTIFICATION] Failed to send admin notification email for order ${order.orderId}`
        );
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
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    // Determine error type and provide appropriate response
    let errorMessage = "Payment verification failed";
    let statusCode = 500;
    let errorType = "verification_error";

    if (error instanceof Error) {
      if (error.message.includes("Invalid payment signature")) {
        errorMessage =
          "Payment signature verification failed. Please try again.";
        statusCode = 400;
        errorType = "signature_error";
      } else if (error.message.includes("Payment not found")) {
        errorMessage =
          "Payment not found. Please contact support if you were charged.";
        statusCode = 404;
        errorType = "payment_not_found";
      } else if (error.message.includes("Payment already processed")) {
        errorMessage = "This payment has already been processed.";
        statusCode = 409;
        errorType = "duplicate_payment";
      } else if (error.message.includes("Insufficient funds")) {
        errorMessage =
          "Payment failed due to insufficient funds. Please try again.";
        statusCode = 402;
        errorType = "insufficient_funds";
      } else if (error.message.includes("Card declined")) {
        errorMessage =
          "Your card was declined. Please try a different payment method.";
        statusCode = 402;
        errorType = "card_declined";
      } else if (
        error.message.includes("Network error") ||
        error.message.includes("timeout")
      ) {
        errorMessage =
          "Network error occurred. Please check your payment status in a few minutes.";
        statusCode = 503;
        errorType = "network_error";
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        errorType: errorType,
        message:
          "Payment verification failed. Please contact support if the issue persists.",
        supportContact: "support@exceltechnologies.com",
      },
      { status: statusCode }
    );
  }
}
