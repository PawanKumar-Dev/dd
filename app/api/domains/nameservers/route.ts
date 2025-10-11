import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import whois from "whois-json";

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

    // Validate domain name format
    const domainRegex =
      /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;
    if (!domainRegex.test(domainName)) {
      return NextResponse.json(
        { error: "Invalid domain name format" },
        { status: 400 }
      );
    }

    console.log(`🔍 [WHOIS] Looking up nameservers for: ${domainName}`);

    try {
      // Query WHOIS data
      const whoisData = await whois(domainName, {
        timeout: 10000, // 10 second timeout
        follow: 3, // Follow up to 3 redirects
      });

      console.log(`✅ [WHOIS] Received data for: ${domainName}`);

      // Extract nameservers from different possible fields
      let nameservers: string[] = [];

      // Common nameserver field names in WHOIS data
      const nameserverFields = [
        "nameServer",
        "nameserver",
        "name_servers",
        "name_servers_list",
        "nserver",
        "Name Server",
        "NAME SERVER",
        "nameservers",
        "dns",
        "dns_servers",
      ];

      // Look for nameservers in various fields
      for (const field of nameserverFields) {
        if (whoisData[field]) {
          if (Array.isArray(whoisData[field])) {
            nameservers = [...nameservers, ...whoisData[field]];
          } else if (typeof whoisData[field] === "string") {
            // Split by common separators
            const nsList = whoisData[field]
              .split(/[,\n\r\t]+/)
              .map((ns: string) => ns.trim())
              .filter((ns: string) => ns.length > 0);
            nameservers = [...nameservers, ...nsList];
          }
        }
      }

      // Remove duplicates and clean up
      nameservers = [...new Set(nameservers)]
        .map((ns) => ns.toLowerCase().trim())
        .filter((ns) => {
          // Basic validation for nameserver format
          return (
            ns.length > 0 &&
            ns.includes(".") &&
            !ns.includes(" ") &&
            /^[a-zA-Z0-9.-]+$/.test(ns)
          );
        });

      // If no nameservers found in common fields, try to extract from raw text
      if (nameservers.length === 0 && whoisData.raw) {
        const rawText = whoisData.raw;
        const nsRegex = /name\s*server[s]?[:\s]+([^\n\r]+)/gi;
        let match;

        while ((match = nsRegex.exec(rawText)) !== null) {
          const nsLine = match[1].trim();
          const nsList = nsLine
            .split(/[,\s]+/)
            .map((ns) => ns.trim())
            .filter((ns) => ns.length > 0 && ns.includes("."));
          nameservers = [...nameservers, ...nsList];
        }
      }

      // Remove duplicates again
      nameservers = [...new Set(nameservers)];

      console.log(
        `📋 [WHOIS] Found ${nameservers.length} nameservers for ${domainName}:`,
        nameservers
      );

      return NextResponse.json({
        success: true,
        domainName,
        nameservers,
        count: nameservers.length,
        whoisData: {
          registrar: whoisData.registrar || whoisData.Registrar || "Unknown",
          creationDate:
            whoisData.creationDate ||
            whoisData.CreationDate ||
            whoisData.created ||
            null,
          expirationDate:
            whoisData.expirationDate ||
            whoisData.ExpirationDate ||
            whoisData.expires ||
            null,
          lastUpdated:
            whoisData.updatedDate ||
            whoisData.UpdatedDate ||
            whoisData.updated ||
            null,
          status: whoisData.status || whoisData.Status || "Unknown",
        },
        lastChecked: new Date().toISOString(),
      });
    } catch (whoisError: any) {
      console.error(`❌ [WHOIS] Error for ${domainName}:`, whoisError.message);

      return NextResponse.json({
        success: false,
        domainName,
        nameservers: [],
        count: 0,
        error: "Failed to retrieve nameserver information",
        details: whoisError.message,
        lastChecked: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Nameserver lookup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
