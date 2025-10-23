# Excel Technologies - Domain Management System

A comprehensive, enterprise-grade domain registration and management platform built with Next.js 14, featuring ResellerClub API integration, Razorpay payment processing, and advanced admin management capabilities.

### Domain Management

- **Domain Search & Registration** - Search and register domains across 400+ TLDs with real-time availability checking
- **Live Pricing Integration** - Real-time pricing from ResellerClub API with 200+ comprehensive TLD mappings
- **Multi-stage Registration** - Step-by-step user registration process with geolocation support
- **DNS Management** - Complete DNS record management with RDAP nameserver lookup, full CRUD operations, and priority field support for MX/SRV records
- **Domain Renewal** - Easy domain renewal with automated notifications
- **Cart System** - Add multiple domains to cart for bulk registration
- **Pending Domains Detection** - Automatic detection of failed registrations due to insufficient funds or processing issues
- **TLD-Specific Validation** - Automatic validation of minimum registration periods for different TLDs (e.g., .ai domains require 2+ years)

### Enhanced User Experience & Animations

- **Advanced Animations** - Smooth Framer Motion animations throughout the application with micro-interactions
- **Interactive Components** - Enhanced buttons, cards, and forms with hover effects and smooth transitions
- **Loading States** - Beautiful skeleton screens and loading animations with progress indicators
- **Toast Notifications** - Animated toast notifications with auto-dismiss and progress bars
- **Page Transitions** - Smooth page transitions with custom easing and scale effects
- **Responsive Design** - Mobile-first design with touch-friendly interactions and optimized animations

### Payment & Order System

- **Razorpay Integration** - Secure payment processing with Indian payment gateway
- **Order Management** - Complete order tracking with real-time status updates
- **PDF Invoice Generation** - Automated invoice generation and download
- **Payment Verification** - Secure payment verification and domain registration automation

### User Management & Authentication

- **JWT Authentication** - Secure token-based authentication with proper expiration
- **Social Login Integration** - Google and Facebook OAuth with seamless profile completion
- **User Registration** - Multi-step registration with email activation
- **Password Reset** - Secure password reset with email verification
- **Role-based Access Control** - Admin and user roles with appropriate permissions
- **Profile Management** - Complete user profile with address and contact information
- **Dual Authentication System** - NextAuth.js for social login, custom JWT for admin users

### Admin Panel

- **User Management** - Complete user administration with role controls
- **Order Tracking** - Real-time order monitoring and management
- **Payment Monitoring** - Payment status tracking and management
- **Pending Domains Management** - Handle domains that failed registration due to insufficient funds or processing issues
- **TLD Requirements Management** - Configure and enforce TLD-specific registration requirements
- **Pricing Configuration** - TLD pricing management and updates
- **System Settings** - Application-wide settings management
- **Analytics Dashboard** - System statistics and performance metrics

## 🛠️ Technology Stack

### Frontend Technologies

- **Next.js 14** - React framework with App Router and server-side rendering
- **TypeScript 5.3.3** - Type-safe development with strict type checking
- **Tailwind CSS 3.3.6** - Utility-first CSS framework with custom design system
- **Framer Motion 12.23.22** - Advanced animation library with micro-interactions, page transitions, and smooth component animations
- **React Hook Form 7.48.2** - Performant form handling with validation
- **React Hot Toast 2.4.1** - Enhanced toast notification system with animations
- **Lucide React 0.294.0** - Modern icon library with 1000+ icons
- **Zustand 4.4.7** - Lightweight state management
- **Enhanced UI Components** - Custom animated components with skeleton loading, enhanced modals, and interactive elements

### Backend Technologies

- **Next.js API Routes** - Serverless API endpoints with middleware support
- **MongoDB 8.0.3** - NoSQL database with Mongoose ODM
- **JWT Authentication** - Secure token-based authentication with refresh tokens
- **Bcrypt 2.4.3** - Password hashing with salt rounds
- **Axios 1.6.2** - HTTP client for API requests
- **Nodemailer 6.9.7** - Email sending service

### External Integrations

- **ResellerClub API** - Domain registration, pricing, and management services
- **Razorpay 2.9.2** - Payment processing and webhook handling
- **Puppeteer** - PDF generation for invoices and documents
- **SMTP Services** - Email delivery (Gmail, SendGrid support)

### Development Tools

- **ESLint 8.56.0** - Code linting and quality assurance
- **PostCSS 8.4.32** - CSS processing and optimization
- **Autoprefixer 10.4.16** - CSS vendor prefixing
- **Class Variance Authority** - Component variant management

## 🧪 Comprehensive Testing Suite

The project includes a robust testing framework with multiple test categories and automated test runners:

### Test Categories

- **API Tests** - ResellerClub API integration, TLD pricing, and endpoint testing
- **Admin Tests** - Admin functionality, user management, and order operations
- **Payment Tests** - Payment processing, success/failure scenarios, and error handling
- **Pricing Tests** - TLD pricing accuracy, mapping validation, and AI pricing
- **Debug Tools** - Troubleshooting utilities and data analysis
- **System Tests** - End-to-end functionality and integration testing

### Quick Start

```bash
# Run all tests
node tests/run-tests.js

# Run specific test categories
node tests/run-tests.js api      # API integration tests
node tests/run-tests.js admin    # Admin functionality tests
node tests/run-tests.js payment  # Payment system tests
node tests/run-tests.js pricing  # Pricing system tests
node tests/run-tests.js debug    # Debug and troubleshooting tools

# Run specific tests
node tests/run-tests.js test-final-pricing    # Final pricing verification
node tests/run-tests.js test-eu-pricing       # EU TLD specific testing
node tests/run-tests.js test-payment-success  # Payment success testing
```

### Test Coverage

- **200+ TLD Mappings** - Comprehensive TLD mapping validation
- **API Endpoint Testing** - All ResellerClub API endpoints
- **Payment Flow Testing** - Complete payment processing validation
- **Admin Functionality** - User management and system administration
- **Error Handling** - Comprehensive error scenario testing

For detailed testing documentation, see [tests/README.md](tests/README.md).

## 🔐 Social Login Integration

The system supports social login for enhanced user experience:

### Supported Providers

- **Google OAuth** - Sign in with Google account
- **Facebook OAuth** - Sign in with Facebook account
- **Admin Protection** - Admin users cannot use social login (maintains security)

### Features

- **Profile Completion Flow** - Social login users must complete profile before checkout
- **Dual Authentication** - NextAuth.js for social login, custom JWT for admin users
- **Seamless Integration** - Works alongside existing credential-based authentication

### Setup

For detailed social login setup instructions, see [SOCIAL_LOGIN_SETUP.md](SOCIAL_LOGIN_SETUP.md).

## 🛠️ Utility Scripts

The project includes comprehensive utility scripts for development, maintenance, and deployment:

### Port Management

**Kill Ports Script** (`scripts/kill-ports.js`)

- Kills processes running on specified ports (default: 3000, 3001, 3002)
- Cross-platform support (Windows, Linux, macOS)
- Custom port specification via command line
- Safe error handling for already-free ports

```bash
# Kill default ports
node scripts/kill-ports.js

# Kill custom ports
node scripts/kill-ports.js --ports 3000,8080,9000

# Show help
node scripts/kill-ports.js --help
```

### Database Management

- `scripts/init-db.js` - Initialize database with admin user and default settings
- `scripts/recreate-admin.js` - Recreate admin user with fresh credentials
- `scripts/setup.js` - General setup script for environment configuration
- `scripts/migrate-order-userids.js` - Migrate Order.userId from String to ObjectId references

### Development Scripts

- `scripts/kill-ports.js` - Port management utility
- `scripts/setup.js` - Environment setup and configuration
- `scripts/init-db.js` - Database initialization
- `scripts/recreate-admin.js` - Admin user management

## 📁 Project Structure

```
dd/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # API Routes (20+ endpoints)
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── admin/                # Admin-only endpoints
│   │   ├── domains/              # Domain management endpoints
│   │   ├── orders/               # Order management endpoints
│   │   ├── payments/             # Payment processing endpoints
│   │   ├── cart/                 # Shopping cart endpoints
│   │   ├── user/                 # User management endpoints
│   │   └── webhooks/             # Webhook handlers
│   ├── admin/                    # Admin panel pages
│   ├── dashboard/                # User dashboard
│   ├── checkout/                 # Checkout process
│   ├── dns-management/           # DNS management interface
│   ├── dns/                      # DNS management
│   ├── payment-success/          # Payment success page
│   └── (auth)/                   # Authentication pages
├── components/                   # Reusable React Components (30+ components)
│   ├── admin/                    # Admin-specific components
│   ├── ui/                       # Base UI components
│   ├── forms/                    # Form components
│   └── user/                     # User-specific components
├── lib/                          # Utility Libraries
│   ├── auth.ts                   # JWT authentication service
│   ├── admin-auth.ts             # Admin authentication
│   ├── resellerclub.ts          # ResellerClub API integration
│   ├── pricing-service.ts       # TLD pricing management
│   ├── settings-service.ts      # Application settings
│   ├── razorpay.ts              # Razorpay integration
│   ├── email.ts                 # Email service
│   ├── validation.ts            # Input validation
│   ├── security.ts              # Security utilities
│   └── dateUtils.ts             # Date formatting utilities
├── models/                       # MongoDB Schemas
│   ├── User.ts                   # User model with authentication
│   ├── Order.ts                  # Order model with domain tracking
│   ├── Payment.ts                # Payment model
│   ├── Domain.ts                 # Domain model
│   ├── DNSRecord.ts              # DNS record model
│   └── Settings.ts               # Application settings model
├── scripts/                      # Utility Scripts
│   ├── kill-ports.js            # Port management utility
│   ├── init-db.js               # Database initialization
│   ├── recreate-admin.js        # Admin user recreation
│   ├── setup.js                 # Setup script
│   └── migrate-order-userids.js # Order userId migration
├── tests/                        # Comprehensive Testing Suite
│   ├── api/                      # API testing scripts
│   ├── admin/                    # Admin functionality tests
│   ├── payment/                  # Payment system tests
│   ├── pricing/                  # Pricing system tests
│   ├── debug/                    # Debug tools
│   └── run-tests.js             # Centralized test runner
├── store/                        # State Management
│   └── cartStore.ts              # Zustand cart store
└── public/                       # Static Assets
    ├── logo-black.png
    ├── logo-white.png
    └── favicon.png
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database
- ResellerClub API credentials
- Razorpay account

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
   cd dd
```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create `.env.local` file:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/domain-management

# ResellerClub API
   RESELLERCLUB_API_KEY=your_api_key
RESELLERCLUB_RESELLER_ID=your_reseller_id

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

   # JWT
   JWT_SECRET=your_jwt_secret

   # Admin
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=your_admin_password

   # Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
```

4. **Initialize Database**

```bash
   npm run init-db
```

5. **Start Development Server**

```bash
   npm run dev
```

6. **Access Application**
   - Frontend: http://localhost:3000 (development)
   - Admin Panel: http://localhost:3000/admin

## 🔧 Available Scripts

### NPM Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run init-db` - Initialize database with admin user
- `npm run recreate-admin` - Recreate admin user

### Utility Scripts

- `node scripts/kill-ports.js` - Kill processes on ports 3000, 3001, 3002
- `node scripts/kill-ports.js --ports 3000,8080,9000` - Kill processes on custom ports
- `node scripts/kill-ports.js --help` - Show help for port killing script

## 👥 User Roles

### Admin

- Full system access
- User management
- Order management
- Payment management
- Pricing management
- Settings configuration

### Regular User

- Domain search and registration
- Order history
- Profile management
- Invoice download

## 🌐 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/activate` - Account activation
- `POST /api/auth/resend-activation` - Resend activation email
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `POST /api/auth/resend-activation` - Resend activation

### Domains

- `GET /api/domains/search` - Search domains
- `POST /api/domains/renew` - Renew domain

### Orders

- `GET /api/orders` - Get user orders
- `GET /api/orders/[id]` - Get specific order
- `GET /api/orders/[id]/invoice` - Download invoice

### Payments

- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment

### Admin APIs

- `GET /api/admin/users` - Get all users
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/payments` - Get payment data
- `GET /api/admin/tld-pricing` - Get TLD pricing
- `GET /api/admin/settings` - Get settings
- `POST /api/admin/settings` - Update settings

## 🎯 Key Features Explained

### Domain Search

- Real-time availability checking
- Live pricing from ResellerClub
- Support for 400+ TLDs with comprehensive mappings
- Cached pricing for performance

### Payment Processing

- Razorpay integration
- Secure payment verification
- Automatic domain registration on successful payment
- Invoice generation

### Admin Management

- User management with role-based access
- Order tracking and management
- Payment monitoring
- Pricing configuration
- System settings management

### TLD Pricing System

- **Comprehensive Mappings**: 200+ TLD mappings for accurate ResellerClub API integration
- **Priority-based Lookup**: Direct mappings take priority over pattern matching
- **Multi-format Support**: Handles various ResellerClub API key formats (dot*, dom*, centralnic\*)
- **Live Pricing**: Real-time pricing from ResellerClub customer and reseller APIs
- **Performance Optimized**: Intelligent caching with 5-minute TTL
- **Error Handling**: Robust fallback mechanisms for missing TLD data

### Pending Domains Management

- **Dual Detection Methods**: Enhanced API response parsing + domain availability verification
- **Immediate Detection**: "Order Locked for Processing" responses are caught immediately
- **User-Friendly Messages**: Shows "Domain registration is being processed" instead of technical errors
- **Admin Dashboard**: Complete interface for managing pending domains with bulk operations
- **Manual Recovery**: Admins can refill funds and manually register domains
- **Automatic Creation**: Pending domain records are created automatically for failed registrations
- **Status Tracking**: Complete audit trail of registration attempts and status changes

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CSRF protection
- Rate limiting on API endpoints
- Secure payment processing

## 📱 Responsive Design

- Mobile-first approach
- Responsive admin panel
- Touch-friendly interface
- Optimized for all screen sizes

## 🌍 Internationalization

- Indian timezone support (IST)
- Indian currency formatting (₹)
- Indian date formats (DD/MM/YYYY)
- Localized number formatting

## 🚀 Deployment

### Production Build

```bash
npm run build
npm run start
```

### Environment Variables

Ensure all production environment variables are set:

- Database connection string
- API credentials
- JWT secret
- Email configuration

### Database Setup

Run the initialization script on first deployment:

```bash
npm run init-db
```

## 📊 Monitoring & Logging

- Comprehensive logging system
- Error tracking
- Performance monitoring
- Admin notifications for failures

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Check the API documentation in `API.md`
- Review the code comments
- Create an issue in the repository

## 🔄 Recent Updates

- ✅ **Comprehensive TLD Mappings**: 200+ TLD mappings for accurate ResellerClub API integration
- ✅ **Simplified Pricing Architecture**: Optimized pricing system for better performance and reliability
- ✅ **Admin Settings Management**: Complete admin panel with system configuration capabilities
- ✅ **Indian Timezone Support**: Full IST timezone integration with localized date/time formatting
- ✅ **Enhanced Error Handling**: Comprehensive error handling with user-friendly messages
- ✅ **Improved User Experience**: Modern UI/UX with responsive design and smooth animations
- ✅ **Comprehensive Testing Suite**: 20+ test categories covering all system components
- ✅ **Production-Ready Deployment**: Complete deployment configuration with security best practices
- ✅ **DNS Management API**: Fully functional DNS record management with ResellerClub integration
- ✅ **Complete DNS CRUD Operations**: Create, Read, Update, Delete DNS records with real-time updates
- ✅ **Inline DNS Record Editing**: Real-time DNS record editing with immediate reflection
- ✅ **Simplified Pricing Model**: Clean pricing without GST calculations for better transparency
- ✅ **Enhanced DNS Record Deletion**: Proper ResellerClub API parameters for reliable deletion
- ✅ **Priority Field Support**: Optional priority field with validation for MX/SRV records
- ✅ **Enhanced Security**: Client-side console log removal for production security
- ✅ **SRV Record Support**: Service discovery support with SRV record type
- ✅ **Social Login Integration**: Google and Facebook OAuth with profile completion flow
- ✅ **Advanced Component Library**: 30+ reusable components with TypeScript support
- ✅ **Comprehensive API Documentation**: Complete API reference with examples and testing
- ✅ **Utility Scripts**: Port management, database initialization, and maintenance tools
- ✅ **Latest Updates**: Enhanced documentation, improved testing coverage, and production optimizations
- ✅ **TLD-Specific Validation**: Automatic validation of minimum registration periods for different TLDs
- ✅ **Enhanced Error Handling**: Improved error detection for "already exists" and pending domain scenarios
- ✅ **Layout Stability**: Fixed checkout page layout shifting issues with stable grid system
- ✅ **User Experience Improvements**: Removed unnecessary messages and streamlined cart/checkout flow

---

**Last Updated**: October 16, 2025  
**Version**: 2.5.0  
**Author**: Excel Technologies  
**Status**: Production-ready with TLD validation, enhanced error handling, and improved user experience
