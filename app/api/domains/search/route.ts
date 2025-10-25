import { NextRequest, NextResponse } from "next/server";
import { ResellerClubWrapper } from "@/lib/resellerclub-wrapper";
import { InputValidator } from "@/lib/validation";
import { isRestrictedTLD } from "@/lib/domainRequirements";

// Force dynamic rendering - required for API routes
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();

  try {
    const { domain, tlds } = await request.json();

    if (!domain || typeof domain !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Domain name is required",
          requestId,
        },
        { status: 400 }
      );
    }

    console.log(`📝 [API-${requestId}] Received domain search request:`, {
      domain,
      tlds: tlds || "not specified",
      mode: tlds ? "multiple-tld" : "single-domain",
    });

    // Parse domain input to extract base domain and TLD
    const domainParts = domain.split(".");
    const hasTLD = domainParts.length > 1;

    let baseDomain: string;
    let searchTlds: string[];
    let userEnteredDomain: string | null = null;

    if (hasTLD) {
      // User entered a domain with TLD (e.g., "anutech.shop")
      baseDomain = domainParts[0];
      const userTLD = domainParts.slice(1).join("."); // Handle multi-level TLDs like "co.uk"
      userEnteredDomain = `${baseDomain}.${userTLD}`;

      console.log(`🔍 [API-${requestId}] Domain with TLD detected:`, {
        original: domain,
        baseDomain: baseDomain,
        userTLD: userTLD,
        fullDomain: userEnteredDomain,
      });

      // Check if the TLD is restricted
      if (isRestrictedTLD(userTLD)) {
        console.log(
          `🚫 [API-${requestId}] Restricted TLD detected: ${userTLD}`
        );
        return NextResponse.json({
          success: false,
          error: "restricted_tld",
          message: `Domain registration for .${userTLD} requires special permissions and additional documentation. Please contact our support team for assistance.`,
          domain: userEnteredDomain,
          tld: userTLD,
          supportContact: "support@exceltechnologies.com",
          requestId,
        });
      }

      // Search only for the specific TLD the user entered
      searchTlds = [userTLD];
    } else {
      // User entered just a base domain (e.g., "anutech")
      baseDomain = domain;

      // Use provided TLDs or default to .com
      if (tlds && typeof tlds === "string") {
        searchTlds = tlds.split(",").map((tld) => tld.trim());
      } else {
        searchTlds = ["com"]; // Default to .com only
      }

      // Filter out restricted TLDs and warn user
      const restrictedTlds = searchTlds.filter((tld) => isRestrictedTLD(tld));
      const allowedTlds = searchTlds.filter((tld) => !isRestrictedTLD(tld));

      if (restrictedTlds.length > 0) {
        console.log(
          `🚫 [API-${requestId}] Restricted TLDs detected: ${restrictedTlds.join(
            ", "
          )}`
        );
        // If all TLDs are restricted, return error
        if (allowedTlds.length === 0) {
          return NextResponse.json({
            success: false,
            error: "all_tlds_restricted",
            message: `Domain registration for ${restrictedTlds
              .map((tld) => `.${tld}`)
              .join(
                ", "
              )} requires special permissions and additional documentation. Please contact our support team for assistance.`,
            restrictedTlds: restrictedTlds,
            supportContact: "support@exceltechnologies.com",
            requestId,
          });
        }
        // If some TLDs are restricted, continue with allowed ones but note the restriction
        searchTlds = allowedTlds;
        console.log(
          `⚠️ [API-${requestId}] Filtered out restricted TLDs, continuing with: ${allowedTlds.join(
            ", "
          )}`
        );
      }

      console.log(`🌐 [API-${requestId}] Base domain search:`, {
        baseDomain: baseDomain,
        searchTlds: searchTlds,
        providedTlds: tlds,
        restrictedTlds: restrictedTlds,
      });
    }

    // Validate base domain name
    const domainValidation = InputValidator.validateDomainName(baseDomain);
    if (!domainValidation.isValid) {
      console.error(`❌ [API-${requestId}] Domain validation failed:`, {
        domain: baseDomain,
        errors: domainValidation.errors,
        sanitized: domainValidation.sanitized,
      });
      return NextResponse.json(
        {
          success: false,
          error: domainValidation.errors.join(", "),
          requestId,
        },
        { status: 400 }
      );
    }

    console.log(`🎯 [API-${requestId}] Mode: Production`);

    // Search domain using ResellerClub API with base domain and selected TLDs
    console.log(
      `🌐 [API-${requestId}] Initiating domain search for: "${
        domainValidation.sanitized
      }" with TLDs: ${searchTlds.join(", ")}`
    );
    console.log(`🔍 [API-${requestId}] Search parameters:`, {
      originalDomain: domain,
      baseDomain: domainValidation.sanitized,
      searchTlds: searchTlds,
      hasTLD: hasTLD,
      userEnteredDomain: userEnteredDomain,
    });

    const results = await ResellerClubWrapper.searchDomainWithTlds(
      domainValidation.sanitized || baseDomain,
      searchTlds
    );

    // Store results in localStorage for persistence
    const responseData = {
      success: true,
      results: results || [],
      requestId,
      responseTime: `${Date.now() - startTime}ms`,
      searchQuery: {
        originalDomain: domain,
        baseDomain: domainValidation.sanitized,
        searchTlds: searchTlds,
        userEnteredDomain: userEnteredDomain,
      },
    };

    const availableCount = results.filter((r) => r.available).length;
    const livePricingCount = results.filter(
      (r) => r.pricingSource === "live"
    ).length;

    console.log(
      `✅ [API-${requestId}] Domain search completed in ${
        Date.now() - startTime
      }ms - ${
        results.length
      } domains found, ${availableCount} available, ${livePricingCount} with live pricing`
    );

    return NextResponse.json(responseData);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ [API-${requestId}] Domain search failed:`, {
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime: `${responseTime}ms`,
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Domain search failed due to a technical error",
        requestId,
        responseTime: `${responseTime}ms`,
      },
      { status: 500 }
    );
  }
}
