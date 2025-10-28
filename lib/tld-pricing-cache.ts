/**
 * TLD Pricing Cache Service
 *
 * Provides MongoDB-persisted caching for TLD pricing data to reduce API calls
 * and improve performance. Cache survives server restarts and includes configurable TTL.
 */

import TLDPricingCache from "@/models/TLDPricingCache";
import { connectToDatabase } from "@/lib/mongoose";

interface CachedPricingData {
  tldPricing: Array<{
    tld: string;
    customerPrice: number;
    resellerPrice: number;
    currency: string;
    category: string;
    description?: string;
    margin?: number;
  }>;
  totalCount: number;
  lastUpdated: string;
  pricingSource: string;
  cachedAt: number;
}

class TLDPricingCacheService {
  private defaultTTL: number = 60; // 60 minutes default

  /**
   * Get cached pricing data if available and not expired
   */
  async get(): Promise<CachedPricingData | null> {
    try {
      await connectToDatabase();

      const cache = await TLDPricingCache.findOne({ key: "tld_pricing_cache" });

      if (!cache) {
        console.log("ℹ️ [CACHE] No cache found in MongoDB");
        return null;
      }

      const now = new Date();

      // Check if cache has expired
      if (now > cache.expiresAt) {
        console.log("🗑️ [CACHE] TLD pricing cache expired, clearing...");
        await TLDPricingCache.deleteOne({ key: "tld_pricing_cache" });
        return null;
      }

      const remainingTime = Math.floor(
        (cache.expiresAt.getTime() - now.getTime()) / 1000 / 60
      );
      console.log(
        `✅ [CACHE] Returning cached TLD pricing data from MongoDB (${remainingTime} minutes remaining)`
      );

      return {
        tldPricing: cache.tldPricing,
        totalCount: cache.totalCount,
        lastUpdated: cache.lastUpdated,
        pricingSource: cache.pricingSource,
        cachedAt: cache.cachedAt.getTime(),
      };
    } catch (error) {
      console.error("[CACHE] Error reading from MongoDB:", error);
      return null;
    }
  }

  /**
   * Set pricing data in cache
   */
  async set(data: Omit<CachedPricingData, "cachedAt">): Promise<void> {
    try {
      await connectToDatabase();

      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.defaultTTL * 60 * 1000);

      await TLDPricingCache.findOneAndUpdate(
        { key: "tld_pricing_cache" },
        {
          key: "tld_pricing_cache",
          tldPricing: data.tldPricing,
          totalCount: data.totalCount,
          lastUpdated: data.lastUpdated,
          pricingSource: data.pricingSource,
          cachedAt: now,
          expiresAt: expiresAt,
          ttlMinutes: this.defaultTTL,
        },
        { upsert: true, new: true }
      );

      console.log(
        `💾 [CACHE] Cached TLD pricing data to MongoDB (${data.totalCount} TLDs, expires in ${this.defaultTTL} minutes)`
      );
    } catch (error) {
      console.error("[CACHE] Error saving to MongoDB:", error);
    }
  }

  /**
   * Manually purge the cache
   */
  async purge(): Promise<void> {
    try {
      await connectToDatabase();

      const result = await TLDPricingCache.deleteOne({
        key: "tld_pricing_cache",
      });

      if (result.deletedCount > 0) {
        console.log(
          "🗑️ [CACHE] Manually purged TLD pricing cache from MongoDB"
        );
      } else {
        console.log("ℹ️ [CACHE] Cache already empty, nothing to purge");
      }
    } catch (error) {
      console.error("[CACHE] Error purging cache:", error);
    }
  }

  /**
   * Check if cache exists and is valid
   */
  async isValid(): Promise<boolean> {
    try {
      await connectToDatabase();

      const cache = await TLDPricingCache.findOne({ key: "tld_pricing_cache" });

      if (!cache) {
        return false;
      }

      const now = new Date();
      return now <= cache.expiresAt;
    } catch (error) {
      console.error("[CACHE] Error checking cache validity:", error);
      return false;
    }
  }

  /**
   * Get cache status information
   */
  async getStatus(): Promise<{
    isCached: boolean;
    cachedAt: string | null;
    expiresAt: string | null;
    remainingTime: number | null;
    itemCount: number | null;
  }> {
    try {
      await connectToDatabase();

      const cache = await TLDPricingCache.findOne({ key: "tld_pricing_cache" });

      if (!cache) {
        return {
          isCached: false,
          cachedAt: null,
          expiresAt: null,
          remainingTime: null,
          itemCount: null,
        };
      }

      const now = new Date();
      const remainingTime = Math.max(
        0,
        cache.expiresAt.getTime() - now.getTime()
      );

      return {
        isCached: true,
        cachedAt: cache.cachedAt.toISOString(),
        expiresAt: cache.expiresAt.toISOString(),
        remainingTime: Math.floor(remainingTime / 1000), // in seconds
        itemCount: cache.totalCount,
      };
    } catch (error) {
      console.error("[CACHE] Error getting cache status:", error);
      return {
        isCached: false,
        cachedAt: null,
        expiresAt: null,
        remainingTime: null,
        itemCount: null,
      };
    }
  }

  /**
   * Update cache TTL
   */
  setTTL(ttlInMinutes: number): void {
    this.defaultTTL = ttlInMinutes;
    console.log(`⏱️ [CACHE] Updated cache TTL to ${ttlInMinutes} minutes`);
  }

  /**
   * Get current TTL in minutes
   */
  getTTL(): number {
    return this.defaultTTL;
  }
}

// Export singleton instance
export const tldPricingCache = new TLDPricingCacheService();
