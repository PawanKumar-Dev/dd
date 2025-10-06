// Test script to verify promotional pricing for .eu TLD
const { PricingService } = require('./lib/pricing-service');

async function testPricing() {
  console.log('🧪 Testing .eu TLD pricing...');

  try {
    const pricing = await PricingService.getTLDPricing(['eu']);
    console.log('📊 Pricing result:', pricing);

    if (pricing.eu) {
      console.log('✅ .eu pricing found:');
      console.log(`  - Final Price: ₹${pricing.eu.price}`);
      console.log(`  - Original Price: ₹${pricing.eu.originalPrice || 'N/A'}`);
      console.log(`  - Is Promotional: ${pricing.eu.isPromotional ? 'Yes' : 'No'}`);
      console.log(`  - Currency: ${pricing.eu.currency}`);
    } else {
      console.log('❌ No .eu pricing found');
    }
  } catch (error) {
    console.error('❌ Error testing pricing:', error);
  }
}

testPricing();
