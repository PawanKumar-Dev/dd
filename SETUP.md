# 🚀 Excel Technologies - Domain Management System Setup Guide

**Current Status**: Production-ready system with comprehensive testing suite.

## Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd dd
npm install
```

### 2. Environment Configuration

#### Option A: Quick Setup (Development)

```bash
# Copy the environment template
cp env.example .env.local

# Edit with your actual values
nano .env.local
```

#### Option B: Complete Setup (Production)

```bash
# Copy the complete environment file
cp env.example .env.local

# Edit with your actual values
nano .env.local
```

### 3. Database Setup

```bash
# Initialize database with admin user
npm run init-db

# Or recreate admin user if needed
npm run recreate-admin
```

### 4. Required Environment Variables

#### 🔑 Essential Variables (Must Configure)

```env
# Database
MONGODB_URI=mongodb://localhost:27017/domain-management-system

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# Application URL (for email links)
APP_URL=http://localhost:3000

# ResellerClub API
RESELLERCLUB_ID=your-resellerclub-id
RESELLERCLUB_SECRET=your-resellerclub-secret
RESELLERCLUB_API_URL=https://httpapi.com/api
RESELLERCLUB_RESELLER_ID=your-reseller-id

# Razorpay Payment
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=admin@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com

# Admin User (for recreation script)
ADMIN_PASSWORD=your-secure-admin-password
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User

# Application
NODE_ENV=development
PORT=3000

# DNS
DEFAULT_NAMESERVER_1=ns1.yourdomain.com
DEFAULT_NAMESERVER_2=ns2.yourdomain.com
DEFAULT_NAMESERVER_3=ns3.yourdomain.com
DEFAULT_NAMESERVER_4=ns4.yourdomain.com
```

### 5. Generate Secrets

#### JWT Secret

```bash
# Generate a strong JWT secret
openssl rand -base64 32
```

#### NextAuth Secret

```bash
# Generate NextAuth secret
openssl rand -base64 32
```

### 6. Database Setup

#### Local MongoDB

```bash
# Install MongoDB (Ubuntu/Debian)
sudo apt update
sudo apt install mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

#### MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env.local`

### 6. ResellerClub API Setup

1. **Get API Credentials:**

   - Login to [ResellerClub](https://manage.resellerclub.com)
   - Go to API Settings
   - Generate API Key
   - Note your Reseller ID

2. **Configure Environment:**
   ```env
   RESELLERCLUB_ID=your-resellerclub-id
   RESELLERCLUB_SECRET=your-resellerclub-secret
   RESELLERCLUB_API_URL=https://httpapi.com/api
   RESELLERCLUB_RESELLER_ID=your-reseller-id
   ```

### 7. Razorpay Payment Setup

1. **Create Razorpay Account:**

   - Sign up at [Razorpay](https://razorpay.com)
   - Complete KYC verification

2. **Get API Keys:**

   - Go to Settings > API Keys
   - Generate Test/Live keys
   - Set up webhook endpoint

3. **Configure Environment:**
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
   RAZORPAY_KEY_SECRET=your-secret-key
   RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
   ```

### 8. Email Configuration

#### Gmail SMTP

1. Enable 2-Factor Authentication
2. Generate App Password
3. Configure environment:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

#### SendGrid (Alternative)

```env
SENDGRID_API_KEY=your-sendgrid-api-key
```

### 9. Run the Application

#### Development

```bash
# Start development server
npm run dev

# The application will be available at:
# http://localhost:3000
```

#### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### 10. Verify Setup

1. **Check Database Connection:**

   - Visit `/api/health` endpoint
   - Check console logs for MongoDB connection
   - Verify admin user creation

2. **Test ResellerClub API:**

   - Check console logs for API connection
   - Test domain search functionality
   - Run pricing tests: `node tests/run-tests.js test-final-pricing`

3. **Test Payment Integration:**

   - Use Razorpay test mode
   - Complete a test transaction
   - Verify webhook handling

4. **Test Email Notifications:**

   - Register a new user
   - Check email delivery
   - Test password reset functionality

5. **Test Admin Panel:**
   - Login with admin credentials
   - Verify user management
   - Check order management
   - Test settings configuration

## 🔧 Configuration Details

### Environment Variables Reference

| Variable                   | Required | Description               | Example                         |
| -------------------------- | -------- | ------------------------- | ------------------------------- |
| `MONGODB_URI`              | ✅       | MongoDB connection string | `mongodb://localhost:27017/dms` |
| `JWT_SECRET`               | ✅       | JWT signing secret        | `your-secret-key`               |
| `NEXTAUTH_URL`             | ✅       | Application base URL      | `http://localhost:3000`         |
| `APP_URL`                  | ✅       | Email links base URL      | `http://localhost:3000`         |
| `RESELLERCLUB_ID`          | ✅       | ResellerClub ID           | `your-resellerclub-id`          |
| `RESELLERCLUB_SECRET`      | ✅       | ResellerClub Secret       | `your-resellerclub-secret`      |
| `RESELLERCLUB_RESELLER_ID` | ✅       | Your ResellerClub ID      | `123456`                        |
| `RAZORPAY_KEY_ID`          | ✅       | Razorpay key ID           | `rzp_test_xxxxx`                |
| `RAZORPAY_KEY_SECRET`      | ✅       | Razorpay secret           | `your-secret`                   |
| `RAZORPAY_WEBHOOK_SECRET`  | ✅       | Razorpay webhook secret   | `your-webhook-secret`           |
| `SMTP_HOST`                | ✅       | SMTP server host          | `smtp.gmail.com`                |
| `SMTP_USER`                | ✅       | SMTP username             | `your-email@gmail.com`          |
| `SMTP_PASS`                | ✅       | SMTP password             | `your-app-password`             |
| `ADMIN_EMAIL`              | ✅       | Admin notification email  | `admin@yourdomain.com`          |
| `SUPPORT_EMAIL`            | ✅       | Support email address     | `support@yourdomain.com`        |
| `ADMIN_PASSWORD`           | ✅       | Admin user password       | `your-secure-password`          |
| `ADMIN_FIRST_NAME`         | ✅       | Admin first name          | `Admin`                         |
| `ADMIN_LAST_NAME`          | ✅       | Admin last name           | `User`                          |

### Feature Flags

| Variable                     | Default       | Description                |
| ---------------------------- | ------------- | -------------------------- |
| `ENABLE_EMAIL_NOTIFICATIONS` | `true`        | Enable email notifications |
| `ENABLE_ADMIN_NOTIFICATIONS` | `true`        | Enable admin notifications |
| `NODE_ENV`                   | `development` | Environment mode           |
| `PORT`                       | `3000`        | Application port           |

## 🚨 Security Checklist

- [ ] Change all default passwords and secrets
- [ ] Use strong, unique JWT secrets (32+ characters)
- [ ] Enable HTTPS in production
- [ ] Set up proper CORS policies
- [ ] Configure rate limiting
- [ ] Enable request logging
- [ ] Set up monitoring and alerts
- [ ] Regular security updates
- [ ] Validate all input data
- [ ] Implement proper error handling
- [ ] Use environment variables for sensitive data
- [ ] Regular backup of database
- [ ] Monitor API usage and abuse
- [ ] Implement proper session management

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**

   - Check if MongoDB is running
   - Verify connection string
   - Check network connectivity
   - Run: `npm run init-db` to test connection

2. **ResellerClub API Errors**

   - Verify credentials in `.env.local`
   - Check API key permissions
   - Ensure correct Reseller ID
   - Run: `node tests/run-tests.js test-final-pricing`

3. **Razorpay Payment Issues**

   - Verify API keys
   - Check webhook configuration
   - Ensure correct currency settings
   - Test with Razorpay test mode

4. **Email Not Sending**

   - Check SMTP credentials
   - Verify app password for Gmail
   - Check firewall settings
   - Test with: `node tests/run-tests.js payment`

5. **Port Already in Use**

   - Kill existing processes: `node scripts/kill-ports.js`
   - Use different port: `PORT=3001 npm run dev`

6. **Admin User Issues**
   - Recreate admin: `npm run recreate-admin`
   - Check admin credentials in `.env.local`

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
ENABLE_API_LOGGING=true
NODE_ENV=development
```

### Testing and Validation

```bash
# Run all tests
node tests/run-tests.js

# Test specific functionality
node tests/run-tests.js api
node tests/run-tests.js payment
node tests/run-tests.js admin

# Debug pricing issues
node tests/debug/debug-pricing.js
```

## 📞 Support

For additional help:

- **Documentation**: Check README.md and API.md
- **Testing**: Use the comprehensive testing suite
- **Logs**: Check console logs for detailed error messages
- **Issues**: Create an issue in the repository
- **Email**: support@exceltechnologies.com

## 🔄 Updates

To update the system:

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Run database migrations if needed
npm run init-db

# Build and start
npm run build
npm start
```

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**

   - Configure production environment variables
   - Set up production database
   - Configure production email service

2. **Build and Deploy**

   ```bash
   npm run build
   npm start
   ```

3. **Post-Deployment**
   - Run health checks
   - Test all functionality
   - Monitor logs and performance

---

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

**Note:** Always test in a development environment before deploying to production!
