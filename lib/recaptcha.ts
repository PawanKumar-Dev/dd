/**
 * Google reCAPTCHA v3 utilities for client and server
 */

// Client-side: Load reCAPTCHA script and get token
export class RecaptchaClient {
  private static siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
  private static scriptLoaded = false;

  /**
   * Load reCAPTCHA script
   */
  static loadScript(): Promise<void> {
    if (this.scriptLoaded) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("reCAPTCHA can only be loaded in browser"));
        return;
      }

      // Check if script already exists
      if (document.querySelector('script[src*="recaptcha"]')) {
        this.scriptLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${this.siteKey}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error("Failed to load reCAPTCHA script"));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Execute reCAPTCHA and get token
   */
  static async getToken(action: string): Promise<string> {
    if (typeof window === "undefined") {
      throw new Error("reCAPTCHA can only be executed in browser");
    }

    if (!this.siteKey) {
      console.warn("reCAPTCHA site key not configured");
      return "";
    }

    await this.loadScript();

    return new Promise((resolve, reject) => {
      if (!(window as any).grecaptcha) {
        reject(new Error("reCAPTCHA not loaded"));
        return;
      }

      (window as any).grecaptcha.ready(() => {
        (window as any).grecaptcha
          .execute(this.siteKey, { action })
          .then((token: string) => resolve(token))
          .catch((error: Error) => reject(error));
      });
    });
  }
}

// Server-side: Verify reCAPTCHA token
export class RecaptchaServer {
  private static secretKey = process.env.RECAPTCHA_SECRET_KEY || "";
  private static verifyUrl = "https://www.google.com/recaptcha/api/siteverify";

  /**
   * Verify reCAPTCHA token
   */
  static async verifyToken(
    token: string,
    expectedAction?: string,
    minScore: number = 0.5
  ): Promise<{
    success: boolean;
    score?: number;
    action?: string;
    error?: string;
  }> {
    if (!this.secretKey) {
      console.warn(
        "reCAPTCHA secret key not configured - skipping verification"
      );
      return { success: true }; // Allow in development if not configured
    }

    if (!token) {
      return {
        success: false,
        error: "reCAPTCHA token is required",
      };
    }

    try {
      const response = await fetch(this.verifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: this.secretKey,
          response: token,
        }).toString(),
      });

      const data = await response.json();

      if (!data.success) {
        return {
          success: false,
          error: "reCAPTCHA verification failed",
        };
      }

      // Check score (v3 returns a score from 0.0 to 1.0)
      if (data.score !== undefined && data.score < minScore) {
        return {
          success: false,
          score: data.score,
          error: `reCAPTCHA score too low: ${data.score}`,
        };
      }

      // Check action if provided
      if (expectedAction && data.action !== expectedAction) {
        return {
          success: false,
          action: data.action,
          error: `Unexpected action: ${data.action}`,
        };
      }

      return {
        success: true,
        score: data.score,
        action: data.action,
      };
    } catch (error) {
      console.error("reCAPTCHA verification error:", error);
      return {
        success: false,
        error: "Failed to verify reCAPTCHA",
      };
    }
  }
}
