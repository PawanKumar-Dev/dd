import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import whois from "whois";
import whoisJson from "whois-json";
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

    console.log(`🔍 [WHOIS] Looking up nameservers for: ${domainName}`);

    let nameservers: string[] = [];
    let whoisData: any = {};
    let method = "unknown";

    // Method 1: Try WHOIS-JSON (best for structured data)
    try {
      console.log(
        `🔍 [WHOIS-JSON] Trying WHOIS-JSON lookup for: ${domainName}`
      );

      const whoisJsonResult = await whoisJson(domainName, {
        timeout: 10000,
        follow: 3,
      });

      console.log(`✅ [WHOIS-JSON] Received data for: ${domainName}`);
      method = "whois-json";

      // Extract nameservers from WHOIS-JSON data
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

      for (const field of nameserverFields) {
        if (whoisJsonResult[field]) {
          if (Array.isArray(whoisJsonResult[field])) {
            nameservers = [...nameservers, ...whoisJsonResult[field]];
          } else if (typeof whoisJsonResult[field] === "string") {
            const nsList = whoisJsonResult[field]
              .split(/[,\n\r\t]+/)
              .map((ns) => ns.trim())
              .filter((ns) => ns.length > 0);
            nameservers = [...nameservers, ...nsList];
          }
        }
      }

      // Extract additional domain information
      whoisData = {
        registrar:
          whoisJsonResult.registrar || whoisJsonResult.Registrar || "Unknown",
        creationDate:
          whoisJsonResult.creationDate ||
          whoisJsonResult.CreationDate ||
          whoisJsonResult.created ||
          null,
        expirationDate:
          whoisJsonResult.expirationDate ||
          whoisJsonResult.ExpirationDate ||
          whoisJsonResult.expires ||
          null,
        lastUpdated:
          whoisJsonResult.updatedDate ||
          whoisJsonResult.UpdatedDate ||
          whoisJsonResult.updated ||
          null,
        status: whoisJsonResult.status || whoisJsonResult.Status || "Unknown",
      };
    } catch (whoisJsonError) {
      console.log(`⚠️ [WHOIS-JSON] Failed: ${whoisJsonError.message}`);

      // Method 2: Try public WHOIS API
      try {
        console.log(
          `🔍 [WHOIS-API] Trying public WHOIS API for: ${domainName}`
        );
        const apiResponse = await fetch(
          `https://api.whoisjson.com/v1/whois?domain=${domainName}`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; DomainManager/1.0)",
            },
          }
        );

        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          console.log(`✅ [WHOIS-API] Received data for: ${domainName}`);
          method = "whois-api";

          // Extract nameservers from API response
          if (apiData.nameservers && Array.isArray(apiData.nameservers)) {
            nameservers = apiData.nameservers;
          } else if (
            apiData.nameServers &&
            Array.isArray(apiData.nameServers)
          ) {
            nameservers = apiData.nameServers;
          }

          whoisData = {
            registrar: apiData.registrar || "Unknown",
            creationDate: apiData.creationDate || apiData.created || null,
            expirationDate: apiData.expirationDate || apiData.expires || null,
            lastUpdated: apiData.updatedDate || apiData.updated || null,
            status: apiData.status || "Unknown",
          };
        } else {
          throw new Error(`API returned ${apiResponse.status}`);
        }
      } catch (apiError) {
        console.log(`⚠️ [WHOIS-API] Failed: ${apiError.message}`);

        // Method 3: Try regular WHOIS lookup
        try {
          console.log(
            `🔍 [WHOIS] Trying regular WHOIS lookup for: ${domainName}`
          );

          const whoisResult = await new Promise<string>((resolve, reject) => {
            whois.lookup(domainName, (err: any, data: string) => {
              if (err) {
                reject(err);
              } else {
                resolve(data);
              }
            });
          });

          console.log(`✅ [WHOIS] Received data for: ${domainName}`);
          method = "whois";

          // Extract nameservers from raw WHOIS text
          const nsPatterns = [
            /name\s*server[s]?[:\s]+([^\n\r]+)/gi,
            /nameserver[s]?[:\s]+([^\n\r]+)/gi,
            /nserver[s]?[:\s]+([^\n\r]+)/gi,
            /dns[:\s]+([^\n\r]+)/gi,
          ];

          for (const pattern of nsPatterns) {
            let match;
            while ((match = pattern.exec(whoisResult)) !== null) {
              const nsLine = match[1] || match[0];
              if (nsLine) {
                const nsList = nsLine
                  .split(/[,\s]+/)
                  .map((ns) => ns.trim())
                  .filter((ns) => ns.length > 0 && ns.includes("."));
                nameservers = [...nameservers, ...nsList];
              }
            }
          }

          // Also try to find nameservers by looking for common patterns
          const lines = whoisResult.split("\n");
          for (const line of lines) {
            const trimmedLine = line.trim().toLowerCase();
            if (
              trimmedLine.includes("name server") ||
              trimmedLine.includes("nameserver") ||
              trimmedLine.includes("nserver") ||
              trimmedLine.includes("dns")
            ) {
              const parts = line.split(/[:,\s]+/);
              for (const part of parts) {
                const trimmed = part.trim();
                if (
                  trimmed.includes(".") &&
                  !trimmed.includes(" ") &&
                  /^[a-zA-Z0-9.-]+$/.test(trimmed) &&
                  trimmed.length > 3
                ) {
                  nameservers.push(trimmed);
                }
              }
            }
          }

          // Extract additional domain information from WHOIS
          const registrarMatch = whoisResult.match(
            /registrar[:\s]+([^\n\r]+)/i
          );
          const creationMatch = whoisResult.match(
            /creation\s+date[:\s]+([^\n\r]+)/i
          );
          const expirationMatch = whoisResult.match(/expir[:\s]+([^\n\r]+)/i);
          const statusMatch = whoisResult.match(/status[:\s]+([^\n\r]+)/i);

          whoisData = {
            registrar: registrarMatch ? registrarMatch[1].trim() : "Unknown",
            creationDate: creationMatch ? creationMatch[1].trim() : null,
            expirationDate: expirationMatch ? expirationMatch[1].trim() : null,
            lastUpdated: null,
            status: statusMatch ? statusMatch[1].trim() : "Unknown",
          };
        } catch (whoisError) {
          console.log(`⚠️ [WHOIS] Failed: ${whoisError.message}`);

          // Method 4: Try DNS lookup as fallback
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
              `Unable to retrieve nameserver information for ${domainName}. All lookup methods failed: WHOIS-JSON (${whoisJsonError.message}), WHOIS-API (${apiError.message}), WHOIS (${whoisError.message}), DNS (${dnsError.message})`
            );
          }
        }
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
          !ns.includes("name") &&
          !ns.includes("server") &&
          !ns.includes("dns")
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
