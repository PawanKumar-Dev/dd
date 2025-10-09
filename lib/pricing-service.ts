/**
 * Pricing Service for Domain Management
 *
 * This service handles all pricing-related operations for domains, including
 * fetching live pricing data from ResellerClub API, caching, and providing
 * both customer and reseller pricing information.
 *
 * Key Features:
 * - Live pricing data from ResellerClub API
 * - Intelligent caching with 5-minute TTL
 * - Customer and reseller pricing comparison
 * - TLD-specific pricing lookup
 * - Comprehensive error handling
 *
 * @author Excel Technologies
 * @version 2.0.0
 * @since 2024
 */

import axios from "axios";
import { ResellerClubResponse, DomainSearchResult } from "./types";
import { SettingsService } from "./settings-service";

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

// Configure Axios instance for pricing API requests
const api = axios.create({
  baseURL: RESELLERCLUB_API_URL,
  timeout: 30000, // 30 second timeout
});

// Add authentication to all pricing API requests
api.interceptors.request.use(
  (config) => {
    config.params = {
      ...config.params,
      "auth-userid": RESELLERCLUB_ID,
      "api-key": RESELLERCLUB_SECRET,
      "reseller-id": RESELLERCLUB_ID, // Use same ID for Indian pricing
    };
    return config;
  },
  (error) => {
    console.error("❌ ResellerClub Pricing API Request Error:", error);
    return Promise.reject(error);
  }
);

/**
 * Pricing Service Class
 *
 * Provides methods for fetching and managing domain pricing data.
 * Always fetches fresh data from ResellerClub API.
 */
export class PricingService {
  // Caching removed - always fetch fresh data

  /**
   * Get domain pricing data
   *
   * Fetches live pricing data from ResellerClub API.
   * This method is used to get both customer and reseller pricing information.
   *
   * @returns {Promise<any>} Object containing customerPricing and resellerPricing data
   * @throws {Error} If API request fails or data is invalid
   *
   * @example
   * const pricing = await PricingService.getDomainPricing();
   * console.log(pricing.customerPricing); // Customer pricing data
   * console.log(pricing.resellerPricing); // Reseller pricing data
   */
  static async getDomainPricing(): Promise<any> {
    const startTime = Date.now();
    console.log(
      `💰 [PRICING] Fetching live domain pricing from ResellerClub API (Indian pricing)`
    );

    // No caching - always fetch fresh data

    try {
      // Fetch all pricing data in parallel
      const [customerPricingResponse, resellerPricingResponse] =
        await Promise.all([
          api.get("/api/products/customer-price.json"),
          api.get("/api/products/reseller-price.json"),
        ]);

      const customerTldCount = Object.keys(
        customerPricingResponse.data || {}
      ).length;
      const resellerTldCount = Object.keys(
        resellerPricingResponse.data || {}
      ).length;

      console.log(
        `✅ [PRICING] Customer pricing fetched in ${
          Date.now() - startTime
        }ms - ${customerTldCount} TLDs available`
      );
      console.log(
        `✅ [PRICING] Reseller pricing fetched in ${
          Date.now() - startTime
        }ms - ${resellerTldCount} TLDs available`
      );

      const pricingData = {
        customerPricing: customerPricingResponse.data,
        resellerPricing: resellerPricingResponse.data,
        timestamp: new Date().toISOString(),
      };

      // Log successful API response
      const tldCount = Object.keys(customerPricingResponse.data || {}).length;
      console.log(`✅ [PRICING] API returned ${tldCount} TLDs`);

      // No caching - data is returned directly

      return pricingData;
    } catch (error) {
      console.error(`❌ [PRICING] Failed to fetch domain pricing:`, error);
      throw new Error(
        "Failed to fetch live domain pricing from ResellerClub API"
      );
    }
  }

  /**
   * Get pricing for specific TLDs
   *
   * Retrieves both customer and reseller pricing for multiple TLDs.
   * This method is used by the domain search functionality to get live pricing.
   *
   * @param {string[]} tlds - Array of TLDs to get pricing for (e.g., ['com', 'net', 'org'])
   * @returns {Promise<{ [tld: string]: any }>} Object containing pricing data for each TLD
   *
   * @example
   * const pricing = await PricingService.getTLDPricing(['com', 'net', 'org']);
   * console.log(pricing.com.price); // Customer price for .com
   * console.log(pricing.com.resellerPrice); // Reseller price for .com
   */
  static async getTLDPricing(tlds: string[]): Promise<{ [tld: string]: any }> {
    const startTime = Date.now();

    try {
      const pricingData = await this.getDomainPricing();
      const tldPricing: { [tld: string]: any } = {};

      // Check if pricing data is available
      if (!pricingData || !pricingData.customerPricing) {
        console.warn(`⚠️ [PRICING] No customer pricing data available`);
        return tldPricing;
      }

      // Extract pricing for requested TLDs
      for (const tld of tlds) {
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
          email: "dotemail",
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
          ai: "dotai",
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
          ca: "dotca",
          cc: "dotcc",
          cd: "dotcd",
          cf: "dotcf",
          cg: "dotcg",
          ch: "dotch",
          ci: "dotci",
          ck: "dotck",
          cl: "dotcl",
          cm: "dotcm",
          cn: "dotcn",
          co: "dotco",
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
          fr: "dotfr",
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
          in: "thirdleveldotin",
          io: "dotio",
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
          me: "dotme",
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
          nl: "dotnl",
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
          tv: "dottv",
          tw: "dottw",
          tz: "dottz",
          ua: "dotua",
          ug: "dotug",
          uk: "dotuk",
          us: "domus",
          uy: "dotuy",
          uz: "dotuz",
          va: "dotva",
          vc: "dotvc",
          ve: "dotve",
          vg: "dotvg",
          vi: "dotvi",
          vn: "dotvn",
          vu: "dotvu",
          wf: "dotwf",
          ws: "dotws",
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
          // Special handling for multi-level TLDs
          cleanTld === "co.in" ? "thirdleveldotin" : null,
          cleanTld === "co.uk" ? "thirdleveldotuk" : null,
          cleanTld === "co.ca" ? "thirdleveldotca" : null,
          cleanTld === "co.au" ? "thirdleveldotau" : null,
          cleanTld === "co.za" ? "thirdleveldotza" : null,
          cleanTld === "co.nz" ? "thirdleveldotnz" : null,
          // Handle other common multi-level TLDs
          cleanTld.includes(".")
            ? `thirdleveldot${cleanTld.split(".").pop()}`
            : null,
          // CentralNic formats (lower priority)
          `centralnicza${cleanTld}`,
          `centralnicus${cleanTld}`,
        ].filter(Boolean); // Remove null values
        let foundTld = null;

        for (const variation of tldVariations) {
          if (
            pricingData.customerPricing &&
            pricingData.customerPricing[variation]
          ) {
            foundTld = variation;
            break;
          }
        }

        if (foundTld) {
          const customerPricing = pricingData.customerPricing?.[foundTld];
          const resellerPricing =
            pricingData.resellerPricing?.[foundTld] || null;

          // Extract customer registration price (try 1 year first, then 2 years)
          let customerPrice = 0;
          let currency = "INR";
          let registrationPeriod = 1;

          if (
            customerPricing.addnewdomain &&
            customerPricing.addnewdomain["1"]
          ) {
            customerPrice = parseFloat(customerPricing.addnewdomain["1"]);
            registrationPeriod = 1;
          } else if (
            customerPricing.addnewdomain &&
            customerPricing.addnewdomain["2"]
          ) {
            customerPrice = parseFloat(customerPricing.addnewdomain["2"]);
            registrationPeriod = 2;
          }

          // Extract reseller registration price (try 1 year first, then 2 years)
          let resellerPrice = 0;
          if (
            resellerPricing &&
            resellerPricing.addnewdomain &&
            resellerPricing.addnewdomain["1"]
          ) {
            resellerPrice = parseFloat(resellerPricing.addnewdomain["1"]);
          } else if (
            resellerPricing &&
            resellerPricing.addnewdomain &&
            resellerPricing.addnewdomain["2"]
          ) {
            resellerPrice = parseFloat(resellerPricing.addnewdomain["2"]);
          }

          tldPricing[cleanTld] = {
            price: customerPrice,
            resellerPrice: resellerPrice,
            currency: currency,
            registrationPeriod: registrationPeriod,
            customer: customerPricing,
            reseller: resellerPricing,
            tld: cleanTld,
          };

          const margin =
            customerPrice > 0 && resellerPrice > 0
              ? ((customerPrice - resellerPrice) / customerPrice) * 100
              : 0;

          // Individual TLD logging removed for cleaner output
        }
      }

      // Summary logging
      const totalTlds = Object.keys(tldPricing).length;
      const totalCustomerPrice = Object.values(tldPricing).reduce(
        (sum, tld) => sum + (tld.price || 0),
        0
      );

      console.log(
        `✅ [PRICING] Processed ${totalTlds} TLDs in ${
          Date.now() - startTime
        }ms - Total: ₹${totalCustomerPrice.toFixed(2)}`
      );

      return tldPricing;
    } catch (error) {
      console.error(`❌ [PRICING] Failed to fetch TLD pricing:`, error);
      throw error;
    }
  }

  /**
   * Get registration price for a specific TLD
   */
  static async getRegistrationPrice(
    tld: string,
    years: number = 1
  ): Promise<{ price: number; currency: string } | null> {
    try {
      const cleanTld = tld.startsWith(".") ? tld.substring(1) : tld;
      const tldPricing = await this.getTLDPricing([cleanTld]);

      if (tldPricing[cleanTld] && tldPricing[cleanTld].customer) {
        const customerPricing = tldPricing[cleanTld].customer;

        // Get registration price (addnewdomain) for specified years
        if (
          customerPricing.addnewdomain &&
          customerPricing.addnewdomain[years.toString()]
        ) {
          const price = parseFloat(
            customerPricing.addnewdomain[years.toString()]
          );
          return {
            price: price,
            currency: "INR", // ResellerClub typically returns prices in INR
          };
        }
      }

      return null;
    } catch (error) {
      console.error(
        `❌ [PRICING] Failed to get registration price for ${tld}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get renewal price for a specific TLD
   */
  static async getRenewalPrice(
    tld: string,
    years: number = 1
  ): Promise<{ price: number; currency: string } | null> {
    try {
      const cleanTld = tld.startsWith(".") ? tld.substring(1) : tld;
      const tldPricing = await this.getTLDPricing([cleanTld]);

      if (tldPricing[cleanTld] && tldPricing[cleanTld].customer) {
        const customerPricing = tldPricing[cleanTld].customer;

        // Get renewal price (renewdomain) for specified years
        if (
          customerPricing.renewdomain &&
          customerPricing.renewdomain[years.toString()]
        ) {
          const price = parseFloat(
            customerPricing.renewdomain[years.toString()]
          );
          return {
            price: price,
            currency: "INR",
          };
        }
      }

      return null;
    } catch (error) {
      console.error(
        `❌ [PRICING] Failed to get renewal price for ${tld}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get transfer price for a specific TLD
   */
  static async getTransferPrice(
    tld: string,
    years: number = 1
  ): Promise<{ price: number; currency: string } | null> {
    try {
      const cleanTld = tld.startsWith(".") ? tld.substring(1) : tld;
      const tldPricing = await this.getTLDPricing([cleanTld]);

      if (tldPricing[cleanTld] && tldPricing[cleanTld].customer) {
        const customerPricing = tldPricing[cleanTld].customer;

        // Get transfer price (addtransferdomain) for specified years
        if (
          customerPricing.addtransferdomain &&
          customerPricing.addtransferdomain[years.toString()]
        ) {
          const price = parseFloat(
            customerPricing.addtransferdomain[years.toString()]
          );
          return {
            price: price,
            currency: "INR",
          };
        }
      }

      return null;
    } catch (error) {
      console.error(
        `❌ [PRICING] Failed to get transfer price for ${tld}:`,
        error
      );
      return null;
    }
  }

  /**
   * Clear pricing cache (no-op since caching is disabled)
   */
  static clearCache(): void {
    // No caching - nothing to clear
    console.log(`💰 [PRICING] Cache clear requested (no caching enabled)`);
  }
}
