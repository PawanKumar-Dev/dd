import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { PricingService } from "@/lib/pricing-service";
import { formatIndianCurrency, formatIndianNumber } from "@/lib/dateUtils";
import { tldPricingCache } from "@/lib/tld-pricing-cache";
import Settings from "@/models/Settings";
import { connectToDatabase } from "@/lib/mongoose";

// Force dynamic rendering - required for API routes
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if caching is enabled
    await connectToDatabase();
    const cacheEnabledSetting = await Settings.findOne({
      key: "tld_pricing_cache_enabled",
    });
    const cacheEnabled = cacheEnabledSetting?.value !== false; // Default to true if not set

    // Get TTL setting
    const cacheTTLSetting = await Settings.findOne({
      key: "tld_pricing_cache_ttl",
    });
    if (cacheTTLSetting?.value) {
      tldPricingCache.setTTL(parseInt(cacheTTLSetting.value));
    }

    // Check cache first if enabled
    if (cacheEnabled) {
      const cachedData = await tldPricingCache.get();
      if (cachedData) {
        // Check if cached data is empty (data quality check)
        if (
          cachedData.totalCount === 0 ||
          !cachedData.tldPricing ||
          cachedData.tldPricing.length === 0
        ) {
          console.warn(
            "⚠️ [CACHE] Cached data is empty! Auto-purging and refetching..."
          );
          await tldPricingCache.purge();
          // Continue to fetch fresh data below
        } else {
          console.log(
            `✅ [ADMIN] Returning cached TLD pricing data from MongoDB (${cachedData.totalCount} TLDs)`
          );
          return NextResponse.json({
            success: true,
            tldPricing: cachedData.tldPricing,
            totalCount: cachedData.totalCount,
            lastUpdated: cachedData.lastUpdated,
            pricingSource: cachedData.pricingSource + " (Cached from MongoDB)",
            cached: true,
            cachedAt: new Date(cachedData.cachedAt).toISOString(),
          });
        }
      }
    }

    console.log(
      "💰 [ADMIN] Fetching TLD pricing from API (Customer + Reseller pricing comparison)"
    );

    // Get all domain pricing from ResellerClub API
    const pricingData = await PricingService.getDomainPricing();

    // Extract TLD pricing from the response
    const tldPricing: Array<{
      tld: string;
      customerPrice: number;
      resellerPrice: number;
      currency: string;
      category: string;
      description?: string;
      margin?: number;
    }> = [];

    if (
      pricingData &&
      pricingData.customerPricing &&
      pricingData.resellerPricing
    ) {
      // Process customer pricing data
      const customerPricing = pricingData.customerPricing;
      const resellerPricing = pricingData.resellerPricing;

      // Get all unique TLDs from both customer and reseller pricing
      const allTlds = new Set([
        ...Object.keys(customerPricing),
        ...Object.keys(resellerPricing),
      ]);

      console.log(
        `🔍 [ADMIN] Processing ${allTlds.size} TLDs from API response`
      );

      // Log first 20 TLD keys to understand the naming pattern
      const tldArray = Array.from(allTlds).slice(0, 20);
      console.log(`📋 [DEBUG] First 20 TLD keys from API:`, tldArray);

      // Log sample data structure for debugging (first TLD)
      const sampleTld = tldArray[0];
      if (sampleTld) {
        console.log(
          `📋 [DEBUG] Sample TLD "${sampleTld}" structure:`,
          JSON.stringify(
            {
              customer: customerPricing[sampleTld],
              reseller: resellerPricing[sampleTld],
            },
            null,
            2
          )
        );
      }

      // Helper function to convert API TLD key to readable TLD
      const convertApiKeyToTld = (apiKey: string): string | null => {
        // Skip service entries
        if (apiKey === "privacy-protection" || apiKey === "premium_dns") {
          return null;
        }

        // Skip obscure internal codes (that don't follow the pattern)
        if (!apiKey.startsWith("dot") && !apiKey.startsWith("codot")) {
          return null;
        }

        // Convert: dotio → io, dotin → in, dotcom → com
        if (apiKey.startsWith("dot")) {
          return apiKey.replace("dot", "");
        }

        // Convert: codotde → co.de, codotuk → co.uk
        if (apiKey.startsWith("codot")) {
          const tldPart = apiKey.replace("codot", "");
          return `co.${tldPart}`;
        }

        return null;
      };

      // Process all TLDs from the API response
      for (const tld of allTlds) {
        try {
          // Convert API key to readable TLD
          const readableTld = convertApiKeyToTld(tld);

          // Skip if conversion failed or TLD is not recognizable
          if (!readableTld) {
            continue;
          }

          // Use the already-fetched pricing data
          const customerTldData = customerPricing[tld];
          const resellerTldData = resellerPricing[tld];

          if (customerTldData || resellerTldData) {
            // Try multiple possible price field locations
            let customerPrice = 0;
            let resellerPrice = 0;

            // Extract customer price - structure: data.addnewdomain["1"]
            if (customerTldData) {
              if (typeof customerTldData === "object") {
                customerPrice = parseFloat(
                  customerTldData.addnewdomain?.["1"] ||
                    customerTldData.addnewdomain ||
                    customerTldData["1"] ||
                    customerTldData.price ||
                    "0"
                );
              } else {
                customerPrice = parseFloat(String(customerTldData));
              }
            }

            // Extract reseller price - structure: data["0"].pricing.addnewdomain["1"]
            if (resellerTldData) {
              if (typeof resellerTldData === "object") {
                // Check for nested structure first
                const nestedPricing = resellerTldData["0"]?.pricing;
                if (nestedPricing && typeof nestedPricing === "object") {
                  resellerPrice = parseFloat(
                    nestedPricing.addnewdomain?.["1"] ||
                      nestedPricing.addnewdomain ||
                      nestedPricing["1"] ||
                      nestedPricing.price ||
                      "0"
                  );
                } else {
                  // Fallback to direct structure
                  resellerPrice = parseFloat(
                    resellerTldData.addnewdomain?.["1"] ||
                      resellerTldData.addnewdomain ||
                      resellerTldData["1"] ||
                      resellerTldData.price ||
                      "0"
                  );
                }
              } else {
                resellerPrice = parseFloat(String(resellerTldData));
              }
            }

            // Ensure prices are valid numbers (not NaN)
            if (isNaN(customerPrice)) customerPrice = 0;
            if (isNaN(resellerPrice)) resellerPrice = 0;

            // Only add TLDs that have valid pricing
            if (customerPrice > 0 || resellerPrice > 0) {
              const margin =
                customerPrice > 0 && resellerPrice > 0
                  ? ((customerPrice - resellerPrice) / customerPrice) * 100
                  : 0;

              tldPricing.push({
                tld: `.${readableTld}`,
                customerPrice: customerPrice,
                resellerPrice: resellerPrice,
                currency: "INR",
                category: getTldCategory(readableTld),
                description: getTldDescription(readableTld),
                margin: margin,
              });
            }
          }
        } catch (error) {
          console.warn(
            `⚠️ [ADMIN] Failed to process pricing for TLD: ${tld}`,
            error
          );
        }
      }
    }

    // Sort by TLD name
    tldPricing.sort((a, b) => a.tld.localeCompare(b.tld));

    const totalCustomerPrice = tldPricing.reduce(
      (sum, tld) => sum + tld.customerPrice,
      0
    );
    const totalResellerPrice = tldPricing.reduce(
      (sum, tld) => sum + tld.resellerPrice,
      0
    );
    const avgMargin =
      tldPricing.length > 0
        ? tldPricing.reduce((sum, tld) => sum + (tld.margin || 0), 0) /
          tldPricing.length
        : 0;

    console.log(`✅ [ADMIN] Fetched pricing for ${tldPricing.length} TLDs`);
    console.log(
      `📊 [ADMIN] Pricing Summary: Total Customer ${formatIndianCurrency(
        totalCustomerPrice
      )}, Total Reseller ${formatIndianCurrency(
        totalResellerPrice
      )}, Avg Margin ${avgMargin > 0 ? "+" : ""}${avgMargin.toFixed(1)}%`
    );

    const responseData = {
      success: true,
      tldPricing,
      totalCount: tldPricing.length,
      lastUpdated: new Date().toISOString(),
      pricingSource: "ResellerClub API (Indian Pricing)",
      cached: false,
    };

    // Cache the data if caching is enabled AND data is valid
    if (cacheEnabled) {
      if (tldPricing.length > 0) {
        await tldPricingCache.set({
          tldPricing,
          totalCount: tldPricing.length,
          lastUpdated: responseData.lastUpdated,
          pricingSource: responseData.pricingSource,
        });
        console.log(`✅ [CACHE] Successfully cached ${tldPricing.length} TLDs`);
      } else {
        console.error(
          `❌ [CACHE] Refusing to cache empty data! Check data extraction logic.`
        );
        // Purge any existing empty cache
        await tldPricingCache.purge();
        console.log(`🗑️ [CACHE] Purged empty cache to prevent stale data`);
      }
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("❌ [ADMIN] Failed to fetch TLD pricing:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch TLD pricing",
      },
      { status: 500 }
    );
  }
}

// Helper function to categorize TLDs
function getTldCategory(tld: string): string {
  const categories: { [key: string]: string } = {
    // Generic TLDs
    com: "Generic",
    net: "Generic",
    org: "Generic",
    info: "Generic",
    biz: "Generic",
    name: "Generic",
    pro: "Generic",

    // Country Code TLDs
    in: "Country Code",
    "co.in": "Country Code",
    us: "Country Code",
    uk: "Country Code",
    ca: "Country Code",
    au: "Country Code",
    de: "Country Code",
    fr: "Country Code",
    it: "Country Code",
    es: "Country Code",
    nl: "Country Code",
    be: "Country Code",
    ch: "Country Code",
    at: "Country Code",
    se: "Country Code",
    no: "Country Code",
    dk: "Country Code",
    fi: "Country Code",
    pl: "Country Code",
    cz: "Country Code",
    hu: "Country Code",
    ro: "Country Code",
    bg: "Country Code",
    hr: "Country Code",
    si: "Country Code",
    sk: "Country Code",
    lt: "Country Code",
    lv: "Country Code",
    ee: "Country Code",
    lu: "Country Code",
    ie: "Country Code",
    pt: "Country Code",
    gr: "Country Code",
    cy: "Country Code",
    mt: "Country Code",
    li: "Country Code",
    is: "Country Code",
    fo: "Country Code",
    gl: "Country Code",

    // New Generic TLDs
    shop: "New Generic",
    store: "New Generic",
    online: "New Generic",
    site: "New Generic",
    website: "New Generic",
    app: "New Generic",
    dev: "New Generic",
    tech: "New Generic",
    digital: "New Generic",
    cloud: "New Generic",
    host: "New Generic",
    space: "New Generic",
    io: "New Generic",
    ai: "New Generic",
    me: "New Generic",
    tv: "New Generic",
    cc: "New Generic",
    mobi: "New Generic",
    asia: "New Generic",
    co: "New Generic",
  };

  return categories[tld] || "Other";
}

// Helper function to get TLD descriptions
function getTldDescription(tld: string): string {
  const descriptions: { [key: string]: string } = {
    com: "Commercial organizations",
    net: "Network infrastructure",
    org: "Non-profit organizations",
    info: "Informational sites",
    biz: "Business websites",
    shop: "E-commerce and shopping",
    store: "Online stores",
    online: "Online presence",
    site: "Websites and web presence",
    website: "Websites and web presence",
    app: "Applications and software",
    dev: "Development and developers",
    tech: "Technology companies",
    digital: "Digital services",
    cloud: "Cloud services",
    host: "Hosting services",
    space: "Personal and creative spaces",
    io: "Technology and startups",
    ai: "Artificial intelligence",
    me: "Personal websites",
    tv: "Television and media",
    cc: "Creative Commons",
    mobi: "Mobile websites",
    name: "Personal names",
    pro: "Professionals",
    asia: "Asia Pacific region",
    co: "Companies and corporations",
    in: "India",
    "co.in": "India commercial",
    us: "United States",
    uk: "United Kingdom",
    ca: "Canada",
    au: "Australia",
    de: "Germany",
    fr: "France",
    it: "Italy",
    es: "Spain",
    nl: "Netherlands",
    be: "Belgium",
    ch: "Switzerland",
    at: "Austria",
    se: "Sweden",
    no: "Norway",
    dk: "Denmark",
    fi: "Finland",
    pl: "Poland",
    cz: "Czech Republic",
    hu: "Hungary",
    ro: "Romania",
    bg: "Bulgaria",
    hr: "Croatia",
    si: "Slovenia",
    sk: "Slovakia",
    lt: "Lithuania",
    lv: "Latvia",
    ee: "Estonia",
    lu: "Luxembourg",
    ie: "Ireland",
    pt: "Portugal",
    gr: "Greece",
    cy: "Cyprus",
    mt: "Malta",
    li: "Liechtenstein",
    is: "Iceland",
    fo: "Faroe Islands",
    gl: "Greenland",
  };

  return descriptions[tld] || "Domain extension";
}
