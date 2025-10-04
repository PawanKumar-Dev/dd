# Testing Mode Documentation

## Overview

Testing Mode allows you to test the complete application flow by simulating only ResellerClub API calls while keeping all other functionality (cart, payments, user management, admin) working exactly like in production. This is perfect for development, testing, and demonstrations.

## Features

### 🧪 Mock API Responses (ResellerClub Only)

- **Domain Search**: Always returns available domains with mock pricing
- **Domain Registration**: Simulates successful domain registration
- **DNS Management**: Simulates DNS record operations
- **Domain Renewal/Transfer**: Simulates domain operations

### ✅ Real Functionality (Production Mode)

- **Cart Management**: Works normally with real data
- **Payment Processing**: Uses real Razorpay (with test credentials)
- **User Management**: Real user accounts and authentication
- **Admin Panel**: Real admin functionality and data

### 🎛️ Easy Toggle

- **Admin Settings**: Toggle testing mode on/off in Admin Settings > Testing Mode
- **Visual Indicator**: Yellow indicator appears when testing mode is active
- **Persistent State**: Setting is saved and persists across sessions

## How to Use

### 1. Enable Testing Mode

1. Go to **Admin Dashboard** → **Settings** → **Testing Mode** tab
2. Toggle the switch to enable testing mode
3. You'll see a yellow indicator in the top-right corner

### 2. Test Domain Search

1. Go to the homepage or any page with domain search
2. Search for any domain name
3. All searches will return mock available domains

### 3. Test Cart and Checkout

1. Add domains to your cart
2. Proceed to checkout
3. Complete payment with test credentials
4. Domain registration will be simulated

### 4. Test Mode Page

- Visit `/test-mode` for a dedicated testing interface
- Access from Admin Dashboard → Quick Actions → Test Mode

## Technical Details

### API Wrapper

The system uses `ResellerClubWrapper` which automatically switches between:

- **Production**: Real ResellerClub API calls
- **Testing**: Mock API responses

### Headers

Testing mode is passed via the `x-testing-mode` header:

```javascript
headers: {
  'x-testing-mode': isTestingMode.toString()
}
```

### Mock Responses

All mock responses include realistic delays and data structures to simulate real API behavior.

## Files Modified

### New Files

- `store/testingStore.ts` - Testing mode state management
- `lib/mock-resellerclub.ts` - Mock API implementations
- `lib/resellerclub-wrapper.ts` - API wrapper with testing mode
- `components/admin/TestingModeToggle.tsx` - Admin toggle component
- `components/TestingModeIndicator.tsx` - Visual indicator
- `app/test-mode/page.tsx` - Dedicated test page

### Modified Files

- `app/api/domains/search/route.ts` - Added testing mode support
- `app/api/payments/verify/route.ts` - Added testing mode support
- `components/DomainSearch.tsx` - Pass testing mode header
- `app/checkout/page.tsx` - Pass testing mode header
- `app/admin/settings/page.tsx` - Added testing mode tab
- `app/layout.tsx` - Added testing mode indicator
- `app/admin/dashboard/page.tsx` - Added test mode quick action

## Benefits

### For Development

- Test without API rate limits
- No accidental real charges
- Consistent test data
- Faster development cycles

### For Testing

- Complete end-to-end testing
- Predictable results
- No external dependencies
- Easy to reproduce issues

### For Demos

- Professional demonstrations
- No real money involved
- Reliable functionality
- Easy to reset state

## Security Notes

- Testing mode is client-side only
- No sensitive data is exposed
- Real API credentials are never used in testing mode
- Mock responses don't contain real domain data

## Troubleshooting

### Testing Mode Not Working

1. Check if testing mode is enabled in Admin Settings
2. Clear browser cache and localStorage
3. Verify the testing mode indicator is visible

### Mock Data Issues

1. Mock responses include realistic delays (300-1200ms)
2. All domains show as available in testing mode
3. Pricing is consistent but mock

### Payment Issues

1. Use test Razorpay credentials
2. Testing mode doesn't affect Razorpay integration
3. Payment verification is still real (for security)

## Future Enhancements

- [ ] Mock user management
- [ ] Mock email notifications
- [ ] Test data persistence
- [ ] Advanced mock scenarios
- [ ] Performance testing mode
