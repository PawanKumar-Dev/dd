#!/bin/bash
# Script to fix PM2 server crash issues

echo "🔧 Fixing Next.js server issues..."

# 1. Stop all PM2 processes
echo "📍 Step 1: Stopping all PM2 processes..."
pm2 stop all
pm2 delete all

# 2. Kill any remaining Node processes on port 3000
echo "📍 Step 2: Cleaning up port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "No processes found on port 3000"

# 3. Clean old build files
echo "📍 Step 3: Cleaning old build files..."
rm -rf .next
rm -rf node_modules/.cache

# 4. Rebuild the application
echo "📍 Step 4: Building the application..."
npm run build

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Please check for errors above."
    exit 1
fi

# 5. Start with PM2 with optimized settings
echo "📍 Step 5: Starting server with PM2 using ecosystem config..."
pm2 start ecosystem.config.js

echo "✅ Server restarted with optimized settings!"
echo "📊 Monitoring logs for 10 seconds..."
sleep 2
pm2 logs --lines 20

