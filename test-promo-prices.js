#!/usr/bin/env node

/**
 * Simple script to test ResellerClub promotional pricing API
 * 
 * This script tests the /api/domains/pricing.json endpoint with is_promo=true
 * to see if we can fetch any promotional prices from ResellerClub.
 */

const axios = require('axios');

// ResellerClub API configuration
const RESELLERCLUB_API_URL = process.env.RESELLERCLUB_API_URL || 'https://httpapi.com';
const RESELLERCLUB_ID = process.env.RESELLERCLUB_ID;
const RESELLERCLUB_SECRET = process.env.RESELLERCLUB_SECRET;

// Validate environment variables
if (!RESELLERCLUB_ID || !RESELLERCLUB_SECRET) {
  console.error('❌ Missing required environment variables:');
  console.error('   RESELLERCLUB_ID:', RESELLERCLUB_ID ? '✅ Set' : '❌ Missing');
  console.error('   RESELLERCLUB_SECRET:', RESELLERCLUB_SECRET ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

console.log('🔧 ResellerClub API Configuration:');
console.log('   API URL:', RESELLERCLUB_API_URL);
console.log('   User ID:', RESELLERCLUB_ID);
console.log('   API Key:', RESELLERCLUB_SECRET.substring(0, 8) + '...');
console.log('');

// Test TLDs
const testTlds = ['com', 'net', 'org', 'info', 'biz', 'co', 'io', 'ai', 'app', 'asia', 'au', 'ca', 'cc', 'eu'];

async function testPromotionalPricing() {
  console.log('🎯 Testing ResellerClub Promotional Pricing API...');
  console.log('');

  // Test different possible endpoints
  const endpoints = [
    '/api/domains/pricing.json',
    '/api/products/pricing.json',
    '/api/domains/pricing',
    '/api/products/pricing',
    '/api/domains/price.json',
    '/api/products/price.json'
  ];

  let workingEndpoint = null;
  let normalResponse = null;

  // First, find a working endpoint
  console.log('🔍 Testing different API endpoints...');
  for (const endpoint of endpoints) {
    try {
      console.log(`   Testing: ${endpoint}`);
      const response = await axios.get(`${RESELLERCLUB_API_URL}${endpoint}`, {
        params: {
          'auth-userid': RESELLERCLUB_ID,
          'api-key': RESELLERCLUB_SECRET,
          'format': 'json',
          'tlds': 'com,net',
          'regperiod': '1'
        },
        timeout: 10000
      });

      if (response.status === 200) {
        console.log(`   ✅ Working endpoint found: ${endpoint}`);
        workingEndpoint = endpoint;
        break;
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint}: ${error.response?.status || error.message}`);
    }
  }

  if (!workingEndpoint) {
    console.log('❌ No working pricing endpoint found');
    return;
  }

  try {
    // Test 1: Normal pricing (without promo)
    console.log(`📊 Test 1: Fetching normal pricing from ${workingEndpoint}...`);
    normalResponse = await axios.get(`${RESELLERCLUB_API_URL}${workingEndpoint}`, {
      params: {
        'auth-userid': RESELLERCLUB_ID,
        'api-key': RESELLERCLUB_SECRET,
        'format': 'json',
        'tlds': testTlds.join(','),
        'regperiod': '1'
      },
      timeout: 30000
    });

    console.log('✅ Normal pricing fetched successfully');
    console.log('   Response keys:', Object.keys(normalResponse.data));
    console.log('   Sample TLDs:', Object.keys(normalResponse.data).slice(0, 5));
    console.log('');

    // Test 2: Promotional pricing (with is_promo=true)
    console.log('🎯 Test 2: Fetching promotional pricing...');
    const promoResponse = await axios.get(`${RESELLERCLUB_API_URL}${workingEndpoint}`, {
      params: {
        'auth-userid': RESELLERCLUB_ID,
        'api-key': RESELLERCLUB_SECRET,
        'format': 'json',
        'tlds': testTlds.join(','),
        'regperiod': '1',
        'is_promo': 'true'
      },
      timeout: 30000
    });

    console.log('✅ Promotional pricing fetched successfully');
    console.log('   Response keys:', Object.keys(promoResponse.data));
    console.log('   Sample TLDs:', Object.keys(promoResponse.data).slice(0, 5));
    console.log('');

    // Compare normal vs promotional pricing
    console.log('🔍 Comparing Normal vs Promotional Pricing:');
    console.log('');

    const normalData = normalResponse.data;
    const promoData = promoResponse.data;

    let promotionalTlds = 0;
    let totalSavings = 0;

    for (const tld of testTlds) {
      const normalTld = normalData[tld];
      const promoTld = promoData[tld];

      if (normalTld && promoTld) {
        const normalPrice = normalTld.registration?.normal ? parseFloat(normalTld.registration.normal) / 100 : 0;
        const promoPrice = promoTld.registration?.promo ? parseFloat(promoTld.registration.promo) / 100 : 0;

        if (promoPrice > 0 && promoPrice < normalPrice) {
          const savings = normalPrice - promoPrice;
          const discountPercent = ((savings / normalPrice) * 100).toFixed(1);

          console.log(`🎉 ${tld.toUpperCase()}:`);
          console.log(`   Normal: ₹${normalPrice.toFixed(2)}`);
          console.log(`   Promo:  ₹${promoPrice.toFixed(2)}`);
          console.log(`   Savings: ₹${savings.toFixed(2)} (${discountPercent}% off)`);
          console.log('');

          promotionalTlds++;
          totalSavings += savings;
        } else if (promoPrice > 0) {
          console.log(`⚠️  ${tld.toUpperCase()}: Promo price (₹${promoPrice.toFixed(2)}) >= Normal price (₹${normalPrice.toFixed(2)})`);
        } else {
          console.log(`❌ ${tld.toUpperCase()}: No promotional pricing available`);
        }
      } else {
        console.log(`❌ ${tld.toUpperCase()}: No pricing data available`);
      }
    }

    console.log('📊 Summary:');
    console.log(`   Total TLDs tested: ${testTlds.length}`);
    console.log(`   TLDs with promotions: ${promotionalTlds}`);
    console.log(`   Total potential savings: ₹${totalSavings.toFixed(2)}`);
    console.log('');

    if (promotionalTlds > 0) {
      console.log('🎉 SUCCESS: Found promotional pricing!');
      console.log('   The ResellerClub API is returning promotional prices correctly.');
    } else {
      console.log('⚠️  WARNING: No promotional pricing found');
      console.log('   This could mean:');
      console.log('   - No active promotions for the tested TLDs');
      console.log('   - API credentials don\'t have access to promotional pricing');
      console.log('   - Promotional pricing is not available for your reseller tier');
    }

  } catch (error) {
    console.error('❌ Error testing promotional pricing:');

    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Status Text:', error.response.statusText);
      console.error('   Response Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('   Network Error: No response received');
      console.error('   Request:', error.request);
    } else {
      console.error('   Error:', error.message);
    }

    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   1. Check your ResellerClub API credentials');
    console.error('   2. Verify your reseller account has promotional pricing access');
    console.error('   3. Check if there are any active promotions for the tested TLDs');
    console.error('   4. Verify the API endpoint is correct');
  }
}

// Run the test
console.log('🚀 Starting ResellerClub Promotional Pricing Test');
console.log('='.repeat(60));
console.log('');

testPromotionalPricing()
  .then(() => {
    console.log('');
    console.log('✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
