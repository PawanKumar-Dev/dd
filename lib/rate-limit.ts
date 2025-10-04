import { NextRequest } from "next/server";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (in production, use Redis or similar)
const store: RateLimitStore = {};

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is within rate limit
   */
  isAllowed(request: NextRequest): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const key = this.config.keyGenerator
      ? this.config.keyGenerator(request)
      : this.getDefaultKey(request);

    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Clean up expired entries
    this.cleanup(windowStart);

    // Get or create entry for this key
    if (!store[key]) {
      store[key] = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
    }

    const entry = store[key];

    // Reset if window has passed
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + this.config.windowMs;
    }

    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment counter
    entry.count++;

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  private getDefaultKey(request: NextRequest): string {
    // Use IP address as default key
    const ip =
      request.ip ||
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    return `rate_limit:${ip}`;
  }

  private cleanup(before: number): void {
    Object.keys(store).forEach((key) => {
      if (store[key].resetTime < before) {
        delete store[key];
      }
    });
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  // General API rate limiting
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  }),

  // Login attempts
  login: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (request) => {
      const ip =
        request.ip ||
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      return `login:${ip}`;
    },
  }),

  // Password reset
  passwordReset: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyGenerator: (request) => {
      const ip =
        request.ip ||
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      return `password_reset:${ip}`;
    },
  }),

  // Admin operations
  admin: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  }),
};
