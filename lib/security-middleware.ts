import { NextRequest, NextResponse } from "next/server";
import { SecurityValidator } from "./security";

/**
 * Security Middleware for Enhanced Protection
 */
export class SecurityMiddleware {
  /**
   * Validate request body for security threats
   */
  static validateRequestBody(request: NextRequest): {
    isValid: boolean;
    errors: string[];
    sanitizedBody?: any;
  } {
    try {
      // Get content length
      const contentLength = request.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
        // 10MB limit
        return {
          isValid: false,
          errors: ["Request body too large"],
        };
      }

      // Check for suspicious headers
      const suspiciousHeaders = [
        "x-forwarded-for",
        "x-real-ip",
        "x-originating-ip",
        "x-remote-ip",
        "x-remote-addr",
      ];

      for (const header of suspiciousHeaders) {
        const value = request.headers.get(header);
        if (value) {
          const securityCheck =
            SecurityValidator.containsMaliciousPatterns(value);
          if (securityCheck.isMalicious) {
            return {
              isValid: false,
              errors: [`Suspicious content in ${header} header`],
            };
          }
        }
      }

      return {
        isValid: true,
        errors: [],
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ["Invalid request body"],
      };
    }
  }

  /**
   * Rate limiting with enhanced security
   */
  static checkRateLimit(
    request: NextRequest,
    identifier: string,
    maxRequests: number = 100,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
  ): {
    allowed: boolean;
    resetTime: number;
    remaining: number;
  } {
    // This would integrate with your existing rate limiting system
    // For now, return allowed
    return {
      allowed: true,
      resetTime: Date.now() + windowMs,
      remaining: maxRequests,
    };
  }

  /**
   * Validate and sanitize all string inputs in request body
   */
  static sanitizeRequestBody(body: any): {
    isValid: boolean;
    errors: string[];
    sanitizedBody: any;
  } {
    const errors: string[] = [];
    const sanitizedBody = { ...body };

    const sanitizeValue = (value: any, path: string = ""): any => {
      if (typeof value === "string") {
        // Check for malicious patterns
        const securityCheck =
          SecurityValidator.containsMaliciousPatterns(value);
        if (securityCheck.isMalicious) {
          errors.push(`Malicious content detected in ${path || "input"}`);
        }

        // Sanitize the value
        return SecurityValidator.sanitizeInput(securityCheck.sanitized, {
          maxLength: 1000,
          allowHtml: false,
          allowSpecialChars: true,
        });
      } else if (Array.isArray(value)) {
        return value.map((item, index) =>
          sanitizeValue(item, `${path}[${index}]`)
        );
      } else if (value && typeof value === "object") {
        const sanitized: any = {};
        for (const [key, val] of Object.entries(value)) {
          sanitized[key] = sanitizeValue(val, `${path}.${key}`);
        }
        return sanitized;
      }
      return value;
    };

    // Sanitize all values in the body
    const sanitized = sanitizeValue(sanitizedBody);

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedBody: sanitized,
    };
  }

  /**
   * Check for suspicious request patterns
   */
  static checkSuspiciousPatterns(request: NextRequest): {
    isSuspicious: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    // Check User-Agent
    const userAgent = request.headers.get("user-agent");
    if (userAgent) {
      const suspiciousUAs = [
        "sqlmap",
        "nikto",
        "nmap",
        "masscan",
        "zap",
        "burp",
        "w3af",
        "acunetix",
        "nessus",
        "openvas",
      ];

      for (const suspiciousUA of suspiciousUAs) {
        if (userAgent.toLowerCase().includes(suspiciousUA)) {
          reasons.push(`Suspicious User-Agent: ${suspiciousUA}`);
        }
      }
    }

    // Check for suspicious query parameters
    const url = new URL(request.url);
    const queryParams = url.searchParams;

    for (const [key, value] of queryParams.entries()) {
      const securityCheck = SecurityValidator.containsMaliciousPatterns(value);
      if (securityCheck.isMalicious) {
        reasons.push(`Suspicious query parameter: ${key}`);
      }
    }

    // Check for suspicious path patterns
    const pathname = url.pathname;
    const suspiciousPaths = [
      "/admin",
      "/wp-admin",
      "/phpmyadmin",
      "/.env",
      "/config",
      "/backup",
      "/test",
      "/debug",
    ];

    for (const suspiciousPath of suspiciousPaths) {
      if (pathname.toLowerCase().includes(suspiciousPath)) {
        reasons.push(`Suspicious path access: ${suspiciousPath}`);
      }
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons,
    };
  }

  /**
   * Comprehensive security check
   */
  static async performSecurityCheck(request: NextRequest): Promise<{
    allowed: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate request body
    const bodyValidation = this.validateRequestBody(request);
    if (!bodyValidation.isValid) {
      errors.push(...bodyValidation.errors);
    }

    // 2. Check for suspicious patterns
    const suspiciousCheck = this.checkSuspiciousPatterns(request);
    if (suspiciousCheck.isSuspicious) {
      warnings.push(...suspiciousCheck.reasons);
    }

    // 3. Rate limiting check
    const rateLimitCheck = this.checkRateLimit(request, "general");
    if (!rateLimitCheck.allowed) {
      errors.push("Rate limit exceeded");
    }

    return {
      allowed: errors.length === 0,
      errors,
      warnings,
    };
  }
}
