import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import PendingDomain from "@/models/PendingDomain";
import Order from "@/models/Order";
import { ResellerClubWrapper } from "@/lib/resellerclub-wrapper";
import { DomainVerificationService } from "@/lib/domain-verification";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const pendingDomain = await PendingDomain.findById(params.id);

    if (!pendingDomain) {
      return NextResponse.json(
        { error: "Pending domain not found" },
        { status: 404 }
      );
    }

    if (pendingDomain.status !== "pending") {
      return NextResponse.json(
        { error: "Domain is not in pending status" },
        { status: 400 }
      );
    }

    // Update status to processing
    pendingDomain.status = "processing";
    await pendingDomain.save();

    try {
      // Attempt domain registration
      const result = await ResellerClubWrapper.registerDomain(
        pendingDomain.domainName,
        pendingDomain.registrationPeriod,
        pendingDomain.customerId,
        pendingDomain.nameServers,
        {
          admin: pendingDomain.adminContactId || pendingDomain.contactId,
          tech: pendingDomain.techContactId || pendingDomain.contactId,
          billing: pendingDomain.billingContactId || pendingDomain.contactId,
        }
      );

      if (result.status === "success") {
        // Registration successful
        const expiresAt = new Date(
          Date.now() +
            pendingDomain.registrationPeriod * 365 * 24 * 60 * 60 * 1000
        );

        pendingDomain.status = "completed";
        pendingDomain.registeredAt = new Date();
        pendingDomain.expiresAt = expiresAt;
        pendingDomain.resellerClubOrderId = result.data?.orderid;
        pendingDomain.reason = "Domain registered successfully by admin";
        await pendingDomain.save();

        // Update the original order with the registered domain
        const order = await Order.findOne({ orderId: pendingDomain.orderId });
        if (order) {
          const domainIndex = order.domains.findIndex(
            (d: any) => d.domainName === pendingDomain.domainName
          );
          if (domainIndex !== -1) {
            order.domains[domainIndex].status = "registered";
            order.domains[domainIndex].resellerClubOrderId =
              result.data?.orderid;
            order.domains[domainIndex].expiresAt = expiresAt;
            order.domains[domainIndex].registeredAt = new Date();
            await order.save();
          }
        }

        return NextResponse.json({
          success: true,
          message: "Domain registered successfully",
          result,
          pendingDomain,
        });
      } else {
        // Registration failed
        pendingDomain.status = "failed";
        pendingDomain.reason = `Registration failed: ${result.message}`;
        await pendingDomain.save();

        return NextResponse.json(
          {
            success: false,
            message: "Domain registration failed",
            error: result.message,
            pendingDomain,
          },
          { status: 400 }
        );
      }
    } catch (error) {
      // Registration error
      pendingDomain.status = "failed";
      pendingDomain.reason = `Registration error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      await pendingDomain.save();

      console.error("Domain registration error:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Domain registration failed",
          error: error instanceof Error ? error.message : "Unknown error",
          pendingDomain,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Admin domain registration error:", error);
    return NextResponse.json(
      { error: "Failed to register domain" },
      { status: 500 }
    );
  }
}
