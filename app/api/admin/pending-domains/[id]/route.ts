import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import PendingDomain from "@/models/PendingDomain";
import Order from "@/models/Order";

// Force dynamic rendering - required for API routes
export const dynamic = "force-dynamic";

export async function GET(
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

    const pendingDomain = await PendingDomain.findById(params.id).populate(
      "userId",
      "firstName lastName email phone companyName"
    );

    if (!pendingDomain) {
      return NextResponse.json(
        { error: "Pending domain not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      pendingDomain,
    });
  } catch (error) {
    console.error("Admin pending domain fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending domain" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const body = await request.json();
    const { status, adminNotes, reason } = body;

    const pendingDomain = await PendingDomain.findById(params.id);

    if (!pendingDomain) {
      return NextResponse.json(
        { error: "Pending domain not found" },
        { status: 404 }
      );
    }

    // Update fields
    if (status) {
      pendingDomain.status = status;
    }
    if (adminNotes !== undefined) {
      pendingDomain.adminNotes = adminNotes;
    }
    if (reason) {
      pendingDomain.reason = reason;
    }

    await pendingDomain.save();

    // SYNC WITH ORDER COLLECTION
    // When admin updates pending domain status, also update the corresponding domain in the Order collection
    if (status && pendingDomain.orderId) {
      try {
        const order = await Order.findOne({ orderId: pendingDomain.orderId });

        if (order) {
          // Find and update the matching domain in the order
          const domainIndex = order.domains.findIndex(
            (d: any) => d.domainName === pendingDomain.domainName
          );

          if (domainIndex !== -1) {
            // Map pending domain status to order domain status
            const domainStatus =
              status === "registered" ? "registered" : "failed";

            order.domains[domainIndex].status = domainStatus;

            // Update error message if status is failed
            if (status === "failed" && reason) {
              order.domains[domainIndex].error = reason;
            }

            // Add booking status update
            order.domains[domainIndex].bookingStatus =
              order.domains[domainIndex].bookingStatus || [];
            order.domains[domainIndex].bookingStatus.push({
              step:
                status === "registered" ? "domain_registered" : "domain_failed",
              message:
                status === "registered"
                  ? "Domain registered by admin"
                  : `Domain registration failed: ${reason || "Unknown reason"}`,
              timestamp: new Date(),
              progress: status === "registered" ? 100 : 0,
            });

            await order.save();
            console.log(
              `✅ Synced pending domain status to Order collection: ${pendingDomain.domainName} -> ${domainStatus}`
            );
          }
        }
      } catch (syncError) {
        console.error(
          "Failed to sync pending domain status with Order:",
          syncError
        );
        // Don't fail the request if sync fails - pending domain is still updated
      }
    }

    return NextResponse.json({
      success: true,
      message: "Pending domain updated successfully and synced with order",
      pendingDomain,
    });
  } catch (error) {
    console.error("Admin pending domain update error:", error);
    return NextResponse.json(
      { error: "Failed to update pending domain" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Archive instead of delete
    await PendingDomain.findByIdAndUpdate(params.id, {
      isArchived: true,
      archivedAt: new Date(),
      archivedBy: user.email,
    });

    return NextResponse.json({
      success: true,
      message: "Pending domain archived successfully",
    });
  } catch (error) {
    console.error("Admin pending domain archive error:", error);
    return NextResponse.json(
      { error: "Failed to archive pending domain" },
      { status: 500 }
    );
  }
}
