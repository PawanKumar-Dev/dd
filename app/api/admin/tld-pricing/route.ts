import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { PricingService } from "@/lib/pricing-service";
import { formatIndianCurrency, formatIndianNumber } from "@/lib/dateUtils";

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      "💰 [ADMIN] Fetching TLD pricing for admin panel (Customer + Reseller pricing comparison)"
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

    if (pricingData && pricingData.customerPricing) {
      // Process customer pricing data
      const customerPricing = pricingData.customerPricing;

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

      for (const tld of commonTlds) {
        try {
          const tldData = await PricingService.getTLDPricing([tld]);

          if (tldData && tldData[tld]) {
            const customerPrice = parseFloat(tldData[tld].price) || 0;
            const resellerPrice = parseFloat(tldData[tld].resellerPrice) || 0;
            const margin =
              customerPrice > 0 && resellerPrice > 0
                ? ((customerPrice - resellerPrice) / customerPrice) * 100
                : 0;

            tldPricing.push({
              tld: `.${tld}`,
              customerPrice: customerPrice,
              resellerPrice: resellerPrice,
              currency: tldData[tld].currency || "INR",
              category: getTldCategory(tld),
              description: getTldDescription(tld),
              margin: margin,
            });

            console.log(
              `📊 [ADMIN] Processed ${tld}: Customer ₹${customerPrice}, Reseller ₹${resellerPrice}, Margin ${
                margin > 0 ? "+" : ""
              }${margin.toFixed(1)}%`
            );
          }
        } catch (error) {
          console.warn(
            `⚠️ [ADMIN] Failed to fetch pricing for TLD: ${tld}`,
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

    return NextResponse.json({
      success: true,
      tldPricing,
      totalCount: tldPricing.length,
      lastUpdated: new Date().toISOString(),
      pricingSource: "ResellerClub API (Indian Pricing)",
    });
  } catch (error) {
    console.error("❌ [ADMIN] Failed to fetch TLD pricing:", error);
    return NextResponse.json(
      { error: "Failed to fetch TLD pricing" },
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
