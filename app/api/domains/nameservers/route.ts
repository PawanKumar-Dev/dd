import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { promisify } from "util";
import dns from "dns";

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

    console.log(`🔍 [RDAP] Looking up nameservers for: ${domainName}`);

    let nameservers: string[] = [];
    let whoisData: any = {};
    let method = "unknown";

    // Method 1: Try RDAP (Registration Data Access Protocol)
    try {
      console.log(`🔍 [RDAP] Trying RDAP lookup for: ${domainName}`);

      // Extract TLD from domain
      const tld = domainName.split(".").slice(-2).join(".");

      // Try RDAP bootstrap service first
      let rdapData = null;
      let rdapServer = "";

      try {
        // Try IANA RDAP bootstrap
        const bootstrapResponse = await fetch(
          `https://data.iana.org/rdap/dns.json`,
          {
            headers: {
              Accept: "application/json",
              "User-Agent": "Mozilla/5.0 (compatible; DomainManager/1.0)",
            },
          }
        );

        if (bootstrapResponse.ok) {
          const bootstrapData = await bootstrapResponse.json();
          console.log(`✅ [RDAP] Bootstrap data loaded`);

          // Find RDAP server for this TLD
          const tldEntry = bootstrapData.services?.find((service: any) =>
            service[0]?.some(
              (pattern: string) =>
                pattern === tld ||
                pattern === `*.${tld}` ||
                domainName.endsWith(pattern)
            )
          );

          if (tldEntry && tldEntry[1]?.length > 0) {
            const rdapUrl = tldEntry[1][0];
            console.log(`🔍 [RDAP] Found server for ${tld}: ${rdapUrl}`);

            const rdapResponse = await fetch(
              `${rdapUrl}/domain/${domainName}`,
              {
                headers: {
                  Accept: "application/rdap+json",
                  "User-Agent": "Mozilla/5.0 (compatible; DomainManager/1.0)",
                },
              }
            );

            if (rdapResponse.ok) {
              rdapData = await rdapResponse.json();
              rdapServer = rdapUrl;
              console.log(`✅ [RDAP] Received data from ${rdapUrl}`);
            }
          }
        }
      } catch (bootstrapError) {
        console.log(`⚠️ [RDAP] Bootstrap failed: ${bootstrapError.message}`);
      }

      // Fallback to direct RDAP servers if bootstrap fails
      if (!rdapData) {
        const directServers = [
          `https://rdap.verisign.com/domain/${domainName}`,
          `https://rdap.arin.net/registry/domain/${domainName}`,
          `https://rdap.afilias.net/rdap/domain/${domainName}`,
          `https://rdap.nic.in/domain/${domainName}`,
          `https://rdap.registry.in/domain/${domainName}`,
        ];

        for (const server of directServers) {
          try {
            const rdapResponse = await fetch(server, {
              headers: {
                Accept: "application/rdap+json",
                "User-Agent": "Mozilla/5.0 (compatible; DomainManager/1.0)",
              },
            });

            if (rdapResponse.ok) {
              rdapData = await rdapResponse.json();
              rdapServer = server;
              console.log(`✅ [RDAP] Received data from ${server}`);
              break;
            }
          } catch (serverError) {
            console.log(
              `⚠️ [RDAP] Server ${server} failed: ${serverError.message}`
            );
            continue;
          }
        }
      }

      if (rdapData) {
        method = "rdap";

        // Extract nameservers from RDAP data
        if (rdapData.nameservers && Array.isArray(rdapData.nameservers)) {
          nameservers = rdapData.nameservers
            .map((ns: any) => {
              if (typeof ns === "string") return ns;
              if (ns.ldhName) return ns.ldhName;
              if (ns.name) return ns.name;
              return ns;
            })
            .filter((ns: string) => ns && ns.includes(".") && ns.length > 3);
        }

        // Extract additional domain information from RDAP
        whoisData = {
          registrar:
            rdapData.registrar?.name || rdapData.registrar?.value || "Unknown",
          creationDate:
            rdapData.events?.find((e: any) => e.eventAction === "registration")
              ?.eventDate || null,
          expirationDate:
            rdapData.events?.find((e: any) => e.eventAction === "expiration")
              ?.eventDate || null,
          lastUpdated:
            rdapData.events?.find((e: any) => e.eventAction === "last changed")
              ?.eventDate || null,
          status: rdapData.status?.join(", ") || "Unknown",
        };

        console.log(
          `📋 [RDAP] Found ${nameservers.length} nameservers from ${rdapServer}`
        );
      } else {
        throw new Error("No RDAP server responded successfully");
      }
    } catch (rdapError) {
      console.log(`⚠️ [RDAP] Failed: ${rdapError.message}`);

      // Method 2: Try DNS lookup as fallback
      try {
        console.log(`🔄 [DNS] Trying DNS lookup as fallback...`);
        const resolveNs = promisify(dns.resolveNs);
        const nsRecords = await resolveNs(domainName);

        if (nsRecords && nsRecords.length > 0) {
          nameservers = nsRecords;
          method = "dns";
          console.log(
            `✅ [DNS] Found ${nameservers.length} nameservers via DNS`
          );
        }

        whoisData = {
          registrar: "Unknown",
          creationDate: null,
          expirationDate: null,
          lastUpdated: null,
          status: "Unknown",
        };
      } catch (dnsError) {
        console.error(`❌ [DNS] Also failed: ${dnsError.message}`);

        // All lookup methods failed - throw error
        throw new Error(
          `Unable to retrieve nameserver information for ${domainName}. Both RDAP and DNS lookups failed: RDAP (${rdapError.message}), DNS (${dnsError.message})`
        );
      }
    }

    // Clean up nameservers
    nameservers = [...new Set(nameservers)]
      .map((ns) => ns.toLowerCase().trim())
      .filter((ns) => {
        return (
          ns.length > 0 &&
          ns.includes(".") &&
          !ns.includes(" ") &&
          /^[a-zA-Z0-9.-]+$/.test(ns) &&
          !ns.includes("name")
        );
      });

    console.log(
      `📋 [${method.toUpperCase()}] Found ${
        nameservers.length
      } nameservers for ${domainName}:`,
      nameservers
    );

    return NextResponse.json({
      success: true,
      domainName,
      nameservers,
      count: nameservers.length,
      method,
      whoisData,
      lastChecked: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Nameserver lookup error:", error);

    // Check if it's a nameserver lookup failure
    if (
      error.message &&
      error.message.includes("Unable to retrieve nameserver information")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Nameserver lookup failed",
          message: error.message,
          domainName: domainName,
          nameservers: [],
          count: 0,
          lastChecked: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Generic server error
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error.message || "An unexpected error occurred",
        domainName: domainName,
        nameservers: [],
        count: 0,
        lastChecked: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
