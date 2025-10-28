# API Documentation

**Current Version:** 2.7.0  
**Last Updated:** October 28, 2025

## What's New in v2.7.0

### 🎉 Purchase Order (PO) System

- **Automatic PO Generation**: Every purchase now gets a unique PO number (format: `PO-{timestamp}-{random}`)
- **Universal Tracking**: PO numbers generated for all orders (successful or failed)
- **Invoice Integration**: PO numbers displayed prominently on invoices and emails
- **Audit Trail**: Complete tracking for all transactions

### 💰 GST Breakdown & Tax Transparency

- **Invoice GST Display**: All invoices show Subtotal, GST (18%), and Total separately
- **Email GST Details**: Order confirmation emails include complete tax breakdown
- **Tax Compliance**: Meets Indian GST regulations and requirements
- **Professional Format**: Enhanced invoice layout with clear pricing structure

### 📧 Smart Email Logic

- **Selective Notifications**: Emails only sent when domains are successfully registered
- **No Spam**: Pending/processing orders don't trigger immediate emails
- **Deferred Confirmations**: Users notified when admin completes registration
- **Better UX**: Eliminates confusion about order status

### 🔒 DNS Management Filtering

- **Registered Only**: DNS management shows only fully registered domains
- **Clean Interface**: Pending/processing domains excluded from DNS pages
- **Status-Based Access**: Prevents DNS operations on non-registered domains
- **Admin & User**: Filtering applied to both admin and user DNS management

---

## Base URL

- **Local Development**: `http://localhost:3000`
- **Production**: `https://yourdomain.com`

## Authentication

Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Token Management

- **Access Token**: Valid for 24 hours
- **Refresh Token**: Valid for 7 days
- **Admin Tokens**: Enhanced permissions for admin operations

## Response Format

All API responses follow this standardized format:

```json
{
  "success": true|false,
  "data": {...},
  "error": "error message",
  "message": "status message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **Domain search**: 10 requests per minute
- **Payment endpoints**: 15 requests per minute
- **Other endpoints**: 20 requests per minute

---

## Authentication Endpoints

### POST /api/auth/register

Register a new user account.

**Request Body:**

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "phoneCc": "string",
  "companyName": "string",
  "address": {
    "line1": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "zipcode": "string"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for activation link.",
  "userId": "string"
}
```

### POST /api/auth/login

Authenticate user and return JWT token.

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "user|admin"
  }
}
```

### POST /api/auth/activate

Activate user account with activation token.

**Request Body:**

```json
{
  "token": "activation-token"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Account activated successfully"
}
```

### POST /api/auth/resend-activation

Resend activation email to user.

**Request Body:**

```json
{
  "email": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Activation email sent"
}
```

### POST /api/auth/forgot-password

Request password reset.

**Request Body:**

```json
{
  "email": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### POST /api/auth/reset-password

Reset password with reset token.

**Request Body:**

```json
{
  "token": "reset-token",
  "password": "new-password"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## Social Login Endpoints

### GET /api/auth/[...nextauth]

NextAuth.js API route handler for social login providers.

**Supported Providers:**

- Google OAuth
- Facebook OAuth

**Endpoints:**

- `GET /api/auth/signin` - Social login page
- `GET /api/auth/callback/google` - Google OAuth callback
- `GET /api/auth/callback/facebook` - Facebook OAuth callback
- `GET /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

### POST /api/user/complete-profile

Complete profile for social login users.

**Headers:**

- `Authorization: Bearer <token>` (NextAuth session)

**Request Body:**

```json
{
  "phone": "string",
  "phoneCc": "string",
  "companyName": "string",
  "address": {
    "line1": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "zipcode": "string"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Profile completed successfully",
  "user": {
    "id": "string",
    "email": "string",
    "profileCompleted": true
  }
}
```

**Features:**

- Required for social login users before checkout
- Validates all required fields
- Updates user profile in database
- Marks profile as completed

---

## Domain Endpoints

### GET /api/user/domains

Get all user's domains (for domain list page).

**Headers:**

- `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "domains": [
    {
      "id": "string",
      "name": "string",
      "status": "registered|pending|processing|failed|cancelled",
      "registrationDate": "string",
      "expiryDate": "string",
      "registrar": "string",
      "nameservers": [],
      "autoRenew": boolean,
      "bookingStatus": [],
      "orderId": "string",
      "resellerClubOrderId": "string",
      "resellerClubCustomerId": "string",
      "resellerClubContactId": "string",
      "dnsActivated": boolean,
      "dnsActivatedAt": "string",
      "error": "string"
    }
  ],
  "total": number
}
```

**Important (v2.7.0):**

- **Returns ALL domain statuses** (registered, pending, processing, failed, cancelled)
- Users can see complete domain portfolio including failed registrations
- Use for general domain list display

### GET /api/user/domains/dns

Get user's registered domains for DNS management only.

**Headers:**

- `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "domains": [
    {
      "id": "string",
      "name": "string",
      "status": "registered",
      "registrationDate": "string",
      "expiryDate": "string",
      "registrar": "string",
      "nameservers": [],
      "autoRenew": boolean,
      "bookingStatus": [],
      "orderId": "string",
      "resellerClubOrderId": "string",
      "resellerClubCustomerId": "string",
      "resellerClubContactId": "string",
      "dnsActivated": boolean,
      "dnsActivatedAt": "string"
    }
  ],
  "total": number
}
```

**Important (v2.7.0):**

- **Only returns domains with "registered" status**
- Used specifically for DNS management interface
- Prevents DNS operations on non-ready domains

### GET /api/domains/search

Search for domain availability and pricing.

**Query Parameters:**

- `domain` (string, required): Domain name to search
- `tlds` (string, optional): Comma-separated TLDs to search
- `mode` (string, optional): Search mode ('single-domain' or 'bulk')

**Response:**

```json
{
  "success": true,
"domains": [
  {
    "domainName": "string",
    "available": true|false,
    "price": number,
    "currency": "string",
    "registrationPeriod": number,
    "pricingSource": "string"
    }
  ]
}
```

### GET /api/domains/nameservers

Get nameserver information for a domain using RDAP (Registration Data Access Protocol).

**Query Parameters:**

- `domainName` (string, required): Domain name to lookup

**Response:**

```json
{
  "success": true,
  "domainName": "string",
  "nameservers": ["string"],
  "count": number,
  "method": "rdap|dns",
  "whoisData": {
    "registrar": "string",
    "creationDate": "string",
    "expirationDate": "string",
    "lastUpdated": "string",
    "status": "string"
  },
  "lastChecked": "2024-01-01T00:00:00.000Z"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Nameserver lookup failed",
  "message": "Unable to retrieve nameserver information for domain.com. Both RDAP and DNS lookups failed",
  "domainName": "string",
  "nameservers": [],
  "count": 0,
  "lastChecked": "2024-01-01T00:00:00.000Z"
}
```

**Features:**

- **RDAP Primary**: Uses modern RDAP protocol for accurate nameserver data
- **DNS Fallback**: Falls back to DNS NS record lookup if RDAP fails
- **TLD-Specific**: Automatically finds correct RDAP server for each TLD
- **Structured Data**: Returns clean JSON with nameservers and domain info
- **No API Keys**: Completely free service with no authentication required

### GET /api/domains/dns

✅ **RESOLVED**: DNS Management API is now fully functional using ResellerClub's specific DNS endpoints.

Get DNS records for a domain using ResellerClub's specific DNS search endpoints.

**Query Parameters:**

- `domainName` (string, required): Domain name to get DNS records for

**Response:**

```json
{
  "success": true,
  "data": {
    "records": [
      {
        "timetolive": "7200",
        "status": "Active",
        "type": "A",
        "host": "www",
        "value": "192.168.1.1"
      }
    ],
    "total": 1
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Failed to get DNS records",
  "message": "string"
}
```

**Note**: This endpoint searches all DNS record types (A, AAAA, CNAME, MX, NS, TXT, SRV) and combines the results. Uses ResellerClub's `/api/dns/manage/search-records.json` endpoint with proper pagination.

### POST /api/domains/dns

Add a new DNS record to a domain.

**Request Body:**

```json
{
  "domainName": "example.com",
  "recordData": {
    "type": "A",
    "name": "www",
    "value": "192.168.1.1",
    "ttl": 7200,
    "priority": 10
  }
}
```

**Priority Field Rules:**

- **Required for**: MX and SRV records
- **Optional for**: A, AAAA, CNAME, TXT, NS records
- **Range**: 0-65535
- **Validation**: Server validates priority requirements based on record type

**Response:**

```json
{
  "success": true,
  "message": "DNS record added successfully",
  "recordId": "12345"
}
```

### PUT /api/domains/dns

Update an existing DNS record (implemented as delete + add for ResellerClub compatibility).

**Request Body:**

```json
{
  "domainName": "example.com",
  "recordId": "12345",
  "recordData": {
    "type": "A",
    "name": "www",
    "value": "192.168.1.2",
    "ttl": 3600,
    "priority": 10
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "DNS record updated successfully"
}
```

### DELETE /api/domains/dns

Delete a DNS record from a domain.

**Request Body:**

```json
{
  "domainName": "example.com",
  "recordId": "12345",
  "recordData": {
    "type": "A",
    "name": "www",
    "value": "192.168.1.1",
    "ttl": 7200,
    "priority": 10
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "DNS record deleted successfully"
}
```

**DNS Management Features:**

- ✅ **Full CRUD Operations**: Create, Read, Update, Delete DNS records
- ✅ **Inline Editing**: Edit records directly in the management interface
- ✅ **Record Type Support**: A, AAAA, CNAME, MX, NS, TXT, SRV records
- ✅ **Priority Support**: Optional priority field with validation for MX and SRV records
- ✅ **TTL Management**: Configurable TTL values (minimum 300 seconds)
- ✅ **Real-time Updates**: Immediate reflection of changes
- ✅ **Error Handling**: Comprehensive error handling with rollback
- ✅ **Smart Validation**: Priority required for MX/SRV, optional for other record types
- ✅ **Enhanced Security**: Client-side console logs removed for production security

### POST /api/domains/renew

Renew a domain.

**Request Body:**

```json
{
  "domainName": "string",
  "years": number
}
```

**Response:**

```json
{
  "success": true,
  "message": "Domain renewal initiated",
  "renewalId": "string"
}
```

---

## Order Endpoints

### GET /api/orders

Get user's order history.

**Headers:**

- `Authorization: Bearer <token>`

**Response:**

```json
{
"success": true,
"orders": [
  {
    "id": "string",
    "orderId": "string",
    "purchaseOrderNumber": "string",
    "invoiceNumber": "string",
    "status": "string",
    "totalAmount": number,
    "currency": "string",
    "createdAt": "string",
    "domains": [
      {
        "domainName": "string",
        "price": number,
        "status": "string"
      }
    ]
  }
]
}
```

**New in v2.7.0:**

- `purchaseOrderNumber`: Unique PO number for every order (format: `PO-{timestamp}-{random}`)
- `invoiceNumber`: Generated only for completed orders (format: `INV-{timestamp}-{random}`)

### GET /api/orders/[id]

Get specific order details.

**Headers:**

- `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
"order": {
  "id": "string",
  "orderId": "string",
  "purchaseOrderNumber": "string",
  "invoiceNumber": "string",
  "status": "string",
  "totalAmount": number,
  "currency": "string",
  "createdAt": "string",
  "paymentId": "string",
  "domains": [
    {
      "domainName": "string",
      "price": number,
      "status": "string",
      "registrationDate": "string",
      "expiryDate": "string"
    }
  ],
  "user": {
    "firstName": "string",
    "lastName": "string",
    "email": "string"
  }
}
}
```

**New in v2.7.0:**

- `purchaseOrderNumber`: Every order gets a unique PO number for tracking
- Purchase Orders are generated for all orders (successful or failed payments)

### GET /api/orders/[id]/invoice

Download order invoice as PDF with GST breakdown.

**Headers:**

- `Authorization: Bearer <token>`

**Response:**

- Content-Type: `application/pdf`
- File download

**Invoice Features (v2.7.0):**

- **Purchase Order Number**: Displayed prominently on invoice
- **GST Breakdown**: Shows Subtotal, GST (18%), and Total separately
- **Professional Format**: Enhanced layout with clear tax information
- **Tax Compliance**: Meets Indian GST regulations

**Invoice Structure:**

```
Excel Technologies
Domain Management System

INVOICE
#INV-123456-ABC
PO: PO-123456-DEF

Order Summary:
- Subtotal:      ₹1,000.00
- GST (18%):     ₹180.00
- Total:         ₹1,180.00 INR
```

---

## Payment Endpoints

### POST /api/payments/create-order

Create Razorpay payment order.

**Request Body:**

```json
{
  "domains": [
    {
      "domainName": "string",
      "price": number,
      "currency": "string",
      "registrationPeriod": number
      }
    ]
  }
```

**Response:**

```json
{
  "success": true,
  "order": {
    "id": "string",
    "amount": number,
    "currency": "string",
    "key": "string"
  }
}
```

### POST /api/payments/verify

Verify payment and process domain registration.

**Request Body:**

```json
{
"razorpay_order_id": "string",
"razorpay_payment_id": "string",
"razorpay_signature": "string",
"cartItems": [
  {
    "domainName": "string",
    "price": number,
    "currency": "string",
    "registrationPeriod": number
  }
]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment verified and domains registered",
  "orderId": "string",
  "purchaseOrderNumber": "string",
  "invoiceNumber": "string",
  "successfulDomains": ["string"],
  "pendingDomains": ["string"],
  "failedDomains": [
    {
      "domainName": "string",
      "error": "string"
    }
  ]
}
```

**Smart Email Logic (v2.7.0):**

- **Order confirmation emails** are sent ONLY when at least one domain is successfully registered
- **No emails sent** for pending/processing domains
- **Deferred notifications**: Users receive confirmation when domains are registered by admin
- **Prevents spam**: No confusing emails about pending orders

**Purchase Order System (v2.7.0):**

- Every payment verification generates a unique **Purchase Order (PO) number**
- Format: `PO-{timestamp}-{random}` (e.g., `PO-123456-ABC`)
- PO numbers are generated for both successful and failed payments
- Provides complete audit trail for all transactions

**Order Confirmation Email Includes:**

- Purchase Order Number (prominently displayed)
- Invoice Number (for completed orders)
- GST Breakdown (Subtotal + 18% GST + Total)
- Domain registration details
- Payment confirmation

---

## Admin Endpoints

### GET /api/admin/users

Get all users (Admin only).

**Headers:**

- `Authorization: Bearer <admin-token>`

**Response:**

```json
{
  "success": true,
  "users": [
    {
      "_id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "role": "string",
      "createdAt": "string",
      "isActive": true|false
    }
  ]
}
```

### GET /api/admin/orders

Get all orders (Admin only).

**Headers:**

- `Authorization: Bearer <admin-token>`

**Response:**

```json
{
  "success": true,
  "orders": [
    {
      "id": "string",
      "status": "string",
      "totalAmount": number,
      "currency": "string",
      "createdAt": "string",
      "userId": {
        "firstName": "string",
        "lastName": "string",
        "email": "string"
      },
      "domains": [
        {
          "domainName": "string",
          "price": number,
          "status": "string"
        }
      ]
    }
  ]
}
```

### GET /api/admin/domains

Get all registered domains for DNS management (Admin only).

**Headers:**

- `Authorization: Bearer <admin-token>`

**Response:**

```json
{
  "success": true,
  "domains": [
    {
      "id": "string",
      "name": "string",
      "status": "registered",
      "price": number,
      "currency": "string",
      "registrationPeriod": number,
      "expiresAt": "string",
      "resellerClubOrderId": "string",
      "resellerClubCustomerId": "string",
      "dnsActivated": boolean,
      "dnsActivatedAt": "string",
      "customerName": "string",
      "customerEmail": "string",
      "orderId": "string",
      "createdAt": "string"
    }
  ],
  "total": number
}
```

**Important (v2.7.0):**

- **Only returns domains with "registered" status**
- Pending, processing, failed, and cancelled domains are excluded
- This ensures DNS management is only available for fully registered domains

### GET /api/admin/payments

Get payment data (Admin only).

**Headers:**

- `Authorization: Bearer <admin-token>`

**Response:**

```json
{
  "success": true,
  "payments": [
    {
      "id": "string",
      "amount": number,
      "currency": "string",
      "status": "string",
      "createdAt": "string",
      "orderId": "string"
      }
    ]
  }
```

### GET /api/admin/pending-domains

Get all pending domains (Admin only).

**Headers:**

- `Authorization: Bearer <admin-token>`

**Query Parameters:**

- `status` (optional): Filter by status (pending, processing, completed, failed)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 20)
- `search` (optional): Search by domain name or order ID

**Response:**

```json
{
  "success": true,
  "pendingDomains": [
    {
      "_id": "string",
      "domainName": "string",
      "price": number,
      "currency": "string",
      "registrationPeriod": number,
      "userId": {
        "_id": "string",
        "firstName": "string",
        "lastName": "string",
        "email": "string",
        "phone": "string",
        "companyName": "string"
      },
      "orderId": "string",
      "customerId": number,
      "contactId": number,
      "status": "pending|processing|completed|failed",
      "reason": "string",
      "verificationAttempts": number,
      "lastVerifiedAt": "string",
      "registeredAt": "string",
      "expiresAt": "string",
      "resellerClubOrderId": "string",
      "adminNotes": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "pages": number
  },
  "statusSummary": {
    "total": number,
    "pending": number,
    "processing": number,
    "completed": number,
    "failed": number
  }
}
```

### POST /api/admin/pending-domains

Create a new pending domain record (Admin only).

**Headers:**

- `Authorization: Bearer <admin-token>`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "domainName": "string",
  "price": number,
  "currency": "string",
  "registrationPeriod": number,
  "userId": "string",
  "orderId": "string",
  "customerId": number,
  "contactId": number,
  "nameServers": ["string"],
  "adminContactId": number,
  "techContactId": number,
  "billingContactId": number,
  "reason": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Pending domain created successfully",
  "pendingDomain": {
    "_id": "string",
    "domainName": "string",
    "status": "pending",
    "createdAt": "string"
  }
}
```

### GET /api/admin/pending-domains/[id]

Get specific pending domain details (Admin only).

**Headers:**

- `Authorization: Bearer <admin-token>`

**Response:**

```json
{
  "success": true,
  "pendingDomain": {
    "_id": "string",
    "domainName": "string",
    "price": number,
    "currency": "string",
    "registrationPeriod": number,
    "userId": {
      "_id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string",
      "companyName": "string"
    },
    "orderId": "string",
    "customerId": number,
    "contactId": number,
    "status": "pending|processing|completed|failed",
    "reason": "string",
    "verificationAttempts": number,
    "lastVerifiedAt": "string",
    "registeredAt": "string",
    "expiresAt": "string",
    "resellerClubOrderId": "string",
    "adminNotes": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

### PUT /api/admin/pending-domains/[id]

Update pending domain status and notes (Admin only).

**Headers:**

- `Authorization: Bearer <admin-token>`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "status": "pending|processing|registered|failed",
  "adminNotes": "string",
  "reason": "string"
}
```

**Automatic Sync (v2.7.0):**

- **Order Collection Sync**: When admin updates pending domain status, it automatically syncs with the Order collection
- **Status Mapping**:
  - `registered` → Updates domain status to "registered" in Order
  - `failed` → Updates domain status to "failed" in Order
- **User Visibility**: Status changes immediately reflect in user's domain list
- **Booking Status**: Adds tracking entry with reason and timestamp

**Response:**

```json
{
  "success": true,
  "message": "Pending domain updated successfully",
  "pendingDomain": {
    "_id": "string",
    "domainName": "string",
    "status": "string",
    "adminNotes": "string",
    "updatedAt": "string"
  }
}
```

### DELETE /api/admin/pending-domains/[id]

Delete pending domain record (Admin only).

**Headers:**

- `Authorization: Bearer <admin-token>`

**Response:**

```json
{
  "success": true,
  "message": "Pending domain deleted successfully"
}
```

### POST /api/admin/pending-domains/[id]/register

Manually register a pending domain (Admin only).

**Headers:**

- `Authorization: Bearer <admin-token>`

**Response:**

```json
{
  "success": true,
  "message": "Domain registered successfully",
  "result": {
    "status": "success",
    "data": {
      "orderid": "string"
    }
  },
  "pendingDomain": {
    "_id": "string",
    "domainName": "string",
    "status": "completed",
    "registeredAt": "string",
    "expiresAt": "string",
    "resellerClubOrderId": "string"
  }
}
```

### POST /api/admin/pending-domains/verify

Batch verify multiple pending domains (Admin only).

**Headers:**

- `Authorization: Bearer <admin-token>`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "domainIds": ["string"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Domain verification completed",
  "verificationResults": [
    {
      "domainName": "string",
      "isAvailable": boolean,
      "registrationStatus": "success|pending|failed",
      "reason": "string",
      "checkedAt": "string"
    }
  ],
  "updatedDomains": [
    {
      "_id": "string",
      "domainName": "string",
      "status": "string",
      "verificationAttempts": number,
      "lastVerifiedAt": "string"
    }
  ],
  "summary": {
    "total": number,
    "successful": number,
    "pending": number,
    "failed": number,
    "pendingDomains": ["string"]
  }
}
```

### GET /api/admin/tld-pricing

Get TLD pricing data (Admin only).

**Headers:**

- `Authorization: Bearer <admin-token>`

**Response:**

```json
{
  "success": true,
  "tldPricing": [
    {
      "tld": "string",
      "customerPrice": number,
      "resellerPrice": number,
      "currency": "string",
      "category": "string",
      "description": "string",
      "margin": number
    }
  ],
  "totalCount": number,
  "lastUpdated": "string"
}
```

---

## Settings Endpoints

### GET /api/admin/settings

Get all application settings (Admin only).

**Headers:**

- `Authorization: Bearer <admin-token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "other_setting": "value"
  }
}
```

### POST /api/admin/settings

Update application settings (Admin only).

**Headers:**

- `Authorization: Bearer <admin-token>`

**Request Body:**

```json
{
  "key": "string",
  "value": "any",
  "description": "string",
  "category": "string"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "key": "string",
    "value": "any",
    "updatedAt": "string",
    "updatedBy": "string"
  }
}
```

## TLD Pricing System

The system implements a comprehensive TLD pricing solution with 200+ TLD mappings for accurate ResellerClub API integration.

### How It Works

1. **Comprehensive TLD Mappings**: 200+ TLD mappings for accurate ResellerClub API integration
2. **Priority-based Lookup**: Direct mappings take priority over pattern matching
3. **Multi-format Support**: Handles various ResellerClub API key formats (dot*, dom*, centralnic\*)
4. **Live Pricing**: Real-time pricing from ResellerClub customer and reseller APIs
5. **Performance Optimized**: Intelligent caching with 5-minute TTL
6. **Error Handling**: Robust fallback mechanisms for missing TLD data

### TLD Mapping Examples

```json
{
  "com": "domcno",
  "net": "dotnet",
  "org": "domorg",
  "info": "dominfo",
  "biz": "dombiz",
  "co": "dotco",
  "in": "thirdleveldotin",
  "eu": "doteu",
  "uk": "dotuk",
  "us": "domus",
  "io": "dotio",
  "ai": "dotai",
  "app": "dotapp",
  "asia": "dotasia"
}
```

### Pricing Data Structure

Domain search response includes:

```json
{
  "domainName": "example.com",
  "available": true,
  "price": 1198.8,
  "currency": "INR",
  "registrationPeriod": 1,
  "pricingSource": "live",
  "totalAmount": 1198.8
}
```

### Supported TLD Categories

- **Generic TLDs**: .com, .net, .org, .info, .biz
- **Country TLDs**: .co, .au, .ca, .cc, .eu, .uk, .us
- **New TLDs**: .io, .ai, .app, .asia, .shop, .store
- **Tech TLDs**: .dev, .tech, .digital, .cloud, .host

---

## Cart Endpoints

### GET /api/cart

Get user's cart items.

**Headers:**

- `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "items": [
    {
      "_id": "string",
      "domainName": "string",
      "price": number,
      "currency": "string",
      "registrationPeriod": number
    }
  ]
}
```

### POST /api/cart

Add item to cart.

**Headers:**

- `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "domainName": "string",
  "price": number,
  "currency": "string",
  "registrationPeriod": number
}
```

**Response:**

```json
{
  "success": true,
  "message": "Item added to cart",
  "item": {
    "_id": "string",
    "domainName": "string",
    "price": number,
    "currency": "string",
    "registrationPeriod": number
  }
}
```

### DELETE /api/cart/[id]

Remove item from cart.

**Headers:**

- `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Validation error message",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Unauthorized access",
  "message": "Invalid or expired token",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": "Access forbidden",
  "message": "Insufficient permissions",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Resource not found",
  "message": "The requested resource was not found",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 429 Too Many Requests

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests, please try again later",
  "retryAfter": 60,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Webhooks

### Razorpay Webhook

**Endpoint**: `/api/webhooks/razorpay`

Handles Razorpay payment events for order updates and payment confirmations.

**Supported Events**:

- `payment.captured` - Payment successfully captured
- `payment.failed` - Payment failed
- `order.paid` - Order payment completed
- `refund.created` - Refund initiated

### Webhook Security

- **Signature Verification**: All webhooks are verified using Razorpay signatures
- **Idempotency**: Duplicate webhook events are handled gracefully
- **Retry Logic**: Failed webhook processing is retried with exponential backoff

## API Testing

### Test Environment

Use the provided testing suite for comprehensive API testing:

```bash
# Run all API tests
node tests/run-tests.js api

# Run specific API tests
node tests/api/test-all-endpoints.js
node tests/api/test-pricing.js
node tests/api/test-tld-mappings.js
```

### Postman Collection

A Postman collection is available for manual API testing with pre-configured requests and environment variables.

### cURL Examples

```bash
# Domain search
curl -X GET "http://localhost:3000/api/domains/search?domain=example.com" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create payment order
curl -X POST "http://localhost:3000/api/payments/create-order" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"domains":[{"domainName":"example.com","price":1198.8,"currency":"INR","registrationPeriod":1}]}'
```

## API Monitoring

### Health Check

**Endpoint**: `/api/health`

Returns system health status including database connectivity and external service status.

### Metrics

- **Response Times**: Average response time per endpoint
- **Error Rates**: Error rate by endpoint and error type
- **Rate Limiting**: Rate limit usage and violations
- **API Usage**: Request volume and patterns

## Support

For API support and questions:

- **Documentation**: Refer to this API documentation
- **Issues**: Create an issue in the repository
- **Email**: support@exceltechnologies.com
- **Testing**: Use the comprehensive testing suite

---

**Last Updated**: October 16, 2025  
**Version**: 2.5.0  
**Author**: Excel Technologies  
**Status**: Production-ready with fully functional DNS Management API, Social Login Integration, Pending Domains Management, and comprehensive testing suite
