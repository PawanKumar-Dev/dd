#!/usr/bin/env node

/**
 * Debug AI TLD Pricing
 * 
 * This script debugs why .ai TLD pricing is not working
 */

require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

async function debugAIPricing() {
  console.log('🔍 Debugging .ai TLD Pricing');
  console.log('============================');

  try {
    const api = axios.create({
      baseURL: process.env.RESELLERCLUB_API_URL,
      timeout: 30000,
    });

    api.interceptors.request.use((config) => {
      config.params = {
        ...config.params,
        'auth-userid': process.env.RESELLERCLUB_ID,
        'api-key': process.env.RESELLERCLUB_SECRET,
        'reseller-id': process.env.RESELLERCLUB_ID,
      };
      return config;
    });

    // Fetch customer pricing data
    console.log('📊 Fetching customer pricing data...');
    const customerResponse = await api.get('/api/products/customer-price.json');
    const customerData = customerResponse.data;

    console.log(`✅ Customer pricing data fetched: ${Object.keys(customerData).length} TLDs`);

    // Test different variations for .ai TLD
    const aiVariations = [
      'ai',
      '.ai',
      'AI',
      'dotai',
      'domai',
      'centralniczai',
      'centralnicusai'
    ];

    console.log('\n🔍 Testing .ai TLD variations:');

    for (const variation of aiVariations) {
      if (customerData[variation]) {
        const price = parseFloat(customerData[variation].addnewdomain?.['1'] || 0);
        console.log(`   ✅ ${variation}: Found - ₹${price}`);

        if (price > 0) {
          console.log(`      📋 Full data:`, JSON.stringify(customerData[variation], null, 2));
        }
      } else {
        console.log(`   ❌ ${variation}: Not found`);
      }
    }

    // Search for any keys containing 'ai'
    console.log('\n🔍 Searching for keys containing "ai":');
    const aiKeys = Object.keys(customerData).filter(key => key.toLowerCase().includes('ai'));
    console.log(`   Found ${aiKeys.length} keys containing "ai":`, aiKeys);

    for (const key of aiKeys) {
      const price = parseFloat(customerData[key].addnewdomain?.['1'] || 0);
      console.log(`   ${key}: ₹${price}`);
    }

    // Test domain search for .ai
    console.log('\n🔍 Testing domain search for .ai:');
    const searchResponse = await api.get('/api/domains/available.json', {
      params: {
        'domain-name': 'test',
        tlds: 'ai'
      }
    });

    console.log('   Domain search response:', searchResponse.data);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugAIPricing();
