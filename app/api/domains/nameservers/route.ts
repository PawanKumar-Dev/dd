import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import whois from "whois";
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

    try {
      // First try WHOIS lookup
      console.log(`🔍 [WHOIS] Trying WHOIS lookup for: ${domainName}`);

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
      const registrarMatch = whoisResult.match(/registrar[:\s]+([^\n\r]+)/i);
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
    } catch (whoisError: any) {
      console.log(`⚠️ [WHOIS] Failed for ${domainName}: ${whoisError.message}`);
      console.log(`🔄 [DNS] Trying DNS lookup as fallback...`);

      try {
        // Fallback to DNS lookup for NS records using Node.js built-in DNS
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
      } catch (dnsError: any) {
        console.error(
          `❌ [DNS] Also failed for ${domainName}:`,
          dnsError.message
        );
        throw new Error(
          `Both WHOIS and DNS lookups failed: ${whoisError.message}, ${dnsError.message}`
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
  } catch (error) {
    console.error("Nameserver lookup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
