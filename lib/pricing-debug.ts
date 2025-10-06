/**
 * Pricing Debug Utility
 *
 * This utility helps debug pricing discrepancies between ResellerClub interface
 * and our application by providing detailed logging and analysis.
 */

import { PricingService } from "./pricing-service";

export class PricingDebug {
  /**
   * Debug pricing for a specific TLD
   */
  static async debugTLDPricing(tld: string): Promise<void> {
    console.log(`🔍 [PRICING-DEBUG] Debugging pricing for TLD: ${tld}`);

    try {
      const pricing = await PricingService.getTLDPricing([tld]);
      const tldData = pricing[tld];

      if (tldData) {
        console.log(`✅ [PRICING-DEBUG] Found pricing data for ${tld}:`, {
          customerPrice: tldData.price,
          resellerPrice: tldData.resellerPrice,
          currency: tldData.currency,
          tld: tldData.tld,
          hasCustomerData: !!tldData.customer,
          hasResellerData: !!tldData.reseller,
        });

        // Log detailed customer pricing structure
        if (tldData.customer) {
          console.log(
            `📊 [PRICING-DEBUG] Customer pricing structure for ${tld}:`,
            {
              addnewdomain: tldData.customer.addnewdomain,
              renewdomain: tldData.customer.renewdomain,
              transferdomain: tldData.customer.transferdomain,
            }
          );
        }

        // Log detailed reseller pricing structure
        if (tldData.reseller) {
          console.log(
            `📊 [PRICING-DEBUG] Reseller pricing structure for ${tld}:`,
            {
              addnewdomain: tldData.reseller.addnewdomain,
              renewdomain: tldData.reseller.renewdomain,
              transferdomain: tldData.reseller.transferdomain,
            }
          );
        }
      } else {
        console.log(`❌ [PRICING-DEBUG] No pricing data found for TLD: ${tld}`);
      }
    } catch (error) {
      console.error(
        `❌ [PRICING-DEBUG] Error debugging pricing for ${tld}:`,
        error
      );
    }
  }

  /**
   * Debug all available TLDs in pricing data
   */
  static async debugAllTLDs(): Promise<void> {
    console.log(`🔍 [PRICING-DEBUG] Debugging all available TLDs`);

    try {
      const pricingData = await PricingService.getDomainPricing();
      const customerTlds = Object.keys(pricingData.customerPricing || {});
      const resellerTlds = Object.keys(pricingData.resellerPricing || {});

      console.log(`📊 [PRICING-DEBUG] Available TLDs:`, {
        customerTlds: customerTlds.length,
        resellerTlds: resellerTlds.length,
        customerTldList: customerTlds.slice(0, 20), // Show first 20
        resellerTldList: resellerTlds.slice(0, 20), // Show first 20
      });

      // Check for .eu specifically
      const euVariations = ["eu", ".eu", "EU", "doteu", "centralniczaeu"];
      console.log(`🔍 [PRICING-DEBUG] Checking .eu variations:`, {
        variations: euVariations,
        foundInCustomer: euVariations.filter((v) => customerTlds.includes(v)),
        foundInReseller: euVariations.filter((v) => resellerTlds.includes(v)),
      });
    } catch (error) {
      console.error(`❌ [PRICING-DEBUG] Error debugging all TLDs:`, error);
    }
  }

  /**
   * Compare pricing between different sources
   */
  static async comparePricing(domain: string, tld: string): Promise<void> {
    console.log(`🔍 [PRICING-DEBUG] Comparing pricing for ${domain}.${tld}`);

    try {
      // Get live pricing
      const livePricing = await PricingService.getTLDPricing([tld]);
      const liveData = livePricing[tld];

      console.log(`📊 [PRICING-DEBUG] Live pricing comparison:`, {
        domain: `${domain}.${tld}`,
        liveCustomerPrice: liveData?.price || "N/A",
        liveResellerPrice: liveData?.resellerPrice || "N/A",
        liveCurrency: liveData?.currency || "N/A",
        pricingSource: liveData ? "Live from ResellerClub API" : "Not found",
      });

      // Expected pricing from ResellerClub interface
      const expectedPricing = {
        "exceltechnologies.eu": {
          costPrice: 800.0,
          promoPrice: 198.0,
          sellingPrice: 218.9,
          currency: "INR",
        },
      };

      const expected = expectedPricing[`${domain}.${tld}`];
      if (expected) {
        console.log(
          `📊 [PRICING-DEBUG] Expected pricing from ResellerClub interface:`,
          expected
        );

        if (liveData) {
          const priceDifference = Math.abs(
            liveData.price - expected.sellingPrice
          );
          const priceMatch = priceDifference < 1; // Within ₹1

          console.log(`📊 [PRICING-DEBUG] Price comparison:`, {
            livePrice: liveData.price,
            expectedPrice: expected.sellingPrice,
            difference: priceDifference,
            match: priceMatch ? "✅ MATCH" : "❌ MISMATCH",
          });
        }
      }
    } catch (error) {
      console.error(`❌ [PRICING-DEBUG] Error comparing pricing:`, error);
    }
  }
}
