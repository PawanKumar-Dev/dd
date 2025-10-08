/**
 * =============================================================================
 * PRICING SERVICE TEST SCRIPT
 * =============================================================================
 * 
 * Purpose: Test the PricingService.getTLDPricing() method to verify that
 * promotional pricing is working correctly for specific TLDs.
 * 
 * What it tests:
 * - Fetches pricing data for specified TLDs
 * - Verifies promotional pricing detection
 * - Displays original vs promotional prices
 * - Shows promotional details and metadata
 * 
 * Usage:
 *   node tests/api/test-pricing.js
 * 
 * Expected Output:
 * - Pricing data for the specified TLDs
 * - Promotional status and pricing details
 * - Error handling if something goes wrong
 * 
 * Dependencies:
 * - lib/pricing-service.js (PricingService class)
 * - .env.local (environment variables)
 * 
 * Author: Excel Technologies
 * Created: 2024
 * Last Updated: 2024-10-08
 */

// Import the PricingService class
const { PricingService } = require('../../lib/pricing-service');

/**
 * Test function to verify TLD pricing functionality
 * 
 * This function tests the core pricing service by:
 * 1. Calling getTLDPricing with test TLDs
 * 2. Analyzing the returned pricing data
 * 3. Checking for promotional pricing detection
 * 4. Displaying comprehensive pricing information
 */
async function testPricing() {
  console.log('🧪 Testing TLD Pricing Service...');
  console.log('=====================================');

  // Test TLDs - you can modify this array to test different TLDs
  const testTlds = ['eu', 'com', 'net', 'org'];
  
  try {
    console.log(`📋 Testing TLDs: ${testTlds.join(', ')}`);
    console.log('⏳ Fetching pricing data...\n');

    // Call the pricing service
    const pricing = await PricingService.getTLDPricing(testTlds);
    
    console.log('📊 Pricing Results:');
    console.log('==================');

    // Process each TLD result
    testTlds.forEach(tld => {
      if (pricing[tld]) {
        const tldData = pricing[tld];
        console.log(`\n🔹 TLD: .${tld}`);
        console.log(`   Final Price: ₹${tldData.price}`);
        console.log(`   Original Price: ₹${tldData.originalPrice || 'N/A'}`);
        console.log(`   Is Promotional: ${tldData.isPromotional ? '✅ Yes' : '❌ No'}`);
        console.log(`   Currency: ${tldData.currency}`);
        console.log(`   Pricing Source: ${tldData.pricingSource}`);
        
        // Show promotional details if available
        if (tldData.isPromotional && tldData.promotionalDetails) {
          const promo = tldData.promotionalDetails;
          console.log(`   🎯 Promotional Details:`);
          console.log(`      Source: ${promo.source}`);
          console.log(`      Discount: ₹${promo.discount || 0}`);
          console.log(`      Action Type: ${promo.actionType || 'N/A'}`);
          if (promo.startTime && promo.endTime) {
            console.log(`      Valid: ${new Date(parseInt(promo.startTime) * 1000).toLocaleDateString()} - ${new Date(parseInt(promo.endTime) * 1000).toLocaleDateString()}`);
          }
        }
      } else {
        console.log(`\n❌ TLD: .${tld} - No pricing data found`);
      }
    });

    // Summary
    const promotionalTlds = testTlds.filter(tld => pricing[tld]?.isPromotional);
    console.log(`\n📈 Summary:`);
    console.log(`   Total TLDs tested: ${testTlds.length}`);
    console.log(`   TLDs with pricing: ${testTlds.filter(tld => pricing[tld]).length}`);
    console.log(`   Promotional TLDs: ${promotionalTlds.length}`);
    
    if (promotionalTlds.length > 0) {
      console.log(`   Promotional TLDs: ${promotionalTlds.map(tld => `.${tld}`).join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Error testing pricing:', error);
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Main execution function
 * 
 * This is the entry point that runs the test and handles any uncaught errors
 */
async function main() {
  try {
    await testPricing();
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
main();
