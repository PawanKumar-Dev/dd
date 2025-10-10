import { NextRequest, NextResponse } from "next/server";
import { ResellerClubWrapper } from "@/lib/resellerclub-wrapper";
import { AuthService } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domainName, action, nameservers } = await request.json();

    if (!domainName || !action) {
      return NextResponse.json(
        { error: "Domain name and action are required" },
        { status: 400 }
      );
    }

    let result;

    if (action === "set-default") {
      // Set default nameservers
      result = await ResellerClubWrapper.setDefaultNameservers(domainName);
    } else if (action === "set-custom") {
      // Set custom nameservers
      if (
        !nameservers ||
        !Array.isArray(nameservers) ||
        nameservers.length === 0
      ) {
        return NextResponse.json(
          {
            error: "Nameservers array is required for custom nameserver action",
          },
          { status: 400 }
        );
      }

      // Validate nameservers format
      const nameserverRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      for (const ns of nameservers) {
        if (!nameserverRegex.test(ns)) {
          return NextResponse.json(
            { error: `Invalid nameserver format: ${ns}` },
            { status: 400 }
          );
        }
      }

      result = await ResellerClubWrapper.setCustomNameservers(
        domainName,
        nameservers
      );
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'set-default' or 'set-custom'" },
        { status: 400 }
      );
    }

    if (result.status === "error") {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Nameservers ${
        action === "set-default" ? "set to default" : "updated successfully"
      }`,
      data: result.data,
    });
  } catch (error) {
    console.error("Nameserver management error:", error);
    return NextResponse.json(
      { error: "Failed to manage nameservers" },
      { status: 500 }
    );
  }
}
