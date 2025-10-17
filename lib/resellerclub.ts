/**
 * ResellerClub API Integration
 *
 * This module provides comprehensive integration with the ResellerClub API for domain management,
 * including domain search, pricing, registration, DNS management, and other domain-related operations.
 *
 * Key Features:
 * - Domain availability search with live pricing
 * - Customer and reseller pricing comparison
 * - Domain registration and management
 * - DNS record management
 * - Comprehensive error handling and logging
 *
 * @author Excel Technologies
 * @version 2.0.0
 * @since 2024
 */

import axios, { AxiosError, AxiosResponse } from "axios";
import { ResellerClubResponse, DomainSearchResult } from "./types";
import { PricingService } from "./pricing-service";

// Environment configuration for ResellerClub API
const RESELLERCLUB_API_URL = process.env.RESELLERCLUB_API_URL;
const RESELLERCLUB_ID = process.env.RESELLERCLUB_ID;
const RESELLERCLUB_SECRET = process.env.RESELLERCLUB_SECRET;

// Validate required environment variables
if (!RESELLERCLUB_API_URL || !RESELLERCLUB_ID || !RESELLERCLUB_SECRET) {
  throw new Error(
    "ResellerClub API configuration is missing. Please check your environment variables."
  );
}

// Configure Axios instance with ResellerClub API settings
const api = axios.create({
  baseURL: RESELLERCLUB_API_URL,
  timeout: 30000, // 30 second timeout for API requests
});

// Enhanced request interceptor with detailed logging
api.interceptors.request.use(
  (config) => {
    const timestamp = new Date().toISOString();
    console.log(`🌐 [${timestamp}] ResellerClub API Request:`, {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      params: config.params,
      data: config.data,
    });

    config.params = {
      ...config.params,
      "auth-userid": RESELLERCLUB_ID,
      "api-key": RESELLERCLUB_SECRET,
      "reseller-id": RESELLERCLUB_ID, // Use same ID for Indian pricing
    };
    return config;
  },
  (error) => {
    console.error("❌ ResellerClub API Request Error:", error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with detailed logging
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const timestamp = new Date().toISOString();
    console.log(`✅ [${timestamp}] ResellerClub API Response:`, {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error: AxiosError) => {
    const timestamp = new Date().toISOString();
    console.error(`❌ [${timestamp}] ResellerClub API Error:`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      code: error.code,
    });
    return Promise.reject(error);
  }
);

/**
 * ResellerClub API Service Class
 *
 * This class provides all the methods needed to interact with the ResellerClub API.
 * It handles domain search, pricing, registration, DNS management, and other domain operations.
 *
 * All methods are static and can be called directly without instantiation.
 * Each method includes comprehensive error handling and detailed logging.
 */
export class ResellerClubAPI {
  /**
   * Fetch live domain pricing from ResellerClub API
   *
   * Retrieves both customer and reseller pricing data from ResellerClub API.
   * This method is used by the PricingService to get the latest pricing information.
   *
   * @returns {Promise<any>} Object containing customerPricing and resellerPricing data
   * @throws {Error} If API request fails or credentials are invalid
   *
   * @example
   * const pricing = await ResellerClubAPI.getDomainPricing();
   * console.log(pricing.customerPricing); // Customer pricing data
   * console.log(pricing.resellerPricing); // Reseller pricing data
   */
  static async getDomainPricing(): Promise<any> {
    const startTime = Date.now();
    console.log(
      `💰 [PRODUCTION] Fetching live domain pricing from ResellerClub API`
    );

    try {
      // Fetch all working pricing APIs in parallel
      const [customerPricingResponse, resellerPricingResponse] =
        await Promise.all([
          api.get("/api/products/customer-price.json"),
          api.get("/api/products/reseller-price.json"),
        ]);

      console.log(
        `✅ [PRODUCTION] All pricing data fetched in ${
          Date.now() - startTime
        }ms`
      );

      return {
        customerPricing: customerPricingResponse.data,
        resellerPricing: resellerPricingResponse.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`❌ [PRODUCTION] Failed to fetch domain pricing:`, error);
      throw new Error(
        "Failed to fetch live domain pricing from ResellerClub API"
      );
    }
  }

  /**
   * Get pricing for specific TLDs
   */
  static async getTLDPricing(tlds: string[]): Promise<{ [tld: string]: any }> {
    const startTime = Date.now();
    console.log(
      `💰 [PRODUCTION] Fetching pricing for TLDs: ${tlds.join(", ")}`
    );

    try {
      const pricingData = await this.getDomainPricing();
      const tldPricing: { [tld: string]: any } = {};

      // Extract pricing for requested TLDs
      tlds.forEach((tld) => {
        const cleanTld = tld.startsWith(".") ? tld.substring(1) : tld;

        // Comprehensive TLD mappings for ResellerClub API
        const tldMappings: { [key: string]: string } = {
          com: "domcno",
          net: "dotnet",
          org: "domorg",
          info: "dominfo",
          biz: "dombiz",
          co: "dotco",
          in: "thirdleveldotin",
          eu: "doteu",
          uk: "dotuk",
          us: "domus",
          ca: "dotca",
          au: "dotau",
          de: "dotde",
          fr: "dotfr",
          es: "dotes",
          nl: "dotnl",
          tv: "dottv",
          ws: "dotws",
          vc: "dotvc",
          cc: "dotcc",
          io: "dotio",
          ai: "dotai",
          app: "dotapp",
          dev: "dotdev",
          tech: "dottech",
          online: "dotonline",
          site: "dotsite",
          store: "dotstore",
          shop: "dotshop",
          blog: "dotblog",
          news: "dotnews",
          media: "dotmedia",
          email: "dotemail",
          cloud: "dotcloud",
          host: "dothost",
          space: "dotspace",
          website: "dotwebsite",
          digital: "dotdigital",
          global: "dotglobal",
          world: "dotworld",
          city: "dotcity",
          country: "dotcountry",
          network: "dotnetwork",
          systems: "dotsystems",
          solutions: "dotsolutions",
          services: "dotservices",
          company: "dotcompany",
          group: "dotgroup",
          team: "dotteam",
          club: "dotclub",
          community: "dotcommunity",
          social: "dotsocial",
          life: "dotlife",
          live: "dotlive",
          today: "dottoday",
          now: "dotnow",
          here: "dothehere",
          me: "dotme",
          name: "dotname",
          mobi: "dotmobi",
          tel: "dottel",
          asia: "dotasia",
          jobs: "dotjobs",
          travel: "dottravel",
          museum: "dotmuseum",
          aero: "dotaero",
          coop: "dotcoop",
          int: "dotint",
          gov: "dotgov",
          mil: "dotmil",
          edu: "dotedu",
          ac: "dotac",
          ad: "dotad",
          ae: "dotae",
          af: "dotaf",
          ag: "dotag",
          al: "dotal",
          am: "dotam",
          ao: "dotao",
          aq: "dotaq",
          ar: "dotar",
          as: "dotas",
          at: "dotat",
          aw: "dotaw",
          ax: "dotax",
          az: "dotaz",
          ba: "dotba",
          bb: "dotbb",
          bd: "dotbd",
          be: "dotbe",
          bf: "dotbf",
          bg: "dotbg",
          bh: "dotbh",
          bi: "dotbi",
          bj: "dotbj",
          bm: "dotbm",
          bn: "dotbn",
          bo: "dotbo",
          br: "dotbr",
          bs: "dotbs",
          bt: "dotbt",
          bv: "dotbv",
          bw: "dotbw",
          by: "dotby",
          bz: "dotbz",
          cd: "dotcd",
          cf: "dotcf",
          cg: "dotcg",
          ch: "dotch",
          ci: "dotci",
          ck: "dotck",
          cl: "dotcl",
          cm: "dotcm",
          cn: "dotcn",
          cr: "dotcr",
          cu: "dotcu",
          cv: "dotcv",
          cw: "dotcw",
          cx: "dotcx",
          cy: "dotcy",
          cz: "dotcz",
          dj: "dotdj",
          dk: "dotdk",
          dm: "dotdm",
          do: "dotdo",
          dz: "dotdz",
          ec: "dotec",
          ee: "dotee",
          eg: "doteg",
          eh: "doteh",
          er: "doter",
          et: "dotet",
          fi: "dotfi",
          fj: "dotfj",
          fk: "dotfk",
          fm: "dotfm",
          fo: "dotfo",
          ga: "dotga",
          gb: "dotgb",
          gd: "dotgd",
          ge: "dotge",
          gf: "dotgf",
          gg: "dotgg",
          gh: "dotgh",
          gi: "dotgi",
          gl: "dotgl",
          gm: "dotgm",
          gn: "dotgn",
          gp: "dotgp",
          gq: "dotgq",
          gr: "dotgr",
          gs: "dotgs",
          gt: "dotgt",
          gu: "dotgu",
          gw: "dotgw",
          gy: "dotgy",
          hk: "dothk",
          hm: "dothm",
          hn: "dothn",
          hr: "dothr",
          ht: "doththt",
          hu: "dothu",
          id: "dotid",
          ie: "dotie",
          il: "dotil",
          im: "dotim",
          iq: "dotiq",
          ir: "dotir",
          is: "dotis",
          it: "dotit",
          je: "dotje",
          jm: "dotjm",
          jo: "dotjo",
          jp: "dotjp",
          ke: "dotke",
          kg: "dotkg",
          kh: "dotkh",
          ki: "dotki",
          km: "dotkm",
          kn: "dotkn",
          kp: "dotkp",
          kr: "dotkr",
          kw: "dotkw",
          ky: "dotky",
          kz: "dotkz",
          la: "dotla",
          lb: "dotlb",
          lc: "dotlc",
          li: "dotli",
          lk: "dotlk",
          lr: "dotlr",
          ls: "dotls",
          lt: "dotlt",
          lu: "dotlu",
          lv: "dotlv",
          ly: "dotly",
          ma: "dotma",
          mc: "dotmc",
          md: "dotmd",
          mf: "dotmf",
          mg: "dotmg",
          mh: "dotmh",
          mk: "dotmk",
          ml: "dotml",
          mm: "dotmm",
          mn: "dotmn",
          mo: "dotmo",
          mp: "dotmp",
          mq: "dotmq",
          mr: "dotmr",
          ms: "dotms",
          mt: "dotmt",
          mu: "dotmu",
          mv: "dotmv",
          mw: "dotmw",
          mx: "dotmx",
          my: "dotmy",
          mz: "dotmz",
          na: "dotna",
          nc: "dotnc",
          ne: "dotne",
          nf: "dotnf",
          ng: "dotng",
          ni: "dotni",
          no: "dotno",
          np: "dotnp",
          nr: "dotnr",
          nu: "dotnu",
          nz: "dotnz",
          om: "dotom",
          pa: "dotpa",
          pe: "dotpe",
          pf: "dotpf",
          pg: "dotpg",
          ph: "dotph",
          pk: "dotpk",
          pl: "dotpl",
          pm: "dotpm",
          pn: "dotpn",
          pr: "dotpr",
          ps: "dotps",
          pt: "dotpt",
          pw: "dotpw",
          py: "dotpy",
          qa: "dotqa",
          re: "dotre",
          ro: "dotro",
          rs: "dotrs",
          ru: "dotru",
          rw: "dotrw",
          sa: "dotsa",
          sb: "dotsb",
          sc: "dotsc",
          sd: "dotsd",
          se: "dotse",
          sg: "dotsg",
          sh: "dotsh",
          si: "dotsi",
          sj: "dotsj",
          sk: "dotsk",
          sl: "dotsl",
          sm: "dotsm",
          sn: "dotsn",
          so: "dotso",
          sr: "dotsr",
          ss: "dotss",
          st: "dotst",
          sv: "dotsv",
          sx: "dotsx",
          sy: "dotsy",
          sz: "dotsz",
          tc: "dottc",
          td: "dottd",
          tf: "dottf",
          tg: "dottg",
          th: "dotth",
          tj: "dottj",
          tk: "dottk",
          tl: "dottl",
          tm: "dottm",
          tn: "dottn",
          to: "dottto",
          tr: "dottr",
          tt: "dotttht",
          tw: "dottw",
          tz: "dottz",
          ua: "dotua",
          ug: "dotug",
          uy: "dotuy",
          uz: "dotuz",
          va: "dotva",
          ve: "dotve",
          vg: "dotvg",
          vi: "dotvi",
          vn: "dotvn",
          vu: "dotvu",
          wf: "dotwf",
          ye: "dotye",
          yt: "dotyt",
          za: "dotza",
          zm: "dotzm",
          zw: "dotzw",
        };

        // Try different variations of the TLD name
        const tldVariations = [
          // Direct mapping first (highest priority)
          tldMappings[cleanTld],
          // Original TLD variations
          cleanTld,
          `.${cleanTld}`,
          cleanTld.toUpperCase(),
          cleanTld.toLowerCase(),
          // General ResellerClub formats
          `dot${cleanTld}`,
          `dom${cleanTld}`,
          // CentralNic formats (lower priority)
          `centralnicza${cleanTld}`,
          `centralnicus${cleanTld}`,
        ].filter(Boolean); // Remove null values

        let foundTld = null;
        for (const variation of tldVariations) {
          if (pricingData.customerPricing[variation]) {
            foundTld = variation;
            break;
          }
        }

        if (foundTld) {
          tldPricing[cleanTld] = {
            customer: pricingData.customerPricing[foundTld],
            reseller: pricingData.resellerPricing[foundTld] || null,
            tld: cleanTld,
          };
        }
      });

      console.log(
        `✅ [PRODUCTION] TLD pricing extracted in ${Date.now() - startTime}ms`
      );
      return tldPricing;
    } catch (error) {
      console.error(`❌ [PRODUCTION] Failed to fetch TLD pricing:`, error);
      throw error;
    }
  }

  /**
   * Search for domain availability with automatic TLD detection
   *
   * This method searches for domain availability and automatically determines whether
   * to search for a specific TLD or multiple common TLDs based on the input.
   *
   * @param {string} domainName - The domain name to search (with or without TLD)
   * @returns {Promise<DomainSearchResult[]>} Array of domain search results with pricing
   *
   * @example
   * // Search for a specific domain
   * const results = await ResellerClubAPI.searchDomain("example.com");
   *
   * // Search for base domain with multiple TLDs
   * const results = await ResellerClubAPI.searchDomain("example");
   */
  static async searchDomain(domainName: string): Promise<DomainSearchResult[]> {
    const startTime = Date.now();

    // Check if domain already has a TLD
    const hasTLD = domainName.includes(".");
    const searchParams: any = {
      "domain-name": domainName,
    };

    if (!hasTLD) {
      // For domains without TLD, search with multiple TLDs
      searchParams.tlds = "com,net,org,info,biz,co,in,co.in";
    } else {
      // For domains with TLD, extract the full TLD (handle multi-level TLDs like .co.in)
      const domainParts = domainName.split(".");
      const tld = domainParts.slice(1).join("."); // Get everything after the first dot
      searchParams.tlds = tld;
    }

    try {
      const response = await api.get("/api/domains/available.json", {
        params: searchParams,
      });

      const results: DomainSearchResult[] = [];
      const responseTime = Date.now() - startTime;

      console.log(
        `📊 [PRODUCTION] Domain search response received in ${responseTime}ms:`,
        {
          domain: domainName,
          hasTLD: hasTLD,
          searchParams: searchParams,
          responseStatus: response.status,
          dataKeys: Object.keys(response.data || {}),
          dataType: typeof response.data,
        }
      );

      if (response.data && typeof response.data === "object") {
        // Check for API errors first
        const hasError = Object.values(response.data).some(
          (data: any) =>
            data && typeof data === "object" && data.status === "error"
        );

        if (hasError) {
          console.error(
            `❌ [PRODUCTION] ResellerClub API returned error:`,
            response.data
          );
          throw new Error(
            "ResellerClub API returned an error. Please check the domain name and try again."
          );
        }

        for (const [domain, data] of Object.entries(response.data)) {
          if (typeof data === "object" && data !== null) {
            const domainData = data as any;
            // Determine domain availability based on status
            let isAvailable = domainData.status === "available";
            let domainStatus = domainData.status;

            // Log domain status for debugging
            console.log(
              `🔍 [PRODUCTION] Domain ${domain} status: ${domainStatus}`
            );

            // Try to get live pricing first
            let price = 0;
            let currency = "INR";
            let registrationPeriod = 1;
            let pricingSource: "live" | "fallback" | "unavailable" | "taken" =
              isAvailable ? "unavailable" : "taken";

            if (isAvailable) {
              const domainParts = domain.split(".");
              const tld = domainParts.slice(1).join(".").toLowerCase(); // Get full TLD for multi-level TLDs
              try {
                if (tld) {
                  console.log(
                    `💰 [PRODUCTION] Fetching live customer pricing for ${domain} (TLD: ${tld})`
                  );
                  const livePricing = await PricingService.getTLDPricing([tld]);

                  if (livePricing && livePricing[tld]) {
                    const finalPrice = parseFloat(livePricing[tld].price) || 0;
                    const resellerPrice =
                      parseFloat(livePricing[tld].resellerPrice) || 0;
                    const margin =
                      finalPrice > 0 && resellerPrice > 0
                        ? ((finalPrice - resellerPrice) / finalPrice) * 100
                        : 0;

                    // Use the final price from PricingService
                    price = finalPrice;
                    currency = livePricing[tld].currency || "INR";
                    registrationPeriod =
                      livePricing[tld].registrationPeriod || 1;
                    pricingSource = "live";

                    console.log(
                      `✅ [PRODUCTION] Live pricing for ${domain}: ₹${finalPrice} ${currency}`
                    );
                    if (resellerPrice > 0) {
                      console.log(
                        `📊 [PRODUCTION] Reseller pricing for ${domain}: ₹${resellerPrice} ${currency} (Margin: ${
                          margin > 0 ? "+" : ""
                        }${margin.toFixed(1)}%)`
                      );
                    } else {
                      console.log(
                        `⚠️ [PRODUCTION] No reseller pricing available for ${domain}`
                      );
                    }
                  }
                }
              } catch (error) {
                console.warn(
                  `⚠️ [PRODUCTION] Failed to fetch live customer pricing for ${domain}:`,
                  error
                );
              }

              // If no live pricing available, mark as unavailable with pricing error
              if (price === 0) {
                pricingSource = "unavailable";
                isAvailable = false; // Mark domain as unavailable if no live pricing
                console.log(
                  `⚠️ [PRODUCTION] Unable to fetch pricing for ${domain} (TLD: ${tld}) - marking as unavailable`
                );
              }
            }

            // Processing domain

            results.push({
              domainName: domain,
              available: isAvailable,
              price: price,
              currency: currency,
              registrationPeriod: registrationPeriod, // Use actual registration period
              pricingSource: pricingSource, // Add pricing source info
            });
          } else {
            console.warn(
              `⚠️ [PRODUCTION] Skipping invalid domain data for ${domain}:`,
              data
            );
          }
        }
      } else {
        console.warn(
          `⚠️ [PRODUCTION] Invalid response data structure:`,
          response.data
        );
      }

      const availableCount = results.filter((r) => r.available).length;
      const livePricingCount = results.filter(
        (r) => r.pricingSource === "live"
      ).length;
      const totalCustomerPrice = results
        .filter((r) => r.available && r.price > 0)
        .reduce((sum, r) => sum + r.price, 0);

      // Domain search completed successfully

      return results;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(
        `❌ [PRODUCTION] Domain search failed for "${domainName}" after ${responseTime}ms:`,
        {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          axiosError:
            error instanceof AxiosError
              ? {
                  status: error.response?.status,
                  statusText: error.response?.statusText,
                  data: error.response?.data,
                  code: error.code,
                }
              : undefined,
        }
      );

      // Re-throw with more specific error information
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          throw new Error(
            "ResellerClub API authentication failed. Please check API credentials."
          );
        } else if (error.response?.status === 403) {
          throw new Error(
            "ResellerClub API access forbidden. Please check API permissions."
          );
        } else if (error.response?.status === 429) {
          throw new Error(
            "ResellerClub API rate limit exceeded. Please try again later."
          );
        } else if (error.response?.status && error.response.status >= 500) {
          throw new Error(
            "ResellerClub API server error. Please try again later."
          );
        } else if (error.code === "ECONNABORTED") {
          throw new Error(
            "ResellerClub API request timeout. Please try again."
          );
        } else if (
          error.code === "ENOTFOUND" ||
          error.code === "ECONNREFUSED"
        ) {
          throw new Error(
            "ResellerClub API connection failed. Please check network connectivity."
          );
        }
      }

      throw new Error(
        `Failed to search domain availability: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Search for domain availability with specific TLDs
   *
   * This method allows searching for a base domain name across multiple specific TLDs.
   * It's used when you want to check availability for a domain across a custom set of TLDs.
   *
   * @param {string} domainName - The base domain name (without TLD)
   * @param {string[]} tlds - Array of TLDs to search (e.g., ['com', 'net', 'org'])
   * @returns {Promise<DomainSearchResult[]>} Array of domain search results with pricing
   *
   * @example
   * // Search for 'example' across multiple TLDs
   * const results = await ResellerClubAPI.searchDomainWithTlds("example", ["com", "net", "org"]);
   *
   * // Search for 'mystore' across e-commerce TLDs
   * const results = await ResellerClubAPI.searchDomainWithTlds("mystore", ["shop", "store", "online"]);
   */
  static async searchDomainWithTlds(
    domainName: string,
    tlds: string[]
  ): Promise<DomainSearchResult[]> {
    const startTime = Date.now();

    try {
      const response = await api.get("/api/domains/available.json", {
        params: {
          "domain-name": domainName,
          tlds: tlds.join(","),
        },
      });

      const results: DomainSearchResult[] = [];
      const responseTime = Date.now() - startTime;

      console.log(
        `📊 [PRODUCTION] Domain search response received in ${responseTime}ms:`,
        {
          domain: domainName,
          tlds: tlds,
          searchParams: { "domain-name": domainName, tlds: tlds.join(",") },
          responseStatus: response.status,
          dataKeys: Object.keys(response.data || {}),
          dataType: typeof response.data,
        }
      );

      if (response.data && typeof response.data === "object") {
        // Check for API errors first
        const hasError = Object.values(response.data).some(
          (data: any) =>
            data && typeof data === "object" && data.status === "error"
        );

        if (hasError) {
          console.error(
            `❌ [PRODUCTION] ResellerClub API returned error:`,
            response.data
          );
          throw new Error(
            "ResellerClub API returned an error. Please check the domain name and TLDs and try again."
          );
        }

        // Log the raw response for debugging
        console.log(`🔍 [PRODUCTION] Raw API response:`, response.data);
        console.log(`🔍 [PRODUCTION] API request params:`, {
          "domain-name": domainName,
          tlds: tlds.join(","),
        });

        for (const [domain, data] of Object.entries(response.data)) {
          // Validate domain name format and base domain match
          const domainParts = domain.split(".");
          const isValidFormat =
            domainParts.length >= 2 && // Allow multi-level TLDs like .co.in, .co.uk
            !domain.includes(",") &&
            !domain.includes("..") &&
            domainParts[0].length > 0 &&
            domainParts[domainParts.length - 1].length > 0; // Check last part (TLD)

          const expectedBaseDomain = domainName.toLowerCase();
          const actualBaseDomain = domainParts[0].toLowerCase();
          const isCorrectBaseDomain = actualBaseDomain === expectedBaseDomain;

          if (!isValidFormat || !isCorrectBaseDomain) {
            console.warn(
              `⚠️ [PRODUCTION] Invalid domain detected: "${domain}" (format: ${isValidFormat}, base match: ${isCorrectBaseDomain}) - skipping`
            );
            continue;
          }

          // Check if domain name is malformed (contains commas or other issues)
          if (
            domain.includes(",") ||
            domain.includes("..") ||
            domainParts.length < 2
          ) {
            console.warn(
              `⚠️ [PRODUCTION] Malformed domain name detected: "${domain}"`
            );

            // Try to split and process individual domains
            const baseDomain = domainName; // This should be the base domain, not the full domain
            const malformedTlds = domain.split(",").map((part) => part.trim());

            console.log(
              `🔧 [PRODUCTION] Attempting to fix malformed response:`,
              {
                baseDomain,
                malformedTlds,
                originalDomain: domain,
              }
            );

            // Process each TLD individually
            for (const tld of malformedTlds) {
              if (tld && tld.length > 0) {
                const cleanDomain = `${baseDomain}.${tld}`;
                console.log(
                  `🔧 [PRODUCTION] Processing fixed domain: "${cleanDomain}"`
                );

                // Use fallback pricing for fixed domains
                const fallbackPrices: {
                  [key: string]: { price: number; currency: string };
                } = {
                  com: { price: 12.99, currency: "INR" },
                  net: { price: 14.99, currency: "INR" },
                  org: { price: 13.99, currency: "INR" },
                  info: { price: 15.99, currency: "INR" },
                  biz: { price: 16.99, currency: "INR" },
                  co: { price: 18.99, currency: "INR" },
                  in: { price: 8.99, currency: "INR" },
                  "co.in": { price: 9.99, currency: "INR" },
                  shop: { price: 19.99, currency: "INR" },
                  store: { price: 19.99, currency: "INR" },
                  online: { price: 24.99, currency: "INR" },
                  site: { price: 17.99, currency: "INR" },
                  website: { price: 22.99, currency: "INR" },
                  app: { price: 29.99, currency: "INR" },
                  dev: { price: 19.99, currency: "INR" },
                  io: { price: 39.99, currency: "INR" },
                  ai: { price: 49.99, currency: "INR" },
                  tech: { price: 24.99, currency: "INR" },
                  digital: { price: 19.99, currency: "INR" },
                  cloud: { price: 24.99, currency: "INR" },
                  host: { price: 19.99, currency: "INR" },
                  space: { price: 17.99, currency: "INR" },
                };

                const fallback = fallbackPrices[tld] || {
                  price: 12.99,
                  currency: "INR",
                };

                results.push({
                  domainName: cleanDomain,
                  available: true, // Assume available for fixed domains
                  price: fallback.price,
                  currency: fallback.currency,
                  registrationPeriod: 1,
                });
              }
            }
            continue;
          }
          if (typeof data === "object" && data !== null) {
            const domainData = data as any;
            // Determine domain availability based on status
            let isAvailable = domainData.status === "available";
            let domainStatus = domainData.status;

            // Log domain status for debugging
            console.log(
              `🔍 [PRODUCTION] Domain ${domain} status: ${domainStatus}`
            );
            // Try to get live pricing first
            let price = 0;
            let currency = "INR";
            let registrationPeriod = 1;
            let pricingSource: "live" | "fallback" | "unavailable" | "taken" =
              isAvailable ? "unavailable" : "taken";

            // Get TLD and live pricing for all domains
            const domainParts = domain.split(".");
            const tld = domainParts.slice(1).join(".").toLowerCase(); // Get full TLD for multi-level TLDs
            let livePricing: any = null;

            if (isAvailable && tld) {
              try {
                console.log(
                  `💰 [PRODUCTION] Fetching live customer pricing for ${domain} (TLD: ${tld})`
                );
                livePricing = await PricingService.getTLDPricing([tld]);

                if (livePricing && livePricing[tld]) {
                  const customerPrice = parseFloat(livePricing[tld].price) || 0;
                  const resellerPrice =
                    parseFloat(livePricing[tld].resellerPrice) || 0;
                  const margin =
                    customerPrice > 0 && resellerPrice > 0
                      ? ((customerPrice - resellerPrice) / customerPrice) * 100
                      : 0;

                  price = customerPrice; // Use customer price for display
                  currency = livePricing[tld].currency || "INR";
                  pricingSource = "live";

                  console.log(
                    `✅ [PRODUCTION] Live customer pricing for ${domain}: ₹${customerPrice} ${currency}`
                  );
                  if (resellerPrice > 0) {
                    console.log(
                      `📊 [PRODUCTION] Reseller pricing for ${domain}: ₹${resellerPrice} ${currency} (Margin: ${
                        margin > 0 ? "+" : ""
                      }${margin.toFixed(1)}%)`
                    );
                  } else {
                    console.log(
                      `⚠️ [PRODUCTION] No reseller pricing available for ${domain}`
                    );
                  }
                }
              } catch (error) {
                console.warn(
                  `⚠️ [PRODUCTION] Failed to fetch live customer pricing for ${domain}:`,
                  error
                );
              }

              // If no live pricing available, mark as unavailable with pricing error
              if (price === 0) {
                pricingSource = "unavailable";
                isAvailable = false; // Mark domain as unavailable if no live pricing
                console.log(
                  `⚠️ [PRODUCTION] Unable to fetch pricing for ${domain} (TLD: ${tld}) - marking as unavailable`
                );
              }
            }

            // Processing domain

            results.push({
              domainName: domain,
              available: isAvailable,
              price: price,
              currency: currency,
              registrationPeriod: registrationPeriod, // Use actual registration period
              pricingSource: pricingSource, // Add pricing source info
            });
          } else {
            console.warn(
              `⚠️ [PRODUCTION] Skipping invalid domain data for ${domain}:`,
              data
            );
          }
        }
      } else {
        console.warn(
          `⚠️ [PRODUCTION] Invalid response data structure:`,
          response.data
        );
      }

      const availableCount = results.filter((r) => r.available).length;
      const livePricingCount = results.filter(
        (r) => r.pricingSource === "live"
      ).length;
      const totalCustomerPrice = results
        .filter((r) => r.available && r.price > 0)
        .reduce((sum, r) => sum + r.price, 0);

      // Domain search completed successfully

      return results;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(
        `❌ [PRODUCTION] Domain search failed for "${domainName}" with TLDs ${tlds.join(
          ", "
        )} after ${responseTime}ms:`,
        {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          axiosError:
            error instanceof AxiosError
              ? {
                  status: error.response?.status,
                  statusText: error.response?.statusText,
                  data: error.response?.data,
                  code: error.code,
                }
              : undefined,
        }
      );

      // Re-throw with more specific error information
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          throw new Error(
            "ResellerClub API authentication failed. Please check API credentials."
          );
        } else if (error.response?.status === 403) {
          throw new Error(
            "ResellerClub API access forbidden. Please check API permissions."
          );
        } else if (error.response?.status === 429) {
          throw new Error(
            "ResellerClub API rate limit exceeded. Please try again later."
          );
        } else if (error.response?.status && error.response.status >= 500) {
          throw new Error(
            "ResellerClub API server error. Please try again later."
          );
        } else if (error.code === "ECONNABORTED") {
          throw new Error(
            "ResellerClub API request timeout. Please try again."
          );
        } else if (
          error.code === "ENOTFOUND" ||
          error.code === "ECONNREFUSED"
        ) {
          throw new Error(
            "ResellerClub API connection failed. Please check network connectivity."
          );
        }
      }

      throw new Error(
        `Failed to search domain availability: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get reseller pricing for a specific TLD
   */
  static async getResellerPricingForTLD(
    tld: string
  ): Promise<{ price: number; currency: string } | null> {
    try {
      // Fetch reseller pricing
      const response = await api.get("/api/products/reseller-price.json");

      if (response.data && response.data[tld]) {
        const tldPricing = response.data[tld];

        // Get registration price (addnewdomain) for 1 year
        if (tldPricing.addnewdomain && tldPricing.addnewdomain["1"]) {
          const price = parseFloat(tldPricing.addnewdomain["1"]);
          const currency = "INR"; // ResellerClub typically returns prices in INR

          return { price, currency };
        }
      }

      return null;
    } catch (error) {
      console.error(
        `❌ [PRODUCTION] Failed to fetch reseller pricing for ${tld}:`,
        error
      );
      return null;
    }
  }

  /**
   * Check if a customer exists in ResellerClub system and get their ID
   */
  static async getCustomerId(
    username: string
  ): Promise<{ status: string; customerId?: number; error?: string }> {
    const startTime = Date.now();
    console.log(
      `🔍 [PRODUCTION] Checking if ResellerClub customer exists: ${username}`
    );

    try {
      const response = await api.get("/api/customers/details.json", {
        params: {
          username: username,
        },
      });

      const responseTime = Date.now() - startTime;
      console.log(
        `✅ [PRODUCTION] Customer details fetched in ${responseTime}ms:`,
        {
          responseData: response.data,
          status: response.status,
        }
      );

      // If we get here, customer exists
      if (response.data && response.data.customerid) {
        return {
          status: "success",
          customerId: parseInt(response.data.customerid),
        };
      } else {
        return {
          status: "error",
          error: "Customer not found",
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log(
        `ℹ️ [PRODUCTION] Customer check completed in ${responseTime}ms - Customer does not exist`
      );

      // If customer doesn't exist, ResellerClub returns an error
      // This is expected behavior, so we return "not found" status
      return {
        status: "not_found",
        error: "Customer does not exist",
      };
    }
  }

  /**
   * Create a customer in ResellerClub system
   */
  static async createCustomer(customerData: {
    username: string;
    passwd: string;
    name: string;
    company?: string;
    addressLine1: string;
    city: string;
    state: string;
    country: string;
    zipcode: string;
    phoneCc: string;
    phone: string;
    langPref?: string;
  }): Promise<{ status: string; data?: any; error?: string }> {
    const startTime = Date.now();
    console.log(
      `🚀 [PRODUCTION] Creating ResellerClub customer: ${customerData.username}`
    );

    try {
      const response = await api.post("/api/customers/signup.json", null, {
        params: {
          username: customerData.username,
          passwd: customerData.passwd,
          name: customerData.name,
          company: customerData.company || customerData.name, // Use name as company if not provided
          "address-line-1": customerData.addressLine1,
          city: customerData.city,
          state: customerData.state,
          country: customerData.country,
          zipcode: customerData.zipcode,
          "phone-cc": customerData.phoneCc,
          phone: customerData.phone,
          "lang-pref": customerData.langPref || "en",
          "reseller-id":
            process.env.RESELLERCLUB_RESELLER_ID || process.env.RESELLERCLUB_ID, // Add reseller ID
        },
      });

      const responseTime = Date.now() - startTime;
      console.log(
        `✅ [PRODUCTION] Customer created successfully in ${responseTime}ms:`,
        {
          responseData: response.data,
          status: response.status,
        }
      );

      return {
        status: "success",
        data: response.data,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(
        `❌ [PRODUCTION] Customer creation failed after ${responseTime}ms:`,
        {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          axiosError:
            error instanceof AxiosError
              ? {
                  status: error.response?.status,
                  statusText: error.response?.statusText,
                  data: error.response?.data,
                  code: error.code,
                }
              : undefined,
          customerData: {
            username: customerData.username,
            name: customerData.name,
          },
        }
      );

      return {
        status: "error",
        error:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : "Unknown error occurred",
      };
    }
  }

  /**
   * Create a contact in ResellerClub system
   */
  static async createContact(contactData: {
    customerId: number;
    name: string;
    company?: string;
    email: string;
    addressLine1: string;
    city: string;
    state: string;
    country: string;
    zipcode: string;
    phoneCc: string;
    phone: string;
    type: "Contact" | "CaDomain" | "IrtContact";
  }): Promise<{ status: string; data?: any; error?: string }> {
    const startTime = Date.now();
    console.log(
      `🚀 [PRODUCTION] Creating ResellerClub contact: ${contactData.name} (${contactData.email})`
    );

    try {
      const response = await api.post("/api/contacts/add.json", null, {
        params: {
          "customer-id": contactData.customerId,
          name: contactData.name,
          company: contactData.company || contactData.name, // Use name as company if not provided
          email: contactData.email,
          "address-line-1": contactData.addressLine1,
          city: contactData.city,
          state: contactData.state,
          country: contactData.country,
          zipcode: contactData.zipcode,
          "phone-cc": contactData.phoneCc,
          phone: contactData.phone,
          type: contactData.type,
          "reseller-id":
            process.env.RESELLERCLUB_RESELLER_ID || process.env.RESELLERCLUB_ID, // Add reseller ID
        },
      });

      const responseTime = Date.now() - startTime;
      console.log(
        `✅ [PRODUCTION] Contact created successfully in ${responseTime}ms:`,
        {
          responseData: response.data,
          status: response.status,
        }
      );

      return {
        status: "success",
        data: response.data,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(
        `❌ [PRODUCTION] Contact creation failed after ${responseTime}ms:`,
        {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          axiosError:
            error instanceof AxiosError
              ? {
                  status: error.response?.status,
                  statusText: error.response?.statusText,
                  data: error.response?.data,
                  code: error.code,
                }
              : undefined,
          contactData: {
            name: contactData.name,
            email: contactData.email,
            customerId: contactData.customerId,
          },
        }
      );

      return {
        status: "error",
        error:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : "Unknown error occurred",
      };
    }
  }

  /**
   * Get or create a ResellerClub customer and contact for a user
   */
  static async getOrCreateCustomerAndContact(userData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    phoneCc?: string;
    companyName?: string;
    address?: {
      line1: string;
      city: string;
      state: string;
      country: string;
      zipcode: string;
    };
  }): Promise<{
    status: string;
    customerId?: number;
    contactId?: number;
    error?: string;
  }> {
    console.log(
      `🔍 [PRODUCTION] Getting or creating ResellerClub customer and contact for user: ${userData.email}`
    );

    try {
      // First, check if customer already exists
      const existingCustomer = await ResellerClubAPI.getCustomerId(
        userData.email
      );

      let customerId: number;

      if (
        existingCustomer.status === "success" &&
        existingCustomer.customerId
      ) {
        // Customer already exists, use their ID
        customerId = existingCustomer.customerId;
        console.log(
          `✅ [PRODUCTION] Found existing ResellerClub customer ${customerId} for user: ${userData.email}`
        );
      } else {
        // Customer doesn't exist, create a new one
        console.log(
          `🆕 [PRODUCTION] Customer not found, creating new ResellerClub customer for: ${userData.email}`
        );

        // Generate ResellerClub-compliant password (8-15 alphanumeric characters)
        const tempPassword = `Temp${Math.random()
          .toString(36)
          .substring(2, 10)}`;

        // Clean phone number (remove spaces and non-digits)
        const cleanPhone = userData.phone?.replace(/\D/g, "") || "0000000000";

        console.log(`🔧 [PRODUCTION] Generated ResellerClub credentials:`, {
          password: tempPassword,
          passwordLength: tempPassword.length,
          originalPhone: userData.phone,
          cleanPhone: cleanPhone,
          phoneCc: userData.phoneCc?.replace("+", "") || "91",
        });

        // Create customer
        const customerResult = await ResellerClubAPI.createCustomer({
          username: userData.email,
          passwd: tempPassword, // Generate ResellerClub-compliant password
          name: `${userData.firstName} ${userData.lastName}`,
          company:
            userData.companyName ||
            `${userData.firstName} ${userData.lastName}`, // Use companyName from user data
          addressLine1: userData.address?.line1 || "Default Address",
          city: userData.address?.city || "Default City",
          state: userData.address?.state || "Default State",
          country: userData.address?.country || "IN",
          zipcode: userData.address?.zipcode || "000000",
          phoneCc: userData.phoneCc?.replace("+", "") || "91", // Use user's phone country code or default to India
          phone: cleanPhone, // Clean phone number without spaces
          langPref: "en",
        });

        if (customerResult.status !== "success" || !customerResult.data) {
          console.error(
            `❌ [PRODUCTION] Failed to create ResellerClub customer for user ${userData.email}:`,
            customerResult.error
          );
          return {
            status: "error",
            error: `Failed to create customer: ${customerResult.error}`,
          };
        }

        // ResellerClub returns customer ID directly as a number
        customerId = parseInt(customerResult.data);
        console.log(
          `✅ [PRODUCTION] Created ResellerClub customer ${customerId} for user: ${userData.email}`
        );
      }

      // Clean phone number for contact creation (remove spaces and non-digits)
      const cleanPhone = userData.phone?.replace(/\D/g, "") || "0000000000";

      // Create contact
      const contactResult = await ResellerClubAPI.createContact({
        customerId: customerId,
        name: `${userData.firstName} ${userData.lastName}`,
        company:
          userData.companyName || `${userData.firstName} ${userData.lastName}`, // Use companyName from user data
        email: userData.email,
        addressLine1: userData.address?.line1 || "Default Address",
        city: userData.address?.city || "Default City",
        state: userData.address?.state || "Default State",
        country: userData.address?.country || "IN",
        zipcode: userData.address?.zipcode || "000000",
        phoneCc: userData.phoneCc?.replace("+", "") || "91", // Use user's phone country code or default to India
        phone: cleanPhone, // Use cleaned phone number without spaces
        type: "Contact",
      });

      if (contactResult.status !== "success" || !contactResult.data) {
        console.error(
          `❌ [PRODUCTION] Failed to create ResellerClub contact for user ${userData.email}:`,
          contactResult.error
        );
        return {
          status: "error",
          error: `Failed to create contact: ${contactResult.error}`,
        };
      }

      // ResellerClub returns contact ID directly as a number
      const contactId = parseInt(contactResult.data);
      console.log(
        `✅ [PRODUCTION] Created ResellerClub contact ${contactId} for user: ${userData.email}`
      );

      // TODO: Store customerId and contactId in your user database record
      // await updateUserResellerClubIds(userData.email, customerId, contactId);

      return {
        status: "success",
        customerId: customerId,
        contactId: contactId,
      };
    } catch (error) {
      console.error(
        `❌ [PRODUCTION] Error in getOrCreateCustomerAndContact for user ${userData.email}:`,
        error
      );
      return {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Register a domain
   */
  static async registerDomain(domainData: {
    domainName: string;
    years: number;
    customerId: number; // ResellerClub customer ID (numeric)
    nameServers?: string[];
    adminContactId?: number; // ResellerClub contact ID (numeric)
    techContactId?: number; // ResellerClub contact ID (numeric)
    billingContactId?: number; // ResellerClub contact ID (numeric)
  }): Promise<ResellerClubResponse> {
    const startTime = Date.now();
    console.log(
      `🚀 [PRODUCTION] Starting domain registration for: "${domainData.domainName}"`,
      {
        years: domainData.years,
        customerId: domainData.customerId,
        nameServers: domainData.nameServers,
        contacts: {
          admin: domainData.adminContactId,
          tech: domainData.techContactId,
          billing: domainData.billingContactId,
        },
      }
    );

    try {
      // Always use ResellerClub nameservers as default for domain registration
      const resellerClubNameServers = [
        "deepak1299294.mercury.orderbox-dns.com",
        "deepak1299294.venus.orderbox-dns.com",
        "deepak1299294.earth.orderbox-dns.com",
        "deepak1299294.mars.orderbox-dns.com",
      ];

      // Use custom nameservers if provided, otherwise use ResellerClub defaults
      const nameServers =
        domainData.nameServers && domainData.nameServers.length > 0
          ? domainData.nameServers
          : resellerClubNameServers;

      console.log(
        `🌐 [PRODUCTION] Using nameservers for ${domainData.domainName}:`,
        nameServers
      );

      // Prepare nameserver parameters using URLSearchParams for correct encoding
      const params = new URLSearchParams({
        "domain-name": domainData.domainName,
        years: domainData.years.toString(),
        "customer-id": domainData.customerId.toString(),
        "reg-contact-id": domainData.adminContactId?.toString() || "",
        "admin-contact-id": domainData.adminContactId?.toString() || "",
        "tech-contact-id": domainData.techContactId?.toString() || "",
        "billing-contact-id": domainData.billingContactId?.toString() || "",
        "invoice-option": "NoInvoice",
      });

      // Add domain-specific policy requirements
      const domainParts = domainData.domainName.split(".");
      const tld = domainParts.slice(1).join(".").toLowerCase(); // Get full TLD for multi-level TLDs

      if (tld === "au") {
        // Australian domain policy requirements
        params.append("id", "AUS");
        params.append("id-type", "Business Registration Number");
        params.append("policy-reason", "1"); // 1 = Business/Commercial use
      } else if (tld === "uk" || tld === "co.uk") {
        // UK domain policy requirements
        params.append("id", "GB");
        params.append("id-type", "Company Registration Number");
        params.append("policy-reason", "1");
      } else if (tld === "ca") {
        // Canadian domain policy requirements
        params.append("id", "CA");
        params.append("id-type", "Business Registration Number");
        params.append("policy-reason", "1");
      } else if (tld === "de") {
        // German domain policy requirements
        params.append("id", "DE");
        params.append("id-type", "Business Registration Number");
        params.append("policy-reason", "1");
      }

      // Add each ns param separately using append() method
      nameServers.forEach((ns) => {
        params.append("ns", ns);
      });

      const response = await api.post("/api/domains/register.json", params);

      const responseTime = Date.now() - startTime;

      // Check if the response contains an error status or error message
      const hasError =
        response.data &&
        (response.data.status === "error" || response.data.error);

      if (hasError) {
        console.error(
          `❌ [PRODUCTION] Domain registration failed for "${domainData.domainName}" in ${responseTime}ms:`,
          {
            responseData: response.data,
            status: response.status,
          }
        );

        // Log the actual ResellerClub error response for debugging
        console.log(
          `🔍 [PRODUCTION] ResellerClub error response for "${domainData.domainName}":`,
          {
            error: response.data.error,
            fullResponse: response.data,
            status: response.status,
          }
        );

        const errorMessage =
          response.data.error || "Domain registration failed";

        // Check for various error conditions that indicate pending status
        const isPendingStatus =
          errorMessage &&
          (errorMessage.toLowerCase().includes("insufficient balance") ||
            errorMessage.toLowerCase().includes("low funds") ||
            errorMessage.toLowerCase().includes("insufficient funds") ||
            errorMessage.toLowerCase().includes("account balance") ||
            errorMessage.toLowerCase().includes("credit limit") ||
            errorMessage
              .toLowerCase()
              .includes("order locked for processing") ||
            errorMessage.toLowerCase().includes("please contact support") ||
            errorMessage.toLowerCase().includes("locked for processing") ||
            errorMessage.toLowerCase().includes("processing") ||
            errorMessage
              .toLowerCase()
              .includes("already exists in our database") ||
            errorMessage.toLowerCase().includes("pending order") ||
            errorMessage.toLowerCase().includes("pending order for") ||
            response.data.status === "InvoicePaid"); // InvoicePaid with error message indicates pending

        return {
          status: isPendingStatus ? "pending" : "error",
          message: errorMessage,
          data: response.data, // Include full response data for debugging
        };
      }

      console.log(
        `✅ [PRODUCTION] Domain registration successful for "${domainData.domainName}" in ${responseTime}ms:`,
        {
          responseData: response.data,
          status: response.status,
        }
      );

      return {
        status: "success",
        data: response.data,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(
        `❌ [PRODUCTION] Domain registration failed for "${domainData.domainName}" after ${responseTime}ms:`,
        {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          axiosError:
            error instanceof AxiosError
              ? {
                  status: error.response?.status,
                  statusText: error.response?.statusText,
                  data: error.response?.data,
                  code: error.code,
                }
              : undefined,
          domainData: {
            domainName: domainData.domainName,
            years: domainData.years,
            customerId: domainData.customerId,
          },
        }
      );

      // Determine specific error message based on response
      let errorMessage = "Failed to register domain";
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          errorMessage =
            "ResellerClub API authentication failed. Please check API credentials.";
        } else if (error.response?.status === 403) {
          errorMessage =
            "ResellerClub API access forbidden. Please check API permissions.";
        } else if (error.response?.status === 400) {
          errorMessage =
            "Invalid domain registration request. Please check domain data.";
        } else if (error.response?.status === 409) {
          errorMessage =
            "Domain registration conflict. Domain may already be registered.";
        } else if (error.response?.status === 429) {
          errorMessage =
            "ResellerClub API rate limit exceeded. Please try again later.";
        } else if (error.response?.status && error.response.status >= 500) {
          errorMessage =
            "ResellerClub API server error. Please try again later.";
        } else if (error.code === "ECONNABORTED") {
          errorMessage = "ResellerClub API request timeout. Please try again.";
        } else if (
          error.code === "ENOTFOUND" ||
          error.code === "ECONNREFUSED"
        ) {
          errorMessage =
            "ResellerClub API connection failed. Please check network connectivity.";
        }
      }

      return {
        status: "error",
        message: errorMessage,
        data: error instanceof AxiosError ? error.response?.data : undefined,
      };
    }
  }

  /**
   * Get domain details
   */
  static async getDomainDetails(
    domainName: string
  ): Promise<ResellerClubResponse> {
    try {
      const response = await api.get("/api/domains/details.json", {
        params: {
          "domain-name": domainName,
        },
      });

      return {
        status: "success",
        data: response.data,
      };
    } catch (error) {
      console.error("ResellerClub domain details error:", error);
      return {
        status: "error",
        message: "Failed to get domain details",
      };
    }
  }

  /**
   * Activate DNS management for a domain
   */
  static async activateDNSManagement(
    domainName: string,
    orderId: string
  ): Promise<ResellerClubResponse> {
    try {
      const response = await api.post("/api/dns/activate.json", null, {
        params: {
          "domain-name": domainName,
          "order-id": orderId,
          "auth-userid": RESELLERCLUB_ID,
          "api-key": RESELLERCLUB_SECRET,
        },
      });

      return {
        status: "success",
        data: response.data,
      };
    } catch (error: any) {
      console.error("ResellerClub DNS activation error:", error);
      return {
        status: "error",
        message: "Failed to activate DNS management",
      };
    }
  }

  /**
   * Get DNS records for a domain
   * Uses the correct ResellerClub DNS search endpoint
   */
  static async getDNSRecords(
    domainName: string,
    customerId: string
  ): Promise<ResellerClubResponse> {
    try {
      // Search for all record types
      const recordTypes = ["A", "AAAA", "CNAME", "MX", "NS", "TXT", "SRV"];
      const allRecords = [];

      for (const recordType of recordTypes) {
        try {
          const response = await api.get(
            "/api/dns/manage/search-records.json",
            {
              params: {
                "domain-name": domainName,
                "customer-id": customerId,
                type: recordType,
                "no-of-records": 50, // Maximum allowed by ResellerClub
                "page-no": 1, // Required parameter for pagination
              },
            }
          );

          if (response.data) {
            // ResellerClub returns records as numbered keys (1, 2, 3, etc.)
            const records = Object.keys(response.data)
              .filter((key) => key !== "recsonpage" && key !== "recsindb")
              .map((key) => {
                const record = response.data[key];
                if (record && record.type) {
                  // Map ResellerClub field names to standard field names
                  return {
                    ...record,
                    id: key, // Preserve the record ID from ResellerClub
                    ttl: record.timetolive || record.ttl, // Map timetolive to ttl
                    name: record.host || record.name, // Map host to name
                    priority: record.priority || undefined, // Ensure priority is included
                  };
                }
                return null;
              })
              .filter((record) => record !== null);

            if (records.length > 0) {
              allRecords.push(...records);
            }
          }
        } catch (typeError) {
          // Continue with other record types if one fails
          console.log(`No ${recordType} records found for ${domainName}`);
        }
      }

      return {
        status: "success",
        data: {
          records: allRecords,
          total: allRecords.length,
        },
      };
    } catch (error: any) {
      console.error("ResellerClub DNS records error:", error);
      return {
        status: "error",
        message:
          error.response?.status === 404
            ? "Request failed with status code 404"
            : "Failed to get DNS records",
      };
    }
  }

  /**
   * Add DNS record using the correct endpoint based on record type
   */
  static async addDNSRecord(
    domainName: string,
    customerId: string,
    recordData: {
      type: string;
      name: string;
      value: string;
      ttl: number;
      priority?: number;
    }
  ): Promise<ResellerClubResponse> {
    try {
      // Ensure TTL is at least 7200 (ResellerClub requirement)
      const ttl = Math.max(recordData.ttl, 7200);

      let endpoint = "";
      let params: any = {
        "domain-name": domainName,
        "customer-id": customerId,
        host: recordData.name,
        value: recordData.value,
        ttl: ttl,
      };

      // Use specific endpoint based on record type
      switch (recordData.type.toUpperCase()) {
        case "A":
          endpoint = "/api/dns/manage/add-ipv4-record.json";
          break;
        case "AAAA":
          endpoint = "/api/dns/manage/add-ipv6-record.json";
          break;
        case "CNAME":
          endpoint = "/api/dns/manage/add-cname-record.json";
          break;
        case "MX":
          endpoint = "/api/dns/manage/add-mx-record.json";
          params.priority = recordData.priority || 10;
          break;
        case "NS":
          endpoint = "/api/dns/manage/add-ns-record.json";
          break;
        case "TXT":
          endpoint = "/api/dns/manage/add-txt-record.json";
          break;
        case "SRV":
          endpoint = "/api/dns/manage/add-srv-record.json";
          params.priority = recordData.priority || 10;
          params.weight = 10; // Default weight
          params.port = 443; // Default port
          break;
        default:
          return {
            status: "error",
            message: `Unsupported DNS record type: ${recordData.type}`,
          };
      }

      const response = await api.post(endpoint, null, { params });

      return {
        status: "success",
        data: response.data,
      };
    } catch (error: any) {
      console.error("ResellerClub add DNS record error:", error);
      return {
        status: "error",
        message: error.response?.data?.msg || "Failed to add DNS record",
      };
    }
  }

  /**
   * Update DNS record
   */
  static async updateDNSRecord(
    domainName: string,
    recordId: string,
    recordData: {
      type: string;
      name: string;
      value: string;
      ttl: number;
      priority?: number;
    }
  ): Promise<ResellerClubResponse> {
    try {
      const response = await api.post(
        "/api/dns/manage/modify-record.json",
        null,
        {
          params: {
            "domain-name": domainName,
            "auth-userid": RESELLERCLUB_ID,
            "api-key": RESELLERCLUB_SECRET,
            "record-id": recordId,
            type: recordData.type,
            host: recordData.name,
            value: recordData.value,
            ttl: recordData.ttl,
            priority: recordData.priority,
          },
        }
      );

      return {
        status: "success",
        data: response.data,
      };
    } catch (error) {
      console.error("ResellerClub update DNS record error:", error);
      return {
        status: "error",
        message: "Failed to update DNS record",
      };
    }
  }

  /**
   * Delete DNS record
   */
  static async deleteDNSRecord(
    domainName: string,
    recordId: string,
    recordData: {
      type: string;
      name: string;
      value: string;
      ttl: number;
      priority?: number;
    }
  ): Promise<ResellerClubResponse> {
    try {
      const response = await api.post(
        "/api/dns/manage/delete-record.json",
        null,
        {
          params: {
            "domain-name": domainName,
            "auth-userid": RESELLERCLUB_ID,
            "api-key": RESELLERCLUB_SECRET,
            "record-id": recordId,
            host: recordData.name,
            value: recordData.value,
            type: recordData.type,
          },
        }
      );

      return {
        status: "success",
        data: response.data,
      };
    } catch (error) {
      console.error("ResellerClub delete DNS record error:", error);
      return {
        status: "error",
        message: "Failed to delete DNS record",
      };
    }
  }

  /**
   * Set default nameservers
   */
  static async setDefaultNameservers(
    domainName: string
  ): Promise<ResellerClubResponse> {
    try {
      const response = await api.post(
        "/api/domains/use-default-ns.json",
        null,
        {
          params: {
            "domain-name": domainName,
          },
        }
      );

      return {
        status: "success",
        data: response.data,
      };
    } catch (error) {
      console.error("ResellerClub set default nameservers error:", error);
      return {
        status: "error",
        message: "Failed to set default nameservers",
      };
    }
  }

  /**
   * Set custom nameservers
   */
  static async setCustomNameservers(
    domainName: string,
    nameservers: string[]
  ): Promise<ResellerClubResponse> {
    try {
      const params: any = {
        "domain-name": domainName,
      };

      // Add nameservers as ns1, ns2, etc.
      nameservers.forEach((ns, index) => {
        params[`ns${index + 1}`] = ns;
      });

      const response = await api.post("/api/domains/modify-ns.json", null, {
        params,
      });

      return {
        status: "success",
        data: response.data,
      };
    } catch (error) {
      console.error("ResellerClub set custom nameservers error:", error);
      return {
        status: "error",
        message: "Failed to set custom nameservers",
      };
    }
  }

  /**
   * Get customer details
   */
  static async getCustomerDetails(
    customerId: string
  ): Promise<ResellerClubResponse> {
    try {
      const response = await api.get("/api/customers/details.json", {
        params: {
          "customer-id": customerId,
        },
      });

      return {
        status: "success",
        data: response.data,
      };
    } catch (error) {
      console.error("ResellerClub customer details error:", error);
      return {
        status: "error",
        message: "Failed to get customer details",
      };
    }
  }

  /**
   * Get domain renewal pricing
   */
  static async getRenewalPricing(
    domainName: string,
    years: number
  ): Promise<ResellerClubResponse> {
    try {
      const response = await api.get("/api/domains/renewal-price.json", {
        params: {
          "domain-name": domainName,
          years: years,
        },
      });

      return {
        status: "success",
        data: response.data,
      };
    } catch (error) {
      console.error("ResellerClub renewal pricing error:", error);
      return {
        status: "error",
        message: "Failed to get renewal pricing",
      };
    }
  }

  /**
   * Get domain expiry date
   */
  static async getDomainExpiry(
    domainName: string
  ): Promise<ResellerClubResponse> {
    try {
      const response = await api.get("/api/domains/details.json", {
        params: {
          "domain-name": domainName,
        },
      });

      return {
        status: "success",
        data: response.data,
      };
    } catch (error) {
      console.error("ResellerClub domain expiry error:", error);
      return {
        status: "error",
        message: "Failed to get domain expiry",
      };
    }
  }

  /**
   * Transfer a domain
   */
  static async transferDomain(
    domainName: string,
    authCode: string
  ): Promise<ResellerClubResponse> {
    try {
      const response = await api.post("/api/domains/transfer.json", null, {
        params: {
          "domain-name": domainName,
          "auth-code": authCode,
        },
      });

      return {
        status: "success",
        data: response.data,
      };
    } catch (error) {
      console.error("ResellerClub domain transfer error:", error);
      return {
        status: "error",
        message: "Failed to transfer domain",
      };
    }
  }
}
