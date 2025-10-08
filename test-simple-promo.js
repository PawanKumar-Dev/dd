#!/usr/bin/env node

/**
 * Simple script to test ResellerClub promotional pricing
 * Tests the existing working endpoints to see if we can find promotional pricing
 */

const axios = require('axios');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const RESELLERCLUB_API_URL = process.env.RESELLERCLUB_API_URL || 'https://httpapi.com';
const RESELLERCLUB_ID = process.env.RESELLERCLUB_ID;
const RESELLERCLUB_SECRET = process.env.RESELLERCLUB_SECRET;

console.log('🔧 Testing ResellerClub Promotional Pricing...');
console.log('   API URL:', RESELLERCLUB_API_URL);
console.log('   User ID:', RESELLERCLUB_ID);
console.log('');

async function testPromotionalPricing() {
  try {
    // Test 1: Customer pricing (what we currently use)
    console.log('📊 Test 1: Customer pricing...');
    const customerResponse = await axios.get(`${RESELLERCLUB_API_URL}/api/products/customer-price.json`, {
      params: {
        'auth-userid': RESELLERCLUB_ID,
        'api-key': RESELLERCLUB_SECRET,
        'format': 'json'
      },
      timeout: 30000
    });

    console.log('✅ Customer pricing fetched');
    console.log('   TLDs available:', Object.keys(customerResponse.data).length);
    console.log('   Sample TLDs:', Object.keys(customerResponse.data).slice(0, 5));
    console.log('');

    // Test 2: Reseller pricing
    console.log('📊 Test 2: Reseller pricing...');
    const resellerResponse = await axios.get(`${RESELLERCLUB_API_URL}/api/products/reseller-price.json`, {
      params: {
        'auth-userid': RESELLERCLUB_ID,
        'api-key': RESELLERCLUB_SECRET,
        'format': 'json'
      },
      timeout: 30000
    });

    console.log('✅ Reseller pricing fetched');
    console.log('   TLDs available:', Object.keys(resellerResponse.data).length);
    console.log('');

    // Test 3: Promo pricing (existing endpoint)
    console.log('📊 Test 3: Promo pricing...');
    const promoResponse = await axios.get(`${RESELLERCLUB_API_URL}/api/products/promo-price.json`, {
      params: {
        'auth-userid': RESELLERCLUB_ID,
        'api-key': RESELLERCLUB_SECRET,
        'format': 'json'
      },
      timeout: 30000
    });

    console.log('✅ Promo pricing fetched');
    console.log('   TLDs available:', Object.keys(promoResponse.data).length);
    console.log('   Sample TLDs:', Object.keys(promoResponse.data).slice(0, 5));
    console.log('');

    // Test 4: Promotional details
    console.log('📊 Test 4: Promotional details...');
    const promoDetailsResponse = await axios.get(`${RESELLERCLUB_API_URL}/api/resellers/promo-details.json`, {
      params: {
        'auth-userid': RESELLERCLUB_ID,
        'api-key': RESELLERCLUB_SECRET,
        'format': 'json'
      },
      timeout: 30000
    });

    console.log('✅ Promotional details fetched');
    console.log('   Promotions available:', Object.keys(promoDetailsResponse.data).length);
    console.log('');

    // Compare pricing to find promotional TLDs
    console.log('🔍 Analyzing promotional pricing...');
    console.log('');

    const customerData = customerResponse.data;
    const resellerData = resellerResponse.data;
    const promoData = promoResponse.data;
    const promoDetailsData = promoDetailsResponse.data;

    let promotionalTlds = 0;
    let totalSavings = 0;

    // Check a few sample TLDs
    const sampleTlds = ['com', 'net', 'org', 'info', 'biz', 'co', 'io', 'ai', 'app', 'asia', 'au', 'ca', 'cc', 'eu'];

    for (const tld of sampleTlds) {
      const customerTld = customerData[tld];
      const resellerTld = resellerData[tld];
      const promoTld = promoData[tld];

      if (customerTld && customerTld.addnewdomain && customerTld.addnewdomain['1']) {
        const customerPrice = parseFloat(customerTld.addnewdomain['1']);
        const resellerPrice = resellerTld?.addnewdomain?.['1'] ? parseFloat(resellerTld.addnewdomain['1']) : 0;
        const promoPrice = promoTld?.addnewdomain?.['1'] ? parseFloat(promoTld.addnewdomain['1']) : 0;

        console.log(`📋 ${tld.toUpperCase()}:`);
        console.log(`   Customer: ₹${customerPrice.toFixed(2)}`);
        console.log(`   Reseller: ₹${resellerPrice.toFixed(2)}`);
        console.log(`   Promo: ₹${promoPrice.toFixed(2)}`);

        if (promoPrice > 0 && promoPrice < customerPrice) {
          const savings = customerPrice - promoPrice;
          const discountPercent = ((savings / customerPrice) * 100).toFixed(1);

          console.log(`   🎉 PROMOTIONAL: Save ₹${savings.toFixed(2)} (${discountPercent}% off)`);
          console.log('');

          promotionalTlds++;
          totalSavings += savings;
        } else {
          console.log(`   ❌ No promotional pricing`);
          console.log('');
        }
      } else {
        console.log(`❌ ${tld.toUpperCase()}: No pricing data`);
        console.log('');
      }
    }

    // Check active promotional details
    console.log('🎯 Active Promotional Details:');
    const activePromotions = Object.values(promoDetailsData).filter((promo) => {
      return promo.isactive === 'true' && promo.productkey;
    });

    console.log(`   Active promotions: ${activePromotions.length}`);

    if (activePromotions.length > 0) {
      console.log('   Sample promotions:');
      activePromotions.slice(0, 3).forEach((promo, index) => {
        console.log(`   ${index + 1}. ${promo.productkey}: ${promo.customerprice} (${promo.starttime} - ${promo.endtime})`);
      });
    }
    console.log('');

    console.log('📊 Summary:');
    console.log(`   TLDs tested: ${sampleTlds.length}`);
    console.log(`   TLDs with promotional pricing: ${promotionalTlds}`);
    console.log(`   Total potential savings: ₹${totalSavings.toFixed(2)}`);
    console.log(`   Active promotional details: ${activePromotions.length}`);
    console.log('');

    if (promotionalTlds > 0) {
      console.log('🎉 SUCCESS: Found promotional pricing!');
    } else if (activePromotions.length > 0) {
      console.log('⚠️  Found promotional details but no direct promo pricing');
    } else {
      console.log('❌ No promotional pricing found');
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
