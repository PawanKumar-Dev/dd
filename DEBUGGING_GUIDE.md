# Social Login Debugging Guide

## Recent Improvements

We've added comprehensive debugging and error handling to the social login flow to prevent the "stuck on loading" issue and make it easier to diagnose problems.

## What Was Fixed

### 1. Login Page Loading Timeout

**Problem**: Page could get stuck in loading state indefinitely if NextAuth session check hangs.

**Solution**: Added 3-second timeout fallback:

- If session status is still "loading" after 3 seconds, show login form anyway
- Added debug information display during loading
- Added comprehensive console logging

### 2. Enhanced Error Handling

**Added to all authentication components**:

- Detailed console logging with emoji prefixes for easy scanning
- Timeout protection on all async operations
- Graceful fallbacks when things fail
- Better error messages to users

### 3. Components Updated

#### `/app/login/page.tsx`

- ✅ 3-second timeout fallback
- ✅ Real-time debug info display
- ✅ Detailed console logging
- ✅ Better async/await handling
- ✅ Cleanup on unmount

#### `/components/SocialLoginButtons.tsx`

- ✅ 10-second OAuth timeout warning
- ✅ 5-second token sync timeout warning
- ✅ Step-by-step logging of OAuth flow
- ✅ Better error reporting
- ✅ 100ms delay before redirect (ensures saves complete)

#### `/lib/auth-sync.ts`

- ✅ 5-second API timeout
- ✅ Detailed sync progress logging
- ✅ Fallback token creation if server fails
- ✅ Better error re-throwing for caller handling

## How to Debug

### 1. Open Browser Console (F12)

You'll now see detailed logs for every step:

```
🔍 [LoginPage] Checking authentication status... { status: 'loading', hasSession: false }
🔐 [SocialLogin] Starting google login...
📊 [SocialLogin] google result: { ok: true, error: null, status: 200 }
✅ [SocialLogin] google login successful - syncing token...
🔄 [AuthSync] Starting session sync...
📊 [AuthSync] Session data: { hasSession: true, hasUser: true, email: 'user@example.com' }
💾 [AuthSync] Saving user data to localStorage: { id: '...', email: '...', ... }
🔑 [AuthSync] Fetching JWT token from server...
📡 [AuthSync] Server response: { ok: true, status: 200 }
✅ [AuthSync] JWT token received and stored
✅ [AuthSync] Sync completed successfully
✅ [SocialLogin] Token sync completed - redirecting...
```

### 2. Common Scenarios and Logs

#### ✅ Successful Login

```
🔐 [SocialLogin] Starting google login...
📊 [SocialLogin] google result: { ok: true }
✅ [SocialLogin] google login successful - syncing token...
🔄 [AuthSync] Starting session sync...
✅ [AuthSync] JWT token received and stored
✅ [SocialLogin] Token sync completed - redirecting...
```

#### ⚠️ Slow Session Check (Timeout Triggered)

```
🔍 [LoginPage] Checking authentication status...
⏳ [LoginPage] Session still loading...
⚠️ [LoginPage] Session check timeout - showing login form
```

**Action**: Login form will be shown, user can proceed

#### ❌ OAuth Error

```
🔐 [SocialLogin] Starting google login...
❌ [SocialLogin] google error: OAuthCallback
```

**Action**: User sees error toast with friendly message

#### ⚠️ Token Sync Fails (Fallback Triggered)

```
✅ [SocialLogin] google login successful - syncing token...
🔄 [AuthSync] Starting session sync...
❌ [AuthSync] Failed to sync token with server: Error...
🔄 [AuthSync] Falling back to client-side token...
✅ [AuthSync] Fallback token created
```

**Action**: User login still succeeds with fallback token

### 3. What Each Emoji Means

- 🔍 = Checking/Investigating
- 🔐 = Authentication/Security
- 📊 = Data/Status Report
- ✅ = Success
- ❌ = Error
- ⚠️ = Warning
- ⏳ = Waiting/Loading
- 🔄 = Processing/Syncing
- 💾 = Saving Data
- 🔑 = Token Operations
- 📡 = Network Request
- 📦 = Data Found

## Testing the Fix

### Test 1: Normal Google Login

1. Clear browser data (cookies + localStorage)
2. Go to `/login`
3. Click "Google" button
4. Complete OAuth on Google
5. **Expected**: Redirect to dashboard within 1-2 seconds

**Check Console For**:

```
🔐 [SocialLogin] Starting google login...
✅ [SocialLogin] Token sync completed - redirecting...
```

### Test 2: Slow Network

1. Open DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Try Google login
4. **Expected**: Either succeeds slowly or shows appropriate error after timeout

**Check Console For**:

```
⚠️ [SocialLogin] google login taking too long
⚠️ [SocialLogin] Token sync taking too long
```

### Test 3: Already Logged In

1. Complete successful login
2. Manually go to `/login` URL
3. **Expected**: Immediately redirect back to dashboard

**Check Console For**:

```
🔍 [LoginPage] Checking authentication status...
✅ [LoginPage] Custom token found - redirecting to dashboard
```

### Test 4: Login Page Timeout

1. Simulate stuck session by blocking NextAuth endpoint
2. Go to `/login`
3. **Expected**: After 3 seconds, login form appears

**Check Console For**:

```
⏳ [LoginPage] Session still loading...
⚠️ [LoginPage] Session check timeout - showing login form
```

## Timeouts and Fallbacks

### Configured Timeouts

| Component   | Operation          | Timeout | Fallback                 |
| ----------- | ------------------ | ------- | ------------------------ |
| LoginPage   | Session check      | 3s      | Show login form          |
| SocialLogin | OAuth process      | 10s     | Show warning (no action) |
| SocialLogin | Token sync         | 5s      | Show warning (no action) |
| AuthSync    | Server token fetch | 5s      | Create client-side token |

### Why These Timeouts?

- **3s for LoginPage**: Users shouldn't wait long to see login form
- **10s for OAuth**: Google OAuth usually completes in 2-5s
- **5s for Token Sync**: API should respond quickly, but network can be slow
- **5s for Server Token**: Same as token sync

## Production Considerations

### Console Logs in Production

All debug logs use `console.log`, `console.warn`, and `console.error`.

**To disable in production**, wrap all console statements:

```typescript
if (process.env.NODE_ENV === "development") {
  console.log("...");
}
```

### Current Behavior

- Development: Full verbose logging
- Production: All logs still visible (helps with user-reported issues)

**Recommendation**: Keep logs in production initially to diagnose real-world issues, then add conditional logging later if needed.

## Troubleshooting

### Issue: Still Stuck on Login Page

**Check**:

1. Console logs - what's the last message?
2. Network tab - is `/api/auth/sync-token` being called?
3. Application tab → Cookies - do you see `next-auth.session-token`?

**Possible Causes**:

- NextAuth configuration issue (wrong secret, missing env vars)
- Database connection issue
- CORS/cookie issues

### Issue: "Session check timeout" Every Time

**Cause**: NextAuth session provider not wrapping the app properly

**Check**: `/app/layout.tsx` should have:

```tsx
<SessionProvider>
  <AuthSync />
  {children}
</SessionProvider>
```

### Issue: Token Sync Always Falls Back

**Cause**: `/api/auth/sync-token` endpoint failing

**Check**:

1. Server logs for API errors
2. NextAuth session exists (check session cookie)
3. JWT_SECRET / NEXTAUTH_SECRET environment variable

### Issue: Redirect Loop

**Cause**: Token created but immediately cleared

**Check**:

1. Cookie settings (httpOnly, sameSite, secure)
2. Logout logic not running unintentionally
3. `sessionStorage.getItem("isLoggingOut")` value

## Environment Variables Required

```env
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000 (or your production URL)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Files Changed

1. `/app/login/page.tsx` - Timeout fallback and logging
2. `/components/SocialLoginButtons.tsx` - Detailed OAuth logging
3. `/lib/auth-sync.ts` - Token sync logging and timeout

## Success Metrics

After these changes, you should see:

✅ Login page loads within 3 seconds max
✅ Clear console logs showing each step
✅ Graceful fallbacks if something fails
✅ User never stuck in loading state
✅ Helpful error messages if OAuth fails
