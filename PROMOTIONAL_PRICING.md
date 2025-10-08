# Promotional Pricing System

This document provides comprehensive documentation for the promotional pricing system implemented in the Domain Management System.

## Overview

The promotional pricing system fetches data from multiple ResellerClub APIs to provide accurate promotional pricing information, automatically detecting and applying promotional discounts when available.

## Architecture

### Multi-API Integration

The system fetches pricing data from three ResellerClub APIs in parallel:

1. **Customer Price API** (`/api/products/customer-price.json`)
   - Customer-facing prices (what users see)
   - Includes markup and standard pricing

2. **Reseller Price API** (`/api/products/reseller-price.json`)
   - Base reseller costs (what you pay)
   - No markup or promotional discounts

3. **Promo Price API** (`/api/products/promo-price.json`)
   - Promotional/discounted prices
   - Limited-time offers and special pricing

### Two-Tier Detection System

#### Primary: Promo API Detection
- Fetches promotional prices directly from ResellerClub's promo API
- Compares promo price with customer price
- Applies promotional pricing when `promoPrice < customerPrice`
- Most reliable source for current promotional offers

#### Fallback: Promotional Data API
- Uses promotional details API for additional promotion information
- Checks active promotions based on TLD and time periods
- Provides backup promotional pricing when promo API doesn't have data

## Implementation Details

### ResellerClubAPI.getDomainPricing()

```typescript
static async getDomainPricing(): Promise<any> {
  // Fetch all three pricing APIs in parallel
  const [
    customerPricingResponse,
    resellerPricingResponse,
    promoPricingResponse,
  ] = await Promise.all([
    api.get("/api/products/customer-price.json"),
    api.get("/api/products/reseller-price.json"),
    api.get("/api/products/promo-price.json"),
  ]);

  return {
    customerPricing: customerPricingResponse.data,
    resellerPricing: resellerPricingResponse.data,
    promoPricing: promoPricingResponse.data,
    timestamp: new Date().toISOString(),
  };
}
```

### PricingService.getTLDPricing()

The pricing service implements the core promotional pricing logic:

1. **Extract Pricing Data**: Gets customer, reseller, and promo prices for each TLD
2. **Compare Prices**: Checks if promo price is lower than customer price
3. **Apply Promotional Pricing**: Sets promotional flags and details when applicable
4. **Return Enhanced Data**: Includes original price, promotional status, and details

```typescript
// Extract promo registration price (1 year) - this is the discounted price
let promoPrice = 0;
if (
  promoPricing &&
  promoPricing.addnewdomain &&
  promoPricing.addnewdomain["1"]
) {
  promoPrice = parseFloat(promoPricing.addnewdomain["1"]);
}

// First, check if we have promo pricing from the API (most reliable)
if (promotionalPricingEnabled && promoPrice > 0 && promoPrice < customerPrice) {
  finalCustomerPrice = promoPrice;
  isPromotional = true;
  promotionalDetails = {
    source: "promo-api",
    originalCustomerPrice: customerPrice,
    promotionalPrice: promoPrice,
    discount: customerPrice - promoPrice,
  };
}
```

## Data Structure

### Domain Search Response

When a domain has promotional pricing, the response includes:

```json
{
  "domainName": "example.eu",
  "available": true,
  "price": 198,
  "currency": "INR",
  "registrationPeriod": 1,
  "pricingSource": "live",
  "originalPrice": 768,
  "isPromotional": true,
  "promotionalDetails": {
    "source": "promo-api",
    "originalCustomerPrice": 768,
    "promotionalPrice": 198,
    "discount": 570
  }
}
```

### Promotional Details Fields

- **source**: Indicates data source (`"promo-api"` or `"promo-data"`)
- **originalCustomerPrice**: Original customer price before promotion
- **promotionalPrice**: Discounted promotional price
- **discount**: Amount saved (original - promotional)
- **startTime**: Promotion start time (for promo-data source)
- **endTime**: Promotion end time (for promo-data source)
- **period**: Promotion period (for promo-data source)

## Frontend Integration

### Visual Indicators

The frontend displays promotional pricing with:

1. **Strikethrough Original Price**: Shows the original price with strikethrough
2. **PROMO Badge**: Visual indicator next to promotional prices
3. **Price Highlighting**: Promotional prices are highlighted in a different color
4. **Discount Display**: Shows the amount saved

### Component Usage

```tsx
{result.isPromotional && (
  <div className="flex items-center gap-2">
    <span className="text-sm text-gray-500 line-through">
      ₹{result.originalPrice}
    </span>
    <span className="text-lg font-bold text-green-600">
      ₹{result.price}
    </span>
    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
      PROMO
    </span>
  </div>
)}
```

## Admin Configuration

### Toggle Promotional Pricing

Admins can enable/disable promotional pricing display:

- **GET** `/api/admin/settings/promotional-pricing` - Get current setting
- **POST** `/api/admin/settings/promotional-pricing` - Update setting

```json
{
  "enabled": true
}
```

### Settings Response

```json
{
  "success": true,
  "isEnabled": true,
  "lastUpdated": "2024-01-15T10:30:00Z",
  "updatedBy": "admin@example.com"
}
```

## Performance Considerations

### Parallel API Calls

All three pricing APIs are fetched in parallel to minimize latency:

```typescript
const [customerPricingResponse, resellerPricingResponse, promoPricingResponse] = 
  await Promise.all([
    api.get("/api/products/customer-price.json"),
    api.get("/api/products/reseller-price.json"),
    api.get("/api/products/promo-price.json"),
  ]);
```

### Caching

- Pricing data is cached for performance
- Promotional pricing is checked in real-time
- Cache invalidation occurs when promotional settings change

## Error Handling

### API Failures

- If promo API fails, falls back to promotional data API
- If both fail, displays standard pricing without promotional indicators
- Graceful degradation ensures system remains functional

### Data Validation

- Validates promo price is lower than customer price before applying
- Checks for valid numeric values in pricing data
- Handles missing or malformed promotional data gracefully

## Monitoring and Logging

### Debug Logging

The system includes comprehensive logging for promotional pricing:

```
✅ [PRICING] Applied promo API pricing for eu: Original ₹768 → Promotional ₹198
🎯 [PRICING] Found promo price for eu: ₹198
✅ [PRICING] Applied promotional data pricing for com: Original ₹1200 → Promotional ₹999
```

### Metrics

- Tracks number of TLDs with promotional pricing
- Monitors promotional pricing application success rate
- Logs promotional pricing source (API vs data)

## Troubleshooting

### Common Issues

1. **No Promotional Pricing Detected**
   - Check if promotional pricing is enabled in admin settings
   - Verify ResellerClub API credentials and permissions
   - Check if promo API has data for the specific TLD

2. **Incorrect Promotional Prices**
   - Verify promo API data structure matches expected format
   - Check TLD matching logic for different TLD formats
   - Ensure price comparison logic is working correctly

3. **Performance Issues**
   - Monitor API response times
   - Check for API rate limiting
   - Verify parallel API calls are working correctly

### Debug Steps

1. Check server logs for promotional pricing debug messages
2. Verify API responses contain expected pricing data
3. Test with different TLDs to isolate TLD-specific issues
4. Check admin promotional pricing settings

## Future Enhancements

### Planned Features

1. **Promotional Period Display**: Show promotion end dates
2. **Bulk Promotional Updates**: Update multiple TLDs at once
3. **Promotional Analytics**: Track promotional pricing performance
4. **Custom Promotional Rules**: Admin-defined promotional pricing rules
5. **A/B Testing**: Test different promotional pricing strategies

### API Improvements

1. **Webhook Support**: Real-time promotional pricing updates
2. **Batch Processing**: Process multiple TLDs in single request
3. **Promotional History**: Track promotional pricing changes over time
4. **Advanced Filtering**: Filter promotional pricing by criteria
