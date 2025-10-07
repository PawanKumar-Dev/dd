import { ResellerClubAPI } from "./resellerclub";
import { MockResellerClubAPI } from "./mock-resellerclub";
import { PricingService } from "./pricing-service";
import { DomainSearchResult, ResellerClubResponse } from "./types";

export class ResellerClubWrapper {
  /**
   * Search for domain availability
   */
  static async searchDomain(
    domainName: string,
    isTestingMode: boolean = false
  ): Promise<DomainSearchResult[]> {
    if (isTestingMode) {
      console.log(
        "🧪 Testing Mode: Using mock ResellerClub API for domain search"
      );
      return MockResellerClubAPI.searchDomain(domainName);
    }

    console.log(
      `🌐 [PRODUCTION] ResellerClub Wrapper: Initiating domain search for "${domainName}"`
    );
    return ResellerClubAPI.searchDomain(domainName);
  }

  /**
   * Search for domain availability with specific TLDs
   */
  static async searchDomainWithTlds(
    domainName: string,
    tlds: string[],
    isTestingMode: boolean = false
  ): Promise<DomainSearchResult[]> {
    if (isTestingMode) {
      console.log(
        "🧪 Testing Mode: Using mock ResellerClub API for domain search with TLDs"
      );
      return MockResellerClubAPI.searchDomainWithTlds(domainName, tlds);
    }

    console.log(
      `🌐 [PRODUCTION] ResellerClub Wrapper: Initiating domain search for "${domainName}" with TLDs: ${tlds.join(
        ", "
      )}`
    );
    return ResellerClubAPI.searchDomainWithTlds(domainName, tlds);
  }

  /**
   * Get domain pricing for specific TLDs
   */
  static async getDomainPricing(
    tlds: string[],
    isTestingMode: boolean = false
  ): Promise<any> {
    if (isTestingMode) {
      console.log(
        "🧪 Testing Mode: Using mock ResellerClub API for domain pricing"
      );
      return MockResellerClubAPI.getDomainPricing(tlds);
    }

    // Use the new PricingService for live pricing
    return PricingService.getTLDPricing(tlds);
  }

  /**
   * Register a domain
   */
  static async registerDomain(
    domainData: {
      domainName: string;
      years: number;
      customerId: number; // ResellerClub customer ID (numeric)
      nameServers?: string[];
      adminContactId?: number; // ResellerClub contact ID (numeric)
      techContactId?: number; // ResellerClub contact ID (numeric)
      billingContactId?: number; // ResellerClub contact ID (numeric)
    },
    isTestingMode: boolean = false
  ): Promise<ResellerClubResponse> {
    if (isTestingMode) {
      console.log(
        "🧪 Testing Mode: Using mock ResellerClub API for domain registration"
      );
      return MockResellerClubAPI.registerDomain(domainData);
    }

    console.log(
      `🌐 [PRODUCTION] ResellerClub Wrapper: Initiating domain registration for "${domainData.domainName}"`
    );
    return ResellerClubAPI.registerDomain(domainData);
  }

  /**
   * Get domain details
   */
  static async getDomainDetails(
    domainName: string,
    isTestingMode: boolean = false
  ): Promise<ResellerClubResponse> {
    if (isTestingMode) {
      console.log(
        "🧪 Testing Mode: Using mock ResellerClub API for domain details"
      );
      return MockResellerClubAPI.getDomainDetails(domainName);
    }

    return ResellerClubAPI.getDomainDetails(domainName);
  }

  /**
   * Get DNS records for a domain
   */
  static async getDNSRecords(
    domainName: string,
    isTestingMode: boolean = false
  ): Promise<ResellerClubResponse> {
    if (isTestingMode) {
      console.log(
        "🧪 Testing Mode: Using mock ResellerClub API for DNS records"
      );
      return MockResellerClubAPI.getDNSRecords(domainName);
    }

    return ResellerClubAPI.getDNSRecords(domainName);
  }

  /**
   * Renew a domain
   */
  static async renewDomain(
    domainName: string,
    years: number,
    isTestingMode: boolean = false
  ): Promise<ResellerClubResponse> {
    if (isTestingMode) {
      console.log(
        "🧪 Testing Mode: Using mock ResellerClub API for domain renewal"
      );
      return MockResellerClubAPI.renewDomain(domainName, years);
    }

    // TODO: Implement domain renewal
    throw new Error("Domain renewal not implemented yet");
  }

  /**
   * Transfer a domain
   */
  static async transferDomain(
    domainName: string,
    authCode: string,
    isTestingMode: boolean = false
  ): Promise<ResellerClubResponse> {
    if (isTestingMode) {
      console.log(
        "🧪 Testing Mode: Using mock ResellerClub API for domain transfer"
      );
      return MockResellerClubAPI.transferDomain(domainName, authCode);
    }

    return ResellerClubAPI.transferDomain(domainName, authCode);
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
    },
    isTestingMode: boolean = false
  ): Promise<ResellerClubResponse> {
    if (isTestingMode) {
      console.log(
        "🧪 Testing Mode: Using mock ResellerClub API for adding DNS record"
      );
      return MockResellerClubAPI.addDNSRecord(domainName, recordData);
    }

    console.log(
      `🌐 [PRODUCTION] ResellerClub Wrapper: Adding DNS record for "${domainName}"`
    );
    return ResellerClubAPI.addDNSRecord(domainName, recordData);
  }

  /**
   * Delete DNS record
   */
  static async deleteDNSRecord(
    domainName: string,
    recordId: string,
    isTestingMode: boolean = false
  ): Promise<ResellerClubResponse> {
    if (isTestingMode) {
      console.log(
        "🧪 Testing Mode: Using mock ResellerClub API for deleting DNS record"
      );
      return MockResellerClubAPI.deleteDNSRecord(domainName, recordId);
    }

    console.log(
      `🌐 [PRODUCTION] ResellerClub Wrapper: Deleting DNS record for "${domainName}"`
    );
    return ResellerClubAPI.deleteDNSRecord(domainName, recordId);
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
    },
    isTestingMode: boolean = false
  ): Promise<ResellerClubResponse> {
    if (isTestingMode) {
      console.log(
        "🧪 Testing Mode: Using mock ResellerClub API for updating DNS record"
      );
      return MockResellerClubAPI.updateDNSRecord(
        domainName,
        recordId,
        recordData
      );
    }

    console.log(
      `🌐 [PRODUCTION] ResellerClub Wrapper: Updating DNS record for "${domainName}"`
    );
    return ResellerClubAPI.updateDNSRecord(domainName, recordId, recordData);
  }

  /**
   * Get domain renewal pricing
   */
  static async getRenewalPricing(
    domainName: string,
    years: number,
    isTestingMode: boolean = false
  ): Promise<ResellerClubResponse> {
    if (isTestingMode) {
      console.log(
        "🧪 Testing Mode: Using mock ResellerClub API for renewal pricing"
      );
      return MockResellerClubAPI.getRenewalPricing(domainName, years);
    }

    console.log(
      `🌐 [PRODUCTION] ResellerClub Wrapper: Getting renewal pricing for "${domainName}"`
    );
    return ResellerClubAPI.getRenewalPricing(domainName, years);
  }

  /**
   * Get domain expiry date
   */
  static async getDomainExpiry(
    domainName: string,
    isTestingMode: boolean = false
  ): Promise<ResellerClubResponse> {
    if (isTestingMode) {
      console.log(
        "🧪 Testing Mode: Using mock ResellerClub API for domain expiry"
      );
      return MockResellerClubAPI.getDomainExpiry(domainName);
    }

    console.log(
      `🌐 [PRODUCTION] ResellerClub Wrapper: Getting expiry date for "${domainName}"`
    );
    return ResellerClubAPI.getDomainExpiry(domainName);
  }
}
