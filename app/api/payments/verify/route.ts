import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { RazorpayService } from "@/lib/razorpay";
import { ResellerClubWrapper } from "@/lib/resellerclub-wrapper";
import { ResellerClubAPI } from "@/lib/resellerclub";
import { EmailService } from "@/lib/email";
import { DomainVerificationService } from "@/lib/domain-verification";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import PendingDomain from "@/models/PendingDomain";
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
    const totalAmount = cartItems.reduce(
      (total, item) => total + item.price,
      0
    );
    const expectedAmount = Math.round(totalAmount * 100); // Convert to paise

    console.log("💰 [PAYMENT-VERIFY] Amount calculation:");
    console.log("💰 [PAYMENT-VERIFY] Total amount:", totalAmount);
    console.log("💰 [PAYMENT-VERIFY] Expected amount (paise):", expectedAmount);
    console.log(
      "💰 [PAYMENT-VERIFY] Received amount (paise):",
      paymentDetails.amount
    );

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

    // Calculate total amount for registration
    const registrationTotalAmount = cartItems.reduce(
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

    // Define nameservers at higher scope for pending domain creation
    let nameServers: string[] | undefined;

    // Get or create ResellerClub customer and contact IDs (outside loop to avoid duplication)
    console.log(
      `👤 [PAYMENT-VERIFY] Creating/verifying customer account for: ${user.email}`
    );

    const customerResult = await ResellerClubAPI.getOrCreateCustomerAndContact({
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

    console.log(
      `✅ [PAYMENT-VERIFY] Customer account created successfully: ${customerResult.customerId}`
    );

    for (const item of cartItems) {
      console.log(`🔄 [PAYMENT-VERIFY] Registering domain: ${item.domainName}`);

      // Initialize domain booking status
      const domainBookingStatus = [
        {
          step: "payment_verified" as const,
          message: "Payment verified successfully",
          timestamp: new Date(),
          progress: 20,
        },
        {
          step: "customer_created" as any,
          message: "Setting up your account",
          timestamp: new Date(),
          progress: 40,
        },
        {
          step: "contact_created" as any,
          message: "Account setup completed",
          timestamp: new Date(),
          progress: 60,
        },
      ];

      try {
        // Get user's nameserver configuration (if any)
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

        console.log(
          `🌐 [PAYMENT-VERIFY] Starting domain registration for: ${item.domainName}`
        );
        domainBookingStatus.push({
          step: "domain_registering" as any,
          message: "Registering domain",
          timestamp: new Date(),
          progress: 80,
        });

        const result = await ResellerClubWrapper.registerDomain(
          item.domainName,
          item.registrationPeriod || 1,
          customerResult.customerId, // Use ResellerClub customer ID
          nameServers, // Will use ResellerClub defaults if undefined
          {
            admin: customerResult.contactId, // Use ResellerClub contact ID for admin
            tech: customerResult.contactId, // Use same contact ID for tech
            billing: customerResult.contactId, // Use same contact ID for billing
          }
        );

        if (result.status === "success") {
          console.log(
            `✅ [PAYMENT-VERIFY] Domain registration successful: ${item.domainName}`
          );

          domainBookingStatus.push({
            step: "domain_registered" as any,
            message: "Domain registered successfully",
            timestamp: new Date(),
            progress: 100,
          });

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
            bookingStatus: domainBookingStatus,
            orderId: result.data?.orderid,
            expiresAt,
            resellerClubOrderId: result.data?.orderid,
            resellerClubCustomerId: customerResult.customerId,
            resellerClubContactId: customerResult.contactId,
          });
        } else if (result.status === "pending") {
          console.log(
            `⏳ [PAYMENT-VERIFY] Domain registration pending: ${item.domainName} - ${result.message}`
          );

          // Create user-friendly message for pending status
          const userFriendlyMessage =
            result.message &&
            result.message.toLowerCase().includes("order locked for processing")
              ? "Domain registration is being processed. Our team will complete the registration shortly."
              : `Domain registration pending: ${result.message}`;

          domainBookingStatus.push({
            step: "domain_pending" as any,
            message: userFriendlyMessage,
            timestamp: new Date(),
            progress: 50,
          });

          registrationResults.push({
            domainName: item.domainName,
            status: "pending",
            error: result.message,
          });

          orderDomains.push({
            domainName: item.domainName,
            price: item.price,
            currency: item.currency || "INR",
            registrationPeriod: item.registrationPeriod || 1,
            status: "pending",
            bookingStatus: domainBookingStatus,
            error: userFriendlyMessage, // Use user-friendly message instead of raw error
            resellerClubCustomerId: customerResult.customerId,
            resellerClubContactId: customerResult.contactId,
          });
        } else {
          console.error(
            `❌ [PAYMENT-VERIFY] Domain registration failed: ${item.domainName} - ${result.message}`
          );

          // Log the actual ResellerClub response for debugging
          console.log(
            `🔍 [PAYMENT-VERIFY] ResellerClub response for "${item.domainName}":`,
            {
              status: result.status,
              message: result.message,
              data: result.data,
            }
          );

          // More conservative approach - only mark as pending for very specific balance-related errors
          const isInsufficientBalance =
            result.status === "pending" || // If ResellerClub wrapper already determined it's pending
            (result.message &&
              (result.message.toLowerCase().includes("insufficient balance") ||
                result.message.toLowerCase().includes("low funds") ||
                result.message.toLowerCase().includes("insufficient funds") ||
                result.message.toLowerCase().includes("account balance") ||
                result.message.toLowerCase().includes("credit limit") ||
                result.message
                  .toLowerCase()
                  .includes("already exists in our database") ||
                result.message.toLowerCase().includes("pending order") ||
                result.message.toLowerCase().includes("pending order for")));

          const domainStatus = isInsufficientBalance ? "pending" : "failed";
          const statusMessage = isInsufficientBalance
            ? result.message
                .toLowerCase()
                .includes("already exists in our database")
              ? "Domain registration is being processed. Our team will complete the registration shortly."
              : "Domain registration pending due to insufficient balance"
            : `Domain registration failed: ${result.message}`;

          domainBookingStatus.push({
            step: isInsufficientBalance
              ? ("domain_pending" as any)
              : ("domain_failed" as any),
            message: statusMessage,
            timestamp: new Date(),
            progress: isInsufficientBalance ? 50 : 100,
          });

          registrationResults.push({
            domainName: item.domainName,
            status: domainStatus,
            error: result.message,
          });

          orderDomains.push({
            domainName: item.domainName,
            price: item.price,
            currency: item.currency || "INR",
            registrationPeriod: item.registrationPeriod || 1,
            status: domainStatus,
            bookingStatus: domainBookingStatus,
            error: result.message,
            resellerClubCustomerId: customerResult.customerId,
            resellerClubContactId: customerResult.contactId,
          });
        }
      } catch (error) {
        console.error(
          `Domain registration error for ${item.domainName}:`,
          error
        );

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        // Log the error for debugging
        console.log(
          `🔍 [PAYMENT-VERIFY] Domain registration error for "${item.domainName}":`,
          {
            error: errorMessage,
            errorType:
              error instanceof Error ? error.constructor.name : typeof error,
            stack: error instanceof Error ? error.stack : undefined,
          }
        );

        // More conservative approach - only mark as pending for very specific balance-related errors
        const isInsufficientBalance =
          errorMessage &&
          (errorMessage.toLowerCase().includes("insufficient balance") ||
            errorMessage.toLowerCase().includes("low funds") ||
            errorMessage.toLowerCase().includes("insufficient funds") ||
            errorMessage.toLowerCase().includes("account balance") ||
            errorMessage.toLowerCase().includes("credit limit"));

        const domainStatus = isInsufficientBalance ? "pending" : "failed";
        const statusMessage = isInsufficientBalance
          ? "Domain registration pending due to insufficient balance"
          : `Registration failed: ${errorMessage}`;

        domainBookingStatus.push({
          step: isInsufficientBalance
            ? ("domain_pending" as any)
            : ("domain_failed" as any),
          message: statusMessage,
          timestamp: new Date(),
          progress: isInsufficientBalance ? 50 : 100,
        });

        registrationResults.push({
          domainName: item.domainName,
          status: domainStatus,
          error: errorMessage,
        });

        orderDomains.push({
          domainName: item.domainName,
          price: item.price,
          currency: item.currency || "INR",
          registrationPeriod: item.registrationPeriod || 1,
          status: domainStatus,
          bookingStatus: domainBookingStatus,
          error: errorMessage,
          resellerClubCustomerId: customerResult.customerId,
          resellerClubContactId: customerResult.contactId,
        });
      }
    }

    // Log domain registration summary
    console.log("📊 [PAYMENT-VERIFY] Domain registration summary:", {
      totalDomains: cartItems.length,
      successful: successfulDomains.length,
      successfulDomains: successfulDomains,
    });

    // Verify domain registrations to detect failed registrations due to insufficient funds
    console.log(
      "🔍 [PAYMENT-VERIFY] Starting domain verification for all registered domains..."
    );

    const domainsToVerify = orderDomains.map((domain) => domain.domainName);
    const verificationResults =
      await DomainVerificationService.verifyMultipleDomains(domainsToVerify);

    // Process verification results and create pending domains for failed registrations
    const pendingDomainsToCreate = [];

    // First, add domains that were already marked as pending during registration
    for (const orderDomain of orderDomains) {
      if (orderDomain.status === "pending") {
        console.log(
          `📝 [PAYMENT-VERIFY] Creating pending domain record for: ${orderDomain.domainName}`
        );

        const pendingDomainData = {
          domainName: orderDomain.domainName,
          price: orderDomain.price,
          currency: orderDomain.currency,
          registrationPeriod: orderDomain.registrationPeriod,
          userId: user._id?.toString() || '',
          orderId: orderId,
          customerId: orderDomain.resellerClubCustomerId,
          contactId: orderDomain.resellerClubContactId,
          nameServers: nameServers,
          adminContactId: customerResult.contactId,
          techContactId: customerResult.contactId,
          billingContactId: customerResult.contactId,
          status: "pending",
          reason:
            orderDomain.error ||
            "Domain registration pending - requires manual processing",
          verificationAttempts: 0,
          lastVerifiedAt: new Date(),
        };

        pendingDomainsToCreate.push(pendingDomainData);
      }
    }

    // Then, process verification results for domains that appeared successful
    for (const verificationResult of verificationResults) {
      const orderDomain = orderDomains.find(
        (d) => d.domainName === verificationResult.domainName
      );

      if (
        orderDomain &&
        orderDomain.status === "registered" && // Only check domains that appeared successful
        DomainVerificationService.isPendingRegistration(verificationResult)
      ) {
        console.log(
          `⚠️ [PAYMENT-VERIFY] Domain still available after registration: ${verificationResult.domainName}`
        );

        // Update order domain status to pending
        orderDomain.status = "pending";
        orderDomain.verificationResult = verificationResult;

        // Create pending domain record for admin management
        const pendingDomainData = {
          domainName: verificationResult.domainName,
          price: orderDomain.price,
          currency: orderDomain.currency,
          registrationPeriod: orderDomain.registrationPeriod,
          userId: user._id?.toString() || '',
          orderId: orderId,
          customerId: orderDomain.resellerClubCustomerId,
          contactId: orderDomain.resellerClubContactId,
          nameServers: nameServers,
          adminContactId: customerResult.contactId,
          techContactId: customerResult.contactId,
          billingContactId: customerResult.contactId,
          status: "pending",
          reason:
            verificationResult.reason ||
            "Domain still available - registration likely failed due to insufficient funds",
          verificationAttempts: 1,
          lastVerifiedAt: new Date(),
        };

        pendingDomainsToCreate.push(pendingDomainData);
      } else if (
        orderDomain &&
        orderDomain.status === "registered" &&
        verificationResult.registrationStatus === "success"
      ) {
        console.log(
          `✅ [PAYMENT-VERIFY] Domain verification successful: ${verificationResult.domainName}`
        );
        // Domain is properly registered, no action needed
      }
    }

    // Create pending domain records in database
    if (pendingDomainsToCreate.length > 0) {
      console.log(
        `📝 [PAYMENT-VERIFY] Creating ${pendingDomainsToCreate.length} pending domain records for admin management`
      );
      try {
        await PendingDomain.insertMany(pendingDomainsToCreate);
        console.log(
          `✅ [PAYMENT-VERIFY] Successfully created ${pendingDomainsToCreate.length} pending domain records`
        );
      } catch (error) {
        console.error(
          "❌ [PAYMENT-VERIFY] Failed to create pending domain records:",
          error
        );
        // Don't fail the entire process if pending domain creation fails
      }
    }

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
      amount: registrationTotalAmount,
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
          subtotal: (order as any).subtotal,
          currency: order.currency,
          successfulDomains: orderDomains
            .filter((d) => d.status === "registered")
            .map((d) => ({
              domainName: d.domainName,
              price: d.price,
              registrationPeriod: d.registrationPeriod,
            })),
          allDomains: orderDomains.map((d) => ({
            domainName: d.domainName,
            price: d.price,
            registrationPeriod: d.registrationPeriod,
            status: d.status,
          })),
          paymentId: order.paymentId,
          createdAt: order.createdAt,
        } as any
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
