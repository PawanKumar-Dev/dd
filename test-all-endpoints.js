#!/usr/bin/env node

/**
 * Comprehensive test of all ResellerClub API endpoints
 * to find which ones work and what promotional pricing is available
 */

const axios = require('axios');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const RESELLERCLUB_API_URL = process.env.RESELLERCLUB_API_URL || 'https://httpapi.com';
const RESELLERCLUB_ID = process.env.RESELLERCLUB_ID;
const RESELLERCLUB_SECRET = process.env.RESELLERCLUB_SECRET;

console.log('🔧 Testing All ResellerClub API Endpoints...');
console.log('   API URL:', RESELLERCLUB_API_URL);
console.log('   User ID:', RESELLERCLUB_ID);
console.log('');

// Test all possible endpoints
const endpoints = [
  // Products endpoints
  { name: 'Customer Price', url: '/api/products/customer-price.json' },
  { name: 'Reseller Price', url: '/api/products/reseller-price.json' },
  { name: 'Promo Price', url: '/api/products/promo-price.json' },
  { name: 'Pricing', url: '/api/products/pricing.json' },
  { name: 'Price', url: '/api/products/price.json' },

  // Domains endpoints
  { name: 'Domains Pricing', url: '/api/domains/pricing.json' },
  { name: 'Domains Price', url: '/api/domains/price.json' },
  { name: 'Domains Available', url: '/api/domains/available.json' },

  // Resellers endpoints
  { name: 'Promo Details', url: '/api/resellers/promo-details.json' },
  { name: 'Reseller Pricing', url: '/api/resellers/pricing.json' },
  { name: 'Reseller Price', url: '/api/resellers/price.json' },

  // Other possible endpoints
  { name: 'Pricing Info', url: '/api/pricing.json' },
  { name: 'Price Info', url: '/api/price.json' },
  { name: 'Promotions', url: '/api/promotions.json' },
  { name: 'Promo', url: '/api/promo.json' },
];

async function testEndpoint(endpoint) {
  try {
    const response = await axios.get(`${RESELLERCLUB_API_URL}${endpoint.url}`, {
      params: {
        'auth-userid': RESELLERCLUB_ID,
        'api-key': RESELLERCLUB_SECRET,
        'format': 'json'
      },
      timeout: 10000
    });

    if (response.status === 200) {
      const data = response.data;
      const keys = Object.keys(data);

      console.log(`✅ ${endpoint.name}: ${endpoint.url}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Keys: ${keys.length} (${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''})`);

      // Check if it looks like pricing data
      if (keys.length > 0) {
        const firstKey = keys[0];
        const firstItem = data[firstKey];

        if (typeof firstItem === 'object' && firstItem !== null) {
          const itemKeys = Object.keys(firstItem);
          console.log(`   Sample item keys: ${itemKeys.join(', ')}`);

          // Check for pricing-related keys
          const pricingKeys = itemKeys.filter(key =>
            key.toLowerCase().includes('price') ||
            key.toLowerCase().includes('cost') ||
            key.toLowerCase().includes('promo') ||
            key.toLowerCase().includes('addnewdomain') ||
            key.toLowerCase().includes('registration')
          );

          if (pricingKeys.length > 0) {
            console.log(`   🎯 Pricing keys found: ${pricingKeys.join(', ')}`);
          }
        }
      }

      console.log('');
      return { success: true, data, keys };
    }
  } catch (error) {
    console.log(`❌ ${endpoint.name}: ${endpoint.url}`);
    console.log(`   Status: ${error.response?.status || 'Error'}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    console.log('');
    return { success: false, error };
  }
}

async function testAllEndpoints() {
  console.log('🔍 Testing all possible endpoints...');
  console.log('');

  const results = [];

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push({ ...endpoint, ...result });
  }

  console.log('📊 Summary:');
  console.log('');

  const workingEndpoints = results.filter(r => r.success);
  const failedEndpoints = results.filter(r => !r.success);

  console.log(`✅ Working endpoints: ${workingEndpoints.length}`);
  workingEndpoints.forEach(endpoint => {
    console.log(`   - ${endpoint.name}: ${endpoint.url}`);
  });
  console.log('');

  console.log(`❌ Failed endpoints: ${failedEndpoints.length}`);
  failedEndpoints.forEach(endpoint => {
    console.log(`   - ${endpoint.name}: ${endpoint.url}`);
  });
  console.log('');

  // If we found working endpoints, analyze them for promotional pricing
  if (workingEndpoints.length > 0) {
    console.log('🔍 Analyzing working endpoints for promotional pricing...');
    console.log('');

    for (const endpoint of workingEndpoints) {
      if (endpoint.data) {
        console.log(`📋 ${endpoint.name}:`);

        // Look for promotional pricing patterns
        const sampleKeys = endpoint.keys.slice(0, 3);
        for (const key of sampleKeys) {
          const item = endpoint.data[key];
          if (typeof item === 'object' && item !== null) {
            console.log(`   ${key}:`, JSON.stringify(item, null, 2).substring(0, 200) + '...');
          }
        }
        console.log('');
      }
    }
  }
}

testAllEndpoints().catch(console.error);
