/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    RESELLERCLUB_ID: process.env.RESELLERCLUB_ID,
    RESELLERCLUB_SECRET: process.env.RESELLERCLUB_SECRET,
    RESELLERCLUB_API_URL: process.env.RESELLERCLUB_API_URL,
    RESELLERCLUB_RESELLER_ID: process.env.RESELLERCLUB_RESELLER_ID,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    FROM_EMAIL: process.env.FROM_EMAIL,
    FROM_NAME: process.env.FROM_NAME,
  },

  // Skip ESLint during builds (temporary - for debugging)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Production optimizations for security
  compiler: {
    // Remove ALL console statements in production for security
    // This prevents any logs from being exposed to frontend users
    removeConsole: process.env.NODE_ENV === 'production' ? true : false,
  },

  // Disable source maps in production (prevent code inspection)
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
