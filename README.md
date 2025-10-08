# Domain Management System

A comprehensive domain registration and management platform built with Next.js 14, featuring ResellerClub API integration, payment processing, and admin management capabilities.

## 🚀 Features

### Core Functionality

- **Domain Search & Registration** - Search and register domains across 400+ TLDs
- **Live Pricing** - Real-time pricing from ResellerClub API with promotional pricing support
- **Payment Processing** - Integrated Razorpay payment gateway
- **User Management** - Registration, authentication, and profile management
- **Order Management** - Complete order tracking and invoice generation
- **Admin Panel** - Comprehensive admin dashboard for system management

### Advanced Features

- **Promotional Pricing** - Admin-configurable promotional pricing display
- **Multi-stage Registration** - Step-by-step user registration with geolocation
- **Indian Timezone Support** - All dates and times displayed in IST
- **Email Notifications** - Automated email notifications for orders and updates
- **PDF Invoices** - Generate and download PDF invoices
- **Failed Domain Alerts** - Admin notifications for failed domain registrations

## 🛠️ Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Hook Form** - Form handling
- **React Hot Toast** - Toast notifications

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT Authentication** - Secure token-based authentication
- **Bcrypt** - Password hashing

### External Services

- **ResellerClub API** - Domain registration and pricing
- **Razorpay** - Payment processing
- **Nodemailer** - Email sending
- **Puppeteer** - PDF generation

## 📁 Project Structure

```
dd/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── admin/                # Admin-only endpoints
│   │   ├── domains/              # Domain-related endpoints
│   │   ├── orders/               # Order management
│   │   └── payments/             # Payment processing
│   ├── admin/                    # Admin panel pages
│   ├── dashboard/                # User dashboard
│   └── (auth)/                   # Authentication pages
├── components/                   # Reusable React components
│   ├── admin/                    # Admin-specific components
│   ├── ui/                       # Base UI components
│   └── forms/                    # Form components
├── lib/                          # Utility libraries
│   ├── auth.ts                   # Authentication service
│   ├── resellerclub.ts          # ResellerClub API integration
│   ├── pricing-service.ts       # Pricing management
│   ├── settings-service.ts      # Application settings
│   └── dateUtils.ts             # Date formatting utilities
├── models/                       # MongoDB schemas
├── scripts/                      # Database scripts
└── public/                       # Static assets
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
   - Frontend: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run init-db` - Initialize database with admin user
- `npm run recreate-admin` - Recreate admin user

## 👥 User Roles

### Admin

- Full system access
- User management
- Order management
- Payment management
- Pricing management
- Settings configuration
- Failed domain notifications

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
- `GET /api/admin/settings/promotional-pricing` - Get promotional pricing setting
- `POST /api/admin/settings/promotional-pricing` - Update promotional pricing

## 🎯 Key Features Explained

### Domain Search

- Real-time availability checking
- Live pricing from ResellerClub
- Support for 400+ TLDs
- Promotional pricing support
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

### Promotional Pricing

- Admin-configurable promotional pricing
- Real-time promotional price application
- Original price display
- Promotional period tracking

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

- ✅ Promotional pricing system implementation
- ✅ Admin settings management
- ✅ Indian timezone support
- ✅ Verbose logging reduction
- ✅ Enhanced error handling
- ✅ Improved user experience
