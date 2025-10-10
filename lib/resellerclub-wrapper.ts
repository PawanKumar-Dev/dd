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
   * Register a domain
   */
  static async registerDomain(
    domainName: string,
    years: number,
    customerId: number,
    nameServers?: string[],
    contacts?: {
      admin: number;
      tech: number;
      billing: number;
    },
    isTestingMode: boolean = false
  ): Promise<ResellerClubResponse> {
    if (isTestingMode) {
      console.log(
        "🧪 Testing Mode: Using mock ResellerClub API for domain registration"
      );
      return MockResellerClubAPI.registerDomain(
        domainName,
        years,
        customerId,
        nameServers,
        contacts
      );
    }

    console.log(
      `🌐 [PRODUCTION] ResellerClub Wrapper: Initiating domain registration for "${domainName}"`
    );
    return ResellerClubAPI.registerDomain(
      domainName,
      years,
      customerId,
      nameServers,
      contacts
    );
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

    return ResellerClubAPI.renewDomain(domainName, years);
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
   * Set default nameservers
   */
  static async setDefaultNameservers(
    domainName: string,
    isTestingMode: boolean = false
  ): Promise<ResellerClubResponse> {
    if (isTestingMode) {
      console.log(
        "🧪 Testing Mode: Using mock ResellerClub API for setting default nameservers"
      );
      return MockResellerClubAPI.setDefaultNameservers(domainName);
    }

    console.log(
      `🌐 [PRODUCTION] ResellerClub Wrapper: Setting default nameservers for "${domainName}"`
    );
    return ResellerClubAPI.setDefaultNameservers(domainName);
  }

  /**
   * Set custom nameservers
   */
  static async setCustomNameservers(
    domainName: string,
    nameservers: string[],
    isTestingMode: boolean = false
  ): Promise<ResellerClubResponse> {
    if (isTestingMode) {
      console.log(
        "🧪 Testing Mode: Using mock ResellerClub API for setting custom nameservers"
      );
      return MockResellerClubAPI.setCustomNameservers(domainName, nameservers);
    }

    console.log(
      `🌐 [PRODUCTION] ResellerClub Wrapper: Setting custom nameservers for "${domainName}"`
    );
    return ResellerClubAPI.setCustomNameservers(domainName, nameservers);
  }
}
