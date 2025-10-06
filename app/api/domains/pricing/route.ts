import { NextRequest, NextResponse } from "next/server";
import { ResellerClubAPI } from "@/lib/resellerclub";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    console.log(`💰 [API-${requestId}] Live pricing request started`);

    // Get TLDs from query parameters
    const { searchParams } = new URL(request.url);
    const tldsParam = searchParams.get("tlds");
    const tlds = tldsParam ? tldsParam.split(",").map((tld) => tld.trim()) : [];

    let pricingData;

    if (tlds.length > 0) {
      // Fetch pricing for specific TLDs
      pricingData = await ResellerClubAPI.getTLDPricing(tlds);
    } else {
      // Fetch all pricing data
      pricingData = await ResellerClubAPI.getDomainPricing();
    }

    // Pricing data fetched successfully
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: pricingData,
      requestId,
      responseTime: `${responseTime}ms`,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ [API-${requestId}] Failed to fetch pricing data:`, {
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime: `${responseTime}ms`,
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch pricing data",
        requestId,
        responseTime: `${responseTime}ms`,
      },
      { status: 500 }
    );
  }
}
