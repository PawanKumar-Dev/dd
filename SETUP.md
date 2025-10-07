# 🚀 Domain Management System - Setup Guide

## Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd domain-management-system
npm install
```

### 2. Environment Configuration

#### Option A: Quick Setup (Development)

```bash
# Copy the minimal environment file
cp env.local.example .env.local

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

### 3. Required Environment Variables

#### 🔑 Essential Variables (Must Configure)

```env
# Database
MONGODB_URI=mongodb://localhost:27017/domain-management-system

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

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
```

### 4. Generate Secrets

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

### 5. Database Setup

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
npm run dev
```

#### Production Build

```bash
npm run build
npm start
```

### 10. Verify Setup

1. **Check Database Connection:**

   - Visit `/api/health` endpoint
   - Check console logs for MongoDB connection

2. **Test ResellerClub API:**

   - Check console logs for API connection
   - Test domain search functionality

3. **Test Payment Integration:**

   - Use Razorpay test mode
   - Complete a test transaction

4. **Test Email Notifications:**
   - Register a new user
   - Check email delivery

## 🔧 Configuration Details

### Environment Variables Reference

| Variable                   | Required | Description               | Example                         |
| -------------------------- | -------- | ------------------------- | ------------------------------- |
| `MONGODB_URI`              | ✅       | MongoDB connection string | `mongodb://localhost:27017/dms` |
| `JWT_SECRET`               | ✅       | JWT signing secret        | `your-secret-key`               |
| `RESELLERCLUB_ID`          | ✅       | ResellerClub ID           | `your-resellerclub-id`          |
| `RESELLERCLUB_SECRET`      | ✅       | ResellerClub Secret       | `your-resellerclub-secret`      |
| `RESELLERCLUB_RESELLER_ID` | ✅       | Your ResellerClub ID      | `123456`                        |
| `RAZORPAY_KEY_ID`          | ✅       | Razorpay key ID           | `rzp_test_xxxxx`                |
| `RAZORPAY_KEY_SECRET`      | ✅       | Razorpay secret           | `your-secret`                   |
| `SMTP_HOST`                | ✅       | SMTP server host          | `smtp.gmail.com`                |
| `SMTP_USER`                | ✅       | SMTP username             | `your-email@gmail.com`          |
| `SMTP_PASS`                | ✅       | SMTP password             | `your-app-password`             |
| `ADMIN_EMAIL`              | ✅       | Admin notification email  | `admin@yourdomain.com`          |

### Feature Flags

| Variable                     | Default | Description                |
| ---------------------------- | ------- | -------------------------- |
| `ENABLE_EMAIL_NOTIFICATIONS` | `true`  | Enable email notifications |
| `ENABLE_ADMIN_NOTIFICATIONS` | `true`  | Enable admin notifications |

## 🚨 Security Checklist

- [ ] Change all default passwords and secrets
- [ ] Use strong, unique JWT secrets
- [ ] Enable HTTPS in production
- [ ] Set up proper CORS policies
- [ ] Configure rate limiting
- [ ] Enable request logging
- [ ] Set up monitoring and alerts
- [ ] Regular security updates

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**

   - Check if MongoDB is running
   - Verify connection string
   - Check network connectivity

2. **ResellerClub API Errors**

   - Verify credentials
   - Check API key permissions
   - Ensure correct Reseller ID

3. **Razorpay Payment Issues**

   - Verify API keys
   - Check webhook configuration
   - Ensure correct currency settings

4. **Email Not Sending**
   - Check SMTP credentials
   - Verify app password for Gmail
   - Check firewall settings

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
ENABLE_API_LOGGING=true
```

## 📞 Support

For additional help:

- Check the logs in console
- Review API documentation
- Contact support: support@yourdomain.com

## 🔄 Updates

To update the system:

```bash
git pull origin main
npm install
npm run build
```

---

**Note:** Always test in a development environment before deploying to production!
