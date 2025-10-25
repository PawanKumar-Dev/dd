import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import PendingDomain from "@/models/PendingDomain";

// Force dynamic rendering - required for API routes
export const dynamic = 'force-dynamic';

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

    return NextResponse.json({
      success: true,
      message: "Pending domain updated successfully",
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

    await PendingDomain.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: "Pending domain deleted successfully",
    });
  } catch (error) {
    console.error("Admin pending domain deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete pending domain" },
      { status: 500 }
    );
  }
}
