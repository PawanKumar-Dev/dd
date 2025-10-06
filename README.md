# Excel Technologies - Domain Management System

A modern, full-stack domain management platform built with Next.js 14, featuring live ResellerClub API integration, secure payment processing, and comprehensive admin tools.

## 🎯 Overview

Complete domain registration and management solution with real-time pricing, secure payments, DNS management, and advanced admin capabilities. Built for both customers and administrators with a focus on security, performance, and user experience.

## ✨ Key Features

### 🔍 Domain Management

- **Live Domain Search** - Real-time availability with ResellerClub API
- **Promotional Pricing** - Dynamic pricing with promotional offers
- **DNS Management** - Complete DNS record management
- **Domain Transfer** - Seamless domain transfer process

### 💳 Payment & Security

- **Multi-layer Payment Verification** - Razorpay integration with signature verification
- **Secure Authentication** - JWT-based auth with role-based access
- **Payment Security** - Domain registration only after confirmed payment
- **Failed Domain Handling** - Automatic retry and refund processes

### 👥 User Experience

- **User Dashboard** - Domain management and account control
- **Shopping Cart** - Persistent cart with server synchronization
- **Responsive Design** - Google Workspace theme, mobile-first
- **Real-time Notifications** - Live updates and status alerts

### 🛠️ Admin Tools

- **Admin Dashboard** - Comprehensive management interface
- **Order Management** - Track and manage all orders
- **User Management** - Customer account administration
- **Failed Domain Alerts** - Real-time notifications for registration failures
- **Pricing Management** - TLD pricing and margin control

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB
- ResellerClub API credentials
- Razorpay account

### Installation

```bash
# Clone repository
git clone <repository-url>
cd domain-management-system

# Install dependencies
npm install

# Environment setup
cp .env.example .env.local
# Configure your environment variables

# Run development server
npm run dev
```

### Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/domain-management

# ResellerClub API
RESELLERCLUB_API_URL=https://httpapi.com/api
RESELLERCLUB_USERNAME=your_username
RESELLERCLUB_API_KEY=your_api_key

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Excel Technologies

# Admin
ADMIN_EMAIL=admin@yourdomain.com
```

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Google Workspace theme
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with HTTP-only cookies
- **Payments**: Razorpay integration
- **Email**: Nodemailer with SMTP
- **State Management**: Zustand with persistence

### Key Components

- **Domain Search** - Live availability checking
- **Payment Processing** - Secure payment verification
- **DNS Management** - Record management interface
- **Admin Panel** - Comprehensive management tools
- **User Dashboard** - Customer account interface

## 📱 Pages & Routes

### Public Pages

- `/` - Homepage with domain search
- `/about` - About page
- `/contact` - Contact form
- `/privacy` - Privacy policy
- `/terms-and-conditions` - Terms and conditions

### User Pages

- `/login` - User authentication
- `/register` - User registration
- `/dashboard` - User dashboard
- `/domain-management` - DNS management
- `/cart` - Shopping cart
- `/checkout` - Payment processing
- `/payment-success` - Payment confirmation

### Admin Pages

- `/admin/dashboard` - Admin overview
- `/admin/user-management` - User administration
- `/admin/order-management` - Order tracking
- `/admin/payment-management` - Payment monitoring
- `/admin/pricing-management` - TLD pricing control
- `/admin/system-settings` - System configuration

## 🔧 API Endpoints

### Domain Management

- `GET /api/domains/search` - Search domain availability
- `GET /api/domains/tlds` - Get TLD pricing
- `POST /api/domains/dns` - DNS record management

### Payment Processing

- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment and register domains
- `POST /api/webhooks/razorpay` - Razorpay webhook handler

### User Management

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/user/domains` - Get user domains

### Admin APIs

- `GET /api/admin/users` - Get all users
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/failed-domains` - Get failed domain registrations

## 🛡️ Security Features

- **JWT Authentication** - Secure token-based auth
- **Role-based Access** - Admin and user permissions
- **Input Validation** - Comprehensive data validation
- **XSS Protection** - Cross-site scripting prevention
- **Rate Limiting** - API request throttling
- **Payment Verification** - Multi-layer payment security
- **HTTPS Enforcement** - Secure communication

## 📊 Admin Notifications

### Failed Domain Registration Alerts

- **Email Notifications** - Urgent alerts to admin email
- **Dashboard Alerts** - Real-time notifications in admin panel
- **Action Items** - Clear next steps for resolution
- **Order Tracking** - Complete order and customer details

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Setup

1. Configure all environment variables
2. Set up MongoDB database
3. Configure ResellerClub API credentials
4. Set up Razorpay account
5. Configure SMTP for email notifications

## 📈 Performance

- **Code Splitting** - Automatic route-based splitting
- **Image Optimization** - Next.js image optimization
- **Caching** - API response caching
- **Lazy Loading** - Component lazy loading
- **Bundle Optimization** - Webpack optimization

## 🔄 Recent Updates (v2.2.0)

- **Admin Notifications** - Real-time failed domain registration alerts
- **Enhanced UI** - Improved admin dashboard with notifications
- **Payment Security** - Background cart clearing after payment
- **Error Handling** - Better failed domain registration handling
- **User Experience** - Smoother checkout and payment flow

## 📞 Support

For technical support or questions:

- **Email**: support@exceltechnologies.com
- **Admin Panel**: Real-time system monitoring
- **Documentation**: Comprehensive API and component docs

## 📄 License

This project is proprietary software developed by Excel Technologies.

---

**Built with ❤️ by Excel Technologies**
