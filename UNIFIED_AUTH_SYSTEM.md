# Unified Authentication System

## ✅ System Overhaul Complete

The authentication system has been completely overhauled to use **NextAuth (Auth.js) for EVERYTHING** - both social login (Google, Facebook) and credentials login (email/password).

## 🎯 What Changed

### Before (Two Separate Systems)

- ❌ NextAuth for social login → creates NextAuth session
- ❌ Custom API (`/api/auth/login`) for credentials → creates custom JWT
- ❌ AuthSync component to bridge the two systems
- ❌ Middleware checks both token types
- ❌ Complex synchronization logic
- ❌ Multiple points of failure
- ❌ Confusing redirects

### After (One Unified System)

- ✅ NextAuth for ALL authentication
- ✅ Single session management
- ✅ Consistent behavior for all login methods
- ✅ No synchronization needed
- ✅ Simpler codebase
- ✅ Fewer bugs

## 🔧 Technical Details

### Authentication Flow

```
User Login
    ↓
NextAuth signIn()
    ├─ Google/Facebook (OAuth)
    └─ Credentials (Email/Password)
    ↓
NextAuth Session Created
    ↓
JWT Token Stored in Cookie
    ↓
Middleware Checks JWT
    ↓
Access Granted
```

### Files Modified

#### 1. `/components/LoginForm.tsx`

**Before**: Custom API call to `/api/auth/login`
**After**: Uses `signIn('credentials', {...})` from NextAuth

```typescript
// Now uses NextAuth for credentials login
const result = await signIn("credentials", {
  redirect: false,
  email: formData.email,
  password: formData.password,
  recaptchaToken,
});
```

#### 2. `/components/SocialLoginButtons.tsx`

**Before**: Calls `syncAuthWithLocalStorage()` after OAuth
**After**: Direct redirect, no sync needed

```typescript
// Simplified - just redirect
if (result?.ok) {
  toast.success("Successfully signed in!");
  onSuccess?.();
}
```

#### 3. `/lib/auth-config.ts` - CredentialsProvider

**Before**: Simple password check, returns null on error
**After**: Full validation with reCAPTCHA and proper error messages

```typescript
// Now handles:
- ✅ reCAPTCHA verification
- ✅ Account activation check
- ✅ Account deactivation check
- ✅ Detailed error messages
```

#### 4. `/app/login/page.tsx`

**Before**: Checks both custom token AND NextAuth session
**After**: Only checks NextAuth session

```typescript
// Simplified check
if (status === "authenticated" && session) {
  router.push("/dashboard");
}
```

#### 5. `/middleware.ts`

**Before**: Checks both `nextAuthToken` and `customToken`
**After**: Only checks NextAuth token

```typescript
// Unified check
const token = await getToken({
  req: request,
  secret: process.env.NEXTAUTH_SECRET,
});
if (!token) {
  return NextResponse.redirect(new URL("/login", request.url));
}
```

#### 6. `/app/layout.tsx`

**Before**: Includes `<AuthSync />` component
**After**: Removed (no longer needed)

```typescript
// Cleaner layout
<SessionProvider>
  {children}
  <FloatingCart />
  <ScrollToTop />
</SessionProvider>
```

### Components Removed/Simplified

1. **AuthSync Component** - No longer needed (removed from layout)
2. **auth-sync.ts utility** - No longer needed (dual system bridge)
3. **Custom `/api/auth/login`** - Can be deprecated (NextAuth handles it)
4. **Custom JWT token system** - Replaced with NextAuth JWT

## 🚀 Benefits

### 1. Consistency

- Same authentication flow for all login methods
- Same session structure for all users
- Same middleware checks for all routes

### 2. Simplicity

- One authentication system instead of two
- Fewer files to maintain
- Less code to debug

### 3. Reliability

- No synchronization issues
- No token mismatches
- No redirect loops
- Fewer edge cases

### 4. Security

- Industry-standard NextAuth security
- Proper CSRF protection
- Secure cookie handling
- Built-in session management

### 5. Maintainability

- Standard Auth.js patterns
- Well-documented library
- Community support
- Easier onboarding for new developers

## 📝 How It Works

### Credentials Login (Email/Password)

```typescript
// 1. User submits form
LoginForm → signIn('credentials', { email, password })

// 2. NextAuth calls CredentialsProvider.authorize()
lib/auth-config.ts → CredentialsProvider.authorize()
  ├─ Verify reCAPTCHA
  ├─ Check database for user
  ├─ Verify password with bcrypt
  ├─ Check activation status
  └─ Return user object or throw error

// 3. NextAuth creates session
callbacks.jwt() → Add user data to token
callbacks.session() → Add token data to session

// 4. Session stored in cookie
next-auth.session-token (httpOnly, secure)

// 5. User redirected to dashboard
```

### Social Login (Google/Facebook)

```typescript
// 1. User clicks "Sign in with Google"
SocialLoginButtons → signIn('google')

// 2. NextAuth redirects to Google OAuth
User completes OAuth on Google

// 3. Google redirects back with code
NextAuth → GoogleProvider

// 4. NextAuth validates and creates session
callbacks.signIn() → Prevent admin social login
callbacks.jwt() → Create/update user in database
callbacks.session() → Add user data to session

// 5. Session stored in cookie
next-auth.session-token (httpOnly, secure)

// 6. User redirected to dashboard
```

### Session Validation

```typescript
// Client-side
const { data: session, status } = useSession();
// status: "loading" | "authenticated" | "unauthenticated"

// Server-side (middleware)
const token = await getToken({ req, secret: NEXTAUTH_SECRET });
// token: { userId, email, role, ... } | null

// API routes
const session = await getServerSession(authOptions);
// session: { user: { ... } } | null
```

## 🔐 Security Features

### NextAuth Built-in Security

1. **CSRF Protection** - Automatic token validation
2. **Secure Cookies** - httpOnly, sameSite, secure flags
3. **JWT Encryption** - Secret-based signing
4. **Session Management** - Automatic expiration
5. **OAuth Security** - PKCE flow for social login

### Custom Security

1. **reCAPTCHA** - Bot protection on credentials login
2. **Account Activation** - Email verification required
3. **Account Deactivation** - Admin can disable accounts
4. **Role-Based Access** - Admin vs User permissions
5. **Password Hashing** - bcrypt with salt

## 👨‍💼 Admin Authentication

### Admin vs Regular Users

The unified system handles both admin and regular user authentication correctly:

| Feature                  | Admin Users     | Regular Users  |
| ------------------------ | --------------- | -------------- |
| **Email/Password Login** | ✅ Allowed      | ✅ Allowed     |
| **Social Login**         | ❌ Blocked      | ✅ Allowed     |
| **Dashboard**            | `/admin`        | `/dashboard`   |
| **Session Role**         | `role: "admin"` | `role: "user"` |

### How It Works

1. **CredentialsProvider** - Allows both admin and regular users to login via email/password:

```typescript
return {
  id: user._id?.toString(),
  email: user.email,
  name: `${user.firstName} ${user.lastName}`,
  role: user.role, // ← "admin" or "user"
};
```

2. **signIn Callback** - Blocks admins from social login:

```typescript
async signIn({ user, account }) {
  if (account?.provider === "google" || account?.provider === "facebook") {
    const existingUser = await User.findOne({
      email: user.email,
      role: "admin",
    });
    if (existingUser) {
      return false; // Block admin social login
    }
  }
  return true;
}
```

3. **Middleware** - Protects admin routes:

```typescript
if (token.role !== "admin") {
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
```

### Admin Security Features

- ✅ **Social login blocked** - Admins must use email/password only
- ✅ **Role-based access** - Middleware checks token.role
- ✅ **Session management** - Same reliable NextAuth sessions
- ✅ **API protection** - Admin API routes check role

**See `ADMIN_AUTH_GUIDE.md` for detailed admin authentication documentation.**

## 🧪 Testing

### Test Credentials Login

```bash
1. Go to /login
2. Enter email and password
3. Submit form
4. Check console:
   🔐 [LoginForm] Starting credentials login...
   ✅ [CredentialsProvider] User authenticated: user@example.com
   📊 [LoginForm] Login result: { ok: true }
   ✅ [LoginForm] Login successful
5. Should redirect to /dashboard
```

### Test Google Login

```bash
1. Go to /login
2. Click "Google" button
3. Complete OAuth on Google
4. Check console:
   🔐 [SocialLogin] Starting google login...
   📊 [SocialLogin] google result: { ok: true }
   ✅ [SocialLogin] google login successful - redirecting...
5. Should redirect to /dashboard
```

### Test Session Persistence

```bash
1. Login successfully
2. Refresh page
3. Check console:
   🔍 [LoginPage] Checking authentication status...
   ✅ [LoginPage] Session found - redirecting to dashboard
4. Should stay logged in
```

### Test Logout

```bash
1. While logged in, click logout
2. Check console logs
3. Should redirect to /login
4. Try accessing /dashboard
5. Should redirect back to /login
```

## 🐛 Debugging

### Check Current Session

```typescript
// In browser console
import { getSession } from "next-auth/react";
const session = await getSession();
console.log(session);
```

### Check Cookies

```bash
# Open DevTools → Application → Cookies
Look for: next-auth.session-token
```

### Check Middleware Logs

```bash
# Server console
🔍 [Middleware] Checking path: /dashboard { hasToken: true, role: 'user' }
✅ [Middleware] Session found - allowing access
```

## 📚 NextAuth Configuration

### Environment Variables Required

```env
# NextAuth
NEXTAUTH_SECRET=your-secret-key-min-32-chars
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth (optional)
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret

# reCAPTCHA
RECAPTCHA_SECRET_KEY=your-recaptcha-secret
```

### Session Configuration

```typescript
session: {
  strategy: "jwt",  // Use JWT instead of database sessions
  maxAge: 30 * 24 * 60 * 60, // 30 days
}
```

### Cookie Configuration

```typescript
cookies: {
  sessionToken: {
    name: `next-auth.session-token`,
    options: {
      httpOnly: true,      // Not accessible via JavaScript
      sameSite: 'lax',     // CSRF protection
      path: '/',           // Available site-wide
      secure: NODE_ENV === 'production' // HTTPS only in prod
    }
  }
}
```

## 🔄 Migration Notes

### Old Code to Remove (Safe to Delete)

- ❌ `/components/AuthSync.tsx` - No longer used
- ❌ `/lib/auth-sync.ts` - No longer needed
- ❌ `/api/auth/sync-token` - Can be deprecated
- ❌ Custom token localStorage logic - Can be cleaned up

### Old Code to Keep (For Now)

- ⚠️ `/api/auth/login` - Keep for backwards compatibility
- ⚠️ Logout localStorage clearing - Keep for safe cleanup
- ⚠️ Custom token cookie clearing - Keep for migration users

### User Impact

- ✅ **No impact** - All existing users can continue logging in
- ✅ **Better experience** - Faster, more reliable authentication
- ✅ **No data loss** - User data remains intact
- ✅ **Automatic migration** - Next login will use new system

## 📖 Further Reading

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [NextAuth.js Credentials Provider](https://next-auth.js.org/providers/credentials)
- [NextAuth.js Callbacks](https://next-auth.js.org/configuration/callbacks)
- [NextAuth.js JWT Configuration](https://next-auth.js.org/configuration/options#jwt)

## 🎉 Result

**One authentication system. Zero complexity. Infinite reliability.**

All authentication now flows through NextAuth - consistent, secure, and maintainable. No more dual systems, no more synchronization issues, no more confusion.

---

**Last Updated**: $(date)
**Status**: ✅ Production Ready
