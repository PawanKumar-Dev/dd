#!/usr/bin/env node

/**
 * Final test of ResellerClub promotional pricing
 * Shows actual promotional data and pricing comparisons
 */

const axios = require('axios');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const RESELLERCLUB_API_URL = process.env.RESELLERCLUB_API_URL || 'https://httpapi.com';
const RESELLERCLUB_ID = process.env.RESELLERCLUB_ID;
const RESELLERCLUB_SECRET = process.env.RESELLERCLUB_SECRET;

console.log('🎯 Final ResellerClub Promotional Pricing Test');
console.log('   API URL:', RESELLERCLUB_API_URL);
console.log('   User ID:', RESELLERCLUB_ID);
console.log('');

async function testPromotionalPricing() {
  try {
    // Fetch all available data
    console.log('📊 Fetching all pricing data...');

    const [customerResponse, resellerResponse, promoDetailsResponse] = await Promise.all([
      axios.get(`${RESELLERCLUB_API_URL}/api/products/customer-price.json`, {
        params: {
          'auth-userid': RESELLERCLUB_ID,
          'api-key': RESELLERCLUB_SECRET,
          'format': 'json'
        },
        timeout: 30000
      }),
      axios.get(`${RESELLERCLUB_API_URL}/api/products/reseller-price.json`, {
        params: {
          'auth-userid': RESELLERCLUB_ID,
          'api-key': RESELLERCLUB_SECRET,
          'format': 'json'
        },
        timeout: 30000
      }),
      axios.get(`${RESELLERCLUB_API_URL}/api/resellers/promo-details.json`, {
        params: {
          'auth-userid': RESELLERCLUB_ID,
          'api-key': RESELLERCLUB_SECRET,
          'format': 'json'
        },
        timeout: 30000
      })
    ]);

    console.log('✅ All data fetched successfully');
    console.log('   Customer pricing TLDs:', Object.keys(customerResponse.data).length);
    console.log('   Reseller pricing TLDs:', Object.keys(resellerResponse.data).length);
    console.log('   Promotional details:', Object.keys(promoDetailsResponse.data).length);
    console.log('');

    const customerData = customerResponse.data;
    const resellerData = resellerResponse.data;
    const promoDetailsData = promoDetailsResponse.data;

    // Show promotional details
    console.log('🎯 Promotional Details Analysis:');
    console.log('');

    const promotions = Object.values(promoDetailsData);
    console.log(`   Total promotions: ${promotions.length}`);
    console.log('');

    if (promotions.length > 0) {
      console.log('📋 Active Promotions:');
      promotions.forEach((promo, index) => {
        console.log(`   ${index + 1}. Product: ${promo.productkey}`);
        console.log(`      Customer Price: ₹${promo.customerprice}`);
        console.log(`      Reseller Price: ₹${promo.resellerprice}`);
        console.log(`      Period: ${promo.period}`);
        console.log(`      Active: ${promo.isactive}`);
        console.log(`      Start: ${promo.starttime}`);
        console.log(`      End: ${promo.endtime}`);
        console.log(`      Action Type: ${promo.actiontype}`);
        console.log('');
      });
    }

    // Test specific TLDs for promotional pricing
    console.log('🔍 Testing Specific TLDs for Promotional Pricing:');
    console.log('');

    const testTlds = ['com', 'net', 'org', 'info', 'biz', 'co', 'io', 'ai', 'app', 'asia', 'au', 'ca', 'cc', 'eu'];
    let promotionalTlds = 0;
    let totalSavings = 0;

    for (const tld of testTlds) {
      // Try different TLD formats
      const tldFormats = [
        tld,
        `dot${tld}`,
        `centralnicza${tld}`,
        tld.toUpperCase(),
        tld.toLowerCase()
      ];

      let customerPrice = 0;
      let resellerPrice = 0;
      let foundTld = null;

      // Find the TLD in customer pricing
      for (const format of tldFormats) {
        if (customerData[format] && customerData[format].addnewdomain && customerData[format].addnewdomain['1']) {
          customerPrice = parseFloat(customerData[format].addnewdomain['1']);
          foundTld = format;
          break;
        }
      }

      if (foundTld) {
        // Get reseller price
        if (resellerData[foundTld] && resellerData[foundTld]['0'] && resellerData[foundTld]['0'].pricing && resellerData[foundTld]['0'].pricing.addnewdomain && resellerData[foundTld]['0'].pricing.addnewdomain['1']) {
          resellerPrice = parseFloat(resellerData[foundTld]['0'].pricing.addnewdomain['1']);
        }

        console.log(`📋 ${tld.toUpperCase()} (${foundTld}):`);
        console.log(`   Customer Price: ₹${customerPrice.toFixed(2)}`);
        console.log(`   Reseller Price: ₹${resellerPrice.toFixed(2)}`);
        console.log(`   Margin: ${resellerPrice > 0 ? (((customerPrice - resellerPrice) / customerPrice) * 100).toFixed(1) : 0}%`);

        // Check if there's a promotional price for this TLD
        const matchingPromo = promotions.find(promo =>
          promo.productkey &&
          promo.productkey.toLowerCase().includes(tld.toLowerCase()) &&
          promo.isactive === 'true'
        );

        if (matchingPromo) {
          const promoPrice = parseFloat(matchingPromo.customerprice);
          const savings = customerPrice - promoPrice;
          const discountPercent = ((savings / customerPrice) * 100).toFixed(1);

          console.log(`   🎉 PROMOTIONAL PRICE: ₹${promoPrice.toFixed(2)}`);
          console.log(`   💰 SAVINGS: ₹${savings.toFixed(2)} (${discountPercent}% off)`);
          console.log(`   📅 Valid: ${matchingPromo.starttime} to ${matchingPromo.endtime}`);

          promotionalTlds++;
          totalSavings += savings;
        } else {
          console.log(`   ❌ No promotional pricing available`);
        }

        console.log('');
      } else {
        console.log(`❌ ${tld.toUpperCase()}: No pricing data found`);
        console.log('');
      }
    }

    // Summary
    console.log('📊 Final Summary:');
    console.log(`   TLDs tested: ${testTlds.length}`);
    console.log(`   TLDs with promotional pricing: ${promotionalTlds}`);
    console.log(`   Total potential savings: ₹${totalSavings.toFixed(2)}`);
    console.log(`   Active promotional details: ${promotions.length}`);
    console.log('');

    if (promotionalTlds > 0) {
      console.log('🎉 SUCCESS: Found promotional pricing!');
      console.log('   The system can detect and apply promotional pricing.');
    } else if (promotions.length > 0) {
      console.log('⚠️  Found promotional details but no matching TLDs in test set');
      console.log('   Promotional pricing may be available for other TLDs.');
    } else {
      console.log('❌ No promotional pricing found');
      console.log('   This could mean no active promotions or insufficient API access.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testPromotionalPricing();
