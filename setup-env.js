#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment for Google OAuth...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📋 Creating .env.local from env.example...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env.local created successfully!\n');
  } else {
    console.log('❌ env.example not found. Please create .env.local manually.\n');
    process.exit(1);
  }
} else {
  console.log('✅ .env.local already exists\n');
}

console.log('🔑 Required environment variables for Google OAuth:');
console.log('');
console.log('1. GOOGLE_CLIENT_ID - Your Google OAuth Client ID');
console.log('2. GOOGLE_CLIENT_SECRET - Your Google OAuth Client Secret');
console.log('3. NEXTAUTH_SECRET - A random secret for NextAuth (generate with: openssl rand -base64 32)');
console.log('4. NEXTAUTH_URL - Your application URL (e.g., http://localhost:3000)');
console.log('');
console.log('📝 Please update your .env.local file with these values.');
console.log('');
console.log('🌐 Google OAuth Setup Instructions:');
console.log('1. Go to https://console.cloud.google.com/');
console.log('2. Create a new project or select existing one');
console.log('3. Enable Google+ API');
console.log('4. Create OAuth 2.0 credentials');
console.log('5. Add authorized redirect URIs:');
console.log('   - http://localhost:3000/api/auth/callback/google (development)');
console.log('   - https://your-domain.com/api/auth/callback/google (production)');
console.log('');
console.log('🚀 After setting up the environment variables, restart your development server.');
