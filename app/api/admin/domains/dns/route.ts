import { NextRequest, NextResponse } from "next/server";
import { ResellerClubWrapper } from "@/lib/resellerclub-wrapper";
import { AuthService } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const domainName = searchParams.get("domainName");

    if (!domainName) {
      return NextResponse.json(
        { error: "Domain name is required" },
        { status: 400 }
      );
    }

    await connectDB(); // Connect to DB

    // Find the domain in the database (admin can access any domain)
    const order = await Order.findOne({
      "domains.domainName": domainName,
    });

    if (!order) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const domain = order.domains.find((d) => d.domainName === domainName);

    if (!domain || !domain.resellerClubCustomerId) {
      return NextResponse.json(
        { error: "ResellerClub Customer ID not found for this domain" },
        { status: 404 }
      );
    }

    // Get DNS records
    const result = await ResellerClubWrapper.getDNSRecords(
      domainName,
      domain.resellerClubCustomerId
    );

    if (result.status === "error") {
      // Check if it's a 404 error (domain not found in ResellerClub)
      if (result.message && result.message.includes("404")) {
        return NextResponse.json(
          { error: "Domain not found in ResellerClub" },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      domainName,
      records: result.data?.records || [],
    });
  } catch (error: any) {
    console.error("Error in admin DNS GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { domainName, recordData } = await request.json();

    if (!domainName || !recordData) {
      return NextResponse.json(
        { error: "Domain name and record data are required" },
        { status: 400 }
      );
    }

    await connectDB(); // Connect to DB

    // Find the domain in the database (admin can access any domain)
    const order = await Order.findOne({
      "domains.domainName": domainName,
    });

    if (!order) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const domain = order.domains.find((d) => d.domainName === domainName);

    if (!domain || !domain.resellerClubCustomerId) {
      return NextResponse.json(
        { error: "ResellerClub Customer ID not found for this domain" },
        { status: 404 }
      );
    }

    // Add DNS record
    const result = await ResellerClubWrapper.addDNSRecord(
      domainName,
      domain.resellerClubCustomerId,
      recordData
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "DNS record added successfully",
        recordId: result.data?.recordId,
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to add DNS record" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in admin DNS POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const domainName = searchParams.get("domainName");
    const recordId = searchParams.get("recordId");

    if (!domainName || !recordId) {
      return NextResponse.json(
        { error: "Domain name and record ID are required" },
        { status: 400 }
      );
    }

    // Get record data from request body
    const { recordData } = await request.json().catch(() => ({}));

    if (!recordData) {
      return NextResponse.json(
        { error: "Record data is required for deletion" },
        { status: 400 }
      );
    }

    await connectDB(); // Connect to DB

    // Find the domain in the database (admin can access any domain)
    const order = await Order.findOne({
      "domains.domainName": domainName,
    });

    if (!order) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const domain = order.domains.find((d) => d.domainName === domainName);

    if (!domain || !domain.resellerClubCustomerId) {
      return NextResponse.json(
        { error: "ResellerClub Customer ID not found for this domain" },
        { status: 404 }
      );
    }

    // Delete DNS record
    const result = await ResellerClubWrapper.deleteDNSRecord(
      domainName,
      recordId,
      recordData
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "DNS record deleted successfully",
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to delete DNS record" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in admin DNS DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
