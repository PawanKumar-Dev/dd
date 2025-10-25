import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import PendingDomain from "@/models/PendingDomain";
import User from "@/models/User";

// Force dynamic rendering - required for API routes
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");

    // Build query
    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { domainName: { $regex: search, $options: "i" } },
        { orderId: { $regex: search, $options: "i" } },
      ];
    }

    // Get pending domains with pagination
    const skip = (page - 1) * limit;
    const pendingDomains = await PendingDomain.find(query)
      .populate("userId", "firstName lastName email phone companyName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await PendingDomain.countDocuments(query);

    // Get status counts
    const statusCounts = await PendingDomain.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusSummary = {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    statusCounts.forEach((item) => {
      statusSummary[item._id as keyof typeof statusSummary] = item.count;
      statusSummary.total += item.count;
    });

    return NextResponse.json({
      success: true,
      pendingDomains,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      statusSummary,
    });
  } catch (error) {
    console.error("Admin pending domains fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending domains" },
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

    // Check if user is admin
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Connect to database
    await connectDB();

    const body = await request.json();
    const {
      domainName,
      price,
      currency,
      registrationPeriod,
      userId,
      orderId,
      customerId,
      contactId,
      nameServers,
      adminContactId,
      techContactId,
      billingContactId,
      reason,
    } = body;

    // Validate required fields
    if (
      !domainName ||
      !price ||
      !userId ||
      !orderId ||
      !customerId ||
      !contactId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if domain already exists in pending domains
    const existingPending = await PendingDomain.findOne({ domainName });
    if (existingPending) {
      return NextResponse.json(
        { error: "Domain already exists in pending domains" },
        { status: 400 }
      );
    }

    // Create new pending domain
    const pendingDomain = new PendingDomain({
      domainName,
      price,
      currency: currency || "INR",
      registrationPeriod: registrationPeriod || 1,
      userId,
      orderId,
      customerId,
      contactId,
      nameServers,
      adminContactId,
      techContactId,
      billingContactId,
      reason:
        reason ||
        "Domain registration failed - likely due to insufficient funds",
      status: "pending",
      verificationAttempts: 0,
    });

    await pendingDomain.save();

    return NextResponse.json({
      success: true,
      message: "Pending domain created successfully",
      pendingDomain,
    });
  } catch (error) {
    console.error("Admin pending domain creation error:", error);
    return NextResponse.json(
      { error: "Failed to create pending domain" },
      { status: 500 }
    );
  }
}
