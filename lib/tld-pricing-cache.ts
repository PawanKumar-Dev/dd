/**
 * TLD Pricing Cache Service
 *
 * Provides in-memory caching for TLD pricing data to reduce API calls
 * and improve performance. Includes configurable TTL and manual purge capability.
 */

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

class TLDPricingCache {
  private cache: CachedPricingData | null = null;
  private defaultTTL: number = 3600000; // 1 hour in milliseconds

  /**
   * Get cached pricing data if available and not expired
   */
  get(): CachedPricingData | null {
    if (!this.cache) {
      return null;
    }

    const now = Date.now();
    const age = now - this.cache.cachedAt;

    // Check if cache has expired
    if (age > this.defaultTTL) {
      console.log("🗑️ [CACHE] TLD pricing cache expired, clearing...");
      this.cache = null;
      return null;
    }

    const remainingTime = Math.floor((this.defaultTTL - age) / 1000 / 60);
    console.log(
      `✅ [CACHE] Returning cached TLD pricing data (${remainingTime} minutes remaining)`
    );
    return this.cache;
  }

  /**
   * Set pricing data in cache
   */
  set(data: Omit<CachedPricingData, "cachedAt">): void {
    this.cache = {
      ...data,
      cachedAt: Date.now(),
    };
    console.log(
      `💾 [CACHE] Cached TLD pricing data (${
        data.totalCount
      } TLDs, expires in ${this.defaultTTL / 1000 / 60} minutes)`
    );
  }

  /**
   * Manually purge the cache
   */
  purge(): void {
    if (this.cache) {
      console.log("🗑️ [CACHE] Manually purging TLD pricing cache");
      this.cache = null;
    } else {
      console.log("ℹ️ [CACHE] Cache already empty, nothing to purge");
    }
  }

  /**
   * Check if cache exists and is valid
   */
  isValid(): boolean {
    if (!this.cache) {
      return false;
    }

    const now = Date.now();
    const age = now - this.cache.cachedAt;
    return age <= this.defaultTTL;
  }

  /**
   * Get cache status information
   */
  getStatus(): {
    isCached: boolean;
    cachedAt: string | null;
    expiresAt: string | null;
    remainingTime: number | null;
    itemCount: number | null;
  } {
    if (!this.cache) {
      return {
        isCached: false,
        cachedAt: null,
        expiresAt: null,
        remainingTime: null,
        itemCount: null,
      };
    }

    const now = Date.now();
    const age = now - this.cache.cachedAt;
    const remainingTime = Math.max(0, this.defaultTTL - age);
    const expiresAt = new Date(this.cache.cachedAt + this.defaultTTL);

    return {
      isCached: true,
      cachedAt: new Date(this.cache.cachedAt).toISOString(),
      expiresAt: expiresAt.toISOString(),
      remainingTime: Math.floor(remainingTime / 1000), // in seconds
      itemCount: this.cache.totalCount,
    };
  }

  /**
   * Update cache TTL
   */
  setTTL(ttlInMinutes: number): void {
    this.defaultTTL = ttlInMinutes * 60 * 1000;
    console.log(`⏱️ [CACHE] Updated cache TTL to ${ttlInMinutes} minutes`);
  }

  /**
   * Get current TTL in minutes
   */
  getTTL(): number {
    return this.defaultTTL / 1000 / 60;
  }
}

// Export singleton instance
export const tldPricingCache = new TLDPricingCache();
