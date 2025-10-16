/**
 * Domain Verification Service
 *
 * This service provides functionality to verify domain registration status
 * by checking domain availability after registration attempts.
 *
 * Since ResellerClub API doesn't provide reliable wallet balance information
 * or proper error responses for insufficient funds, we use this workaround:
 * - After attempting domain registration, check if domain is still available
 * - If domain is still available, it likely means registration failed due to insufficient funds
 * - This allows us to detect pending registrations that need manual intervention
 */

import { ResellerClubWrapper } from "./resellerclub-wrapper";

export interface DomainVerificationResult {
  domainName: string;
  isAvailable: boolean;
  registrationStatus: "success" | "pending" | "failed";
  reason?: string;
  checkedAt: Date;
}

export class DomainVerificationService {
  /**
   * Verify if a domain registration was successful by checking availability
   *
   * @param domainName - The domain name to verify
   * @returns Promise<DomainVerificationResult>
   */
  static async verifyDomainRegistration(
    domainName: string
  ): Promise<DomainVerificationResult> {
    console.log(
      `🔍 [DOMAIN-VERIFICATION] Verifying registration status for: ${domainName}`
    );

    try {
      // Search for the domain to check if it's still available
      const searchResults = await ResellerClubWrapper.searchDomain(domainName);

      // Find the exact domain in search results
      const domainResult = searchResults.find(
        (result) => result.domainName.toLowerCase() === domainName.toLowerCase()
      );

      if (!domainResult) {
        console.log(
          `❌ [DOMAIN-VERIFICATION] Domain not found in search results: ${domainName}`
        );
        return {
          domainName,
          isAvailable: false,
          registrationStatus: "success", // If not found in search, likely registered
          reason: "Domain not found in availability search - likely registered",
          checkedAt: new Date(),
        };
      }

      const isAvailable = domainResult.status === "available";

      if (isAvailable) {
        console.log(
          `⚠️ [DOMAIN-VERIFICATION] Domain still available after registration attempt: ${domainName}`
        );
        return {
          domainName,
          isAvailable: true,
          registrationStatus: "pending",
          reason:
            "Domain still available - registration likely failed due to insufficient funds",
          checkedAt: new Date(),
        };
      } else {
        console.log(
          `✅ [DOMAIN-VERIFICATION] Domain no longer available - registration successful: ${domainName}`
        );
        return {
          domainName,
          isAvailable: false,
          registrationStatus: "success",
          reason: "Domain no longer available - registration successful",
          checkedAt: new Date(),
        };
      }
    } catch (error) {
      console.error(
        `❌ [DOMAIN-VERIFICATION] Error verifying domain ${domainName}:`,
        error
      );
      return {
        domainName,
        isAvailable: false,
        registrationStatus: "failed",
        reason: `Verification failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        checkedAt: new Date(),
      };
    }
  }

  /**
   * Verify multiple domains in batch
   *
   * @param domainNames - Array of domain names to verify
   * @returns Promise<DomainVerificationResult[]>
   */
  static async verifyMultipleDomains(
    domainNames: string[]
  ): Promise<DomainVerificationResult[]> {
    console.log(
      `🔍 [DOMAIN-VERIFICATION] Verifying ${domainNames.length} domains in batch`
    );

    const results: DomainVerificationResult[] = [];

    // Process domains in parallel with a small delay to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < domainNames.length; i += batchSize) {
      const batch = domainNames.slice(i, i + batchSize);

      const batchPromises = batch.map(async (domainName) => {
        // Add small delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
        return this.verifyDomainRegistration(domainName);
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches
      if (i + batchSize < domainNames.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(
      `✅ [DOMAIN-VERIFICATION] Completed verification of ${domainNames.length} domains`
    );
    return results;
  }

  /**
   * Check if a domain verification result indicates a pending registration
   *
   * @param result - Domain verification result
   * @returns boolean
   */
  static isPendingRegistration(result: DomainVerificationResult): boolean {
    return result.registrationStatus === "pending" && result.isAvailable;
  }

  /**
   * Get summary statistics from verification results
   *
   * @param results - Array of verification results
   * @returns Object with summary statistics
   */
  static getVerificationSummary(results: DomainVerificationResult[]) {
    const summary = {
      total: results.length,
      successful: 0,
      pending: 0,
      failed: 0,
      pendingDomains: [] as string[],
    };

    results.forEach((result) => {
      switch (result.registrationStatus) {
        case "success":
          summary.successful++;
          break;
        case "pending":
          summary.pending++;
          summary.pendingDomains.push(result.domainName);
          break;
        case "failed":
          summary.failed++;
          break;
      }
    });

    return summary;
  }
}
