#!/usr/bin/env node

/**
 * =============================================================================
 * PROMOTIONAL PRICING DEBUG SCRIPT
 * =============================================================================
 * 
 * Purpose: Debug and troubleshoot promotional pricing data and detection
 * issues by providing detailed analysis of ResellerClub promotional data.
 * 
 * What it provides:
 * - Raw promotional details API response
 * - Active promotions analysis and validation
 * - TLD-specific promotion detection
 * - Time validity checking for promotions
 * - Detailed debugging information
 * 
 * Usage:
 *   node tests/debug/debug-promo.js
 * 
 * When to use:
 * - When promotional pricing is not working as expected
 * - To verify promotional data is being fetched correctly
 * - To debug TLD matching issues
 * - To check promotion validity periods
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
 */
function validateEnvironment() {
  if (!RESELLERCLUB_ID || !RESELLERCLUB_SECRET) {
    console.error('❌ Missing required environment variables:');
    console.error('   RESELLERCLUB_ID:', RESELLERCLUB_ID ? '✅ Set' : '❌ Missing');
    console.error('   RESELLERCLUB_SECRET:', RESELLERCLUB_SECRET ? '✅ Set' : '❌ Missing');
    process.exit(1);
  }
}

/**
 * Display API configuration
 */
function displayConfiguration() {
  console.log('🔍 Promotional Pricing Debug Tool');
  console.log('='.repeat(50));
  console.log('   API URL:', RESELLERCLUB_API_URL);
  console.log('   User ID:', RESELLERCLUB_ID);
  console.log('   API Key:', RESELLERCLUB_SECRET.substring(0, 8) + '...');
  console.log('');
}

/**
 * Fetch and analyze promotional details from ResellerClub API
 * 
 * This function fetches the raw promotional details data and provides
 * comprehensive analysis for debugging promotional pricing issues.
 * 
 * @returns {Promise<Object>} Promotional details data
 */
async function fetchPromotionalDetails() {
  console.log('📡 Fetching promotional details from ResellerClub API...');
  console.log('   Endpoint: /api/resellers/promo-details.json');
  console.log('');

  try {
    const response = await axios.get(`${RESELLERCLUB_API_URL}/api/resellers/promo-details.json`, {
      params: {
        'auth-userid': RESELLERCLUB_ID,
        'api-key': RESELLERCLUB_SECRET,
        'format': 'json'
      },
      timeout: 30000
    });

    console.log('✅ Promotional details fetched successfully!');
    console.log(`   Response Status: ${response.status}`);
    console.log(`   Response Keys: ${Object.keys(response.data).length}`);
    console.log('');

    return response.data;

  } catch (error) {
    console.error('❌ Failed to fetch promotional details:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Display raw promotional details response for debugging
 * 
 * @param {Object} promoData - Raw promotional details data
 */
function displayRawResponse(promoData) {
  console.log('📊 Raw Promotional Details Response:');
  console.log('='.repeat(45));
  console.log(JSON.stringify(promoData, null, 2));
  console.log('');
}

/**
 * Analyze active promotions and their characteristics
 * 
 * @param {Object} promoData - Promotional details data
 */
function analyzeActivePromotions(promoData) {
  console.log('🎯 Active Promotions Analysis:');
  console.log('='.repeat(35));
  console.log('');

  const promotions = Object.values(promoData);
  console.log(`   Total promotions in system: ${promotions.length}`);
  console.log('');

  if (promotions.length === 0) {
    console.log('   ⚠️  No promotions found in the system');
    console.log('   This could mean:');
    console.log('   - No active promotions currently available');
    console.log('   - API credentials don\'t have promotional access');
    console.log('   - Promotional details API is not working');
    return;
  }

  // Display all promotions with detailed information
  promotions.forEach((promo, index) => {
    console.log(`   ${index + 1}. Promotion Details:`);
    console.log(`      Product Key: ${promo.productkey}`);
    console.log(`      Active Status: ${promo.isactive}`);
    console.log(`      Customer Price: ₹${promo.customerprice}`);
    console.log(`      Reseller Price: ₹${promo.resellerprice}`);
    console.log(`      Period: ${promo.period} year(s)`);
    console.log(`      Action Type: ${promo.actiontype}`);

    // Time validity analysis
    const now = new Date();
    const startTime = new Date(parseInt(promo.starttime) * 1000);
    const endTime = new Date(parseInt(promo.endtime) * 1000);
    const isCurrentlyActive = now >= startTime && now <= endTime;

    console.log(`      Start Time: ${startTime.toISOString()}`);
    console.log(`      End Time: ${endTime.toISOString()}`);
    console.log(`      Current Time: ${now.toISOString()}`);
    console.log(`      Is Currently Active: ${isCurrentlyActive ? 'Yes' : 'No'}`);

    if (!isCurrentlyActive) {
      if (now < startTime) {
        console.log(`      ⏰ Promotion starts in: ${Math.ceil((startTime - now) / (1000 * 60 * 60 * 24))} days`);
      } else {
        console.log(`      ⏰ Promotion ended: ${Math.ceil((now - endTime) / (1000 * 60 * 60 * 24))} days ago`);
      }
    }

    console.log('');
  });
}

/**
 * Check for specific TLD promotions (like .eu)
 * 
 * @param {Array} promotions - Array of promotional details
 * @param {string} targetTld - TLD to search for (e.g., 'eu')
 */
function checkSpecificTldPromotions(promotions, targetTld) {
  console.log(`🔍 Checking for ${targetTld.toUpperCase()} TLD Promotions:`);
  console.log('='.repeat(45));
  console.log('');

  // Try different TLD format variations
  const tldVariations = [
    targetTld.toLowerCase(),
    `dot${targetTld.toLowerCase()}`,
    `centralnicza${targetTld.toLowerCase()}`,
    targetTld.toUpperCase(),
    `DOT${targetTld.toUpperCase()}`,
    `CENTRALNICZA${targetTld.toUpperCase()}`
  ];

  console.log(`   Searching for TLD variations: ${tldVariations.join(', ')}`);
  console.log('');

  let foundPromotions = [];

  // Search for matching promotions
  tldVariations.forEach(variation => {
    const matchingPromos = promotions.filter(promo =>
      promo.productkey &&
      promo.productkey.toLowerCase().includes(variation.toLowerCase())
    );

    if (matchingPromos.length > 0) {
      console.log(`   ✅ Found ${matchingPromos.length} promotion(s) for variation "${variation}":`);
      matchingPromos.forEach((promo, index) => {
        console.log(`      ${index + 1}. Product Key: ${promo.productkey}`);
        console.log(`         Active: ${promo.isactive}`);
        console.log(`         Customer Price: ₹${promo.customerprice}`);
        console.log(`         Reseller Price: ₹${promo.resellerprice}`);

        // Check time validity
        const now = new Date();
        const startTime = new Date(parseInt(promo.starttime) * 1000);
        const endTime = new Date(parseInt(promo.endtime) * 1000);
        const isCurrentlyActive = now >= startTime && now <= endTime;

        console.log(`         Currently Active: ${isCurrentlyActive ? 'Yes' : 'No'}`);
        console.log(`         Valid Period: ${startTime.toLocaleDateString()} - ${endTime.toLocaleDateString()}`);
        console.log('');
      });

      foundPromotions.push(...matchingPromos);
    }
  });

  if (foundPromotions.length === 0) {
    console.log(`   ❌ No promotions found for ${targetTld.toUpperCase()} TLD`);
    console.log('   This could mean:');
    console.log('   - No active promotions for this TLD');
    console.log('   - TLD name format doesn\'t match any promotions');
    console.log('   - Promotions exist but with different naming conventions');
  } else {
    console.log(`   🎉 Found ${foundPromotions.length} total promotion(s) for ${targetTld.toUpperCase()} TLD`);
  }

  console.log('');
}

/**
 * Test TLD matching logic used in the application
 * 
 * @param {Array} promotions - Array of promotional details
 * @param {string} testTld - TLD to test matching for
 */
function testTldMatchingLogic(promotions, testTld) {
  console.log(`🧪 Testing TLD Matching Logic for "${testTld}":`);
  console.log('='.repeat(50));
  console.log('');

  const cleanTld = testTld.toLowerCase();
  let matchingPromotions = 0;

  console.log(`   Testing TLD: ${cleanTld}`);
  console.log('   Using application matching logic:');
  console.log('   - productkey.includes(tld)');
  console.log('   - productkey === `dot${tld}`');
  console.log('   - productkey === `centralnicza${tld}`');
  console.log('');

  promotions.forEach((promo, index) => {
    if (!promo.productkey) return;

    const productKey = promo.productkey.toLowerCase();
    const tldMatches =
      productKey.includes(cleanTld) ||
      productKey === `dot${cleanTld}` ||
      productKey === `centralnicza${cleanTld}`;

    console.log(`   ${index + 1}. Product Key: ${promo.productkey}`);
    console.log(`      Includes "${cleanTld}": ${productKey.includes(cleanTld)}`);
    console.log(`      Equals "dot${cleanTld}": ${productKey === `dot${cleanTld}`}`);
    console.log(`      Equals "centralnicza${cleanTld}": ${productKey === `centralnicza${cleanTld}`}`);
    console.log(`      Final Match: ${tldMatches ? '✅ Yes' : '❌ No'}`);

    if (tldMatches) {
      matchingPromotions++;
      console.log(`      🎯 This promotion would be selected for ${testTld} TLD`);
    }
    console.log('');
  });

  console.log(`   📊 Matching Results:`);
  console.log(`      Total promotions tested: ${promotions.length}`);
  console.log(`      Matching promotions: ${matchingPromotions}`);
  console.log(`      Match rate: ${((matchingPromotions / promotions.length) * 100).toFixed(1)}%`);
  console.log('');
}

/**
 * Main debug function that orchestrates all debugging operations
 * 
 * This function:
 * 1. Validates the environment
 * 2. Fetches promotional details from ResellerClub
 * 3. Displays raw response for inspection
 * 4. Analyzes active promotions
 * 5. Checks for specific TLD promotions
 * 6. Tests TLD matching logic
 */
async function debugPromotionalPricing() {
  try {
    // Validate environment
    validateEnvironment();
    displayConfiguration();

    // Fetch promotional details
    const promoData = await fetchPromotionalDetails();

    // Display raw response
    displayRawResponse(promoData);

    // Analyze active promotions
    const promotions = Object.values(promoData);
    analyzeActivePromotions(promoData);

    // Check for specific TLD promotions
    checkSpecificTldPromotions(promotions, 'eu');

    // Test TLD matching logic
    testTldMatchingLogic(promotions, 'eu');

    console.log('✅ Promotional pricing debug completed!');
    console.log('');
    console.log('💡 Debug Summary:');
    console.log('   - Check the raw response above for data structure');
    console.log('   - Verify active promotions are currently valid');
    console.log('   - Confirm TLD matching logic is working correctly');
    console.log('   - Use this information to troubleshoot promotional pricing issues');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    await debugPromotionalPricing();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the promotional pricing debug tool
main();