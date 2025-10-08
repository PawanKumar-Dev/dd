# API Documentation

This document provides comprehensive documentation for all API endpoints in the Domain Management System.

## Base URL

- Development: `http://localhost:3000`
- Production: `https://yourdomain.com`

## Authentication

Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this format:

```json
{
"success": true|false,
"data": {...},
"error": "error message",
"message": "status message"
}
```

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
    "pricingSource": "string",
    "originalPrice": number,
    "isPromotional": true|false,
    "promotionalDetails": {
      "startTime": "string",
      "endTime": "string",
      "period": "string",
      "originalCustomerPrice": number,
      "originalResellerPrice": number
    }
    }
  ]
}
```

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
  "registeredDomains": ["string"],
  "failedDomains": ["string"]
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

### GET /api/admin/failed-domains

Get failed domain registrations (Admin only).

**Headers:**

- `Authorization: Bearer <admin-token>`

**Response:**

```json
{
  "success": true,
  "failedDomains": [
    {
      "id": "string",
      "domainName": "string",
      "orderId": "string",
      "error": "string",
      "failedAt": "string",
      "userId": {
        "firstName": "string",
        "lastName": "string",
        "email": "string"
      }
    }
  ]
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
    "promotional_pricing_enabled": true|false,
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

### GET /api/admin/settings/promotional-pricing

Get promotional pricing setting (Admin only).

**Headers:**

- `Authorization: Bearer <admin-token>`

**Response:**

```json
{
  "success": true,
  "isEnabled": true|false,
  "lastUpdated": "string",
  "updatedBy": "string"
}
```

### POST /api/admin/settings/promotional-pricing

Update promotional pricing setting (Admin only).

**Headers:**

- `Authorization: Bearer <admin-token>`

**Request Body:**

```json
{
  "enabled": true|false
}
```

**Response:**

```json
{
  "success": true,
  "isEnabled": true|false,
  "lastUpdated": "string",
  "updatedBy": "string"
}
```

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
  "error": "Validation error message"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Unauthorized access"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": "Access forbidden"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- Authentication endpoints: 5 requests per minute
- Domain search: 10 requests per minute
- Other endpoints: 20 requests per minute

## Webhooks

### Razorpay Webhook

Endpoint: `/api/webhooks/razorpay`

Handles Razorpay payment events for order updates and payment confirmations.

---

## Testing

Use the provided Postman collection or curl commands to test the API endpoints. Ensure you have valid JWT tokens for authenticated endpoints.

## Support

For API support and questions, please refer to the main README.md or create an issue in the repository.
