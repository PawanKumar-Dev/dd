#!/usr/bin/env node

/**
 * =============================================================================
 * RESELLERCLUB PROMOTIONAL PRICING API TEST SCRIPT
 * =============================================================================
 * 
 * Purpose: Test ResellerClub's promotional pricing API endpoints to verify
 * that promotional prices can be fetched and compared with normal prices.
 * 
 * What it tests:
 * - Multiple ResellerClub API endpoints for pricing
 * - Normal pricing vs promotional pricing comparison
 * - Promotional discount calculations
 * - API response validation and error handling
 * 
 * Usage:
 *   node tests/api/test-promo-prices.js
 * 
 * Expected Output:
 * - Working API endpoint identification
 * - Normal vs promotional price comparison
 * - Discount calculations and savings summary
 * - Error handling and troubleshooting tips
 * 
 * Dependencies:
 * - axios (HTTP client)
 * - .env.local (environment variables)
 * 
 * Author: Excel Technologies
 * Created: 2024
 * Last Updated: 2024-10-08
 */

const axios = require('axios');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// ResellerClub API configuration
const RESELLERCLUB_API_URL = process.env.RESELLERCLUB_API_URL || 'https://httpapi.com';
const RESELLERCLUB_ID = process.env.RESELLERCLUB_ID;
const RESELLERCLUB_SECRET = process.env.RESELLERCLUB_SECRET;

/**
 * Validate that all required environment variables are set
 * 
 * This function checks for the presence of ResellerClub API credentials
 * and provides helpful error messages if any are missing.
 */
function validateEnvironment() {
  if (!RESELLERCLUB_ID || !RESELLERCLUB_SECRET) {
    console.error('❌ Missing required environment variables:');
    console.error('   RESELLERCLUB_ID:', RESELLERCLUB_ID ? '✅ Set' : '❌ Missing');
    console.error('   RESELLERCLUB_SECRET:', RESELLERCLUB_SECRET ? '✅ Set' : '❌ Missing');
    console.error('');
    console.error('🔧 To fix this:');
    console.error('   1. Copy env.example to .env.local');
    console.error('   2. Fill in your ResellerClub API credentials');
    console.error('   3. Run this script again');
    process.exit(1);
  }
}

/**
 * Display API configuration (with masked credentials for security)
 * 
 * This function shows the current API configuration while keeping
 * sensitive information secure by masking the API secret.
 */
function displayConfiguration() {
  console.log('🔧 ResellerClub API Configuration:');
  console.log('   API URL:', RESELLERCLUB_API_URL);
  console.log('   User ID:', RESELLERCLUB_ID);
  console.log('   API Key:', RESELLERCLUB_SECRET.substring(0, 8) + '...');
  console.log('');
}

// Test TLDs - modify this array to test different TLDs
const testTlds = ['com', 'net', 'org', 'info', 'biz', 'co', 'io', 'ai', 'app', 'asia', 'au', 'ca', 'cc', 'eu'];

/**
 * Test different ResellerClub API endpoints to find working ones
 * 
 * This function tries multiple possible endpoints for pricing data
 * and returns the first working one found.
 * 
 * @returns {Promise<string|null>} Working endpoint URL or null if none found
 */
async function findWorkingEndpoint() {
  console.log('🔍 Testing different API endpoints...');

  // List of possible pricing endpoints to test
  const endpoints = [
    '/api/domains/pricing.json',
    '/api/products/pricing.json',
    '/api/domains/pricing',
    '/api/products/pricing',
    '/api/domains/price.json',
    '/api/products/price.json'
  ];

  // Test each endpoint
  for (const endpoint of endpoints) {
    try {
      console.log(`   Testing: ${endpoint}`);

      const response = await axios.get(`${RESELLERCLUB_API_URL}${endpoint}`, {
        params: {
          'auth-userid': RESELLERCLUB_ID,
          'api-key': RESELLERCLUB_SECRET,
          'format': 'json',
          'tlds': 'com,net', // Test with just 2 TLDs for speed
          'regperiod': '1'
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.status === 200) {
        console.log(`   ✅ Working endpoint found: ${endpoint}`);
        return endpoint;
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint}: ${error.response?.status || error.message}`);
    }
  }

  console.log('❌ No working pricing endpoint found');
  return null;
}

/**
 * Fetch normal pricing data from ResellerClub API
 * 
 * @param {string} endpoint - Working API endpoint
 * @returns {Promise<Object>} Normal pricing data
 */
async function fetchNormalPricing(endpoint) {
  console.log(`📊 Test 1: Fetching normal pricing from ${endpoint}...`);

  const response = await axios.get(`${RESELLERCLUB_API_URL}${endpoint}`, {
    params: {
      'auth-userid': RESELLERCLUB_ID,
      'api-key': RESELLERCLUB_SECRET,
      'format': 'json',
      'tlds': testTlds.join(','),
      'regperiod': '1'
    },
    timeout: 30000 // 30 second timeout
  });

  console.log('✅ Normal pricing fetched successfully');
  console.log('   Response keys:', Object.keys(response.data));
  console.log('   Sample TLDs:', Object.keys(response.data).slice(0, 5));
  console.log('');

  return response.data;
}

/**
 * Fetch promotional pricing data from ResellerClub API
 * 
 * @param {string} endpoint - Working API endpoint
 * @returns {Promise<Object>} Promotional pricing data
 */
async function fetchPromotionalPricing(endpoint) {
  console.log('🎯 Test 2: Fetching promotional pricing...');

  const response = await axios.get(`${RESELLERCLUB_API_URL}${endpoint}`, {
    params: {
      'auth-userid': RESELLERCLUB_ID,
      'api-key': RESELLERCLUB_SECRET,
      'format': 'json',
      'tlds': testTlds.join(','),
      'regperiod': '1',
      'is_promo': 'true' // This parameter should enable promotional pricing
    },
    timeout: 30000 // 30 second timeout
  });

  console.log('✅ Promotional pricing fetched successfully');
  console.log('   Response keys:', Object.keys(response.data));
  console.log('   Sample TLDs:', Object.keys(response.data).slice(0, 5));
  console.log('');

  return response.data;
}

/**
 * Compare normal vs promotional pricing and calculate savings
 * 
 * This function analyzes the pricing data to find promotional discounts
 * and calculates the total potential savings.
 * 
 * @param {Object} normalData - Normal pricing data
 * @param {Object} promoData - Promotional pricing data
 */
function comparePricing(normalData, promoData) {
  console.log('🔍 Comparing Normal vs Promotional Pricing:');
  console.log('');

  let promotionalTlds = 0;
  let totalSavings = 0;

  // Process each test TLD
  for (const tld of testTlds) {
    const normalTld = normalData[tld];
    const promoTld = promoData[tld];

    if (normalTld && promoTld) {
      // Extract prices (convert from paise to INR by dividing by 100)
      const normalPrice = normalTld.registration?.normal ?
        parseFloat(normalTld.registration.normal) / 100 : 0;
      const promoPrice = promoTld.registration?.promo ?
        parseFloat(promoTld.registration.promo) / 100 : 0;

      // Check if this TLD has promotional pricing
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

  // Display summary
  console.log('📊 Summary:');
  console.log(`   Total TLDs tested: ${testTlds.length}`);
  console.log(`   TLDs with promotions: ${promotionalTlds}`);
  console.log(`   Total potential savings: ₹${totalSavings.toFixed(2)}`);
  console.log('');

  // Provide feedback based on results
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
}

/**
 * Handle and display errors with helpful troubleshooting information
 * 
 * @param {Error} error - The error that occurred
 */
function handleError(error) {
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
  console.error('   5. Check your internet connection');
}

/**
 * Main test function that orchestrates the entire promotional pricing test
 * 
 * This function:
 * 1. Validates environment variables
 * 2. Finds a working API endpoint
 * 3. Fetches normal and promotional pricing
 * 4. Compares the pricing data
 * 5. Displays results and summary
 */
async function testPromotionalPricing() {
  console.log('🎯 Testing ResellerClub Promotional Pricing API...');
  console.log('');

  try {
    // Step 1: Find working endpoint
    const workingEndpoint = await findWorkingEndpoint();
    if (!workingEndpoint) {
      console.log('❌ Cannot proceed without a working API endpoint');
      return;
    }

    // Step 2: Fetch normal pricing
    const normalData = await fetchNormalPricing(workingEndpoint);

    // Step 3: Fetch promotional pricing
    const promoData = await fetchPromotionalPricing(workingEndpoint);

    // Step 4: Compare and analyze pricing
    comparePricing(normalData, promoData);

  } catch (error) {
    handleError(error);
    throw error; // Re-throw to be caught by the main function
  }
}

/**
 * Main execution function
 * 
 * This is the entry point that:
 * 1. Validates the environment
 * 2. Displays configuration
 * 3. Runs the promotional pricing test
 * 4. Handles any errors and exits appropriately
 */
async function main() {
  console.log('🚀 Starting ResellerClub Promotional Pricing Test');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Validate environment
    validateEnvironment();

    // Display configuration
    displayConfiguration();

    // Run the test
    await testPromotionalPricing();

    console.log('');
    console.log('✅ Test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
main();
