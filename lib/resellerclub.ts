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
const RESELLERCLUB_API_ID = process.env.RESELLERCLUB_API_ID;
const RESELLERCLUB_API_KEY = process.env.RESELLERCLUB_API_KEY;

// Validate required environment variables
if (!RESELLERCLUB_API_URL || !RESELLERCLUB_API_ID || !RESELLERCLUB_API_KEY) {
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
      "auth-userid": RESELLERCLUB_API_ID,
      "api-key": RESELLERCLUB_API_KEY,
      "reseller-id": RESELLERCLUB_API_ID, // Use same ID for Indian pricing
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
      // Fetch customer pricing
      const customerPricingResponse = await api.get(
        "/api/products/customer-price.json"
      );
      console.log(
        `✅ [PRODUCTION] Customer pricing fetched in ${
          Date.now() - startTime
        }ms`
      );

      // Fetch reseller pricing
      const resellerPricingResponse = await api.get(
        "/api/products/reseller-price.json"
      );
      console.log(
        `✅ [PRODUCTION] Reseller pricing fetched in ${
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
   * Fetch promotional pricing details from ResellerClub API
   *
   * Retrieves current promotional pricing information including active promotions,
   * their validity periods, and promotional prices for both reseller and customer tiers.
   *
   * @returns {Promise<any>} Object containing promotional pricing data
   * @throws {Error} If API request fails or credentials are invalid
   *
   * @example
   * const promoPricing = await ResellerClubAPI.getPromotionalPricing();
   * console.log(promoPricing); // Promotional pricing data
   */
  static async getPromotionalPricing(): Promise<any> {
    const startTime = Date.now();
    console.log(
      `🎯 [PRODUCTION] Fetching promotional pricing from ResellerClub API`
    );

    try {
      const response = await api.get("/api/resellers/promo-details.json");
      console.log(
        `✅ [PRODUCTION] Promotional pricing fetched in ${
          Date.now() - startTime
        }ms`
      );

      return {
        promotionalPricing: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(
        `❌ [PRODUCTION] Failed to fetch promotional pricing:`,
        error
      );
      throw new Error(
        "Failed to fetch promotional pricing from ResellerClub API"
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

        if (pricingData.customerPricing[cleanTld]) {
          tldPricing[cleanTld] = {
            customer: pricingData.customerPricing[cleanTld],
            reseller: pricingData.resellerPricing[cleanTld] || null,
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
    console.log(`🔍 [PRODUCTION] Starting domain search for: "${domainName}"`);

    // Check if domain already has a TLD
    const hasTLD = domainName.includes(".");
    const searchParams: any = {
      "domain-name": domainName,
    };

    if (!hasTLD) {
      // For domains without TLD, search with multiple TLDs
      searchParams.tlds = "com,net,org,info,biz,co,in,co.in";
      console.log(
        `🔍 [PRODUCTION] Domain without TLD detected, will search with multiple TLDs`
      );
    } else {
      // For domains with TLD, extract the TLD and use it in the tlds parameter
      const tld = domainName.split(".").pop();
      searchParams.tlds = tld;
      console.log(
        `🔍 [PRODUCTION] Domain with TLD detected, searching with TLD: "${tld}"`
      );
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
            let isAvailable = domainData.status === "available";

            // Try to get live pricing first
            let price = 0;
            let currency = "INR";
            let pricingSource: "live" | "fallback" | "unavailable" =
              "unavailable";

            if (isAvailable) {
              try {
                const tld = domain.split(".").pop()?.toLowerCase();
                if (tld) {
                  console.log(
                    `💰 [PRODUCTION] Fetching live customer pricing for ${domain} (TLD: ${tld})`
                  );
                  const livePricing = await PricingService.getTLDPricing([tld]);

                  if (livePricing && livePricing[tld]) {
                    const customerPrice =
                      parseFloat(livePricing[tld].price) || 0;
                    const resellerPrice =
                      parseFloat(livePricing[tld].resellerPrice) || 0;
                    const margin =
                      customerPrice > 0 && resellerPrice > 0
                        ? ((customerPrice - resellerPrice) / customerPrice) *
                          100
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
                }
              } catch (error) {
                console.warn(
                  `⚠️ [PRODUCTION] Failed to fetch live customer pricing for ${domain}:`,
                  error
                );
              }

              // If no live pricing available, mark as unavailable
              if (price === 0) {
                pricingSource = "unavailable";
                isAvailable = false; // Mark domain as unavailable if no live pricing
                console.log(
                  `⚠️ [PRODUCTION] No customer pricing available for ${domain} - marking as unavailable`
                );
              }
            }

            console.log(`🏷️ [PRODUCTION] Processing domain: ${domain}`, {
              status: domainData.status,
              available: isAvailable,
              price: price,
              currency: currency,
              rawData: domainData,
            });

            results.push({
              domainName: domain,
              available: isAvailable,
              price: price,
              currency: currency,
              registrationPeriod: 1, // Default to 1 year
              pricingSource: pricingSource, // Add pricing source info
              originalPrice: undefined,
              isPromotional: false,
              promotionalDetails: undefined,
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

      console.log(`✅ [PRODUCTION] Domain search completed successfully:`, {
        domain: domainName,
        hasTLD: hasTLD,
        searchType: hasTLD ? "exact-domain" : "multiple-tlds",
        resultsCount: results.length,
        availableCount: availableCount,
        livePricingCount: livePricingCount,
        totalCustomerPrice: `₹${totalCustomerPrice.toLocaleString()}`,
        totalTime: responseTime + "ms",
        results: results.map((r) => ({
          domain: r.domainName,
          available: r.available,
          price: r.price,
          pricingSource: r.pricingSource,
        })),
      });

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
    console.log(
      `🔍 [PRODUCTION] Starting domain search for: "${domainName}" with TLDs: ${tlds.join(
        ", "
      )}`
    );

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
            domainParts.length === 2 &&
            !domain.includes(",") &&
            !domain.includes("..") &&
            domainParts[0].length > 0 &&
            domainParts[1].length > 0;

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
            domain.split(".").length !== 2
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
            let isAvailable = domainData.status === "available";
            // Try to get live pricing first
            let price = 0;
            let currency = "INR";
            let pricingSource: "live" | "fallback" | "unavailable" =
              "unavailable";

            // Get TLD and live pricing for all domains
            const tld = domain.split(".").pop()?.toLowerCase();
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

              // If no live pricing available, mark as unavailable
              if (price === 0) {
                pricingSource = "unavailable";
                isAvailable = false; // Mark domain as unavailable if no live pricing
                console.log(
                  `⚠️ [PRODUCTION] No customer pricing available for ${domain} - marking as unavailable`
                );
              }
            }

            console.log(`🏷️ [PRODUCTION] Processing domain: ${domain}`, {
              status: domainData.status,
              available: isAvailable,
              price: price,
              currency: currency,
              rawData: domainData,
            });

            results.push({
              domainName: domain,
              available: isAvailable,
              price: price,
              currency: currency,
              registrationPeriod: 1, // Default to 1 year
              pricingSource: pricingSource, // Add pricing source info
              originalPrice: undefined,
              isPromotional: false,
              promotionalDetails: undefined,
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

      console.log(`✅ [PRODUCTION] Domain search completed successfully:`, {
        domain: domainName,
        tlds: tlds,
        searchType: "multiple-tlds",
        resultsCount: results.length,
        availableCount: availableCount,
        livePricingCount: livePricingCount,
        totalCustomerPrice: `₹${totalCustomerPrice.toLocaleString()}`,
        totalTime: responseTime + "ms",
        results: results.map((r) => ({
          domain: r.domainName,
          available: r.available,
          price: r.price,
          pricingSource: r.pricingSource,
        })),
      });

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
    const startTime = Date.now();
    console.log(`💰 [PRODUCTION] Fetching reseller pricing for TLD: ${tld}`);

    try {
      // Fetch reseller pricing
      const response = await api.get("/api/products/reseller-price.json");

      if (response.data && response.data[tld]) {
        const tldPricing = response.data[tld];

        // Get registration price (addnewdomain) for 1 year
        if (tldPricing.addnewdomain && tldPricing.addnewdomain["1"]) {
          const price = parseFloat(tldPricing.addnewdomain["1"]);
          const currency = "INR"; // ResellerClub typically returns prices in INR

          console.log(
            `✅ [PRODUCTION] Live reseller pricing for ${tld}: ₹${price} ${currency} (${
              Date.now() - startTime
            }ms)`
          );

          return { price, currency };
        }
      }

      console.log(`⚠️ [PRODUCTION] No reseller pricing found for TLD: ${tld}`);
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
   * Register a domain
   */
  static async registerDomain(domainData: {
    domainName: string;
    years: number;
    customerId: string;
    nameServers?: string[];
    adminContactId?: string;
    techContactId?: string;
    billingContactId?: string;
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
      const response = await api.post("/api/domains/register.json", null, {
        params: {
          "domain-name": domainData.domainName,
          years: domainData.years,
          "customer-id": domainData.customerId,
          ns: domainData.nameServers || [],
          "admin-contact-id": domainData.adminContactId,
          "tech-contact-id": domainData.techContactId,
          "billing-contact-id": domainData.billingContactId,
        },
      });

      const responseTime = Date.now() - startTime;
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
   * Get DNS records for a domain
   */
  static async getDNSRecords(
    domainName: string
  ): Promise<ResellerClubResponse> {
    try {
      const response = await api.get("/api/domains/dns/get-records.json", {
        params: {
          "domain-name": domainName,
        },
      });

      return {
        status: "success",
        data: response.data,
      };
    } catch (error) {
      console.error("ResellerClub DNS records error:", error);
      return {
        status: "error",
        message: "Failed to get DNS records",
      };
    }
  }

  /**
   * Add DNS record
   */
  static async addDNSRecord(
    domainName: string,
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
        "/api/domains/dns/add-record.json",
        null,
        {
          params: {
            "domain-name": domainName,
            type: recordData.type,
            name: recordData.name,
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
      console.error("ResellerClub add DNS record error:", error);
      return {
        status: "error",
        message: "Failed to add DNS record",
      };
    }
  }

  /**
   * Delete DNS record
   */
  static async deleteDNSRecord(
    domainName: string,
    recordId: string
  ): Promise<ResellerClubResponse> {
    try {
      const response = await api.post(
        "/api/domains/dns/delete-record.json",
        null,
        {
          params: {
            "domain-name": domainName,
            "record-id": recordId,
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
        "/api/domains/dns/modify-record.json",
        null,
        {
          params: {
            "domain-name": domainName,
            "record-id": recordId,
            type: recordData.type,
            name: recordData.name,
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
