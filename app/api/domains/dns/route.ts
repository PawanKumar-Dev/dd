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

    const { searchParams } = new URL(request.url);
    const domainName = searchParams.get("domainName");

    if (!domainName) {
      return NextResponse.json(
        { error: "Domain name is required" },
        { status: 400 }
      );
    }

    await connectDB(); // Connect to DB

    // Find the domain in the database to get resellerClubCustomerId
    const order = await Order.findOne({
      "domains.domainName": domainName, // Correct field name is 'domainName'
      userId: user._id,
    });

    if (!order) {
      return NextResponse.json(
        { error: "Domain not found for this user" },
        { status: 404 }
      );
    }

    const domain = order.domains.find((d: any) => d.domainName === domainName);

    if (!domain || !domain.resellerClubCustomerId) {
      return NextResponse.json(
        { error: "ResellerClub Customer ID not found for this domain" },
        { status: 404 }
      );
    }

    // Get DNS records
    const result = await ResellerClubWrapper.getDNSRecords(
      domainName,
      domain.resellerClubCustomerId // Pass the customer ID
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
  } catch (error) {
    console.error("DNS records fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch DNS records" },
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

    const { domainName, recordData } = await request.json();

    if (!domainName || !recordData) {
      return NextResponse.json(
        { error: "Domain name and record data are required" },
        { status: 400 }
      );
    }

    // Validate record data
    const { type, name, value, ttl, priority } = recordData;
    if (!type || !name || !value || !ttl) {
      return NextResponse.json(
        { error: "Type, name, value, and TTL are required" },
        { status: 400 }
      );
    }

    await connectDB(); // Connect to DB

    // Find the domain in the database to get resellerClubCustomerId
    const order = await Order.findOne({
      "domains.domainName": domainName,
      userId: user._id,
    });

    if (!order) {
      return NextResponse.json(
        { error: "Domain not found for this user" },
        { status: 404 }
      );
    }

    const domain = order.domains.find((d: any) => d.domainName === domainName);

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

    if (result.status === "error") {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "DNS record added successfully",
      recordId: result.data?.recordid,
    });
  } catch (error) {
    console.error("DNS record add error:", error);
    return NextResponse.json(
      { error: "Failed to add DNS record" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domainName, recordId, recordData } = await request.json();

    if (!domainName || !recordId || !recordData) {
      return NextResponse.json(
        { error: "Domain name, record ID, and record data are required" },
        { status: 400 }
      );
    }

    // Update DNS record
    const result = await ResellerClubWrapper.updateDNSRecord(
      domainName,
      recordId,
      recordData
    );

    if (result.status === "error") {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "DNS record updated successfully",
    });
  } catch (error) {
    console.error("DNS record update error:", error);
    return NextResponse.json(
      { error: "Failed to update DNS record" },
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

    // Delete DNS record
    const result = await ResellerClubWrapper.deleteDNSRecord(
      domainName,
      recordId,
      recordData
    );

    if (result.status === "error") {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "DNS record deleted successfully",
    });
  } catch (error) {
    console.error("DNS record delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete DNS record" },
      { status: 500 }
    );
  }
}
