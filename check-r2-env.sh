#!/bin/bash
# Script to verify Cloudflare R2 environment variables are properly set

echo "🔍 Checking Cloudflare R2 Environment Variables..."
echo ""

check_env_var() {
  local var_name=$1
  local value=${!var_name}
  
  if [ -z "$value" ]; then
    echo "❌ $var_name is NOT set"
    return 1
  else
    # Show first 4 and last 4 characters for security
    local length=${#value}
    if [ $length -gt 8 ]; then
      local masked="${value:0:4}...${value:$((length-4))}"
    else
      local masked="[set]"
    fi
    echo "✅ $var_name is set ($masked)"
    return 0
  fi
}

echo "Required Variables:"
check_env_var "CLOUDFLARE_ACCOUNT_ID"
check_env_var "CLOUDFLARE_ACCESS_KEY_ID"
check_env_var "CLOUDFLARE_SECRET_ACCESS_KEY"
check_env_var "CLOUDFLARE_BUCKET_NAME"

echo ""
echo "Alternative Variable Names (also supported):"
check_env_var "R2_ACCOUNT_ID"
check_env_var "R2_ACCESS_KEY_ID"
check_env_var "R2_SECRET_ACCESS_KEY"
check_env_var "R2_BUCKET_NAME"

echo ""
echo "📝 Instructions:"
echo "1. Create/edit .env.local in apps/backend/"
echo "2. Add these variables with your Cloudflare R2 credentials:"
echo ""
echo "   CLOUDFLARE_ACCOUNT_ID=your_account_id"
echo "   CLOUDFLARE_ACCESS_KEY_ID=your_access_key"
echo "   CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_key"
echo "   CLOUDFLARE_BUCKET_NAME=your_bucket_name"
echo ""
echo "3. Save and restart the dev server"
echo ""
echo "For help setting up R2, see: R2_SETUP.md"
