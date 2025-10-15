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

### GET /api/orders/[id]/invoice

Download order invoice as PDF.

**Headers:**

- `Authorization: Bearer <token>`

**Response:**

- Content-Type: `application/pdf`
- File download

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
  "message": "Payment verified and domains registered",
  "orderId": "string",
  "registeredDomains": ["string"]
}
```

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

**Last Updated**: January 26, 2025  
**Version**: 2.3.0  
**Author**: Excel Technologies  
**Status**: Production-ready with fully functional DNS Management API and Social Login Integration
