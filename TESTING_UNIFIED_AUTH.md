# Testing the Unified Authentication System

## 🎯 Quick Test Checklist

### Test 1: Credentials Login (Email/Password)

```
✅ Step 1: Clear browser data (cookies + localStorage)
✅ Step 2: Go to http://localhost:3000/login
✅ Step 3: Enter email and password
✅ Step 4: Click "Sign in"
✅ Step 5: Should redirect to /dashboard immediately
✅ Step 6: Check console for logs:
   🔐 [LoginForm] Starting credentials login...
   ✅ [CredentialsProvider] User authenticated: user@example.com
   ✅ [LoginForm] Login successful
```

**Expected Result**: Instant redirect to dashboard, no stuck loading, no login page redirect.

### Test 2: Google OAuth Login

```
✅ Step 1: Clear browser data (cookies + localStorage)
✅ Step 2: Go to http://localhost:3000/login
✅ Step 3: Click "Google" button
✅ Step 4: Complete OAuth on Google
✅ Step 5: Should redirect to /dashboard immediately
✅ Step 6: Check console for logs:
   🔐 [SocialLogin] Starting google login...
   📊 [SocialLogin] google result: { ok: true }
   ✅ [SocialLogin] google login successful - redirecting...
```

**Expected Result**: No redirect to login page after OAuth, direct to dashboard.

### Test 3: Session Persistence

```
✅ Step 1: Login successfully (any method)
✅ Step 2: Refresh the page (F5)
✅ Step 3: Should stay on /dashboard
✅ Step 4: Open new tab, go to /login
✅ Step 5: Should immediately redirect to /dashboard
```

**Expected Result**: Session persists across tabs and refreshes.

### Test 4: Protected Routes

```
✅ Step 1: Logout completely
✅ Step 2: Try to access /dashboard directly
✅ Step 3: Should redirect to /login
✅ Step 4: Check console:
   🚫 [Middleware] No session - redirecting to login
```

**Expected Result**: Unauthenticated users cannot access protected routes.

### Test 5: Logout

```
✅ Step 1: Login successfully
✅ Step 2: Go to /dashboard
✅ Step 3: Click logout button
✅ Step 4: Should redirect to /login
✅ Step 5: Try to go back to /dashboard
✅ Step 6: Should redirect to /login again
```

**Expected Result**: Complete session termination, cannot access protected routes.

### Test 6: Invalid Credentials

```
✅ Step 1: Go to /login
✅ Step 2: Enter wrong email/password
✅ Step 3: Click "Sign in"
✅ Step 4: Should show error toast: "Invalid email or password"
✅ Step 5: Should stay on /login
```

**Expected Result**: Clear error message, stays on login page.

### Test 7: Inactive Account

```
✅ Step 1: Try to login with unactivated account
✅ Step 2: Should show error: "Account not activated"
✅ Step 3: Should redirect to /activate page
```

**Expected Result**: Proper handling of inactive accounts.

## 🐛 What to Look For

### Success Indicators ✅

- ✅ No infinite loading spinner
- ✅ No unexpected redirects to login after successful login
- ✅ Consistent behavior between social and credentials login
- ✅ Clear console logs showing each step
- ✅ Toast notifications working
- ✅ Session persists across page refreshes

### Red Flags ❌

- ❌ Stuck on loading screen for >2 seconds
- ❌ Redirect loop (login → dashboard → login)
- ❌ Console errors
- ❌ Session not persisting
- ❌ Different behavior between login methods

## 📊 Console Logs Reference

### Successful Login Flow

```
🔍 [LoginPage] Checking authentication status... { status: 'unauthenticated', hasSession: false }
✅ [LoginPage] No session - showing login form
🔐 [LoginForm] Starting credentials login...
✅ [CredentialsProvider] User authenticated: user@example.com
📊 [LoginForm] Login result: { ok: true, error: null }
✅ [LoginForm] Login successful
🔍 [Middleware] Checking path: /dashboard { hasToken: true, role: 'user' }
✅ [Middleware] Session found - allowing access
```

### Failed Login Flow

```
🔍 [LoginPage] Checking authentication status...
✅ [LoginPage] No session - showing login form
🔐 [LoginForm] Starting credentials login...
❌ [CredentialsProvider] Authentication error: Invalid email or password
📊 [LoginForm] Login result: { ok: false, error: 'CredentialsSignin' }
❌ [LoginForm] Login error: CredentialsSignin
```

### Successful OAuth Flow

```
🔍 [LoginPage] No session - showing login form
🔐 [SocialLogin] Starting google login...
📊 [SocialLogin] google result: { ok: true, error: null, status: 200 }
✅ [SocialLogin] google login successful - redirecting...
🔍 [Middleware] Checking path: /dashboard { hasToken: true, role: 'user' }
✅ [Middleware] Session found - allowing access
```

## 🔍 Debugging Tips

### If Login Page Loads Forever

1. Check browser console for errors
2. Look for timeout message after 2 seconds
3. Check if NextAuth API is responding: `http://localhost:3000/api/auth/session`
4. Verify NEXTAUTH_SECRET is set in `.env.local`

### If Redirect Loop Occurs

1. Clear all cookies and localStorage
2. Check middleware logs in server console
3. Verify session cookie is being set
4. Check if multiple SessionProvider components exist

### If Session Doesn't Persist

1. Check Application → Cookies in DevTools
2. Look for `next-auth.session-token`
3. Verify cookie domain and path settings
4. Check if NEXTAUTH_URL matches your domain

### If "Invalid Session" Errors

1. Verify NEXTAUTH_SECRET hasn't changed
2. Check if session expired (30 days default)
3. Clear cookies and login again
4. Check server logs for JWT errors

## 📝 Test Accounts

### Regular User

```
Email: test@example.com
Password: password123
Expected: Access to /dashboard
```

### Admin User

```
Email: admin@example.com
Password: admin123
Expected: Access to /admin
```

### Inactive User

```
Email: inactive@example.com
Password: password123
Expected: Redirect to /activate
```

## ✅ All Tests Passed?

If all tests pass, your unified authentication system is working correctly!

Key achievements:

- ✅ Single authentication system for all login methods
- ✅ No synchronization issues
- ✅ Consistent user experience
- ✅ Proper error handling
- ✅ Session management working
- ✅ Protected routes secure

## 🚀 Ready for Production

Once all tests pass, the unified authentication system is production-ready. No more dual systems, no more confusion!

---

**Test Status**: ⏳ Pending
**Last Run**: Not yet
**All Tests Passed**: ❓ Unknown
