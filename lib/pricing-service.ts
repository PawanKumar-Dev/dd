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
 * Includes intelligent caching to improve performance and reduce API calls.
 */
export class PricingService {
  // Cache configuration for pricing data
  private static pricingCache: {
    data: any;
    timestamp: number;
    ttl: number;
  } | null = null;

  /**
   * Get domain pricing data with intelligent caching
   *
   * Fetches live pricing data from ResellerClub API with a 5-minute cache TTL.
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

    // Check cache first (5 minute TTL)
    if (
      this.pricingCache &&
      Date.now() - this.pricingCache.timestamp < this.pricingCache.ttl
    ) {
      console.log(`💰 [PRICING] Using cached pricing data`);
      return this.pricingCache.data;
    }

    try {
      // Fetch customer pricing
      const customerPricingResponse = await api.get(
        "/api/products/customer-price.json"
      );
      const customerTldCount = Object.keys(
        customerPricingResponse.data || {}
      ).length;
      console.log(
        `✅ [PRICING] Customer pricing fetched in ${
          Date.now() - startTime
        }ms - ${customerTldCount} TLDs available`
      );

      // Fetch reseller pricing
      const resellerPricingResponse = await api.get(
        "/api/products/reseller-price.json"
      );
      const resellerTldCount = Object.keys(
        resellerPricingResponse.data || {}
      ).length;
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

      // Cache the data
      this.pricingCache = {
        data: pricingData,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000, // 5 minutes
      };

      return pricingData;
    } catch (error) {
      console.error(`❌ [PRICING] Failed to fetch domain pricing:`, error);
      throw new Error(
        "Failed to fetch live domain pricing from ResellerClub API"
      );
    }
  }

  /**
   * Get promotional pricing data from ResellerClub API
   *
   * Fetches current promotional pricing information without caching.
   * This method retrieves active promotions and their pricing details.
   *
   * @returns {Promise<any>} Object containing promotional pricing data
   * @throws {Error} If API request fails or data is invalid
   *
   * @example
   * const promoPricing = await PricingService.getPromotionalPricing();
   * console.log(promoPricing); // Promotional pricing data
   */
  static async getPromotionalPricing(): Promise<any> {
    const startTime = Date.now();
    console.log(
      `🎯 [PRICING] Fetching promotional pricing from ResellerClub API`
    );

    try {
      const response = await api.get("/api/resellers/promo-details.json");
      console.log(
        `✅ [PRICING] Promotional pricing fetched in ${
          Date.now() - startTime
        }ms`
      );

      return response.data;
    } catch (error) {
      console.error(`❌ [PRICING] Failed to fetch promotional pricing:`, error);
      throw new Error(
        "Failed to fetch promotional pricing from ResellerClub API"
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

      // Get promotional pricing data
      let promotionalData: any = null;
      try {
        promotionalData = await this.getPromotionalPricing();
      } catch (error) {
        console.warn(
          `⚠️ [PRICING] Could not fetch promotional pricing:`,
          error
        );
      }

      // Extract pricing for requested TLDs
      tlds.forEach((tld) => {
        const cleanTld = tld.startsWith(".") ? tld.substring(1) : tld;

        // Try different variations of the TLD name
        const tldVariations = [
          cleanTld,
          `.${cleanTld}`,
          cleanTld.toUpperCase(),
          cleanTld.toLowerCase(),
          `dot${cleanTld}`, // ResellerClub format: dotcom, dotnet, etc.
          `centralnicza${cleanTld}`, // ResellerClub format for some TLDs
        ];
        let foundTld = null;

        for (const variation of tldVariations) {
          if (pricingData.customerPricing[variation]) {
            foundTld = variation;
            break;
          }
        }

        if (foundTld) {
          const customerPricing = pricingData.customerPricing[foundTld];
          const resellerPricing = pricingData.resellerPricing[foundTld] || null;

          // Extract customer registration price (1 year)
          let customerPrice = 0;
          let currency = "INR";

          if (
            customerPricing.addnewdomain &&
            customerPricing.addnewdomain["1"]
          ) {
            customerPrice = parseFloat(customerPricing.addnewdomain["1"]);
          }

          // Extract reseller registration price (1 year)
          let resellerPrice = 0;
          if (
            resellerPricing &&
            resellerPricing.addnewdomain &&
            resellerPricing.addnewdomain["1"]
          ) {
            resellerPrice = parseFloat(resellerPricing.addnewdomain["1"]);
          }

          // Check for promotional pricing
          let finalCustomerPrice = customerPrice;
          let finalResellerPrice = resellerPrice;
          let isPromotional = false;
          let promotionalDetails = null;

          if (promotionalData) {
            // Look for active promotions for this TLD
            const activePromotions = Object.values(promotionalData).filter(
              (promo: any) =>
                promo.isactive === "true" &&
                promo.productkey &&
                promo.productkey.toLowerCase().includes(cleanTld.toLowerCase())
            );

            if (activePromotions.length > 0) {
              const promotion = activePromotions[0] as any;
              const now = new Date();
              const startTime = new Date(promotion.starttime);
              const endTime = new Date(promotion.endtime);

              // Check if promotion is currently active
              if (now >= startTime && now <= endTime) {
                finalCustomerPrice =
                  parseFloat(promotion.customerprice) || customerPrice;
                finalResellerPrice =
                  parseFloat(promotion.resellerprice) || resellerPrice;
                isPromotional = true;
                promotionalDetails = {
                  startTime: promotion.starttime,
                  endTime: promotion.endtime,
                  period: promotion.period,
                  originalCustomerPrice: customerPrice,
                  originalResellerPrice: resellerPrice,
                };

                console.log(
                  `🎯 [PRICING] Applied promotional pricing for ${cleanTld}: ₹${customerPrice} → ₹${finalCustomerPrice} (Valid: ${promotion.starttime} to ${promotion.endtime})`
                );
              }
            }
          }

          tldPricing[cleanTld] = {
            price: finalCustomerPrice, // Use promotional price if available
            resellerPrice: finalResellerPrice,
            currency: currency,
            customer: customerPricing,
            reseller: resellerPricing,
            tld: cleanTld,
            isPromotional: isPromotional,
            promotionalDetails: promotionalDetails,
            originalPrice: customerPrice, // Keep original price for reference
          };

          const margin =
            finalCustomerPrice > 0 && finalResellerPrice > 0
              ? ((finalCustomerPrice - finalResellerPrice) /
                  finalCustomerPrice) *
                100
              : 0;

          console.log(
            `✅ [PRICING] Found ${cleanTld}: Customer ₹${finalCustomerPrice}${
              isPromotional ? " (PROMO)" : ""
            }, Reseller ₹${finalResellerPrice} (Margin: ${
              margin > 0 ? "+" : ""
            }${margin.toFixed(1)}%)`
          );
        }
      });

      console.log(
        `✅ [PRICING] TLD pricing extracted in ${Date.now() - startTime}ms`
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
   * Clear pricing cache
   */
  static clearCache(): void {
    this.pricingCache = null;
    console.log(`💰 [PRICING] Cache cleared`);
  }
}
