#!/bin/bash

# Script to add 'export const dynamic = force-dynamic' to all API routes
# This fixes the "Dynamic server usage" build error

echo "🔧 Adding dynamic directive to API routes..."

# Find all route.ts files in app/api
find app/api -name "route.ts" -type f | while read -r file; do
  # Check if file already has the directive
  if grep -q "export const dynamic" "$file"; then
    echo "⏭️  Skipped (already has directive): $file"
  else
    # Check if file has any imports
    if grep -q "^import" "$file"; then
      # Find the last import line
      last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
      
      # Add the directive after the last import
      sed -i "${last_import_line}a\\
\\
// Force dynamic rendering - required for API routes\\
export const dynamic = 'force-dynamic';" "$file"
      
      echo "✅ Added directive to: $file"
    else
      # No imports, add at the beginning
      sed -i "1i// Force dynamic rendering - required for API routes\nexport const dynamic = 'force-dynamic';\n" "$file"
      
      echo "✅ Added directive to: $file"
    fi
  fi
done

echo "
✅ Done! Dynamic directive added to all API routes.
🔨 Run 'npm run build' to verify the fix.
"
