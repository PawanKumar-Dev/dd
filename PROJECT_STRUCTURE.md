# Excel Technologies - Domain Management System

## Project Structure

This document outlines the comprehensive component-based architecture of the Excel Technologies domain management system, built with Next.js 14 and modern web technologies.

**Current Status**: Production-ready system with comprehensive testing suite and full domain management functionality.

## 📁 Directory Structure

```
dd/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # API Routes (20+ endpoints)
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── register/         # User registration
│   │   │   ├── login/            # User login
│   │   │   ├── activate/         # Account activation
│   │   │   ├── forgot-password/  # Password reset
│   │   │   └── reset-password/   # Password reset completion
│   │   ├── admin/                # Admin-only endpoints
│   │   │   ├── users/            # User management
│   │   │   ├── orders/           # Order management
│   │   │   ├── payments/         # Payment monitoring
│   │   │   ├── settings/         # System settings
│   │   │   └── tld-pricing/      # TLD pricing management
│   │   ├── domains/              # Domain management
│   │   │   ├── search/           # Domain search
│   │   │   ├── renew/            # Domain renewal
│   │   │   ├── dns/              # DNS record management (CRUD)
│   │   │   ├── nameservers/      # Nameserver lookup
│   │   │   └── activate-dns/     # DNS activation
│   │   ├── orders/               # Order management
│   │   │   ├── [id]/             # Specific order details
│   │   │   └── [id]/invoice/     # Order invoice download
│   │   ├── payments/             # Payment processing
│   │   │   ├── create-order/     # Create payment order
│   │   │   └── verify/           # Payment verification
│   │   ├── cart/                 # Shopping cart
│   │   ├── user/                 # User management
│   │   ├── contact/              # Contact form
│   │   ├── check-ip/             # IP checking
│   │   └── webhooks/             # Webhook handlers
│   │       └── razorpay/         # Razorpay webhooks
│   ├── dashboard/                # User dashboard
│   ├── admin/                    # Admin panel
│   ├── dns-management/           # DNS management interface
│   ├── dns/                      # DNS management
│   ├── checkout/                 # Checkout process
│   ├── payment-success/          # Payment success page
│   ├── login/                    # Login page
│   ├── register/                 # Registration page
│   ├── activate/                 # Account activation
│   ├── forgot-password/          # Password reset
│   ├── reset-password/           # Password reset completion
│   ├── about/                    # About Us page
│   ├── contact/                  # Contact Us page
│   ├── privacy/                  # Privacy policy
│   ├── terms-and-conditions/     # Terms and conditions
│   ├── cancellation-refund/      # Cancellation and refund policy
│   ├── debug/                    # Debug pages
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage
│   ├── loading.tsx               # Loading component
│   ├── error.tsx                 # Error boundary
│   └── not-found.tsx             # 404 page
├── components/                    # Reusable Components (30+ components)
│   ├── admin/                    # Admin-specific components
│   │   ├── AdminCard.tsx         # Admin card component
│   │   ├── AdminTable.tsx        # Admin data table
│   │   ├── AdminTabs.tsx         # Admin tab navigation
│   │   └── AdminPasswordReset.tsx # Admin password reset
│   ├── ui/                       # Base UI components
│   │   ├── Button.tsx            # Button component with variants
│   │   ├── Input.tsx             # Input component with validation
│   │   ├── Textarea.tsx          # Textarea component
│   │   ├── Card.tsx              # Card container component
│   │   ├── Modal.tsx             # Modal dialog component
│   │   ├── LoadingSpinner.tsx    # Loading spinner
│   │   └── EmptyState.tsx        # Empty state component
│   ├── forms/                    # Form components
│   │   ├── LoginForm.tsx         # Login form with validation
│   │   ├── RegisterForm.tsx      # Registration form
│   │   ├── MultiStageRegisterForm.tsx # Multi-step registration
│   │   ├── ForgotPasswordForm.tsx # Password reset form
│   │   └── ContactForm.tsx       # Contact form
│   ├── domain/                   # Domain-specific components
│   │   ├── DomainSearch.tsx      # Domain search interface
│   │   ├── DomainBookingProgress.tsx # Domain booking progress
│   │   ├── DomainRenewalModal.tsx # Domain renewal modal
│   │   ├── DomainRequirementsModal.tsx # Domain requirements
│   │   └── NameServerManagement.tsx # RDAP nameserver lookup
│   ├── payment/                  # Payment components
│   │   ├── Invoice.tsx           # Invoice generation
│   │   └── LivePricingIndicator.tsx # Live pricing indicator
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx            # Site header
│   │   ├── Navigation.tsx        # Navigation bar
│   │   ├── Footer.tsx            # Site footer
│   │   └── PageTransition.tsx    # Page transition animations
│   ├── content/                  # Content components
│   │   ├── Logo.tsx              # Logo component
│   │   ├── FAQItem.tsx           # FAQ accordion item
│   │   ├── ContactInfo.tsx       # Contact information
│   │   ├── FeatureCard.tsx       # Feature display card
│   │   ├── StatsCard.tsx         # Statistics card
│   │   ├── HeroSection.tsx       # Hero section component
│   │   ├── Section.tsx           # Generic section wrapper
│   │   └── LoadingPage.tsx       # Loading page component
│   ├── utility/                  # Utility components
│   │   ├── ClientOnly.tsx        # Client-side only rendering
│   │   └── OutboundIPBadge.tsx   # Outbound IP display
│   ├── index.ts                  # Component exports
│   └── README.md                 # Component documentation
├── lib/                          # Utility Libraries
│   ├── auth.ts                   # JWT authentication service
│   ├── admin-auth.ts             # Admin authentication middleware
│   ├── mongodb.ts                # MongoDB connection management
│   ├── mongoose.ts               # Mongoose ODM configuration
│   ├── resellerclub.ts           # ResellerClub API integration
│   ├── resellerclub-wrapper.ts   # ResellerClub API wrapper
│   ├── pricing-service.ts        # TLD pricing management
│   ├── settings-service.ts       # Application settings
│   ├── razorpay.ts               # Razorpay payment integration
│   ├── razorpay-payments.ts      # Razorpay payment service
│   ├── email.ts                  # Email service (Nodemailer)
│   ├── validation.ts             # Input validation utilities
│   ├── security.ts               # Security utilities
│   ├── security-middleware.ts    # Security middleware
│   ├── rate-limit.ts             # Rate limiting middleware
│   ├── domainRequirements.ts     # Domain requirements validation
│   ├── dateUtils.ts              # Date formatting utilities
│   ├── utils.ts                  # General utilities
│   └── types.ts                  # TypeScript type definitions
├── models/                       # MongoDB Schemas
│   ├── User.ts                   # User model with authentication
│   ├── Order.ts                  # Order model with domain tracking
│   ├── Payment.ts                # Payment model
│   ├── Domain.ts                 # Domain model
│   ├── DNSRecord.ts              # DNS record model
│   ├── Settings.ts               # Application settings model
│   └── IPCheck.ts                # IP check model
├── store/                        # State Management
│   └── cartStore.ts              # Zustand cart store
├── tests/                        # Comprehensive Testing Suite
│   ├── api/                      # API testing scripts
│   │   ├── test-pricing.js       # Pricing service testing
│   │   ├── test-tld-mappings.js  # TLD mapping testing
│   │   ├── test-all-endpoints.js # API endpoint testing
│   │   ├── test-simple-pricing.js # Simple pricing verification
│   │   ├── test-final-pricing.js # Final pricing verification
│   │   └── test-eu-pricing.js    # EU TLD testing
│   ├── admin/                    # Admin functionality tests
│   │   ├── test-ip-check.js      # IP check testing
│   │   └── test-delete-order.js  # Order deletion testing
│   ├── payment/                  # Payment system tests
│   │   ├── test-payment-success.js # Payment success testing
│   │   └── test-error-handling.js # Error handling testing
│   ├── pricing/                  # Pricing system tests
│   │   ├── test-ai-pricing.js    # AI pricing testing
│   │   └── test-pricing-debug.js # Pricing debug testing
│   ├── debug/                    # Debug tools
│   │   ├── debug-pricing.js      # Pricing debugging
│   │   └── debug-ai-pricing.js   # AI pricing debugging
│   ├── scripts/                  # Utility scripts
│   │   └── update_pricing.js     # Pricing update utility
│   ├── run-tests.js              # Centralized test runner
│   └── README.md                 # Testing documentation
├── public/                       # Static Assets
│   ├── logo-black.png            # Black logo
│   ├── logo-white.png            # White logo
│   └── favicon.png               # Site favicon
├── scripts/                      # Utility Scripts
│   ├── setup.js                  # General setup script
│   ├── init-db.js                # Database initialization
│   ├── recreate-admin.js         # Admin user recreation
│   ├── kill-ports.js             # Port management utility
│   └── migrate-order-userids.js  # Order userId migration
├── middleware.ts                 # Next.js middleware
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies and scripts
├── package-lock.json             # Dependency lock file
├── env.example                   # Environment variables template
├── next-env.d.ts                 # Next.js type definitions
├── test-payment-failure.js       # Payment failure testing
├── README.md                     # Project documentation
├── API.md                        # API documentation
├── SETUP.md                      # Setup guide
└── PROJECT_STRUCTURE.md          # This file
```

## 🧩 Component Architecture

### 1. Layout Components

- **Header**: Site header with navigation and user menu
- **Navigation**: Complete navigation bar with mobile menu support
- **Footer**: Site footer with links and company information
- **PageTransition**: Smooth page transition animations

### 2. UI Components

- **Button**: Comprehensive button with multiple variants (primary, secondary, outline, ghost, danger)
- **Input**: Form input with label, error handling, and icon support
- **Textarea**: Textarea input with validation and character counting
- **Card**: Card container with hover effects and variants
- **Modal**: Modal dialog with backdrop and close functionality
- **LoadingSpinner**: Loading spinner with customizable size and color
- **EmptyState**: Empty state component for no-data scenarios

### 3. Form Components

- **LoginForm**: Complete login functionality with validation
- **RegisterForm**: User registration form with multi-step support
- **MultiStageRegisterForm**: Multi-step registration with progress tracking
- **ForgotPasswordForm**: Password reset form with email validation
- **ContactForm**: Contact form with submission handling and validation

### 4. Domain Components

- **DomainSearch**: Domain search interface with real-time pricing
- **DomainBookingProgress**: Domain booking progress tracking
- **DomainRenewalModal**: Domain renewal modal with pricing
- **DomainRequirementsModal**: Domain requirements and validation
- **NameServerManagement**: RDAP nameserver lookup and management

### 5. Payment Components

- **Invoice**: PDF invoice generation and display
- **LivePricingIndicator**: Real-time pricing indicator with updates

### 6. Admin Components

- **AdminCard**: Admin-specific card component
- **AdminTable**: Data table for admin interfaces
- **AdminTabs**: Tab navigation for admin sections
- **AdminPasswordReset**: Admin password reset functionality

### 7. Content Components

- **Logo**: Reusable logo component with size and variant options
- **FAQItem**: Accordion-style FAQ item component
- **ContactInfo**: Contact information display component
- **FeatureCard**: Feature display card with icons and descriptions
- **StatsCard**: Statistics display card with trend indicators
- **HeroSection**: Hero section component with customizable backgrounds
- **Section**: Generic section wrapper with background and padding options
- **LoadingPage**: Full-page loading component

### 8. Utility Components

- **ClientOnly**: Client-side only rendering component
- **OutboundIPBadge**: Outbound IP address display badge

## 🔧 Key Features

### Security

- **JWT Authentication**: Secure token-based authentication with proper expiration
- **Input Validation**: Comprehensive input validation and sanitization
- **Rate Limiting**: API endpoint protection with configurable limits
- **Admin-only Routes**: Role-based access control for admin functions
- **XSS Protection**: Cross-site scripting prevention
- **SQL Injection Protection**: NoSQL injection prevention
- **CSRF Protection**: Cross-site request forgery protection
- **Password Hashing**: Bcrypt with salt rounds for secure password storage

### User Experience

- **Responsive Design**: Mobile-first approach with breakpoint optimization
- **Fixed Navigation**: Sticky navigation with backdrop blur effect
- **Smooth Animations**: Framer Motion animations for enhanced UX
- **Loading States**: Comprehensive loading indicators and skeleton screens
- **Error Handling**: User-friendly error messages and recovery options
- **Toast Notifications**: Real-time feedback with React Hot Toast
- **Accessibility**: ARIA attributes and keyboard navigation support
- **Progressive Enhancement**: Graceful degradation for older browsers

### Developer Experience

- **TypeScript**: Full type safety with strict configuration
- **Component Architecture**: Modular, reusable component system
- **Comprehensive Documentation**: Detailed documentation for all components
- **Consistent Code Style**: ESLint and Prettier for code consistency
- **Testing Suite**: Comprehensive testing framework with multiple test categories
- **Utility Scripts**: Development and maintenance automation scripts
- **Hot Reloading**: Fast development with Next.js hot reloading
- **Error Boundaries**: React error boundaries for graceful error handling

### Performance

- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Next.js Image component for optimized images
- **Caching**: Intelligent caching with 5-minute TTL for API responses
- **Bundle Optimization**: Optimized bundle size with tree shaking
- **Lazy Loading**: Component lazy loading for better performance
- **CDN Ready**: Static asset optimization for CDN deployment

## 📱 Page Structure

### Public Pages

- **Homepage**: Hero, features, stats, FAQ
- **About Us**: Company information and mission
- **Contact Us**: Contact form and information
- **Login**: User authentication
- **Register**: User registration
- **Forgot Password**: Password reset

### Protected Pages

- **Dashboard**: User domain management
- **Admin Panel**: Admin user management
- **DNS Management**: DNS record management
- **Checkout**: Payment processing

## 🎨 Design System

### Colors

- Primary: Blue (#3B82F6)
- Secondary: Gray (#6B7280)
- Success: Green (#10B981)
- Error: Red (#EF4444)
- Warning: Yellow (#F59E0B)

### Typography

- Headings: Font-bold, various sizes
- Body: Font-medium, responsive sizes
- Captions: Font-normal, smaller sizes

### Spacing

- Consistent padding and margins
- Responsive spacing (sm, md, lg, xl)
- Grid-based layouts

## 🚀 Getting Started

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Setup**

   ```bash
   cp .env.example .env
   # Configure your environment variables
   ```

3. **Database Setup**

   ```bash
   npm run init-db
   ```

4. **Development Server**
   ```bash
   npm run dev
   ```

## 📚 Component Usage

### Import Components

```tsx
import { Button, Card, Input, HeroSection } from "@/components";
```

### Use in Pages

```tsx
function MyPage() {
  return (
    <div>
      <HeroSection>
        <h1>My Page</h1>
      </HeroSection>

      <Section background="white">
        <Card>
          <Input label="Name" />
          <Button variant="primary">Submit</Button>
        </Card>
      </Section>
    </div>
  );
}
```

## 🔒 Security Features

- **Authentication**: JWT with proper expiration
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive validation and sanitization
- **Rate Limiting**: API endpoint protection
- **XSS Protection**: Input sanitization
- **Injection Protection**: SQL/NoSQL injection prevention

## 📈 Performance

- **Component-based**: Reusable and maintainable
- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component
- **Caching**: MongoDB connection caching
- **Responsive**: Mobile-first design

## 🧪 Testing

- **Type Safety**: TypeScript throughout
- **Component Testing**: Isolated component testing
- **API Testing**: Endpoint testing
- **Security Testing**: Input validation testing

## 📖 Documentation

- **Component README**: Detailed component documentation
- **API Documentation**: Complete API reference
- **Project README**: Setup and usage instructions
- **TLD Pricing Guide**: Comprehensive TLD mapping and pricing system documentation
- **Code Comments**: Inline documentation

### Documentation Files

- `README.md` - Main project documentation
- `API.md` - Complete API reference with TLD pricing endpoints
- `PROJECT_STRUCTURE.md` - This file, project architecture overview
- `SETUP.md` - Setup and installation instructions

## ✅ Recent Resolutions

- **DNS Management API**: Successfully resolved and fully functional
- **Status**: All DNS record types (A, AAAA, CNAME, MX, NS, TXT, SRV) working
- **Impact**: Complete DNS record management functionality available

## 🔄 Recent Updates

- ✅ Comprehensive testing suite with 20+ test categories
- ✅ Production-ready deployment configuration
- ✅ Enhanced error handling and logging
- ✅ Improved user experience and interface
- ✅ DNS Management API fully functional with ResellerClub integration
- ✅ Complete DNS record CRUD operations (Create, Read, Update, Delete)
- ✅ Inline DNS record editing with real-time updates
- ✅ Enhanced DNS record deletion with proper ResellerClub API parameters
- ✅ Simplified pricing model without GST calculations
- ✅ Optional Priority field support for DNS records with validation for MX/SRV records
- ✅ Enhanced security with client-side console log removal
- ✅ SRV record type support for service discovery

This component-based architecture makes the project highly maintainable, scalable, and developer-friendly while providing a consistent user experience across all pages.
