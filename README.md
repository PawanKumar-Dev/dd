# Excel Technologies - Domain Management System

Enterprise-grade domain registration platform built with Next.js 14, ResellerClub API, and Razorpay payments.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment (.env.local)
cp env.example .env.local

# Initialize database
npm run init-db

# Development
npm run dev

# Production
npm run build
pm2 start ecosystem.config.js
```

Visit: http://localhost:3000 | Admin: http://localhost:3000/admin

---

## 📦 Deployment Scripts

### **deploy.sh** - Regular Deployments

Use this for daily code updates and deployments.

```bash
./deploy.sh
```

**What it does:**

- Saves deployment logs with timestamps
- Stops PM2 server gracefully
- Clears cache (.next, node_modules/.cache)
- Rebuilds application
- Starts PM2 server
- Creates deployment history in `deployment-logs/`

**When to use:** After code changes, dependency updates, regular deployments

---

### **fix-server-issues.sh** - Emergency Recovery

Use this when the server is crashed or stuck in a loop.

```bash
./fix-server-issues.sh
```

**What it does:**

- Stops ALL PM2 processes
- Deletes ALL PM2 apps (nuclear reset)
- Kills port 3000 forcefully
- Clears cache completely
- Rebuilds from scratch
- Fresh PM2 start

**When to use:** Server crash loops, PM2 issues, emergency situations

---

### **view-logs.sh** - View Deployment History

```bash
./view-logs.sh              # List all deployments
./view-logs.sh latest       # View latest deployment
./view-logs.sh 2025-10-29_07-45-30  # View specific deployment
```

---

## 🎯 Core Features

### Domain Management

- **Search & Register** - 400+ TLDs with real-time availability
- **DNS Management** - Full CRUD operations for all DNS record types
- **Domain Renewal** - Automated renewal with notifications
- **Pending Domain Recovery** - Handle failed registrations
- **TLD Validation** - Automatic minimum period enforcement

### Payment & Orders

- **Razorpay Integration** - Secure Indian payment gateway
- **PO System** - Unique purchase order numbers
- **GST Breakdown** - 18% GST with detailed invoices
- **PDF Invoices** - Auto-generated with download
- **Smart Emails** - Sent only when domains are registered

### Authentication

- **NextAuth (Auth.js)** - Industry-standard authentication system
- **Unified Login** - Single system for credentials and social login
- **Social Login** - Google & Facebook OAuth (users only)
- **Admin Protection** - Email/password only for admins
- **Role-based Access** - Middleware-protected routes
- **Email Activation** - Secure account verification
- **Session Management** - 30-day secure sessions

### Admin Panel

- User, order, and payment management
- Pending domains recovery
- TLD pricing configuration
- System settings and analytics

### User Experience & Frontend

- **Universal Skeleton Loading** - Instant visual feedback on all pages
- **Smooth Transitions** - 800ms fade from skeleton to content
- **Responsive Design** - Optimized for mobile, tablet, and desktop
- **Modern Animations** - Framer Motion with skeleton loaders
- **Professional UI** - Polished loading states improve perceived performance
- **7 Reusable Components** - SkeletonBase, Hero, Section, Card, Stats, Contact

---

## 🛠️ Tech Stack

**Frontend:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion  
**Backend:** Next.js API Routes, MongoDB, Mongoose  
**APIs:** ResellerClub, Razorpay  
**Auth:** NextAuth.js (Auth.js) - Unified authentication  
**Email:** Nodemailer, SMTP  
**PDF:** Puppeteer  
**State:** Zustand

---

## 📁 Project Structure

```
dd/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (auth, domains, orders, payments)
│   ├── admin/             # Admin panel
│   └── dashboard/         # User dashboard
├── components/            # React components
├── lib/                   # Utilities (auth, APIs, email, validation)
├── models/                # MongoDB schemas
├── scripts/               # Utility scripts
├── tests/                 # Testing suite
├── deploy.sh             # Regular deployment script
├── fix-server-issues.sh  # Emergency recovery script
└── view-logs.sh          # View deployment logs
```

---

## 🔧 Environment Variables

Create `.env.local`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/domain-management

# ResellerClub API
RESELLERCLUB_API_KEY=your_api_key
RESELLERCLUB_RESELLER_ID=your_reseller_id

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# JWT & Admin
JWT_SECRET=your_jwt_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Social Login (Optional)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret
```

---

## 📜 NPM Scripts

```bash
npm run dev              # Development server
npm run build            # Production build
npm start                # Start production server
npm run init-db          # Initialize database
npm run recreate-admin   # Recreate admin user
npm run fix-profiles     # Fix user profile completion
```

---

## 🧪 Testing

```bash
# Run all tests
node tests/run-tests.js

# Run specific categories
node tests/run-tests.js api       # API tests
node tests/run-tests.js admin     # Admin tests
node tests/run-tests.js payment   # Payment tests
node tests/run-tests.js pricing   # Pricing tests
```

See [tests/README.md](tests/README.md) for details.

---

## 🚀 Production Deployment

### With PM2 (Recommended)

```bash
# First time setup
npm install
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions

# Regular deployments
./deploy.sh

# Emergency recovery
./fix-server-issues.sh
```

### PM2 Commands

```bash
pm2 status              # Check status
pm2 logs next-app       # View logs
pm2 monit               # Monitor resources
pm2 restart next-app    # Restart
pm2 stop next-app       # Stop
```

---

## 🔒 Security Features

- JWT authentication with secure tokens
- Password hashing (bcrypt)
- Input validation & sanitization
- CSRF protection
- Rate limiting
- Secure payment processing

---

## 🇮🇳 India-Focused

- Indian timezone (IST)
- Currency formatting (₹)
- Date format (DD/MM/YYYY)
- +91 phone numbers
- India-only registration

---

## 📊 Key Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `GET/POST /api/auth/[...nextauth]` - NextAuth (login/logout/session)
- ~~`POST /api/auth/login`~~ - Deprecated (use NextAuth)
- `POST /api/auth/activate` - Activate account
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

**Login Methods:** Email/Password (all) | Google OAuth (users) | Facebook OAuth (users)

### Domains

- `POST /api/domains/search` - Search domains
- `POST /api/domains/renew` - Renew domain
- `GET /api/domains/dns` - Get DNS records
- `POST /api/domains/dns` - Add DNS record

### Orders & Payments

- `GET /api/orders` - Get user orders
- `GET /api/orders/[id]/invoice` - Download invoice
- `POST /api/payments/create-order` - Create payment
- `POST /api/payments/verify` - Verify payment

### Admin

- `GET /api/admin/users` - All users
- `GET /api/admin/orders` - All orders
- `GET /api/admin/pending-domains` - Pending domains
- `GET /api/admin/tld-pricing` - TLD pricing

---

## 📚 Documentation

- **API Reference:** [API.md](API.md)
- **Testing Guide:** [tests/README.md](tests/README.md)
- **Skeleton Loading System:** [SKELETON_LOADING_SYSTEM.md](SKELETON_LOADING_SYSTEM.md)
- **Skeleton Quick Reference:** [SKELETON_QUICK_REFERENCE.md](SKELETON_QUICK_REFERENCE.md)
- **Social Login Setup:** [SOCIAL_LOGIN_SETUP.md](SOCIAL_LOGIN_SETUP.md)
- **Project Structure:** [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)

---

## 🆘 Troubleshooting

### Server won't start

```bash
./fix-server-issues.sh
```

### Port already in use

```bash
node scripts/kill-ports.js
```

### View deployment logs

```bash
./view-logs.sh latest
```

### Check PM2 logs

```bash
pm2 logs next-app --lines 50
```
