#!/usr/bin/env node

/**
 * Debug Pricing Service
 */

require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

async function testPricingService() {
  console.log('🧪 Testing Pricing Service directly...');

  try {
    // Test the pricing service API endpoint
    const response = await axios.get('http://localhost:3000/api/admin/tld-pricing?tlds=ai');

    console.log('📊 TLD Pricing Response:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testPricingService();
