# Google OAuth Setup - Enhanced Permissions

## Overview

This guide walks you through configuring Google Cloud Console to enable phone number and address auto-population for social login users.

## Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Select your project (or create a new one)

## Step 2: Enable Google People API

### Navigate to APIs & Services

1. Click **☰ Menu** → **APIs & Services** → **Library**
2. Search for: **"People API"**
3. Click on **Google People API**
4. Click **ENABLE**

**Why?** The People API provides access to user's phone numbers and addresses stored in their Google account.

## Step 3: Configure OAuth Consent Screen

### Access Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (for public users)
3. Click **CREATE**

### Fill Basic Information

```
App name: Excel Technologies Domain Management
User support email: support@exceltechnologies.com
Developer contact: your-email@example.com
```

### Add Scopes

1. Click **ADD OR REMOVE SCOPES**
2. Filter for: "People API"
3. Select the following scopes:

**Required Scopes:**
```
✅ .../auth/userinfo.email
✅ .../auth/userinfo.profile
✅ openid
```

**Additional Scopes (NEW):**
```
✅ https://www.googleapis.com/auth/user.phonenumbers.read
   Description: See your personal phone numbers
   
✅ https://www.googleapis.com/auth/user.addresses.read
   Description: See your street addresses
```

4. Click **UPDATE**
5. Click **SAVE AND CONTINUE**

### Test Users (Development)

While in testing mode, add test users:

```
test1@gmail.com
test2@gmail.com
your-email@gmail.com
```

## Step 4: Create OAuth Credentials

### Access Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS**
3. Select **OAuth 2.0 Client ID**

### Configure Client ID

**Application type:**
```
Web application
```

**Name:**
```
Excel Technologies - Production
```

**Authorized JavaScript origins:**
```
https://app.exceltechnologies.in
http://localhost:3000
```

**Authorized redirect URIs:**
```
https://app.exceltechnologies.in/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

### Save Credentials

1. Click **CREATE**
2. Copy **Client ID** and **Client Secret**
3. Add to `.env.local`:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

## Step 5: Verify Configuration

### Test Authorization Flow

1. Run your app: `npm run dev`
2. Navigate to login page
3. Click "Sign in with Google"
4. You should see consent screen requesting:
   - ✅ Email address
   - ✅ Basic profile info
   - ✅ Phone numbers
   - ✅ Street addresses

### Expected Consent Screen

```
Excel Technologies Domain Management wants to:

✓ See your personal info, including any personal info you've made publicly available
✓ See your email address
✓ See your phone numbers
✓ See your street addresses

[Cancel] [Allow]
```

## Step 6: Publishing (Production)

### Prepare for Verification

**Required Documentation:**
- Privacy Policy URL
- Terms of Service URL
- App Homepage URL
- Authorized domains list

### Submit for Verification

1. Go to **OAuth consent screen**
2. Click **PUBLISH APP**
3. Fill verification questionnaire:
   - Why you need phone numbers
   - Why you need addresses
   - How data is used
   - Privacy policy compliance

4. Submit for review

**Review Time:** 3-7 days typically

### After Approval

Once approved:
- ✅ App can be used by any Google user
- ✅ No more "unverified app" warning
- ✅ Unlimited users (no 100 user limit)

## Security Best Practices

### OAuth Configuration

```typescript
// In auth-config.ts
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: 'openid email profile https://www.googleapis.com/auth/user.phonenumbers.read https://www.googleapis.com/auth/user.addresses.read',
      prompt: "consent", // Always show consent screen
      access_type: "offline", // Get refresh token
      response_type: "code"
    }
  },
})
```

### Environment Variables

Never commit these to git:
```bash
# .env.local
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=https://app.exceltechnologies.in
```

Add to `.gitignore`:
```
.env.local
.env.production
```

## Troubleshooting

### Error: "Access blocked: This app's request is invalid"

**Solution:**
1. Check authorized redirect URIs
2. Ensure URLs match exactly (no trailing slashes)
3. Add both http (dev) and https (prod)

### Error: "Admin policy" or "Access denied"

**Solution:**
1. Check if Google Workspace admin has disabled third-party apps
2. App must be verified for Workspace users
3. Add app to allowed list in Workspace Admin Console

### Scopes Not Showing

**Solution:**
1. Ensure People API is enabled
2. Scopes must be added in OAuth consent screen
3. Clear browser cache and retry

### "Unverified app" Warning

**Expected** during development:
```
This app isn't verified
This app hasn't been verified by Google yet.

[Advanced] → Go to Excel Technologies (unsafe)
```

**Solution:**
- For development: Click "Advanced" and proceed
- For production: Submit app for verification

### No Phone/Address Data Retrieved

**Check:**
1. User granted permissions (check consent screen)
2. User has data saved in Google account
3. API calls successful (check server logs)
4. Access token valid

**Test User's Google Account:**
- Go to [Google Contacts](https://contacts.google.com)
- Check "My info" has phone and address

## Testing Checklist

### Development Testing

- [ ] Google OAuth login works
- [ ] Consent screen shows all scopes
- [ ] User can grant/deny permissions
- [ ] Phone number auto-populated (if available)
- [ ] Address auto-populated (if available)
- [ ] Profile completion smart prompting
- [ ] Existing user updates work

### Production Testing

- [ ] App verified by Google
- [ ] No "unverified app" warning
- [ ] Works for any Google user
- [ ] HTTPS redirect URIs configured
- [ ] Privacy policy accessible
- [ ] Terms of service accessible

## API Quota Limits

### Google People API

**Free Tier:**
- 30,000 queries per minute per project
- 300,000,000 queries per day per project

**Your Usage:**
- 1 query per social login
- Expected: <1,000 queries/day

✅ **Well within free tier limits!**

## Privacy Policy Requirements

When requesting sensitive scopes, your privacy policy must state:

```markdown
## Data Collection

We collect the following information when you sign in with Google:
- Email address (required)
- Name (required)
- Phone number (optional, with your permission)
- Address (optional, with your permission)

## Data Usage

Phone numbers and addresses are used solely to:
- Pre-fill your profile information
- Facilitate domain registration
- Process transactions

We do not share this information with third parties.

## Data Deletion

You can delete your account and all associated data anytime from your dashboard settings.
```

## Monitoring

### View API Usage

1. Go to **APIs & Services** → **People API**
2. Click **Metrics**
3. Monitor:
   - Daily requests
   - Error rates
   - Latency

### Set Up Alerts

Create alerts for:
- Quota exceeded
- High error rate (>5%)
- Unusual traffic spikes

## Support Resources

### Official Documentation

- [People API Overview](https://developers.google.com/people)
- [OAuth 2.0 for Web Apps](https://developers.google.com/identity/protocols/oauth2/web-server)
- [App Verification](https://support.google.com/cloud/answer/9110914)

### Common Issues

- [OAuth Error Codes](https://developers.google.com/identity/protocols/oauth2/web-server#handlingresponse)
- [People API Errors](https://developers.google.com/people/api/rest/v1/people/get#response)

---

## Quick Setup Summary

```bash
# 1. Enable People API in Google Cloud Console
# 2. Add scopes to OAuth consent screen:
   - user.phonenumbers.read
   - user.addresses.read

# 3. Configure OAuth Client:
   - Authorized origins: https://app.exceltechnologies.in
   - Redirect URIs: https://app.exceltechnologies.in/api/auth/callback/google

# 4. Add credentials to .env.local:
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-secret

# 5. Test locally:
   npm run dev

# 6. Submit for verification (production):
   - Privacy policy
   - Justification for scopes
   - 3-7 day review
```

---

**Status**: Ready for implementation
**Estimated Setup Time**: 30 minutes
**Verification Time**: 3-7 business days
