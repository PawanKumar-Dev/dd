# Authentication Cleanup Plan

## 🗑️ Files to Remove

### 1. `/lib/auth-sync.ts` ❌
**Reason**: No longer needed with unified NextAuth system
**Status**: Safe to remove - not imported anywhere

### 2. `/components/AuthSync.tsx` ❌
**Reason**: Already removed from layout, synchronization no longer needed
**Status**: Safe to remove - not imported anywhere

### 3. `/app/api/auth/login/route.ts` ❌
**Reason**: Replaced by NextAuth CredentialsProvider
**Status**: Safe to remove - login now handled by NextAuth

### 4. `/app/api/auth/sync-token/route.ts` ❌
**Reason**: Token sync no longer needed with unified system
**Status**: Safe to remove - referenced only in old auth-sync utility

## ✅ Files to Keep

### 1. `/app/api/auth/[...nextauth]/route.ts` ✅
**Reason**: This IS NextAuth - the core of the unified system
**Status**: REQUIRED

### 2. `/app/api/auth/register/route.ts` ✅
**Reason**: User registration still needed (not handled by NextAuth)
**Status**: Keep

### 3. `/app/api/auth/activate/route.ts` ✅
**Reason**: Email verification still needed
**Status**: Keep

### 4. `/app/api/auth/resend-activation/route.ts` ✅
**Reason**: Resend activation email functionality
**Status**: Keep

### 5. `/app/api/auth/forgot-password/route.ts` ✅
**Reason**: Password reset functionality
**Status**: Keep

### 6. `/app/api/auth/reset-password/route.ts` ✅
**Reason**: Password reset functionality
**Status**: Keep

### 7. `/app/api/auth/me/route.ts` ✅
**Reason**: Get current user endpoint (may still be used)
**Status**: Keep (check usage first)

### 8. `/lib/auth-config.ts` ✅
**Reason**: NextAuth configuration - CORE FILE
**Status**: REQUIRED

### 9. `/lib/auth.ts` ✅
**Reason**: May contain utilities still in use
**Status**: Keep (check usage)

### 10. `/lib/admin-auth.ts` ✅
**Reason**: Admin authentication utilities
**Status**: Keep (check usage)

## 📝 Documentation Updates Needed

### 1. `/UNIFIED_AUTH_SYSTEM.md` ✏️
**Update**: Remove references to auth-sync.ts and AuthSync component

### 2. `/API.md` ✏️
**Update**: Mark `/api/auth/login` as deprecated, refer to NextAuth

### 3. `/README.md` ✏️
**Update**: Remove old auth system references

### 4. `/CHANGELOG.md` ✏️
**Update**: Add entry about unified auth migration

## 🔍 Additional Cleanup Checks

### Check for unused imports:
- [ ] Search for `AuthService.generateToken` usage
- [ ] Search for custom JWT token generation
- [ ] Search for localStorage token manipulation
- [ ] Search for custom token cookies

### Verify nothing breaks:
- [ ] Run linter
- [ ] Check all imports
- [ ] Test login flow
- [ ] Test logout flow
- [ ] Test protected routes

## 📋 Execution Order

1. ✅ Create backup (git commit)
2. ✅ Delete unused files (COMPLETED)
3. ⏳ Update documentation  
4. ✅ Run linter to check for broken imports (NO ERRORS)
5. ⏳ Test authentication flows
6. ⏳ Commit changes

## ✅ Cleanup Completed

### Files Successfully Removed:
- ✅ `/lib/auth-sync.ts` - Token sync utility (no longer needed)
- ✅ `/components/AuthSync.tsx` - Sync component (no longer needed)
- ✅ `/app/api/auth/login/route.ts` - Old login API (replaced by NextAuth)
- ✅ `/app/api/auth/sync-token/route.ts` - Token sync endpoint (no longer needed)

### Linter Status:
✅ No errors found after cleanup!

## ⚠️ Files Still Using Old Auth System

The following files still use `AuthService` for custom token management:

### API Routes (42 files)
These API routes still use custom JWT tokens from `AuthService`:
- `/app/api/user/*` - User endpoints
- `/app/api/admin/*` - Admin endpoints  
- `/app/api/orders/*` - Order endpoints
- `/app/api/domains/*` - Domain endpoints
- `/app/api/cart/*` - Cart endpoints
- `/app/api/payments/*` - Payment endpoints

**Why keeping AuthService?**
- These routes generate/verify custom JWT tokens for API access
- Used for registration, activation, and other non-login flows
- Migration to NextAuth session tokens would require extensive refactoring

**Recommendation**: Keep for now, migrate gradually as needed

### Admin Auth Utilities
- `/lib/admin-auth.ts` - Admin authentication helpers
- `/middleware/admin.ts` - Admin middleware

**Status**: Still in use, keep for now

## 🚀 Benefits After Cleanup

- ✅ Simpler codebase
- ✅ Less confusion
- ✅ Fewer files to maintain
- ✅ Clearer architecture
- ✅ Easier onboarding for new developers

