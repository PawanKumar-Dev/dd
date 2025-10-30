# Social Login Redirect Issue - Fixed

## Problem Description

After completing Google OAuth authentication, users were redirected back to the login page instead of the dashboard. This caused confusion about whether the login was successful. Later, after refreshing the homepage, users would discover they were actually logged in and could access the dashboard normally.

## Root Cause

The application uses two authentication systems:

1. **Custom JWT authentication** - for email/password login (stores token in `localStorage` and cookies)
2. **NextAuth session** - for social login (stores session in `next-auth.session-token` cookie)

The issue occurred because of a **token synchronization gap**:

### Before the Fix:

1. User completes Google OAuth → NextAuth creates session
2. `SocialLoginButtons` component calls redirect to dashboard
3. **BUT** - the custom JWT token hasn't been created yet
4. Login page's `useEffect` only checks for custom token, not NextAuth session
5. User sees login page again (confusion!)
6. Later, when navigating elsewhere, `AuthSync` component runs and creates the custom token
7. Now everything works

### Why AuthSync Didn't Run Initially:

The `AuthSync` component has this check:

```typescript
// Don't sync on login page to avoid conflicts during logout
if (pathname === "/login") {
  return;
}
```

This meant the token sync never happened while on the login page!

## Solution Implemented

### 1. Immediate Token Sync After Social Login

**File**: `components/SocialLoginButtons.tsx`

Added explicit token synchronization immediately after successful OAuth:

```typescript
import { syncAuthWithLocalStorage } from '@/lib/auth-sync';

// In handleSocialLogin:
} else if (result?.ok) {
  // Sync the NextAuth session with localStorage/custom token before redirecting
  try {
    await syncAuthWithLocalStorage();
    toast.success('Successfully signed in!');
    onSuccess?.();
  } catch (syncError) {
    // If sync fails, still redirect - AuthSync will handle it
    console.warn('Token sync failed, will retry on dashboard:', syncError);
    toast.success('Successfully signed in!');
    onSuccess?.();
  }
}
```

**Benefits**:

- Token is created immediately after OAuth success
- No delay or confusion
- Fallback handling if sync fails

### 2. Enhanced Login Page Session Detection

**File**: `app/login/page.tsx`

Updated to check both custom token AND NextAuth session:

```typescript
import { useSession } from "next-auth/react";

const { data: session, status } = useSession();

useEffect(() => {
  // Check for custom token auth
  if (token && userData) {
    router.push(returnUrl || "/dashboard");
    return;
  }

  // Check for NextAuth session (social login)
  if (status === "authenticated" && session) {
    router.push(returnUrl || "/dashboard");
    return;
  }

  // Only stop loading when we're sure user is not authenticated
  if (status !== "loading") {
    setIsLoading(false);
  }
}, [router, session, status]);
```

**Benefits**:

- Detects social login sessions immediately
- Prevents showing login form to authenticated users
- Handles both authentication systems

## How It Works Now

### Successful Google OAuth Flow:

1. ✅ User clicks "Sign in with Google"
2. ✅ Completes OAuth on Google
3. ✅ Returns to app → NextAuth creates session
4. ✅ `syncAuthWithLocalStorage()` is called immediately
5. ✅ Custom JWT token is created and stored
6. ✅ User is redirected to dashboard
7. ✅ No confusion, smooth experience!

### If User Tries to Access Login While Logged In:

1. ✅ Login page loads
2. ✅ Checks for both custom token AND NextAuth session
3. ✅ Finds active session
4. ✅ Immediately redirects to dashboard
5. ✅ Never shows login form

## Technical Details

### Token Sync Process (`lib/auth-sync.ts`):

1. Fetches current NextAuth session
2. Creates compatible user object for localStorage
3. Calls `/api/auth/sync-token` endpoint
4. Server generates proper JWT token
5. Token stored in both localStorage and cookies
6. User data stored in localStorage

### Middleware Protection (`middleware.ts`):

The middleware already handled this case:

```typescript
// For social login users with NextAuth token but no custom token,
// allow access - AuthSync component will handle token creation client-side
if (nextAuthToken && !customToken) {
  return NextResponse.next();
}
```

But now, with immediate sync, users will have both tokens right away!

## Testing Checklist

- [x] Google OAuth login redirects directly to dashboard
- [x] No redirect to login page after successful OAuth
- [x] Token is created immediately
- [x] User can access protected routes right away
- [x] Login page redirects authenticated users
- [x] No confusion or extra steps needed

## Files Modified

1. `/components/SocialLoginButtons.tsx` - Added immediate token sync
2. `/app/login/page.tsx` - Enhanced session detection

## Additional Notes

- Facebook login will benefit from the same fix
- The `AuthSync` component remains as a backup safety net
- No breaking changes to existing email/password authentication
- Backward compatible with existing user sessions
