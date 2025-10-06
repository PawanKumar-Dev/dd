# API Documentation

## Authentication

### Register User

- **POST** `/api/auth/register`
- **Description**: Register a new user account
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Response**:
  ```json
  {
    "message": "User created successfully",
    "token": "jwt-token",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    }
  }
  ```

### Login User

- **POST** `/api/auth/login`
- **Description**: Authenticate user and return JWT token
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Login successful",
    "token": "jwt-token",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    }
  }
  ```

### Forgot Password

- **POST** `/api/auth/forgot-password`
- **Description**: Send password reset email
- **Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response**:
  ```json
  {
    "message": "If an account with that email exists, we've sent a password reset link."
  }
  ```

### Reset Password

- **POST** `/api/auth/reset-password`
- **Description**: Reset password using token from email
- **Body**:
  ```json
  {
    "token": "reset-token-from-email",
    "password": "newpassword123"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Password has been reset successfully"
  }
  ```

## Domain Management

### Search Domains

- **POST** `/api/domains/search`
- **Description**: Search for domain availability
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "domainName": "example.com"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "results": [
      {
        "domainName": "example.com",
        "available": false,
        "price": 12.99,
        "currency": "USD",
        "registrationPeriod": 1
      }
    ]
  }
  ```

## Payment Processing

### Create Payment Order

- **POST** `/api/payments/create-order`
- **Description**: Create a Razorpay payment order
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "domainIds": ["domain-id-1", "domain-id-2"]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "orderId": "order_123",
    "razorpayOrderId": "order_razorpay_123",
    "amount": 25.98,
    "currency": "INR",
    "domains": [
      {
        "id": "domain-id-1",
        "domainName": "example.com",
        "price": 12.99
      }
    ]
  }
  ```

### Verify Payment

- **POST** `/api/payments/verify`
- **Description**: Verify Razorpay payment and register domains
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "razorpay_order_id": "order_123",
    "razorpay_payment_id": "pay_123",
    "razorpay_signature": "signature_123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Payment verified and domains registered",
    "registrationResults": [
      {
        "domainName": "example.com",
        "status": "success",
        "orderId": "resellerclub_order_123"
      }
    ]
  }
  ```

## ResellerClub API Integration

The system integrates with ResellerClub API for domain operations:

### Available Methods

1. **searchDomain(domainName)**: Search for domain availability
2. **registerDomain(domainData)**: Register a domain
3. **getDomainDetails(domainName)**: Get domain information
4. **getDNSRecords(domainName)**: Get DNS records for a domain
5. **addDNSRecord(domainName, recordData)**: Add a DNS record
6. **deleteDNSRecord(domainName, recordId)**: Delete a DNS record

### Domain Registration Flow

1. User searches for domains
2. User adds domains to cart
3. User proceeds to checkout
4. Payment order is created with Razorpay
5. User completes payment
6. Payment is verified on the server
7. Domains are registered with ResellerClub API
8. Domain status is updated in the database

## Error Handling

All API endpoints return appropriate HTTP status codes:

- **200**: Success
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

Error responses include a descriptive message:

```json
{
  "error": "Error description"
}
```

## Rate Limiting

API endpoints are protected with rate limiting to prevent abuse. Default limits:

- Authentication endpoints: 5 requests per minute per IP
- Domain search: 10 requests per minute per user
- Payment endpoints: 3 requests per minute per user

## Security

- All API endpoints require authentication (except public routes)
- JWT tokens are used for authentication
- Passwords are hashed using bcrypt
- Payment signatures are verified using Razorpay's verification method
- Input validation is performed on all endpoints
- CORS is configured for security

## Environment Variables

Required environment variables:

```env
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
RESELLERCLUB_API_ID=your-api-id
RESELLERCLUB_API_KEY=your-api-key
RESELLERCLUB_API_URL=https://httpapi.com/api
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret
```
