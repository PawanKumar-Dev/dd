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
      const cachedData = tldPricingCache.get();
      if (cachedData) {
        console.log("✅ [ADMIN] Returning cached TLD pricing data");
        return NextResponse.json({
          success: true,
          tldPricing: cachedData.tldPricing,
          totalCount: cachedData.totalCount,
          lastUpdated: cachedData.lastUpdated,
          pricingSource: cachedData.pricingSource + " (Cached)",
          cached: true,
          cachedAt: new Date(cachedData.cachedAt).toISOString(),
        });
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

      // Common TLDs to display
      const commonTlds = [
        "com",
        "net",
        "org",
        "info",
        "biz",
        "co",
        "in",
        "co.in",
        "shop",
        "store",
        "online",
        "site",
        "website",
        "app",
        "dev",
        "io",
        "ai",
        "tech",
        "digital",
        "cloud",
        "host",
        "space",
        "me",
        "tv",
        "cc",
        "mobi",
        "name",
        "pro",
        "asia",
        "us",
        "uk",
        "ca",
        "au",
        "de",
        "eu",
        "fr",
        "it",
        "es",
        "nl",
        "be",
        "ch",
        "at",
        "se",
        "no",
        "dk",
        "fi",
        "pl",
        "cz",
        "hu",
        "ro",
        "bg",
        "hr",
        "si",
        "sk",
        "lt",
        "lv",
        "ee",
        "lu",
        "ie",
        "pt",
        "gr",
        "cy",
        "mt",
        "li",
        "is",
        "fo",
        "gl",
      ];

      // Process pricing data that was already fetched
      for (const tld of commonTlds) {
        try {
          // Use the already-fetched pricing data instead of making individual API calls
          const customerTldData = customerPricing[tld];
          const resellerTldData = resellerPricing[tld];

          if (customerTldData || resellerTldData) {
            const customerPrice = customerTldData
              ? parseFloat(customerTldData["1"] || customerTldData.price || "0")
              : 0;
            const resellerPrice = resellerTldData
              ? parseFloat(resellerTldData["1"] || resellerTldData.price || "0")
              : 0;

            const margin =
              customerPrice > 0 && resellerPrice > 0
                ? ((customerPrice - resellerPrice) / customerPrice) * 100
                : 0;

            tldPricing.push({
              tld: `.${tld}`,
              customerPrice: customerPrice,
              resellerPrice: resellerPrice,
              currency: "INR",
              category: getTldCategory(tld),
              description: getTldDescription(tld),
              margin: margin,
            });
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

    // Cache the data if caching is enabled
    if (cacheEnabled) {
      tldPricingCache.set({
        tldPricing,
        totalCount: tldPricing.length,
        lastUpdated: responseData.lastUpdated,
        pricingSource: responseData.pricingSource,
      });
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
