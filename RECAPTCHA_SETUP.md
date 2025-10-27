# Google reCAPTCHA v3 Implementation

This application uses Google reCAPTCHA v3 to protect forms from spam and bot attacks. reCAPTCHA v3 is invisible to users and provides a friction-free experience while maintaining security.

## 🔐 Protected Forms

The following forms are protected with reCAPTCHA:

1. **Login** (`/login`)
2. **Register** (`/register`)
3. **Contact** (`/contact`)
4. **Forgot Password** (`/reset-password`)
5. **Reset Password** (API endpoint)

## 🚀 Setup Instructions

### Step 1: Get reCAPTCHA Keys

1. Visit [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click "Create" to register a new site
3. Fill in the details:
   - **Label**: Your application name (e.g., "Excel Technologies Domain Management")
   - **reCAPTCHA type**: Select **reCAPTCHA v3**
   - **Domains**: Add your domains (e.g., `exceltechnologies.in`, `localhost`)
4. Accept the terms and submit
5. Copy the **Site Key** and **Secret Key**

### Step 2: Configure Environment Variables

Add the following to your `.env` file:

```env
# Google reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-site-key-here
RECAPTCHA_SECRET_KEY=your-secret-key-here
```

⚠️ **Important Notes:**

- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` must start with `NEXT_PUBLIC_` to be accessible in the browser
- `RECAPTCHA_SECRET_KEY` is used only on the server and should **never** be exposed to the client
- Never commit these keys to version control

### Step 3: Restart Your Application

After adding the environment variables, restart your development server:

```bash
npm run dev
```

## 📚 How It Works

### Client-Side (Frontend)

1. **Script Loading**: The reCAPTCHA script is loaded automatically when a form component mounts
2. **Token Generation**: When a user submits a form, a reCAPTCHA token is generated with an action name
3. **Token Submission**: The token is sent along with the form data to the API

```typescript
// Example from LoginForm
const { executeRecaptcha } = useRecaptcha();

const handleSubmit = async (e: React.FormEvent) => {
  // Get reCAPTCHA token
  const recaptchaToken = await executeRecaptcha("login");

  // Send with form data
  const response = await fetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      ...formData,
      recaptchaToken,
    }),
  });
};
```

### Server-Side (Backend)

1. **Token Verification**: The server receives the token and verifies it with Google's API
2. **Score Evaluation**: reCAPTCHA v3 returns a score from 0.0 (bot) to 1.0 (human)
3. **Action Validation**: The action name is verified to prevent token reuse
4. **Response**: If verification fails, the request is rejected

```typescript
// Example from login API
import { RecaptchaServer } from "@/lib/recaptcha";

const { recaptchaToken } = await request.json();

const recaptchaResult = await RecaptchaServer.verifyToken(
  recaptchaToken,
  "login",
  0.5 // Minimum score threshold
);

if (!recaptchaResult.success) {
  return NextResponse.json(
    { error: "Security verification failed" },
    { status: 403 }
  );
}
```

## 🎯 Score Thresholds

The application uses a **minimum score of 0.5** for all forms:

- **0.0 - 0.4**: Likely a bot (rejected)
- **0.5 - 1.0**: Likely human (accepted)

You can adjust these thresholds in each API route if needed.

## 🔍 Action Names

Each form uses a unique action name for tracking:

| Form            | Action Name       |
| --------------- | ----------------- |
| Login           | `login`           |
| Register        | `register`        |
| Contact         | `contact`         |
| Forgot Password | `forgot_password` |
| Reset Password  | `reset_password`  |

## 🛠️ Architecture

### Components

- **`lib/recaptcha.ts`**: Core reCAPTCHA utilities

  - `RecaptchaClient`: Client-side script loading and token generation
  - `RecaptchaServer`: Server-side token verification

- **`hooks/useRecaptcha.ts`**: React hook for easy integration
  - Automatically loads reCAPTCHA script
  - Provides `executeRecaptcha()` function
  - Handles errors gracefully

### Protected Forms

All forms that require reCAPTCHA:

- `components/LoginForm.tsx`
- `components/RegisterForm.tsx`
- `components/ContactForm.tsx`
- `components/ForgotPasswordForm.tsx`

### API Routes with Verification

All API routes that verify reCAPTCHA:

- `app/api/auth/login/route.ts`
- `app/api/auth/register/route.ts`
- `app/api/contact/route.ts`
- `app/api/auth/forgot-password/route.ts`
- `app/api/auth/reset-password/route.ts`

## 🧪 Testing

### Development Mode

If reCAPTCHA keys are not configured, the application will:

- Show a warning in the console
- Allow requests to proceed (development only)

### Production Mode

In production, reCAPTCHA verification is **required**. Requests without valid tokens will be rejected.

### Testing with Real Keys

1. Use test keys provided by Google (returns fixed responses)
2. Or use your production keys on localhost (Google allows localhost as a domain)

## 🔒 Security Best Practices

1. **Never expose secret key**: Keep `RECAPTCHA_SECRET_KEY` server-side only
2. **Validate on server**: Always verify tokens on the server, never trust client-side checks
3. **Use HTTPS**: reCAPTCHA requires HTTPS in production
4. **Monitor scores**: Review reCAPTCHA Analytics to adjust thresholds
5. **Rate limiting**: Combine reCAPTCHA with rate limiting for enhanced security

## 📊 Monitoring

Visit the [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin) to:

- View request analytics
- Monitor bot detection rates
- Analyze score distributions
- Review verification trends

## 🐛 Troubleshooting

### Issue: "Failed to load reCAPTCHA script"

**Solution**: Check your internet connection and firewall settings. Ensure `google.com` is not blocked.

### Issue: "Security verification failed"

**Possible causes**:

1. Invalid or expired reCAPTCHA keys
2. Score below threshold (0.5)
3. Token used more than once
4. Domain not registered in reCAPTCHA admin console

**Solution**:

- Verify environment variables are set correctly
- Check reCAPTCHA admin console for errors
- Ensure domain is whitelisted

### Issue: reCAPTCHA not working on localhost

**Solution**: Add `localhost` to the domains list in reCAPTCHA admin console.

### Issue: "reCAPTCHA site key not configured"

**Solution**: Ensure `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set in `.env` and the app has been restarted.

## 📝 Additional Resources

- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
- [Best Practices Guide](https://developers.google.com/recaptcha/docs/v3#best_practices)

## 🎉 Benefits

✅ **Invisible Protection**: No user interaction required
✅ **Better UX**: No checkboxes or image challenges
✅ **Smart Detection**: Uses advanced AI to detect bots
✅ **Detailed Analytics**: View bot traffic and trends
✅ **Easy Integration**: Simple to add to any form
✅ **Multiple Forms**: Protect all your forms with one setup
