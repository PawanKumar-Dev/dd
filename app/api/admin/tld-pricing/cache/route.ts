import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { tldPricingCache } from "@/lib/tld-pricing-cache";
import Settings from "@/models/Settings";
import { connectToDatabase } from "@/lib/mongoose";

// Force dynamic rendering - required for API routes
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/tld-pricing/cache
 * Get cache status
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cacheStatus = tldPricingCache.getStatus();

    return NextResponse.json({
      success: true,
      cache: cacheStatus,
      ttl: tldPricingCache.getTTL(),
    });
  } catch (error) {
    console.error("[CACHE-API] Error getting cache status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get cache status",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/tld-pricing/cache
 * Purge the cache
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    tldPricingCache.purge();

    console.log(`🗑️ [CACHE-API] Cache purged by admin: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: "Cache purged successfully",
    });
  } catch (error) {
    console.error("[CACHE-API] Error purging cache:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to purge cache",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/tld-pricing/cache
 * Update cache settings (enable/disable, TTL)
 */
export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const user = await AuthService.getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enabled, ttlMinutes } = body;

    await connectToDatabase();

    // Update cache enabled setting
    if (enabled !== undefined) {
      await Settings.findOneAndUpdate(
        { key: "tld_pricing_cache_enabled" },
        {
          key: "tld_pricing_cache_enabled",
          value: enabled,
          description: "Enable/disable TLD pricing cache",
          category: "caching",
          updatedAt: new Date(),
          updatedBy: user.email,
        },
        { upsert: true, new: true }
      );

      console.log(
        `⚙️ [CACHE-API] Cache ${enabled ? "enabled" : "disabled"} by admin: ${
          user.email
        }`
      );

      // If disabling, purge the cache
      if (!enabled) {
        tldPricingCache.purge();
      }
    }

    // Update TTL setting
    if (ttlMinutes !== undefined && ttlMinutes > 0) {
      await Settings.findOneAndUpdate(
        { key: "tld_pricing_cache_ttl" },
        {
          key: "tld_pricing_cache_ttl",
          value: ttlMinutes,
          description: "TLD pricing cache TTL in minutes",
          category: "caching",
          updatedAt: new Date(),
          updatedBy: user.email,
        },
        { upsert: true, new: true }
      );

      tldPricingCache.setTTL(ttlMinutes);
      console.log(
        `⏱️ [CACHE-API] Cache TTL updated to ${ttlMinutes} minutes by admin: ${user.email}`
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cache settings updated successfully",
      settings: {
        enabled,
        ttlMinutes,
      },
    });
  } catch (error) {
    console.error("[CACHE-API] Error updating cache settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update cache settings",
      },
      { status: 500 }
    );
  }
}
