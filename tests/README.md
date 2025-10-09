# Testing Suite for Domain Management System

This directory contains comprehensive testing scripts for the Domain Management System, organized by category and purpose.

## 📁 Directory Structure

```
tests/
├── README.md                 # This file - testing documentation
├── run-tests.js             # Centralized test runner
├── api/                      # API testing scripts
│   ├── test-pricing.js       # Pricing service testing
│   ├── test-tld-mappings.js  # TLD mapping testing
│   ├── test-all-endpoints.js # Comprehensive API endpoint testing
│   ├── test-simple-pricing.js # Simple pricing verification
│   ├── test-final-pricing.js  # Final pricing verification
│   └── test-eu-pricing.js    # EU TLD specific testing
├── admin/                    # Admin functionality tests
│   ├── test-ip-check.js      # IP check database functionality
│   └── test-delete-order.js  # Order deletion functionality
├── payment/                  # Payment system tests
│   ├── test-payment-success.js # Payment success page testing
│   └── test-error-handling.js  # Payment error handling testing
├── pricing/                  # Pricing system tests
│   ├── test-ai-pricing.js    # AI TLD pricing testing
│   └── test-pricing-debug.js # Pricing debugging tests
├── debug/                    # Debug and troubleshooting scripts
│   ├── debug-pricing.js      # Pricing debugging
│   └── debug-ai-pricing.js   # AI pricing debugging
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
- TLD mapping accuracy
- Price comparison and validation
- Error handling and edge cases

#### `test-tld-mappings.js`

**Purpose**: Test TLD mapping accuracy and coverage
**Usage**: `node tests/api/test-tld-mappings.js`
**What it tests**:

- TLD mapping accuracy for 200+ TLDs
- ResellerClub API key format validation
- Priority-based lookup testing
- Fallback mechanism validation

#### `test-all-endpoints.js`

**Purpose**: Comprehensive test of all ResellerClub API endpoints
**Usage**: `node tests/api/test-all-endpoints.js`
**What it tests**:

- All known ResellerClub API endpoints
- Response validation and data structure analysis
- TLD pricing data detection
- Endpoint categorization and success tracking

### TLD Pricing Tests

#### `test-simple-pricing.js`

**Purpose**: Simple verification of TLD pricing capabilities
**Usage**: `node tests/api/test-simple-pricing.js`
**What it tests**:

- Customer and reseller pricing APIs
- TLD mapping validation
- Price accuracy verification
- Performance testing

#### `test-final-pricing.js`

**Purpose**: Final verification of TLD pricing implementation
**Usage**: `node tests/api/test-final-pricing.js`
**What it tests**:

- Complete pricing data fetching
- TLD format matching across naming conventions
- TLD mapping accuracy validation
- Comprehensive summary and success confirmation

#### `test-eu-pricing.js`

**Purpose**: EU TLD specific pricing testing
**Usage**: `node tests/api/test-eu-pricing.js`
**What it tests**:

- EU TLD pricing accuracy
- Domain search API integration
- Price display verification

## 🔧 Debug Scripts

### `debug-pricing.js`

**Purpose**: Debug TLD pricing data and mappings
**Usage**: `node tests/debug/debug-pricing.js`
**What it provides**:

- Detailed pricing data analysis
- TLD mapping logic debugging
- Pricing detection troubleshooting
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

#### Test All TLD Pricing

```bash
# Run comprehensive TLD pricing test
node tests/api/test-final-pricing.js

# Run simple pricing verification
node tests/api/test-simple-pricing.js
```

#### Test Specific Components

```bash
# Test pricing service
node tests/api/test-pricing.js

# Test TLD mappings
node tests/api/test-tld-mappings.js

# Test all API endpoints
node tests/api/test-all-endpoints.js

# Test EU TLD specifically
node tests/api/test-eu-pricing.js
```

#### Debug Issues

```bash
# Debug pricing and mappings
node tests/debug/debug-pricing.js
```

## 📊 Expected Output

### Successful Test Output

```
🎯 Final ResellerClub TLD Pricing Test
============================================================
   API URL: https://httpapi.com
   User ID: your-user-id
   API Key: 12345678...

📊 Fetching all pricing data from ResellerClub API...
✅ All pricing data fetched successfully!
   Customer pricing TLDs: 407
   Reseller pricing TLDs: 405

🔍 Testing TLD Mappings and Pricing:
📋 TLD: .COM (mapped to: domcno)
   Customer Price: ₹1,198.80
   Reseller Price: ₹1,000.00
   Margin: 16.6%

📋 TLD: .NET (mapped to: dotnet)
   Customer Price: ₹1,558.80
   Reseller Price: ₹1,300.00
   Margin: 16.6%

📋 TLD: .INFO (mapped to: dominfo)
   Customer Price: ₹2,494.80
   Reseller Price: ₹2,000.00
   Margin: 19.8%

📋 TLD: .EU (mapped to: doteu)
   Customer Price: ₹768.00
   Reseller Price: ₹600.00
   Margin: 21.9%

📊 FINAL TEST SUMMARY
==================================================
📈 Test Results:
   TLDs tested: 20
   TLDs with accurate pricing: 20
   TLD mappings working: 20
   Average margin: 18.7%

🏆 Final Assessment:
   ✅ SUCCESS: TLD pricing system is working correctly!
   ✅ All TLD mappings are accurate.
   ✅ Pricing data is being fetched successfully.
   ✅ 20 TLD(s) have valid pricing data.

💡 Next Steps:
   ✅ TLD pricing system is working - no action needed
   ✅ Monitor ResellerClub API for pricing updates
   ✅ Consider adding more TLD mappings as needed

✅ Final TLD pricing test completed successfully!
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

- Run `test-final-pricing.js` weekly to verify TLD pricing
- Run `test-all-endpoints.js` monthly to check API endpoint status
- Run `debug-pricing.js` when troubleshooting pricing issues

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
