#!/usr/bin/env node

/**
 * Test script to verify .eu promotional pricing
 */

const axios = require('axios');

async function testEuPricing() {
  try {
    console.log('🔍 Testing .eu promotional pricing...');

    const response = await axios.post('http://localhost:3000/api/domains/search', {
      domain: 'anutech',
      tlds: 'eu'
    }, {
      timeout: 30000
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));

    if (response.data.domains && response.data.domains.length > 0) {
      const domain = response.data.domains[0];
      console.log('\n🎯 Domain Search Result:');
      console.log('   Domain:', domain.domainName);
      console.log('   Price:', domain.price);
      console.log('   Currency:', domain.currency);
      console.log('   Is Promotional:', domain.isPromotional);
      console.log('   Original Price:', domain.originalPrice);
      console.log('   Promotional Details:', domain.promotionalDetails);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testEuPricing();
