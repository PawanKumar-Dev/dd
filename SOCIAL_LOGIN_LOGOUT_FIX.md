# Social Login Logout Fix

## Problem Description

Users who logged in via Google OAuth (or any social login) were experiencing an issue where logout was not working properly. After clicking logout, they would see the "logging out" message but immediately get redirected back to the dashboard instead of the login page.

## Root Cause

The issue was a **race condition** between the logout process and the `AuthSync` component:

1. **Logout initiated** → User clicks logout → `signOut()` called → localStorage cleared
2. **AuthSync re-syncs** → Before NextAuth session fully cleared, `AuthSync` component detected the authenticated NextAuth session and automatically re-synced authentication data to localStorage
3. **Redirect loop** → Middleware detected tokens and redirected user back to dashboard instead of login page

### Technical Details

- `AuthSync.tsx` runs on every page (mounted in root layout)
- It continuously monitors NextAuth session status
- When `status === "authenticated"`, it syncs session data to localStorage
- During logout, there's a brief moment where NextAuth session still exists but localStorage is being cleared
- This created a race condition where AuthSync would re-populate localStorage before logout completed

## Solution Implemented

### 1. **Logout Flag System** (`sessionStorage`)

Added a `isLoggingOut` flag in `sessionStorage` to signal when logout is in progress:

```typescript
// In logout.ts - Set flag at start of logout
sessionStorage.setItem('isLoggingOut', 'true');

// In AuthSync.tsx - Check flag before syncing
const isLoggingOut = sessionStorage.getItem("isLoggingOut");
if (isLoggingOut === "true") {
  return; // Don't sync during logout
}
```

### 2. **Enhanced AuthSync Component**

Updated `components/AuthSync.tsx`:
- Check for logout flag before syncing
- Clear logout flag when session becomes unauthenticated
- Prevent re-authentication during logout process

### 3. **Improved Logout Process**

Updated `lib/logout.ts`:
- Set logout flag immediately at start
- Clear both `localStorage` AND `sessionStorage`
- Use `window.location.replace()` instead of `href` for hard redirect
- Prevents browser back button from returning to authenticated state

### 4. **Hard Redirect**

Changed from `window.location.href` to `window.location.replace()`:
- Forces complete page reload
- Clears all cached state
- Prevents back button navigation to authenticated pages

## Files Modified

1. **`components/AuthSync.tsx`**
   - Added logout flag check
   - Clear flag when unauthenticated

2. **`lib/logout.ts`**
   - Set logout flag at start
   - Clear sessionStorage
   - Use `window.location.replace()`

3. **`middleware.ts`**
   - Added comment clarifying logout behavior (no functional change needed)

## How It Works Now

### Logout Flow:
1. User clicks logout button
2. `sessionStorage.setItem('isLoggingOut', 'true')` - **Blocks AuthSync**
3. `signOut({ redirect: false })` - Clears NextAuth session
4. Clear localStorage (token, user data)
5. Clear sessionStorage (including logout flag)
6. Clear all cookies (NextAuth + custom tokens)
7. `window.location.replace('/login')` - Hard redirect to login

### AuthSync Behavior:
- On every render, checks if `isLoggingOut === 'true'`
- If true, **skips sync** completely
- If false, proceeds with normal authentication sync
- When session becomes unauthenticated, clears logout flag

## Testing Scenarios

### ✅ Social Login User (Google OAuth)
- Login with Google → Logout → Should redirect to login page
- No automatic re-authentication
- Cannot use back button to return to dashboard

### ✅ Manual Registration User
- Login with credentials → Logout → Should redirect to login page
- Same behavior as social login users

### ✅ Admin Users
- Admin users cannot use social login (existing protection maintained)
- Logout works normally with custom JWT

## Benefits

1. **Clean Logout** - Complete session termination
2. **No Race Conditions** - Logout flag prevents AuthSync interference
3. **Hard Redirect** - `window.location.replace()` ensures clean state
4. **Unified Behavior** - Same logout process for all user types
5. **Security** - Prevents accidental session persistence

## Additional Notes

- Uses `sessionStorage` (not `localStorage`) for logout flag because it's automatically cleared on browser close
- `sessionStorage` is also cleared explicitly during logout for extra safety
- The fix is backward compatible with existing credential-based authentication
- No database changes required
- No API changes required

## Version

- **Fixed in**: October 25, 2025
- **Affects**: Social login users (Google, Facebook)
- **Impact**: High - Fixes critical logout functionality

---

**Status**: ✅ Fixed and tested
