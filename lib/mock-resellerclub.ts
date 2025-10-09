import { DomainSearchResult, ResellerClubResponse } from "./types";

export class MockResellerClubAPI {
  /**
   * Mock domain search - returns unavailable domains (no live pricing in production)
   */
  static async searchDomain(domainName: string): Promise<DomainSearchResult[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In production mode, mock API should not be used
    // This is only for testing when ResellerClub API is not available
    const mockResults: DomainSearchResult[] = [
      {
        domainName: domainName,
        available: false,
        price: 0,
        currency: "INR",
        registrationPeriod: 1,
        pricingSource: "unavailable",
      },
    ];

    console.log(
      `🧪 [MOCK] Generated ${mockResults.length} mock results for domain "${domainName}" - all unavailable (no live pricing)`
    );

    return mockResults;
  }

  /**
   * Mock domain search with specific TLDs - returns unavailable domains (no live pricing in production)
   */
  static async searchDomainWithTlds(
    domainName: string,
    tlds: string[]
  ): Promise<DomainSearchResult[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In production mode, mock API should not be used
    // This is only for testing when ResellerClub API is not available
    const mockResults: DomainSearchResult[] = tlds.map((tld) => {
      return {
        domainName: `${domainName}.${tld}`,
        available: false,
        price: 0,
        currency: "INR",
        registrationPeriod: 1,
        pricingSource: "unavailable",
      };
    });

    console.log(
      `🧪 [MOCK] Generated ${
        mockResults.length
      } mock results for domain "${domainName}" with TLDs: ${tlds.join(
        ", "
      )} - all unavailable (no live pricing)`
    );

    return mockResults;
  }

  /**
   * Mock domain pricing
   */
  static async getDomainPricing(tlds: string[]): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const pricing: any = {};
    tlds.forEach((tld) => {
      pricing[tld] = {
        "1": { price: 12.99, currency: "USD" },
        "2": { price: 24.99, currency: "USD" },
        "5": { price: 59.99, currency: "USD" },
      };
    });

    return {
      status: "success",
      data: pricing,
    };
  }

  /**
   * Mock domain registration - always succeeds
   */
  static async registerDomain(domainData: {
    domainName: string;
    years: number;
    customerId: number; // ResellerClub customer ID (numeric)
    nameServers?: string[];
    adminContactId?: number; // ResellerClub contact ID (numeric)
    techContactId?: number; // ResellerClub contact ID (numeric)
    billingContactId?: number; // ResellerClub contact ID (numeric)
  }): Promise<ResellerClubResponse> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      status: "success",
      data: {
        orderid: `MOCK_ORDER_${Date.now()}`,
        entityid: `MOCK_ENTITY_${Date.now()}`,
        description: `Domain registration for ${domainData.domainName}`,
        actiontypedesc: "Domain Registration",
        actionstatus: "Success",
        status: "Success",
      },
    };
  }

  /**
   * Mock domain details
   */
  static async getDomainDetails(
    domainName: string
  ): Promise<ResellerClubResponse> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    return {
      status: "success",
      data: {
        entityid: `MOCK_ENTITY_${Date.now()}`,
        domainname: domainName,
        orderid: `MOCK_ORDER_${Date.now()}`,
        description: `Domain details for ${domainName}`,
        actiontypedesc: "Domain Details",
        actionstatus: "Success",
        status: "Success",
        creationtime: new Date().toISOString(),
        endtime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  }

  /**
   * Mock DNS records
   */
  static async getDNSRecords(
    domainName: string
  ): Promise<ResellerClubResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      status: "success",
      data: {
        records: [
          {
            type: "A",
            name: "@",
            value: "192.168.1.1",
            ttl: 3600,
          },
          {
            type: "CNAME",
            name: "www",
            value: domainName,
            ttl: 3600,
          },
        ],
      },
    };
  }

  /**
   * Mock domain renewal
   */
  static async renewDomain(
    domainName: string,
    years: number
  ): Promise<ResellerClubResponse> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      status: "success",
      data: {
        orderid: `MOCK_RENEWAL_${Date.now()}`,
        entityid: `MOCK_ENTITY_${Date.now()}`,
        description: `Domain renewal for ${domainName} for ${years} year(s)`,
        actiontypedesc: "Domain Renewal",
        actionstatus: "Success",
        status: "Success",
      },
    };
  }

  /**
   * Mock domain transfer
   */
  static async transferDomain(
    domainName: string,
    authCode: string
  ): Promise<ResellerClubResponse> {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    return {
      status: "success",
      data: {
        orderid: `MOCK_TRANSFER_${Date.now()}`,
        entityid: `MOCK_ENTITY_${Date.now()}`,
        description: `Domain transfer for ${domainName}`,
        actiontypedesc: "Domain Transfer",
        actionstatus: "Success",
        status: "Success",
      },
    };
  }

  /**
   * Mock add DNS record
   */
  static async addDNSRecord(
    domainName: string,
    recordData: {
      type: string;
      name: string;
      value: string;
      ttl: number;
      priority?: number;
    }
  ): Promise<ResellerClubResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      status: "success",
      data: {
        recordid: `MOCK_RECORD_${Date.now()}`,
        description: `DNS record added for ${domainName}`,
        actiontypedesc: "DNS Record Added",
        actionstatus: "Success",
        status: "Success",
      },
    };
  }

  /**
   * Mock delete DNS record
   */
  static async deleteDNSRecord(
    domainName: string,
    recordId: string
  ): Promise<ResellerClubResponse> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    return {
      status: "success",
      data: {
        description: `DNS record deleted for ${domainName}`,
        actiontypedesc: "DNS Record Deleted",
        actionstatus: "Success",
        status: "Success",
      },
    };
  }

  /**
   * Mock update DNS record
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
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      status: "success",
      data: {
        description: `DNS record updated for ${domainName}`,
        actiontypedesc: "DNS Record Updated",
        actionstatus: "Success",
        status: "Success",
      },
    };
  }

  /**
   * Mock get renewal pricing
   */
  static async getRenewalPricing(
    domainName: string,
    years: number
  ): Promise<ResellerClubResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Mock pricing based on TLD
    const domainParts = domainName.split(".");
    const tld = domainParts.slice(1).join(".").toLowerCase(); // Get full TLD for multi-level TLDs
    const basePrices: { [key: string]: number } = {
      com: 999,
      net: 1199,
      org: 1099,
      info: 1299,
      biz: 1399,
      co: 1499,
      in: 699,
      "co.in": 799,
    };

    const basePrice = basePrices[tld || "com"] || 999;
    const totalPrice = basePrice * years;

    return {
      status: "success",
      data: {
        price: totalPrice,
        currency: "INR",
        years: years,
        domain: domainName,
        description: `Renewal pricing for ${domainName} for ${years} year(s)`,
      },
    };
  }

  /**
   * Mock get domain expiry
   */
  static async getDomainExpiry(
    domainName: string
  ): Promise<ResellerClubResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Mock expiry date (1 year from now)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    return {
      status: "success",
      data: {
        domain: domainName,
        expirydate: expiryDate.toISOString(),
        expirydateinseconds: Math.floor(expiryDate.getTime() / 1000),
        description: `Expiry date for ${domainName}`,
      },
    };
  }
}
