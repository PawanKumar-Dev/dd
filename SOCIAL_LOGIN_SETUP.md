# Social Login Implementation Guide

This document explains the social login implementation for Google and Facebook authentication in the Domain Management System.

## Overview

The system now supports social login for regular users while maintaining separate admin authentication. Social login users are required to complete their profile before proceeding to checkout.

## Features Implemented

### 1. Social Login Providers

- **Google OAuth**: Users can sign in with their Google account
- **Facebook OAuth**: Users can sign in with their Facebook account
- **Admin Protection**: Admin users cannot use social login (maintains security)

### 2. Profile Completion Flow

- Social login users must complete their profile before checkout
- Required fields: phone, company name, and address information
- Profile completion is tracked in the database

### 3. Dual Authentication System

- NextAuth.js for social login
- Custom JWT for admin and existing users
- Seamless integration between both systems

## Setup Instructions

### 1. Environment Variables

Add the following variables to your `.env.local` file:

```env
# Social Login - Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Social Login - Facebook OAuth
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://your-domain.com:3000
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)

### 3. Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs:
   - `http://localhost:3000/api/auth/callback/facebook` (development)
   - `https://your-domain.com/api/auth/callback/facebook` (production)

## File Structure

### New Files Created

```
lib/
├── auth-config.ts              # NextAuth configuration
├── auth-sync.ts               # Sync NextAuth with localStorage

components/
├── SocialLoginButtons.tsx     # Social login UI component
├── ProfileCompletionForm.tsx  # Profile completion form
├── SessionProvider.tsx        # NextAuth session provider

app/
├── api/auth/[...nextauth]/route.ts  # NextAuth API route
├── api/user/complete-profile/route.ts  # Profile completion API
├── complete-profile/page.tsx  # Profile completion page
```

### Modified Files

```
models/User.ts                 # Added social login fields
components/LoginForm.tsx       # Added social login buttons
app/dashboard/page.tsx         # Updated for dual auth
app/checkout/page.tsx          # Added profile completion check
middleware.ts                  # Updated for social login
app/layout.tsx                 # Added SessionProvider
env.example                    # Added OAuth environment variables
```

## User Flow

### 1. Social Login Flow

1. User clicks "Sign in with Google/Facebook"
2. Redirected to OAuth provider
3. User authorizes the application
4. User is created/updated in database
5. Redirected to dashboard

### 2. Profile Completion Flow

1. Social login user tries to checkout
2. System checks if profile is completed
3. If not completed, redirects to profile completion page
4. User fills required information
5. Profile is marked as completed
6. User can proceed to checkout

### 3. Admin Protection

1. Admin users cannot use social login
2. Admin routes require custom JWT token
3. Social login users are redirected away from admin routes

## Database Schema Changes

### User Model Updates

```typescript
interface IUser {
  // ... existing fields

  // Social login fields
  provider?: string; // 'google', 'facebook', 'credentials'
  providerId?: string; // Social provider user ID
  profileCompleted?: boolean; // Track profile completion

  // Made optional for social login users
  password?: string;
  phone?: string;
  phoneCc?: string;
  companyName?: string;
  address?: {
    line1: string;
    city: string;
    state: string;
    country: string;
    zipcode: string;
  };
}
```

## API Endpoints

### Profile Completion

- **POST** `/api/user/complete-profile`
- **Body**: `{ phone, phoneCc, companyName, address }`
- **Auth**: Required (JWT or NextAuth)

### NextAuth Endpoints

- **GET/POST** `/api/auth/[...nextauth]`
- Handles OAuth callbacks and session management

## Security Considerations

1. **Admin Protection**: Admin users cannot use social login
2. **Profile Validation**: Required fields are validated before checkout
3. **Token Management**: Dual token system maintains security
4. **OAuth Scopes**: Minimal required scopes for user data

## Testing

### Test Social Login

1. Start the development server
2. Navigate to `/login`
3. Click "Sign in with Google" or "Sign in with Facebook"
4. Complete OAuth flow
5. Verify user is created in database
6. Test profile completion flow

### Test Admin Protection

1. Try to access admin routes with social login
2. Verify redirection to user dashboard
3. Confirm admin users cannot use social login

## Troubleshooting

### Common Issues

1. **OAuth Redirect URI Mismatch**

   - Ensure redirect URIs match exactly in OAuth provider settings
   - Check for trailing slashes and protocol (http vs https)

2. **Environment Variables**

   - Verify all OAuth credentials are correctly set
   - Check NEXTAUTH_SECRET is properly configured

3. **Profile Completion Loop**

   - Ensure profile completion API is working
   - Check database for profileCompleted field updates

4. **Admin Access Issues**
   - Verify admin users are using credential login
   - Check middleware configuration

## Migration Notes

### Existing Users

- Existing users continue to work with credential login
- No data migration required
- Social login is additive feature

### Database Migration

- New fields are optional and backward compatible
- Existing users have `profileCompleted: true` by default
- Social login users start with `profileCompleted: false`

## Future Enhancements

1. **Additional Providers**: LinkedIn, GitHub, etc.
2. **Account Linking**: Link social accounts to existing accounts
3. **Profile Sync**: Sync profile data from social providers
4. **Advanced Security**: Two-factor authentication for social login
