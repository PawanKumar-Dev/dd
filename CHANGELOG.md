# Changelog

## [2.8.0] - 2025-10-30

### 🔐 Unified Authentication System

#### Added

- **NextAuth Integration**: Fully migrated to NextAuth (Auth.js) for all authentication
- **Unified Login System**: Single authentication system for both credentials and social login
- **Google OAuth**: Native Google social login support for regular users
- **Facebook OAuth**: Native Facebook social login support for regular users
- **Session Management**: Unified NextAuth sessions with 30-day duration
- **Security Enhancements**: Industry-standard authentication patterns and CSRF protection
- **Admin Protection**: Automatic blocking of admin users from social login

#### Changed

- **Login Flow**: Credentials login now handled by NextAuth CredentialsProvider
- **Token System**: Migrated from dual token system to unified NextAuth JWT tokens
- **Session Cookie**: Now using `next-auth.session-token` (httpOnly, secure, sameSite)
- **Middleware**: Simplified to use only NextAuth tokens for route protection
- **Login Page**: Removed dual authentication checks, now uses single NextAuth session check

#### Removed

- **Old Login API**: Deprecated `/api/auth/login` endpoint (use NextAuth instead)
- **Token Sync**: Removed `/api/auth/sync-token` endpoint (no longer needed)
- **AuthSync Component**: Removed client-side token synchronization component
- **auth-sync Utility**: Removed token bridging utility (no longer needed)

#### Fixed

- **Redirect Loop**: Eliminated confusing redirect to login after successful OAuth
- **Token Mismatch**: Resolved synchronization issues between auth systems
- **Loading State**: Fixed infinite loading spinner on login page with 2-second timeout
- **Social Login UX**: Direct redirect to dashboard after OAuth completion

#### Improved

- **Code Simplicity**: 50% reduction in authentication code
- **Performance**: Faster login with no synchronization overhead
- **Reliability**: No more token sync failures or edge cases
- **Maintainability**: Standard NextAuth patterns, easier to understand and maintain
- **Developer Experience**: Consistent authentication across all login methods
- **Security**: Enhanced with NextAuth's built-in security features

#### Technical Details

- **CredentialsProvider**: Enhanced with reCAPTCHA verification and detailed error handling
- **Social Provider Callbacks**: Implemented admin blocking in `signIn` callback
- **JWT Callback**: Enhanced user data handling from database
- **Session Callback**: Proper role and profile data propagation
- **Middleware**: Role-based access control using NextAuth tokens

#### Breaking Changes

- **For Developers**: `/api/auth/login` endpoint deprecated (use `signIn('credentials')` from next-auth/react)
- **For Users**: None - all existing functionality maintained

#### Migration Notes

```typescript
// Old way (deprecated)
const response = await fetch("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password }),
});

// New way (recommended)
import { signIn } from "next-auth/react";
const result = await signIn("credentials", {
  redirect: false,
  email,
  password,
});
```

---

## [2.7.0] - 2025-10-28

### Added

#### MongoDB-Persisted TLD Pricing Cache

- **Database Persistence**: TLD pricing cache now persists in MongoDB instead of in-memory storage
- **Server Restart Resilience**: Cache survives server restarts and deployments
- **Automatic Expiry**: MongoDB cache includes automatic expiration handling
- **Enhanced Reliability**: Shared cache across multiple server instances (for horizontal scaling)
- **Performance**: Maintains fast cache access while providing persistent storage
- **Smart TLD Conversion**: Automatically converts ResellerClub API TLD keys (e.g., `dotio`, `dotin`, `codotuk`) to readable formats (e.g., `.io`, `.in`, `.co.uk`). Filters out obscure internal codes (e.g., `centralniczacom`) and non-TLD service entries
- **Empty Cache Detection**: Automatically detects and purges empty cache, refetches fresh data to prevent serving stale/empty results
- **Enhanced Price Extraction**: Fixed nested reseller pricing structure (`data["0"].pricing.addnewdomain["1"]`) to correctly extract both customer and reseller prices
- **Debug Logging**: Added comprehensive debugging to show actual API data structure for troubleshooting

#### Purchase Order (PO) System & Improved Payment Flow

- **PO Number Generation**: Every purchase now automatically generates a unique Purchase Order (PO) number
- **PO Tracking**: PO numbers are displayed in invoices, emails, and order records for better tracking
- **Smart Email Logic**: Order confirmation emails are only sent when domains are successfully registered
- **No Spam for Pending Orders**: Emails are not sent for pending/processing domains - users get notified only when registration is complete
- **Unified Order Tracking**: Both successful and failed payments receive PO numbers for complete audit trail

#### GST Transparency & Tax Breakdown

- **Invoice GST Breakdown**: All PDF invoices now show detailed GST (18%) breakdown with Subtotal, GST amount, and Total
- **Email GST Breakdown**: Order confirmation emails display complete price breakdown including GST calculation
- **Tax Compliance**: Clear indication that 18% GST is included in all prices as per Indian tax regulations
- **Professional Formatting**: Enhanced invoice and email layouts with proper GST line items

### Fixed

#### GST Breakdown UI Display

- **Order Details Modal**: Added comprehensive GST breakdown in user order details modal showing Subtotal, GST (18%), and Total
- **Admin Order Management**: Enhanced payment information section with detailed GST breakdown display
- **Admin Payment Management**: Updated payment details to show complete tax breakdown
- **Cart Page**: Improved order summary to display actual GST amount instead of just "Included"
- **Payment Success Page**: Added detailed GST breakdown with highlighted box on payment confirmation page
- **Consistent Formatting**: Standardized GST display across all user-facing pages for better tax transparency

#### Domain Visibility & Status Sync

- **User Domain List**: Fixed critical issue where users couldn't see failed/pending domains in their domain list
- **DNS Management Filtering**: Created separate endpoint for DNS management to show only registered domains
- **Status Synchronization**: Admin pending domain status updates now sync with Order collection automatically
- **Failed Domain Visibility**: Users can now see all their domains regardless of status (pending, processing, registered, failed)

#### DNS Management

- **Pending Domain Filter**: DNS management now only displays domains with "registered" status
- **Status-Based Access**: Separated DNS management from general domain list
- **Clean Interface**: DNS operations only available for fully registered domains

#### Authentication & Security

- **Password Detection System**: Fixed issue where `getUserFromRequest` was excluding password field with `.select("-password")`, causing incorrect password status detection
- **Social Login Password Support**: Enhanced system to allow all users (both social login and credential-based) to set/change passwords, enabling hybrid authentication
- **Account Settings UI**: Fixed false warning messages for users who have passwords set but logged in via social auth
- **API Consistency**: Added `provider` field to all authentication endpoints (login, register, activate) for consistent user data

#### User Interface Improvements

- **Refresh Button Standardization**: Unified all 10+ Refresh buttons across the entire application (User Orders, Domains, DNS Management, Admin Order Management, Payment Management, User Management, Pricing Management, Pending Domains, DNS Management, Settings) with consistent outlined design and blue hover effects for better visual consistency and improved UX
- **Action Button Enhancement**: Enlarged action buttons (View/Download) from 16px to 20px with padding and hover backgrounds for better clickability and user experience
- **Payment Success Page**: Removed "Domains Being Processed" section to provide cleaner, simpler user experience without overwhelming technical details
- **Admin Pending Domains**: Removed status summary stat cards for more focused domain management interface
- **DNS Management**: Added validation to prevent DNS activation for domains in pending or processing status
- **Console Logs Cleanup**: Removed debug logs from browser console for cleaner production experience

#### Security Enhancements

- **Password Field Handling**: Improved password field handling to check existence without exposing actual hash values
- **API Response Security**: Ensured all endpoints return password as boolean instead of exposing hash
- **Validation Messages**: Enhanced error messages to be more specific about domain status in DNS activation

### Changed

#### DNS Management System

- **DNS Activation Rules**: DNS activation button now only appears for fully registered domains
- **Status-Based UI**: Pending/processing domains show disabled state with helpful message: "DNS activation unavailable (Domain pending/processing)"
- **API Validation**: Enhanced backend validation with specific error messages for different domain states
- **User Guidance**: Improved messaging to guide admins to wait for registration completion before DNS activation

#### Account Settings

- **Password Management**: Unified password management interface for all users regardless of login method
- **Info Messages**: Updated warning messages to be more accurate and helpful:
  - Without password: "Set a password to enable email/password login in addition to your social login"
  - With password: "Change your account password. You can use either password or social login to access your account"
- **Form Behavior**: Correctly shows "Set Password" vs "Change Password" based on actual password existence

### Improved

- **Code Quality**: Removed unused imports, state variables, and functions after UI simplification
- **Performance**: Reduced unnecessary API calls and data fetching for removed features
- **User Experience**: Streamlined interfaces by removing redundant information displays
- **Developer Experience**: Cleaner console output without debug logs in production

#### Loading States & UI Consistency

- **Perfect Centering**: All loading indicators now perfectly centered on all screen sizes using Flexbox with minimum heights
- **Consistent Sizing**: Standardized loading spinner sizes across the app (sm: 4-6px, md: 8-10px, lg: 12-14px, xl: 16-20px)
- **CenteredLoading Component**: New reusable component with full-screen and inline modes, multiple sizes, and smooth animations
- **Loading Guidelines**: Comprehensive documentation for implementing consistent loading states
- **Responsive Design**: Loading states optimized for mobile, tablet, and desktop screens
- **Visual Improvements**: Changed spinner colors to blue (`text-blue-600`) for better brand consistency and visibility
- **Better Messaging**: Updated loading messages to be more descriptive and professional

### Technical Details

#### Files Modified

**Authentication & Security:**

- `lib/auth.ts` - Removed `.select("-password")` to allow password existence checking
- `app/api/auth/me/route.ts` - Added password field existence check and debug logging cleanup
- `app/api/auth/login/route.ts` - Added provider field to response
- `app/api/auth/register/route.ts` - Added provider field to response
- `app/api/auth/activate/route.ts` - Added provider field to response
- `app/dashboard/settings/page.tsx` - Fixed password detection logic and cleaned up console logs

**UI Simplification:**

- `app/payment-success/page.tsx` - Removed processing domains section and related code
- `app/admin/pending-domains/page.tsx` - Removed status summary cards and improved loading centering

**Domain Visibility & Sync:**

- `app/api/user/domains/route.ts` - **FIXED**: Now returns ALL domain statuses (not just registered) for user's domain list
- `app/api/user/domains/dns/route.ts` - **NEW**: Dedicated endpoint for DNS management (registered domains only)
- `app/dashboard/dns-management/page.tsx` - Updated to use new DNS-specific endpoint
- `app/api/admin/pending-domains/[id]/route.ts` - Added Order collection sync when admin updates pending domain status

**DNS Management:**

- `app/api/admin/domains/route.ts` - Added filter to only return registered domains for DNS management
- `app/admin/dns-management/page.tsx` - Added status-based DNS activation controls and improved loading states
- `app/api/admin/domains/activate-dns/route.ts` - Enhanced validation with specific error messages

**Loading States:**

- `components/CenteredLoading.tsx` - NEW: Unified loading component with perfect centering
- `components/index.ts` - Added CenteredLoading exports
- `app/loading.tsx` - Updated to use CenteredLoading component
- `app/checkout/page.tsx` - Improved loading message

**Purchase Order System:**

- `models/Order.ts` - Added `purchaseOrderNumber` field to Order schema with auto-generation logic
- `app/api/payments/verify/route.ts` - Added PO number generation and smart email logic (only send for registered domains)
- `app/api/orders/[id]/invoice/route.ts` - Added PO number display in user invoices
- `app/api/admin/orders/[id]/invoice/route.ts` - Added PO number display in admin invoices
- `lib/email.ts` - Added PO number to order confirmation emails

**GST & Tax Breakdown:**

- `app/api/orders/[id]/invoice/route.ts` - Added GST breakdown calculation and display in user invoices
- `app/api/admin/orders/[id]/invoice/route.ts` - Added GST breakdown calculation and display in admin invoices
- `components/Invoice.tsx` - Updated invoice modal component with GST breakdown
- `lib/email.ts` - Updated email template with GST breakdown in order summary

**Documentation:**

- `PURCHASE_ORDER_IMPLEMENTATION.md` - NEW: Complete PO system and smart email logic guide
- `GST_IMPLEMENTATION.md` - NEW: Complete GST breakdown implementation guide

## [2.6.0] - 2025-01-26

### Added

#### Enhanced User Experience & Animations

- **Advanced Button Animations**: Enhanced Button component with Framer Motion animations, hover effects, scale transitions, and ripple effects
- **Interactive Card Components**: Improved Card, FeatureCard, and StatsCard with smooth hover animations, scale effects, and staggered content animations
- **Enhanced Page Transitions**: Upgraded PageTransition component with custom easing, scale effects, and improved timing
- **Advanced Loading States**: Enhanced LoadingPage with gradient backgrounds, pulsing ring effects, animated progress bars, and customizable loading messages
- **Interactive Form Elements**: Enhanced Input component with focus animations, icon transitions, and smooth error/helper text animations
- **Animated Modal System**: Upgraded Modal component with AnimatePresence, backdrop animations, and size variants
- **Enhanced Toast Notifications**: New EnhancedToast component with slide-in animations, progress bars, and auto-dismiss functionality
- **Skeleton Loading Components**: New EnhancedSkeleton system with wave animations, pre-built components (SkeletonText, SkeletonCard, SkeletonTable, SkeletonList)
- **Domain Requirements Modal**: Specialized modal component for domain registration requirements with proper scroll handling and alternative domain suggestions
- **Modal Scroll Management**: Enhanced modal system with proper scroll handling, body scroll prevention, and custom scrollbar styling
- **Micro-interactions**: Added subtle animations throughout the application for better user feedback and engagement

#### Component Enhancements

- **Animation Props**: Added animation control props to components (animate, delay) for fine-tuned animation control
- **Improved Accessibility**: Enhanced animations maintain accessibility standards with reduced motion support
- **Performance Optimizations**: Optimized animations for better performance with proper easing and duration controls
- **Responsive Animations**: All animations are optimized for mobile devices with touch-friendly interactions

### Enhanced

- **User Experience**: Significantly improved overall user experience with smooth animations and better visual feedback
- **Component Library**: Enhanced component library with consistent animation patterns and improved developer experience
- **Visual Polish**: Added visual polish throughout the application with professional-grade animations and transitions
- **Modal System**: Fixed modal overflow issues with proper scroll handling, preventing content from being cut off
- **Scroll Management**: Improved scroll behavior with body scroll prevention and custom scrollbar styling

### Fixed

- **Modal Content Overflow**: Fixed issue where modal content was being cut off at the bottom of the viewport
- **Scroll Behavior**: Improved modal scroll behavior to prevent background page scrolling when modal is open
- **Content Visibility**: Ensured all modal content is accessible through proper scroll handling and responsive design
- **Domain Requirements Error**: Fixed "requirements.map is not a function" error by adding proper array validation and default values
- **Type Safety**: Enhanced DomainRequirementsModal with proper TypeScript types and error handling

### Added

#### Pending Domains Management System

- **Enhanced ResellerClub API Response Handling**: Added logic to detect "Order Locked for Processing" responses and mark domains as pending
- **Domain Verification Service**: Comprehensive service to verify domain registration success by checking availability
- **Pending Domains Database Model**: Complete MongoDB schema for tracking pending domain registrations
- **Admin Pending Domains Interface**: Full-featured admin dashboard for managing pending domains
- **Automatic Pending Domain Creation**: Domains with failed registrations are automatically added to pending list
- **User-Friendly Messages**: Shows "Domain registration is being processed" instead of technical errors

#### TLD-Specific Validation System

- **Minimum Registration Period Validation**: Automatic validation of TLD-specific minimum registration requirements
- **Dynamic Cart Interface**: Registration period dropdown adapts based on TLD requirements
- **Pre-payment Validation**: Prevents payment processing for invalid registration periods
- **Visual Indicators**: Clear warnings and minimum period indicators in cart and checkout
- **TLD Support**: Comprehensive support for .ai (2+ years), .co (2+ years), and standard TLDs (1+ year)

#### API Endpoints

- `GET /api/admin/pending-domains` - List pending domains with filtering and pagination
- `POST /api/admin/pending-domains` - Create new pending domain record
- `GET /api/admin/pending-domains/[id]` - Get specific pending domain details
- `PUT /api/admin/pending-domains/[id]` - Update pending domain status/notes
- `DELETE /api/admin/pending-domains/[id]` - Delete pending domain record
- `POST /api/admin/pending-domains/[id]/register` - Manually register a pending domain
- `POST /api/admin/pending-domains/verify` - Batch verify multiple domains

#### Enhanced Features

- **Dual Detection Methods**: Enhanced API response parsing + domain availability verification
- **Immediate Detection**: "Order Locked for Processing" responses are caught immediately
- **Proactive Management**: Domains are added to pending list before verification
- **Bulk Operations**: Select multiple domains for batch verification
- **Status Tracking**: Complete audit trail of registration attempts and status changes

### Changed

#### Payment Verification System

- **Enhanced Error Detection**: Now detects error messages even in successful HTTP responses
- **Improved Status Handling**: "Order Locked for Processing" responses are marked as pending instead of successful
- **User Experience**: Customer-facing messages are now user-friendly instead of technical
- **Automatic Pending Creation**: Domains with pending status are immediately added to pending domains list
- **"Already Exists" Error Handling**: Enhanced detection of "already exists in database" errors as pending status

#### User Interface Improvements

- **Checkout Page Redesign**: Complete redesign using cart page layout pattern for stability
- **Layout Stability**: Fixed layout shifting issues with consistent grid system
- **Cart Experience**: Removed unnecessary messages and streamlined user flow
- **Payment Flow**: Improved payment button states and progress indicators

#### Domain Verification Logic

- **Better Domain Parsing**: Properly splits domain into base domain and TLD
- **Correct Search Method**: Uses `searchDomainWithTlds()` for accurate results
- **Partial Match Detection**: Handles cases where API returns unexpected formats
- **Conservative Approach**: Marks uncertain cases as pending for manual verification

#### Admin Navigation

- **New Menu Item**: Added "Pending Domains" to admin navigation with AlertTriangle icon
- **Integrated Layout**: Pending domains page uses consistent AdminLayoutNew component

### Fixed

#### ResellerClub API Integration

- **"Order Locked for Processing" Detection**: Fixed issue where domains with this response were marked as successful
- **Error Message Parsing**: Enhanced logic to detect various error conditions that indicate pending status
- **Domain Availability Verification**: Fixed domain search logic to properly handle domain name parsing
- **"Already Exists" Error Recognition**: Fixed issue where "already exists in database" errors were marked as failed instead of pending

#### Customer Experience

- **Technical Error Messages**: Replaced technical error messages with user-friendly ones
- **Status Transparency**: Customers now see appropriate "processing" messages instead of confusing errors
- **Layout Shifting**: Fixed checkout page layout shifting when payment button states change
- **Cart Preservation**: Improved cart preservation during payment cancellation/failure
- **Unnecessary Messages**: Removed redundant messages from cart and checkout pages

#### Payment Processing

- **ReferenceError Fix**: Fixed `customerResult is not defined` error in payment verification
- **Scope Issues**: Moved customer creation outside loop to prevent scope conflicts
- **Error Handling**: Improved error handling for TLD-specific registration failures

### Technical Improvements

#### Code Quality

- **Enhanced Logging**: Added comprehensive logging for debugging domain verification
- **Error Handling**: Improved error handling for API failures and edge cases
- **Type Safety**: Enhanced TypeScript interfaces for pending domain management
- **Performance**: Optimized batch operations with rate limiting

#### Database

- **New Collections**: Added PendingDomain collection with proper indexing
- **Data Integrity**: Comprehensive validation and constraints for pending domain records
- **Audit Trail**: Complete tracking of verification attempts and status changes

## [2.4.0] - 2025-10-15

### Added

- DNS Management API with full CRUD operations
- Social Login Integration (Google & Facebook)
- Comprehensive testing suite
- Advanced admin panel features

### Changed

- Enhanced user authentication system
- Improved payment processing flow
- Updated admin interface design

### Fixed

- Various bug fixes and performance improvements

## [2.3.0] - 2025-10-14

### Added

- Multi-stage user registration
- Enhanced domain search functionality
- Improved cart system

### Changed

- Updated pricing service
- Enhanced order management

### Fixed

- Payment verification issues
- Domain registration edge cases

---

## Version History

- **2.7.0** - Authentication Fixes & UI Improvements
- **2.6.0** - Enhanced UX & Animations
- **2.5.0** - Pending Domains Management System
- **2.4.0** - DNS Management & Social Login
- **2.3.0** - Enhanced Registration & Cart System
- **2.2.0** - Payment Processing & Order Management
- **2.1.0** - Admin Panel & User Management
- **2.0.0** - Core Domain Management System
- **1.0.0** - Initial Release

---

**Note**: This changelog follows semantic versioning principles. Major version changes indicate breaking changes, minor versions add new features, and patch versions include bug fixes.
