#!/bin/bash
# Simple deployment script for Next.js app

echo "🚀 Starting deployment..."

# Create logs directory if it doesn't exist
mkdir -p deployment-logs

# Generate timestamp for log files
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_DIR="deployment-logs/$TIMESTAMP"
mkdir -p "$LOG_DIR"

echo "📝 Saving current PM2 logs to: $LOG_DIR"

# Save current PM2 logs before deployment
pm2 logs next-app --lines 500 --nostream > "$LOG_DIR/pm2-logs-before-deploy.log" 2>&1 || echo "No previous logs found"

# Save PM2 status before deployment
pm2 status > "$LOG_DIR/pm2-status-before-deploy.txt" 2>&1 || echo "No PM2 status available"

# 1. Stop PM2 server
echo "📍 Stopping PM2 server..."
pm2 stop next-app 2>/dev/null || echo "Server not running"

# 2. Kill port 3000
echo "📍 Killing port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "Port 3000 is clear"

# 3. Delete cached files
echo "📍 Deleting cached files..."
rm -rf .next
rm -rf node_modules/.cache

# 4. Rebuild
echo "📍 Building application..."
npm run build > "$LOG_DIR/build-output.log" 2>&1

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Deployment aborted."
    echo "Check logs at: $LOG_DIR/build-output.log"
    exit 1
fi

# 5. Start PM2 server
echo "📍 Starting PM2 server..."
pm2 start next-app 2>/dev/null || pm2 start ecosystem.config.js

# Wait a few seconds for server to stabilize
sleep 3

# Save post-deployment logs
echo "📝 Saving post-deployment logs..."
pm2 logs next-app --lines 100 --nostream > "$LOG_DIR/pm2-logs-after-deploy.log" 2>&1

# Save post-deployment status
pm2 status > "$LOG_DIR/pm2-status-after-deploy.txt" 2>&1

# Save deployment summary
cat > "$LOG_DIR/deployment-summary.txt" << EOF
===========================================
DEPLOYMENT SUMMARY
===========================================
Deployment Time: $TIMESTAMP
Server: next-app
Action: Stop → Clean → Build → Start

Build Status: SUCCESS
===========================================

Log Files:
- pm2-logs-before-deploy.log
- pm2-logs-after-deploy.log
- pm2-status-before-deploy.txt
- pm2-status-after-deploy.txt
- build-output.log
- deployment-summary.txt

===========================================
EOF

echo "✅ Deployment complete!"
echo ""
echo "📊 Server status:"
pm2 status

echo ""
echo "📝 Deployment logs saved to: $LOG_DIR"
echo "📝 View current logs with: pm2 logs next-app"
echo ""
echo "📂 Recent deployment logs:"
ls -lt deployment-logs/ | head -5

