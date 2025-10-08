# Testing Suite for Domain Management System

This directory contains comprehensive testing scripts for the Domain Management System, organized by category and purpose.

## 📁 Directory Structure

```
tests/
├── README.md                 # This file - testing documentation
├── api/                      # API testing scripts
│   ├── test-pricing.js       # Pricing service testing
│   ├── test-promo-prices.js  # Promotional pricing API testing
│   ├── test-all-endpoints.js # Comprehensive API endpoint testing
│   ├── test-simple-promo.js  # Simple promotional pricing verification
│   ├── test-final-promo.js   # Final promotional pricing verification
│   └── test-eu-pricing.js    # EU TLD specific testing
├── debug/                    # Debug and troubleshooting scripts
│   └── debug-promo.js        # Promotional pricing debugging
└── scripts/                  # Utility and maintenance scripts
    └── update_pricing.js     # Pricing data update utility
```

## 🧪 API Testing Scripts

### Core Pricing Tests

#### `test-pricing.js`

**Purpose**: Test the PricingService.getTLDPricing() method
**Usage**: `node tests/api/test-pricing.js`
**What it tests**:

- TLD pricing data fetching
- Promotional pricing detection
- Price comparison and validation
- Error handling and edge cases

#### `test-promo-prices.js`

**Purpose**: Test ResellerClub promotional pricing API endpoints
**Usage**: `node tests/api/test-promo-prices.js`
**What it tests**:

- Multiple ResellerClub API endpoints
- Normal vs promotional price comparison
- Promotional discount calculations
- API response validation

#### `test-all-endpoints.js`

**Purpose**: Comprehensive test of all ResellerClub API endpoints
**Usage**: `node tests/api/test-all-endpoints.js`
**What it tests**:

- All known ResellerClub API endpoints
- Response validation and data structure analysis
- Promotional pricing data detection
- Endpoint categorization and success tracking

### Promotional Pricing Tests

#### `test-simple-promo.js`

**Purpose**: Simple verification of promotional pricing capabilities
**Usage**: `node tests/api/test-simple-promo.js`
**What it tests**:

- Customer, reseller, and promotional pricing APIs
- Cross-comparison of pricing sources
- Active promotional details analysis
- Savings calculations and recommendations

#### `test-final-promo.js`

**Purpose**: Final verification of promotional pricing implementation
**Usage**: `node tests/api/test-final-promo.js`
**What it tests**:

- Complete pricing data fetching
- TLD format matching across naming conventions
- Active promotional detection and validation
- Comprehensive summary and success confirmation

#### `test-eu-pricing.js`

**Purpose**: EU TLD specific promotional pricing testing
**Usage**: `node tests/api/test-eu-pricing.js`
**What it tests**:

- EU TLD promotional pricing specifically
- Domain search API integration
- Promotional price display verification

## 🔧 Debug Scripts

### `debug-promo.js`

**Purpose**: Debug promotional pricing data and detection
**Usage**: `node tests/debug/debug-promo.js`
**What it provides**:

- Detailed promotional data analysis
- TLD matching logic debugging
- Promotional detection troubleshooting
- Data structure inspection

## 🛠️ Utility Scripts

### `update_pricing.js`

**Purpose**: Update pricing data in the system
**Usage**: `node tests/scripts/update_pricing.js`
**What it does**:

- Fetches latest pricing data from ResellerClub
- Updates local pricing cache
- Validates pricing data integrity

## 🚀 Quick Start

### Prerequisites

1. Ensure `.env.local` file exists with valid ResellerClub API credentials
2. Install dependencies: `npm install`
3. Ensure the main application is not running (to avoid port conflicts)

### Running Tests

#### Test All Promotional Pricing

```bash
# Run comprehensive promotional pricing test
node tests/api/test-final-promo.js

# Run simple promotional pricing verification
node tests/api/test-simple-promo.js
```

#### Test Specific Components

```bash
# Test pricing service
node tests/api/test-pricing.js

# Test all API endpoints
node tests/api/test-all-endpoints.js

# Test EU TLD specifically
node tests/api/test-eu-pricing.js
```

#### Debug Issues

```bash
# Debug promotional pricing
node tests/debug/debug-promo.js
```

## 📊 Expected Output

### Successful Test Output

```
🎯 Final ResellerClub Promotional Pricing Test
============================================================
   API URL: https://httpapi.com
   User ID: your-user-id
   API Key: 12345678...

📊 Fetching all pricing data from ResellerClub API...
✅ All pricing data fetched successfully!
   Customer pricing TLDs: 407
   Reseller pricing TLDs: 405
   Promotional details: 1

🎯 Promotional Details Analysis:
   Total promotions in system: 1

📋 Active Promotions Details:
   1. Product Key: doteu
      Customer Price: ₹218.90
      Reseller Price: ₹768.00
      Period: 1 year(s)
      Status: Active
      Currently Valid: Yes
      Start: 10/1/2025 12:00:00 AM
      End: 12/1/2025 11:59:59 PM
      Action Type: addnewdomain

🔍 Testing Specific TLDs for Promotional Pricing:
📋 TLD: .EU (found as: eu)
   Customer Price: ₹768.00
   Reseller Price: ₹768.00
   Margin: 0.0%
   🎉 PROMOTIONAL PRICE: ₹218.90
   💰 SAVINGS: ₹549.10 (71.5% off)
   📅 Valid: 10/1/2025 - 12/1/2025
   🎯 Action Type: addnewdomain

📊 FINAL TEST SUMMARY
==================================================
📈 Test Results:
   TLDs tested: 15
   TLDs with promotional pricing: 1
   Total potential savings: ₹549.10
   Active promotional details: 1

🎉 Promotional TLDs Found:
   .EU: Save ₹549.10 (71.5% off)

🏆 Final Assessment:
   ✅ SUCCESS: Promotional pricing is working correctly!
   ✅ The system can detect and apply promotional pricing.
   ✅ 1 TLD(s) have active promotional pricing.
   ✅ Total potential savings: ₹549.10

💡 Next Steps:
   ✅ Promotional pricing is working - no action needed
   ✅ Consider implementing automatic promotional detection in the main application
   ✅ Monitor promotional details API for new promotions

✅ Final promotional pricing test completed successfully!
```

## 🔍 Troubleshooting

### Common Issues

#### Environment Variables Not Set

```
❌ Missing required environment variables:
   RESELLERCLUB_ID: ❌ Missing
   RESELLERCLUB_SECRET: ❌ Missing
```

**Solution**: Copy `env.example` to `.env.local` and fill in your ResellerClub API credentials.

#### API Authentication Failed

```
❌ Customer pricing failed: Request failed with status code 401
```

**Solution**: Check your ResellerClub API credentials in `.env.local`.

#### No Promotional Pricing Found

```
❌ No promotional pricing found
```

**Possible causes**:

- No active promotions for tested TLDs
- Insufficient API access level
- API credentials don't have promotional pricing permissions

#### Network Timeout

```
❌ Error: timeout of 30000ms exceeded
```

**Solution**: Check your internet connection and ResellerClub API status.

### Debug Steps

1. **Check Environment**: Verify `.env.local` has correct credentials
2. **Test API Access**: Run `test-all-endpoints.js` to verify API access
3. **Debug Promotional Data**: Run `debug-promo.js` to inspect promotional data
4. **Check Logs**: Look for detailed error messages in test output

## 📝 Test Data

### Sample TLDs Tested

The tests use a comprehensive list of TLDs:

- Generic TLDs: com, net, org, info, biz
- Country TLDs: co, au, ca, cc, eu
- New TLDs: io, ai, app, asia
- Other TLDs: shop, store, online, site, website, dev, tech, digital, cloud, host

### TLD Format Variations

Tests try multiple TLD format variations for compatibility:

- Standard: `com`
- Dot prefix: `dotcom`
- CentralNic prefix: `centralniczacom`
- Uppercase: `COM`
- Lowercase: `com`

## 🔄 Maintenance

### Regular Testing

- Run `test-final-promo.js` weekly to verify promotional pricing
- Run `test-all-endpoints.js` monthly to check API endpoint status
- Run `debug-promo.js` when troubleshooting promotional pricing issues

### Updating Tests

- Add new TLDs to test arrays as they become available
- Update API endpoint lists if ResellerClub adds new endpoints
- Enhance error handling based on new error patterns

## 📞 Support

If you encounter issues with the testing suite:

1. Check the troubleshooting section above
2. Review test output for specific error messages
3. Verify ResellerClub API status and credentials
4. Contact the development team with detailed error information

---

**Last Updated**: 2024-10-08  
**Version**: 2.0.0  
**Author**: Excel Technologies
