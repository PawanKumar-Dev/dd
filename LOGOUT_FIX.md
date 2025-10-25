# Logout Fix for Social Login Users

## Problem
Social login users were not being properly logged out. After clicking logout, they would be redirected to the login page, but upon returning to the site, they would automatically be logged back in.

## Root Cause
The logout function in `lib/logout.ts` was only clearing localStorage and cookies manually, but was NOT calling NextAuth's `signOut()` function. This meant:

1. The NextAuth session remained active on the server
2. The `AuthSync` component would detect the active session on page load
3. It would re-sync the session data back to localStorage
4. User appeared logged in again

## Solution Applied

### 1. Updated `lib/logout.ts`
- Added import for `signOut` from `next-auth/react`
- Modified both `useLogout()` and `logoutUser()` functions to call `await signOut({ redirect: false })` before clearing localStorage
- This properly terminates the NextAuth session on the server
- Added error handling to ensure logout completes even if NextAuth signOut fails

### 2. Updated `components/AuthSync.tsx`
- Added check to skip auth sync on the `/login` page
- This prevents the component from re-syncing session data immediately after logout
- Uses `usePathname()` to detect current route

## Changes Made

### File: `lib/logout.ts`
```typescript
// Added import
import { signOut } from "next-auth/react";

// In both useLogout() and logoutUser():
// Step 1: Sign out from NextAuth (handles social login sessions)
console.log('🔐 Signing out from NextAuth...');
await signOut({ redirect: false });

// Then proceed with clearing localStorage and cookies...
```

### File: `components/AuthSync.tsx`
```typescript
// Added pathname check
const pathname = usePathname();

useEffect(() => {
  // Don't sync on login page to avoid conflicts during logout
  if (pathname === "/login") {
    return;
  }
  // ... rest of sync logic
}, [session, status, isSyncing, pathname]);
```

## Testing Checklist

### For Social Login Users (Google/Facebook):
1. ✅ Login with Google/Facebook
2. ✅ Navigate to dashboard
3. ✅ Click logout button
4. ✅ Verify redirect to login page
5. ✅ Close browser tab
6. ✅ Open new tab and navigate to the site
7. ✅ Verify user is NOT automatically logged in
8. ✅ Verify login page is shown

### For Credential Users:
1. ✅ Login with email/password
2. ✅ Navigate to dashboard
3. ✅ Click logout button
4. ✅ Verify redirect to login page
5. ✅ Verify user is NOT automatically logged in

### For Admin Users:
- Admin users use inline logout handlers and cannot use social login
- No changes needed for admin logout functionality
- Existing admin logout continues to work as before

## Technical Details

### NextAuth Session Management
- NextAuth stores session data in HTTP-only cookies
- The session is validated on the server side
- Simply clearing client-side cookies is not enough
- Must call `signOut()` to invalidate the server-side session

### Logout Flow (After Fix)
1. User clicks logout button
2. `useLogout()` or `logoutUser()` is called
3. NextAuth `signOut({ redirect: false })` is called
4. Server-side session is invalidated
5. localStorage is cleared
6. All cookies are cleared (belt and suspenders approach)
7. Success toast is shown
8. User is redirected to `/login`
9. `AuthSync` component skips sync on login page
10. User remains logged out

## Notes
- The fix maintains backward compatibility with credential-based login
- Admin users are unaffected (they cannot use social login)
- The solution is defensive - it clears both server and client-side auth data
- Error handling ensures logout completes even if NextAuth fails

## Related Files
- `lib/logout.ts` - Main logout logic
- `components/AuthSync.tsx` - Session synchronization
- `lib/auth-config.ts` - NextAuth configuration
- `lib/auth-sync.ts` - Auth sync utility
- `SOCIAL_LOGIN_SETUP.md` - Social login documentation
