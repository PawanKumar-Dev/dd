# Excel Technologies - Domain Management System

A comprehensive domain management platform built with Next.js 14, featuring live pricing integration with ResellerClub API, user management, admin panel functionality, and advanced testing capabilities. This system provides a complete solution for domain registration, management, and e-commerce operations.

## 🎯 Overview

This domain management system is designed to provide a complete solution for domain registration and management services. It integrates with ResellerClub API to provide live pricing data, supports both customer and reseller pricing models, and includes comprehensive admin tools for managing TLD pricing and margins.

### Key Highlights

- **Live Pricing Integration**: Real-time pricing from ResellerClub API with both customer and reseller pricing
- **Smart Domain Search**: Intelligent TLD suggestions and availability checking
- **Admin Dashboard**: Comprehensive pricing management with margin analysis
- **Testing Environment**: Complete testing mode with mock API responses
- **Modern Architecture**: Built with Next.js 14, TypeScript, and modern React patterns

## 🚀 Features

### Core Functionality

- **Live Domain Search**: Real-time availability with ResellerClub API + promotional pricing
- **Secure Payments**: Multi-layer Razorpay verification before domain registration
- **DNS Management**: Complete DNS record management with ResellerClub integration
- **User Dashboard**: Domain management and account control
- **Admin Panel**: User, order, payment, and pricing management
- **Responsive Design**: Google Workspace theme with mobile-first approach

### Advanced Features

- **Testing Mode**: Complete testing environment with mock ResellerClub API responses
- **Cart Management**: Persistent shopping cart with server synchronization
- **Real-time Pricing**: Live pricing updates with comprehensive error handling
- **Security Features**: JWT authentication, rate limiting, input validation, and XSS protection
- **Responsive Design**: Mobile-first design with modern UI/UX
- **Component System**: Modular, reusable React components
- **State Management**: Zustand stores with persistence
- **Error Handling**: Comprehensive error handling and user feedback
- **Performance Optimization**: Caching, code splitting, and lazy loading
- **Multi-page Support**: Homepage, about, contact, privacy, terms, and more

### Recent Updates (v2.1.0)

- **Promotional Pricing**: Real-time ResellerClub promotional pricing integration
- **URL Restructuring**: User-friendly URLs (`/domain-management`, `/terms-and-conditions`, etc.)
- **Payment Security**: Multi-layer Razorpay verification before domain registration
- **Live Pricing Only**: Removed static pricing, only live ResellerClub API pricing
- **Code Cleanup**: Removed all debug/test files and deprecated code
- **Enhanced UI**: Google Workspace theme with compact, responsive design

## 📁 Project Structure

```
dd/
├── app/                          # Next.js App Router pages
│   ├── admin/                    # Admin panel pages
│   │   ├── pricing-management/  # TLD pricing management
│   │   ├── user-management/     # User management
│   │   ├── order-management/    # Order management
│   │   ├── payment-management/  # Payment management
│   │   ├── system-settings/     # System settings
│   │   └── dashboard/           # Admin dashboard
│   ├── api/                     # API routes
│   │   ├── admin/               # Admin API endpoints
│   │   ├── domains/             # Domain search API
│   │   ├── auth/                # Authentication API
│   │   ├── cart/                # Cart management
│   │   ├── contact/             # Contact form
│   │   ├── orders/              # Order endpoints
│   │   └── payments/            # Payment endpoints
├── components/                   # React components
│   ├── admin/                   # Admin-specific components
│   ├── forms/                   # Form components
│   └── ui/                      # Reusable UI components
├── lib/                         # Utility libraries
│   ├── resellerclub.ts         # ResellerClub API integration
│   ├── pricing-service.ts      # Pricing service with promotional pricing
│   ├── resellerclub-wrapper.ts # API wrapper with error handling
│   └── mock-resellerclub.ts    # Mock API for testing
├── store/                       # Zustand state management
├── public/                      # Static assets
└── scripts/                     # Build and deployment scripts
```

### Key Files

- **`lib/resellerclub.ts`**: ResellerClub API integration with promotional pricing
- **`lib/pricing-service.ts`**: Live pricing service with promotional pricing support
- **`components/DomainSearch.tsx`**: Domain search with Google Workspace UI
- **`app/domain-management/page.tsx`**: DNS management interface
- **`app/api/domains/search/route.ts`**: Domain search API endpoint
- **`app/api/payments/verify/route.ts`**: Secure payment verification

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.3.3
- **Styling**: Tailwind CSS 3.3.6
- **UI Components**: Headless UI, Lucide React icons
- **Animations**: Framer Motion
- **State Management**: Zustand 4.4.7 with persistence
- **Forms**: React Hook Form 7.48.2
- **Notifications**: React Hot Toast

### Backend

- **Runtime**: Node.js 18+
- **API**: Next.js API Routes
- **Database**: MongoDB Atlas with Mongoose 8.0.3
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 2.4.3
- **Validation**: Validator 13.15.15

### Integrations

- **Payment Gateway**: Razorpay 2.9.2
- **Email Service**: Nodemailer 6.9.7
- **PDF Generation**: HTML2Canvas 1.4.1 + jsPDF 3.0.3
- **Domain API**: ResellerClub API integration
- **HTTP Client**: Axios 1.6.2

### Development Tools

- **Linting**: ESLint 8.56.0
- **Package Manager**: npm
- **Environment**: dotenv 16.3.1
- **Utilities**: date-fns 2.30.0, uuid 9.0.1, clsx 2.0.0

## 📋 Prerequisites

- Node.js 18+
- MongoDB Atlas account
- ResellerClub API credentials
- Razorpay account
- Email service (Gmail/SMTP)

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory. You can use the automated setup script or manually configure:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/domain-management

# Authentication
JWT_SECRET=your-super-secret-jwt-key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# ResellerClub API
RESELLERCLUB_API_ID=your-resellerclub-api-id
RESELLERCLUB_API_KEY=your-resellerclub-api-key
RESELLERCLUB_API_URL=https://httpapi.com

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Optional: Testing Mode (default: false)
TESTING_MODE=false
```

## 🚀 Installation

### Quick Setup (Recommended)

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd domain-management-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run automated setup**

   ```bash
   npm run setup
   ```

   This interactive script will guide you through configuring all environment variables.

4. **Initialize database**

   ```bash
   npm run init-db
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

### Manual Setup

If you prefer manual configuration:

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create environment file**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

### Production Build

```bash
npm run build
npm start
```

## 🔌 API Integration Details

### ResellerClub API Configuration

The system integrates with ResellerClub API for live domain pricing and management. The integration includes both production and testing modes for safe development.

#### **API Endpoints Used:**

1. **Customer Pricing API**

   ```
   GET https://httpapi.com/api/products/customer-price.json
   ```

   - Returns pricing for all TLDs in customer format
   - Used for live pricing in domain search and admin panel
   - Supports Indian pricing with `reseller-id` parameter

2. **Reseller Pricing API**

   ```
   GET https://httpapi.com/api/products/reseller-price.json
   ```

   - Returns reseller pricing information
   - Used for admin pricing management
   - Provides detailed pricing breakdown

3. **Domain Search API**

   ```
   GET https://httpapi.com/api/domains/available.json
   ```

   - Checks domain availability
   - Returns pricing and availability status
   - Supports multiple domain search

4. **Domain Registration API**

   ```
   POST https://httpapi.com/api/domains/register.json
   ```

   - Registers domains after successful payment
   - Handles contact information and DNS settings

5. **Domain DNS Management API**

   ```
   GET https://httpapi.com/api/domains/dns/get-records.json
   POST https://httpapi.com/api/domains/dns/add-record.json
   POST https://httpapi.com/api/domains/dns/delete-record.json
   POST https://httpapi.com/api/domains/dns/modify-record.json
   ```

   - Manages DNS records for domains
   - Supports A, AAAA, CNAME, MX, TXT records

6. **Domain Renewal API**
   ```
   GET https://httpapi.com/api/domains/renewal-price.json
   POST https://httpapi.com/api/domains/transfer.json
   ```
   - Handles domain renewal and transfer operations
   - Provides renewal pricing information

### Internal API Endpoints

The system provides comprehensive internal APIs:

#### **Authentication APIs**

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

#### **Domain Management APIs**

- `POST /api/domains/search` - Domain search with pricing
- `GET /api/domains/user-domains` - Get user's domains
- `POST /api/domains/dns-records` - Manage DNS records
- `POST /api/domains/renew` - Domain renewal

#### **Payment APIs**

- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment and register domains
- `GET /api/payments/history` - Payment history

#### **Cart Management APIs**

- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `DELETE /api/cart/remove` - Remove item from cart
- `POST /api/cart/sync` - Sync cart with server

#### **Admin APIs**

- `GET /api/admin/users` - Get all users
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/payments` - Get payment statistics
- `GET /api/admin/tld-pricing` - Get TLD pricing data
- `POST /api/admin/settings` - Update admin settings

#### **API Request Format:**

All ResellerClub API requests include these parameters:

```javascript
{
  "auth-userid": "YOUR_API_ID",
  "api-key": "YOUR_API_KEY",
  "reseller-id": "YOUR_API_ID",  // For Indian pricing
  // ... other endpoint-specific parameters
}
```

#### **Internal API Request Format:**

Internal APIs use JWT authentication:

```javascript
// Headers
{
  "Authorization": "Bearer <jwt-token>",
  "Content-Type": "application/json"
}

// Testing Mode Header (optional)
{
  "x-testing-mode": "true"  // For testing mode API calls
}
```

#### **TLD Name Mapping:**

The ResellerClub API returns TLD names in specific formats. The system handles these mappings with automatic fallback pricing:

| Standard TLD | API Format      | Example         | Fallback Price (INR) |
| ------------ | --------------- | --------------- | -------------------- |
| com          | centralniczacom | centralniczacom | ₹999                 |
| net          | dotnet          | dotnet          | ₹1,199               |
| org          | dotorg          | dotorg          | ₹1,099               |
| in           | dotin           | dotin           | ₹699                 |
| co           | dotco           | dotco           | ₹1,499               |
| co.in        | dotcoin         | dotcoin         | ₹799                 |
| shop         | dotshop         | dotshop         | ₹1,599               |
| store        | dotstore        | dotstore        | ₹1,599               |
| online       | dotonline       | dotonline       | ₹1,999               |
| site         | dotsite         | dotsite         | ₹1,399               |
| website      | dotwebsite      | dotwebsite      | ₹1,799               |
| app          | dotapp          | dotapp          | ₹2,399               |
| dev          | dotdev          | dotdev          | ₹1,599               |
| io           | dotio           | dotio           | ₹3,199               |
| ai           | dotai           | dotai           | ₹3,999               |
| tech         | dottech         | dottech         | ₹1,999               |
| digital      | dotdigital      | dotdigital      | ₹1,599               |
| cloud        | dotcloud        | dotcloud        | ₹1,999               |
| host         | dothost         | dothost         | ₹1,599               |
| space        | dotspace        | dotspace        | ₹1,399               |
| info         | dotinfo         | dotinfo         | ₹1,299               |
| biz          | dotbiz          | dotbiz          | ₹1,399               |

#### **Pricing Strategy:**

1. **Live Pricing**: First attempts to fetch real-time pricing from ResellerClub API
2. **Fallback Pricing**: Uses hardcoded fallback prices if API fails
3. **Testing Mode**: Uses mock pricing for safe development
4. **Currency**: All prices in Indian Rupees (INR) with ₹ symbol

#### **Pricing Structure:**

The API returns pricing in this format:

```json
{
  "tld": {
    "addnewdomain": {
      "1": "price_for_1_year",
      "2": "price_for_2_years",
      "3": "price_for_3_years",
      "4": "price_for_4_years",
      "5": "price_for_5_years",
      "10": "price_for_10_years"
    },
    "renew": {
      "1": "renewal_price_1_year",
      "2": "renewal_price_2_years"
    }
  }
}
```

#### **Indian Pricing Configuration:**

To get Indian pricing (INR), ensure these parameters are included:

- `reseller-id`: Must match your `auth-userid`
- All prices will be returned in INR
- Currency symbol: ₹

### Working TLD Pricing Examples

Here are the current working TLD prices (as of latest API fetch). Prices may vary based on live API data:

| TLD      | Live Price (INR) | Fallback Price (INR) | Category     | Description                     |
| -------- | ---------------- | -------------------- | ------------ | ------------------------------- |
| .com     | ₹27,862.8        | ₹999                 | Generic      | Most popular domain extension   |
| .net     | ₹1,558.8         | ₹1,199               | Generic      | Network infrastructure domains  |
| .in      | ₹862.8           | ₹699                 | Country Code | India's country code domain     |
| .co      | ₹3,298.8         | ₹1,499               | Generic      | Short, memorable domains        |
| .co.in   | N/A              | ₹799                 | Country Code | India commercial domains        |
| .shop    | ₹3,838.8         | ₹1,599               | E-commerce   | Perfect for online stores       |
| .store   | ₹4,788           | ₹1,599               | E-commerce   | Ideal for retail businesses     |
| .online  | ₹3,066           | ₹1,999               | Generic      | Modern web presence             |
| .site    | ₹3,166.8         | ₹1,399               | Generic      | Professional websites           |
| .website | ₹2,542.8         | ₹1,799               | Generic      | Clear web identity              |
| .app     | ₹1,786.8         | ₹2,399               | Tech         | Mobile app domains              |
| .dev     | ₹1,534.8         | ₹1,599               | Tech         | Developer-focused domains       |
| .io      | ₹5,746.8         | ₹3,199               | Tech         | Popular with tech startups      |
| .ai      | ₹0               | ₹3,999               | Tech         | Artificial intelligence domains |
| .tech    | ₹5,746.8         | ₹1,999               | Tech         | Technology companies            |
| .digital | ₹3,670.8         | ₹1,599               | Tech         | Digital transformation          |
| .cloud   | ₹1,906.8         | ₹1,999               | Tech         | Cloud services                  |
| .host    | ₹9,274.8         | ₹1,599               | Tech         | Hosting services                |
| .space   | ₹2,542.8         | ₹1,399               | Generic      | Creative spaces                 |
| .info    | N/A              | ₹1,299               | Generic      | Information websites            |
| .biz     | N/A              | ₹1,399               | Business     | Business domains                |

#### **Pricing Notes:**

- **Live Pricing**: Fetched from ResellerClub API in real-time
- **Fallback Pricing**: Used when API is unavailable or fails
- **Testing Mode**: Uses mock pricing for safe development
- **Currency**: All prices in Indian Rupees (INR) with ₹ symbol
- **Updates**: Pricing updates automatically every 5 minutes
- **Caching**: 5-minute TTL for pricing data to reduce API calls

## 📁 Project Structure

```
dd/
├── app/                          # Next.js 14 App Router
│   ├── admin/                    # Admin panel pages
│   │   ├── dashboard/            # Admin dashboard
│   │   ├── users/                # User management
│   │   ├── orders/               # Order management
│   │   ├── payments/             # Payment management
│   │   ├── settings/             # Admin settings
│   │   └── tld-pricing/          # TLD pricing management
│   ├── api/                      # API routes
│   │   ├── admin/                # Admin API endpoints
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── cart/                 # Cart management
│   │   ├── contact/              # Contact form
│   │   ├── domains/              # Domain-related endpoints
│   │   ├── orders/               # Order endpoints
│   │   └── payments/             # Payment endpoints
│   ├── about/                    # About Us page
│   ├── cart/                     # Shopping cart page
│   ├── checkout/                 # Checkout process
│   ├── contact/                  # Contact Us page
│   ├── dashboard/                # User dashboard
│   ├── domain-management/        # DNS management
│   ├── reset-password/           # Password reset
│   ├── login/                    # Login page
│   ├── payment-success/          # Payment success page
│   ├── privacy/                  # Privacy policy
│   ├── register/                 # Registration page
│   ├── terms-and-conditions/     # Terms and conditions
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage
│   ├── loading.tsx               # Loading page
│   ├── error.tsx                 # Error page
│   └── not-found.tsx             # 404 page
├── components/                   # React components
│   ├── admin/                    # Admin-specific components
│   ├── AdminCard.tsx             # Admin card component
│   ├── AdminPasswordReset.tsx    # Admin password reset
│   ├── AdminTable.tsx            # Admin table component
│   ├── AdminTabs.tsx             # Admin tabs component
│   ├── Button.tsx                # Button component
│   ├── Card.tsx                  # Card component
│   ├── ClientOnly.tsx            # Client-only wrapper
│   ├── ContactForm.tsx           # Contact form
│   ├── ContactInfo.tsx           # Contact information
│   ├── DNSManagementModal.tsx    # DNS management modal
│   ├── DomainRenewalModal.tsx    # Domain renewal modal
│   ├── DomainSearch.tsx          # Domain search component
│   ├── EmptyState.tsx            # Empty state component
│   ├── FAQItem.tsx               # FAQ accordion item
│   ├── FeatureCard.tsx           # Feature display card
│   ├── Footer.tsx                # Site footer
│   ├── ForgotPasswordForm.tsx    # Password reset form
│   ├── Header.tsx                # Site header
│   ├── HeroSection.tsx           # Hero section component
│   ├── Input.tsx                 # Input component
│   ├── Invoice.tsx               # Invoice component
│   ├── LivePricingIndicator.tsx  # Live pricing indicator
│   ├── LoadingPage.tsx           # Loading page component
│   ├── LoadingSpinner.tsx        # Loading spinner
│   ├── LoginForm.tsx             # Login form
│   ├── Logo.tsx                  # Logo component
│   ├── Modal.tsx                 # Modal component
│   ├── Navigation.tsx            # Navigation component
│   ├── PageTransition.tsx        # Page transition
│   ├── RegisterForm.tsx          # Registration form
│   ├── Section.tsx               # Section wrapper
│   ├── StatsCard.tsx             # Statistics card
│   ├── TestingModeBanner.tsx     # Testing mode banner
│   ├── TestingModeIndicator.tsx  # Testing mode indicator
│   ├── TestingModeProvider.tsx   # Testing mode provider
│   ├── TestingModeStatus.tsx     # Testing mode status
│   ├── Textarea.tsx              # Textarea component
│   ├── index.ts                  # Component exports
│   └── README.md                 # Component documentation
├── lib/                          # Utility libraries
│   ├── admin-auth.ts             # Admin authentication
│   ├── auth.ts                   # JWT authentication
│   ├── email.ts                  # Email service
│   ├── mock-resellerclub.ts      # Mock ResellerClub API
│   ├── mongodb.ts                # Database connection
│   ├── pricing-service.ts        # Pricing service
│   ├── rate-limit.ts             # Rate limiting
│   ├── razorpay-payments.ts      # Razorpay payment processing
│   ├── razorpay.ts               # Razorpay integration
│   ├── resellerclub-wrapper.ts   # ResellerClub API wrapper
│   ├── resellerclub.ts           # ResellerClub API integration
│   ├── security-middleware.ts    # Security middleware
│   ├── security.ts               # Security utilities
│   ├── types.ts                  # TypeScript types
│   ├── utils.ts                  # General utilities
│   └── validation.ts             # Input validation
├── models/                       # Mongoose models
│   ├── DNSRecord.ts              # DNS record model
│   ├── Domain.ts                 # Domain model
│   ├── Order.ts                  # Order model
│   ├── Payment.ts                # Payment model
│   └── User.ts                   # User model
├── store/                        # Zustand stores
│   ├── cartStore.ts              # Cart state management
│   └── testingStore.ts           # Testing mode state
├── scripts/                      # Setup scripts
│   ├── setup.js                  # Interactive setup script
│   └── init-db.js                # Database initialization
├── public/                       # Static assets
│   ├── logo-black.png            # Black logo
│   ├── logo-white.png            # White logo
│   └── favicon.png               # Favicon
├── middleware.ts                 # Next.js middleware
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies and scripts
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── postcss.config.js             # PostCSS configuration
├── update_pricing.js             # Pricing update script
├── README.md                     # Project documentation
├── API.md                        # API documentation
├── PROJECT_STRUCTURE.md          # Project structure documentation
└── TESTING_MODE.md               # Testing mode documentation
```

## 🔧 Key Components

### Pricing Service (`lib/pricing-service.ts`)

Handles all ResellerClub API pricing operations with caching and fallback mechanisms:

```typescript
// Get pricing for specific TLDs
const pricing = await PricingService.getTLDPricing(["com", "net", "org"]);

// Get all domain pricing
const allPricing = await PricingService.getDomainPricing();

// Get reseller pricing for specific TLD
const resellerPricing = await PricingService.getResellerPricingForTLD("com");
```

### ResellerClub API Wrapper (`lib/resellerclub-wrapper.ts`)

Main API integration layer with testing mode support:

```typescript
// Search domain availability (automatically switches between real/mock)
const results = await ResellerClubWrapper.searchDomain(
  "example.com",
  isTestingMode
);

// Register domain
const registration = await ResellerClubWrapper.registerDomain(
  domainData,
  isTestingMode
);

// Get DNS records
const dnsRecords = await ResellerClubWrapper.getDNSRecords(
  "example.com",
  isTestingMode
);
```

### Cart Management (`store/cartStore.ts`)

Zustand store for shopping cart with server synchronization:

```typescript
// Add item to cart
addItem({ domainName: "example.com", price: 999, currency: "INR" });

// Remove item from cart
removeItem("example.com");

// Get total price
const total = getTotalPrice();

// Sync with server
await syncWithServer();
```

### Testing Mode Store (`store/testingStore.ts`)

Manages testing mode state with cross-tab synchronization:

```typescript
// Toggle testing mode
const { toggleTestingMode, isTestingMode } = useTestingStore();

// Set testing mode
setTestingMode(true);
```

### Admin TLD Pricing (`app/admin/tld-pricing/page.tsx`)

Admin interface for managing TLD pricing with:

- Live pricing display with real-time updates
- Search and filter functionality
- Statistics dashboard with pricing trends
- Testing mode toggle
- Fallback pricing management

## 🧪 Testing Mode

### Overview

Testing Mode allows you to test the complete application flow by simulating ResellerClub API calls while keeping all other functionality (cart, payments, user management, admin) working exactly like in production.

### Features

- **Mock API Responses**: Simulates ResellerClub API responses for domain operations
- **Real Functionality**: Cart, payments, user management, and admin features work normally
- **Easy Toggle**: Enable/disable via Admin Settings → Testing Mode
- **Visual Indicator**: Yellow indicator appears when testing mode is active
- **Cross-tab Sync**: Testing mode state synchronizes across browser tabs

### How to Use

1. **Enable Testing Mode**

   - Go to Admin Dashboard → Settings → Testing Mode tab
   - Toggle the switch to enable testing mode
   - You'll see a yellow indicator in the top-right corner

2. **Test Domain Search**

   - All domain searches return mock available domains
   - Pricing is consistent but simulated
   - No real API calls are made to ResellerClub

3. **Test Complete Flow**

   - Add domains to cart
   - Proceed to checkout
   - Complete payment with test credentials
   - Domain registration is simulated

4. **Test Mode Page**
   - Visit `/test-mode` for dedicated testing interface
   - Access from Admin Dashboard → Quick Actions → Test Mode

### Benefits

- **Development**: Test without API rate limits or real charges
- **Testing**: Complete end-to-end testing with predictable results
- **Demos**: Professional demonstrations without external dependencies

## 🚨 Troubleshooting

### Common Issues

1. **TLD Pricing Not Loading**

   - Check ResellerClub API credentials
   - Verify `reseller-id` parameter is set
   - Ensure API endpoints are accessible
   - Check if testing mode is interfering

2. **Domain Search Failing (404 Error)**

   - **Fixed**: All API endpoints now use correct `/api/` prefix
   - Verify API key permissions
   - Check network connectivity
   - Review API rate limits
   - Ensure IP address is whitelisted in ResellerClub account
   - Try enabling testing mode to isolate API issues

3. **API Endpoint Issues**

   - All endpoints now correctly use `/api/` prefix:
     - `/api/domains/available.json` (was `/domains/available.json`)
     - `/api/domains/register.json` (was `/domains/register.json`)
     - `/api/domains/dns/*` endpoints
     - `/api/products/*` endpoints

4. **Payment Processing Issues**

   - Verify Razorpay credentials
   - Check webhook configuration
   - Review payment amount calculations
   - Ensure test credentials are used in development

5. **Testing Mode Issues**
   - Clear browser cache and localStorage
   - Check if testing mode indicator is visible
   - Verify testing mode is enabled in Admin Settings
   - Restart development server if needed

### Debug Logging

The system includes comprehensive logging:

```bash
# Enable debug logs
DEBUG=* npm run dev

# Check specific API calls
grep "PRICING" logs/app.log
grep "RESELLERCLUB" logs/app.log
```

## 📊 API Rate Limits & Performance

### Rate Limits

- **ResellerClub API**: 1000 requests/hour
- **Authentication endpoints**: 5 requests per minute per IP
- **Domain search**: 10 requests per minute per user
- **Payment endpoints**: 3 requests per minute per user

### Caching Strategy

- **Pricing Data**: 5-minute TTL for ResellerClub pricing
- **User Sessions**: JWT tokens with configurable expiration
- **Cart Data**: Persistent storage with server synchronization
- **API Responses**: Intelligent caching to reduce external API calls

### Performance Optimizations

- **Batch Processing**: TLD pricing fetched in batches
- **Lazy Loading**: Components loaded on demand
- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Next.js Image component
- **Database Connection**: Connection pooling with Mongoose
- **Static Generation**: Static pages where possible

## 🔒 Security Features

### Authentication & Authorization

- **JWT-based authentication** with proper expiration
- **Role-based access control** (User, Admin)
- **Password hashing** using bcrypt with salt rounds
- **Session management** with secure token handling
- **Admin-only route protection** with middleware

### Input Validation & Sanitization

- **Comprehensive input validation** using validator library
- **XSS protection** through input sanitization
- **SQL/NoSQL injection prevention**
- **Email validation** and format checking
- **Domain name validation** and format verification

### API Security

- **Rate limiting** on all API endpoints
- **CORS configuration** for cross-origin requests
- **API key encryption** and secure storage
- **Request validation** and sanitization
- **Error handling** without information leakage

### Data Protection

- **Environment variable protection**
- **Secure database connections** with MongoDB Atlas
- **Payment data encryption** through Razorpay
- **Email security** with secure SMTP configuration
- **File upload restrictions** and validation

## 📈 Performance & Scalability

### Frontend Performance

- **Next.js 14 App Router** with automatic code splitting
- **Static Generation** for public pages
- **Image Optimization** with Next.js Image component
- **Lazy Loading** for components and routes
- **Bundle Analysis** and optimization
- **Responsive Design** with mobile-first approach

### Backend Performance

- **API Route Optimization** with Next.js API routes
- **Database Connection Pooling** with Mongoose
- **Caching Strategy** for frequently accessed data
- **Batch Processing** for bulk operations
- **Error Handling** with proper logging
- **Rate Limiting** to prevent abuse

### State Management

- **Zustand Stores** with persistence
- **Optimized Re-renders** with selective subscriptions
- **Cross-tab Synchronization** for testing mode
- **Server Synchronization** for cart data
- **Memory Management** with proper cleanup

### Monitoring & Analytics

- **Error Tracking** with comprehensive logging
- **Performance Monitoring** for API calls
- **User Analytics** (privacy-compliant)
- **Database Performance** monitoring
- **API Usage Tracking** for rate limit management

## 📄 Available Pages & Routes

### Public Pages

- **`/`** - Homepage with domain search and features
- **`/about`** - About Us page with company information
- **`/contact`** - Contact Us page with contact form
- **`/login`** - User login page
- **`/register`** - User registration page
- **`/reset-password`** - Password reset page
- **`/privacy`** - Privacy policy page
- **`/terms-and-conditions`** - Terms and conditions page
- **`/cancellation-refund`** - Cancellation and refund policy

### User Pages (Authentication Required)

- **`/dashboard`** - User dashboard with domain management
- **`/cart`** - Shopping cart page
- **`/checkout`** - Checkout and payment page
- **`/payment-success`** - Payment success page
- **`/domain-management`** - Domain management for user domains

### Admin Pages (Admin Access Required)

- **`/admin`** - Admin dashboard
- **`/admin/user-management`** - User management
- **`/admin/order-management`** - Order management
- **`/admin/payment-management`** - Payment management
- **`/admin/pricing-management`** - TLD pricing management
- **`/admin/system-settings`** - Admin settings and configuration

### Testing & Development Pages

- **`/test-mode`** - Testing mode interface
- **`/testing-guide`** - Testing mode documentation
- **`/debug`** - Debug pages for development
- **`/test`** - Test pages

### Template Pages

- **`/basic`** - Basic page template
- **`/minimal`** - Minimal page template
- **`/minimal-home`** - Minimal homepage template
- **`/simple`** - Simple page template

### API Routes

- **`/api/auth/*`** - Authentication endpoints
- **`/api/domains/*`** - Domain management endpoints
- **`/api/payments/*`** - Payment processing endpoints
- **`/api/cart/*`** - Cart management endpoints
- **`/api/admin/*`** - Admin-only endpoints
- **`/api/contact`** - Contact form submission
- **`/api/debug-pricing`** - Pricing debug endpoints

## 🛠️ Development Workflow

### Testing Mode Usage

1. **Enable Testing Mode**

   ```bash
   # Via Admin Panel
   Admin Dashboard → Settings → Testing Mode → Toggle ON

   # Via Environment Variable
   TESTING_MODE=true
   ```

2. **Test Domain Operations**

   - All domain searches return mock available domains
   - Pricing is simulated but consistent
   - No real API calls to ResellerClub
   - Payment processing still works (with test credentials)

3. **Test Complete Flow**
   ```bash
   # 1. Search domains (returns mock results)
   # 2. Add to cart (real cart functionality)
   # 3. Checkout (real checkout process)
   # 4. Payment (real Razorpay with test credentials)
   # 5. Domain registration (simulated)
   ```

### Component Development

```typescript
// Import components from the centralized index
import { Button, Card, Input, HeroSection } from "@/components";

// Use with TypeScript interfaces
<Button variant="primary" size="lg" loading={isLoading}>
  Submit
</Button>

<Card hover padding="md">
  <Input label="Domain Name" placeholder="example.com" />
</Card>
```

### State Management

```typescript
// Cart management
import { useCartStore } from "@/store/cartStore";
const { addItem, removeItem, getTotalPrice } = useCartStore();

// Testing mode
import { useTestingStore } from "@/store/testingStore";
const { isTestingMode, toggleTestingMode } = useTestingStore();
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Enable testing mode** for safe development
4. **Make your changes** following the component architecture
5. **Test thoroughly** using testing mode
6. **Add tests** if applicable
7. **Update documentation** if needed
8. **Submit a pull request**

### Development Guidelines

- Use TypeScript for all new code
- Follow the existing component structure
- Test with testing mode enabled
- Update documentation for new features
- Use the established naming conventions
- Follow the security best practices

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:

- **Documentation**: Check the comprehensive documentation files
- **Issues**: Create an issue in the repository
- **Troubleshooting**: Review the troubleshooting section

## 📚 API Documentation

### Domain Search API

#### `POST /api/domains/search`

Search for domain availability and pricing.

**Request Body:**

```json
{
  "domain": "example.com",
  "tlds": ["com", "net", "org"] // Optional: for multiple TLD search
}
```

**Response:**

```json
{
  "success": true,
  "results": [
    {
      "domainName": "example.com",
      "available": true,
      "price": 27862.8,
      "currency": "INR",
      "registrationPeriod": 1,
      "pricingSource": "live"
    }
  ],
  "totalCount": 1,
  "availableCount": 1,
  "livePricingCount": 1,
  "totalCustomerPrice": "₹27,863",
  "searchTime": "1.2s"
}
```

### Admin TLD Pricing API

#### `GET /api/admin/tld-pricing`

Get comprehensive TLD pricing data for admin panel.

**Response:**

```json
{
  "success": true,
  "tldPricing": [
    {
      "tld": ".com",
      "customerPrice": 27862.8,
      "resellerPrice": 25000,
      "currency": "INR",
      "category": "Generic",
      "description": "Commercial domains",
      "margin": 10.3
    }
  ],
  "totalCount": 150,
  "lastUpdated": "2024-01-15T10:30:00Z",
  "pricingSource": "live"
}
```

### Authentication API

#### `POST /api/auth/login`

User authentication endpoint.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "token": "jwt_token_here"
}
```

- **API Documentation**: Check `API.md` for endpoint details
- **Testing**: Use testing mode for safe development
- **Component System**: Check `components/README.md` for component usage

## 📚 Additional Documentation

### Project Documentation

- **[API.md](./API.md)**: Complete API documentation with endpoints and examples
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**: Detailed project structure and component architecture
- **[TESTING_MODE.md](./TESTING_MODE.md)**: Comprehensive testing mode documentation
- **[components/README.md](./components/README.md)**: Component system documentation

### Key Scripts

- **`npm run setup`**: Interactive setup script for environment configuration
- **`npm run init-db`**: Database initialization script
- **`npm run dev`**: Development server with hot reload
- **`npm run build`**: Production build
- **`npm run start`**: Production server
- **`npm run lint`**: Code linting

### Environment Files

- **`.env.local`**: Local environment variables (not committed)
- **`.env.example`**: Environment variables template
- **`update_pricing.js`**: Script to update pricing logic in ResellerClub API

## 🎯 Getting Started Checklist

- [ ] Clone the repository
- [ ] Run `npm install`
- [ ] Run `npm run setup` for interactive configuration
- [ ] Configure MongoDB Atlas connection
- [ ] Set up ResellerClub API credentials
- [ ] Configure Razorpay payment gateway
- [ ] Set up email service (Nodemailer)
- [ ] Run `npm run init-db`
- [ ] Start development server with `npm run dev`
- [ ] Test domain search functionality
- [ ] Enable testing mode for safe development
- [ ] Access admin panel at `/admin`
- [ ] Test complete user flow (search → cart → checkout → payment)

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**API Status**: ✅ Working with 32+ TLDs  
**Pricing Source**: ResellerClub API (Indian Pricing)  
**Currency**: INR (₹)
**Testing Mode**: ✅ Available for safe development  
**Documentation**: ✅ Comprehensive with examples
