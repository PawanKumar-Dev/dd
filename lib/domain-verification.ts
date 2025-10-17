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
      // Parse domain name to get base domain and TLD
      const domainParts = domainName.split(".");
      const baseDomain = domainParts[0];
      const tld = domainParts.slice(1).join(".");

      console.log(
        `🔍 [DOMAIN-VERIFICATION] Parsed domain: base="${baseDomain}", tld="${tld}"`
      );

      // Search for the domain using the base domain and TLD
      const searchResults = await ResellerClubWrapper.searchDomainWithTlds(
        baseDomain,
        [tld]
      );

      console.log(
        `🔍 [DOMAIN-VERIFICATION] Search results for ${domainName}:`,
        searchResults
      );

      // Find the exact domain in search results
      const domainResult = searchResults.find(
        (result) => result.domainName.toLowerCase() === domainName.toLowerCase()
      );

      if (!domainResult) {
        console.log(
          `❌ [DOMAIN-VERIFICATION] Domain not found in search results: ${domainName}`
        );
        console.log(
          `🔍 [DOMAIN-VERIFICATION] Available search results:`,
          searchResults.map((r) => `${r.domainName} (${r.available ? 'available' : 'taken'})`)
        );

        // If domain is not found in search results, it could mean:
        // 1. Domain is registered (not available for search)
        // 2. Domain search failed or returned unexpected results
        // 3. Domain search API returned different format

        // Check if any search results contain our domain name (partial match)
        const partialMatch = searchResults.find(
          (result) =>
            result.domainName
              .toLowerCase()
              .includes(domainName.toLowerCase()) ||
            domainName.toLowerCase().includes(result.domainName.toLowerCase())
        );

        if (partialMatch) {
          console.log(
            `🔍 [DOMAIN-VERIFICATION] Found partial match: ${partialMatch.domainName} (${partialMatch.available ? 'available' : 'taken'})`
          );
          // Use the partial match result
          const isAvailable = partialMatch.available;
          return {
            domainName,
            isAvailable,
            registrationStatus: isAvailable ? "pending" : "success",
            reason: isAvailable
              ? "Domain still available - registration likely failed due to insufficient funds"
              : "Domain no longer available - registration successful",
            checkedAt: new Date(),
          };
        }

        // No match found - be conservative and mark as pending for manual verification
        return {
          domainName,
          isAvailable: false,
          registrationStatus: "pending",
          reason:
            "Domain not found in availability search - needs manual verification",
          checkedAt: new Date(),
        };
      }

      const isAvailable = domainResult.available;

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
