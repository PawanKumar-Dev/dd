#!/usr/bin/env node

/**
 * Debug script to check promotional pricing data
 */

const axios = require('axios');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const RESELLERCLUB_API_URL = process.env.RESELLERCLUB_API_URL || 'https://httpapi.com';
const RESELLERCLUB_ID = process.env.RESELLERCLUB_ID;
const RESELLERCLUB_SECRET = process.env.RESELLERCLUB_SECRET;

async function debugPromotionalPricing() {
  try {
    console.log('🔍 Debugging promotional pricing data...');

    // Fetch promotional details
    const promoResponse = await axios.get(`${RESELLERCLUB_API_URL}/api/resellers/promo-details.json`, {
      params: {
        'auth-userid': RESELLERCLUB_ID,
        'api-key': RESELLERCLUB_SECRET,
        'format': 'json'
      },
      timeout: 30000
    });

    console.log('📊 Promotional Details Response:');
    console.log('   Status:', promoResponse.status);
    console.log('   Keys:', Object.keys(promoResponse.data));
    console.log('   Data:', JSON.stringify(promoResponse.data, null, 2));

    // Check for doteu promotion
    const promotions = Object.values(promoResponse.data);
    console.log('\n🎯 Active Promotions:');
    promotions.forEach((promo, index) => {
      console.log(`   ${index + 1}. Product Key: ${promo.productkey}`);
      console.log(`      Active: ${promo.isactive}`);
      console.log(`      Customer Price: ${promo.customerprice}`);
      console.log(`      Start Time: ${promo.starttime}`);
      console.log(`      End Time: ${promo.endtime}`);
      console.log('');
    });

    // Check if doteu promotion exists
    const doteuPromotion = promotions.find(promo =>
      promo.productkey && promo.productkey.toLowerCase().includes('doteu')
    );

    if (doteuPromotion) {
      console.log('✅ Found doteu promotion:');
      console.log('   Product Key:', doteuPromotion.productkey);
      console.log('   Active:', doteuPromotion.isactive);
      console.log('   Customer Price:', doteuPromotion.customerprice);

      // Check time validity
      const now = new Date();
      const startTime = new Date(parseInt(doteuPromotion.starttime) * 1000);
      const endTime = new Date(parseInt(doteuPromotion.endtime) * 1000);

      console.log('   Current Time:', now.toISOString());
      console.log('   Start Time:', startTime.toISOString());
      console.log('   End Time:', endTime.toISOString());
      console.log('   Is Active Now:', now >= startTime && now <= endTime);
    } else {
      console.log('❌ No doteu promotion found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

debugPromotionalPricing();
