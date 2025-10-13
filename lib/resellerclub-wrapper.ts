import { ResellerClubAPI } from "./resellerclub";
import { PricingService } from "./pricing-service";
import { DomainSearchResult, ResellerClubResponse } from "./types";

export class ResellerClubWrapper {
  /**
   * Search for domain availability
   */
  static async searchDomain(domainName: string): Promise<DomainSearchResult[]> {
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
    tlds: string[]
  ): Promise<DomainSearchResult[]> {
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
    }
  ): Promise<ResellerClubResponse> {
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
    domainName: string
  ): Promise<ResellerClubResponse> {
    return ResellerClubAPI.getDomainDetails(domainName);
  }

  /**
   * Get DNS records for a domain
   */
  static async getDNSRecords(
    domainName: string,
    customerId: string
  ): Promise<ResellerClubResponse> {
    return ResellerClubAPI.getDNSRecords(domainName, customerId);
  }

  /**
   * Renew a domain
   */
  static async renewDomain(
    domainName: string,
    years: number
  ): Promise<ResellerClubResponse> {
    return ResellerClubAPI.renewDomain(domainName, years);
  }

  /**
   * Transfer a domain
   */
  static async transferDomain(
    domainName: string,
    authCode: string
  ): Promise<ResellerClubResponse> {
    return ResellerClubAPI.transferDomain(domainName, authCode);
  }

  /**
   * Add DNS record
   */
  static async addDNSRecord(
    domainName: string,
    customerId: string,
    recordData: {
      type: string;
      name: string;
      value: string;
      ttl: number;
      priority?: number;
    }
  ): Promise<ResellerClubResponse> {
    console.log(
      `🌐 [PRODUCTION] ResellerClub Wrapper: Adding DNS record for "${domainName}"`
    );
    return ResellerClubAPI.addDNSRecord(domainName, customerId, recordData);
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
    }
  ): Promise<ResellerClubResponse> {
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
    recordData: {
      type: string;
      name: string;
      value: string;
      ttl: number;
      priority?: number;
    }
  ): Promise<ResellerClubResponse> {
    console.log(
      `🌐 [PRODUCTION] ResellerClub Wrapper: Deleting DNS record for "${domainName}"`
    );
    return ResellerClubAPI.deleteDNSRecord(domainName, recordId, recordData);
  }

  /**
   * Set default nameservers
   */
  static async setDefaultNameservers(
    domainName: string
  ): Promise<ResellerClubResponse> {
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
    nameservers: string[]
  ): Promise<ResellerClubResponse> {
    console.log(
      `🌐 [PRODUCTION] ResellerClub Wrapper: Setting custom nameservers for "${domainName}"`
    );
    return ResellerClubAPI.setCustomNameservers(domainName, nameservers);
  }
}
