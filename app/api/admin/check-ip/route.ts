import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import IPCheck from "@/models/IPCheck";

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await connectDB();

    // Check IP using multiple services for reliability
    const ipServices = [
      "https://api.ipify.org",
      "https://ipinfo.io/ip",
      "https://api.ipify.org?format=json",
      "https://httpbin.org/ip",
    ];

    const results: any = {
      timestamp: new Date().toISOString(),
      services: {},
      primaryIP: null,
      allIPs: [],
      serverInfo: {
        userAgent: request.headers.get("user-agent"),
        host: request.headers.get("host"),
        forwarded: request.headers.get("x-forwarded-for"),
        realIP: request.headers.get("x-real-ip"),
      },
    };

    let hasSuccess = false;

    // Try each service
    for (const service of ipServices) {
      try {
        const response = await fetch(service, {
          method: "GET",
          headers: {
            "User-Agent": "Domain-Management-System/1.0",
          },
        });

        if (response.ok) {
          const data = await response.text();
          let ip = data.trim();

          // Handle JSON responses
          if (service.includes("format=json") || service.includes("httpbin")) {
            try {
              const jsonData = JSON.parse(data);
              ip = jsonData.ip || jsonData.origin || data;
            } catch (e) {
              // Keep as text if JSON parsing fails
            }
          }

          results.services[service] = {
            status: "success",
            ip: ip,
            responseTime: response.headers.get("x-response-time") || "unknown",
          };

          if (!results.primaryIP) {
            results.primaryIP = ip;
          }

          if (!results.allIPs.includes(ip)) {
            results.allIPs.push(ip);
          }

          hasSuccess = true;
        } else {
          results.services[service] = {
            status: "error",
            error: `HTTP ${response.status}`,
            responseTime: "unknown",
          };
        }
      } catch (error) {
        results.services[service] = {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          responseTime: "unknown",
        };
      }
    }

    // Prepare response data
    const responseData = {
      success: hasSuccess,
      message: hasSuccess
        ? `Outbound IP detected: ${results.primaryIP}`
        : "No IP detected from any service",
      data: hasSuccess ? results : undefined,
      error: hasSuccess ? undefined : "All IP detection services failed",
    };

    // Save to database
    const ipCheckRecord = new IPCheck({
      success: responseData.success,
      message: responseData.message,
      data: responseData.data,
      error: responseData.error,
      checkedBy: user._id,
      checkedAt: new Date(),
    });

    await ipCheckRecord.save();

    console.log(
      `✅ [ADMIN] IP check saved to database by ${user.email}: ${
        responseData.success ? results.primaryIP : "Failed"
      }`
    );

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Failed to check IP:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to check IP",
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
