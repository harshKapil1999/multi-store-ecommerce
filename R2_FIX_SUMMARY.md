# Cloudflare R2 Integration - Fixed ✅

## Issue Fixed

The R2 service was crashing on module load because:
1. Environment variables were being validated at import time
2. Mismatch between environment variable names (`R2_` vs `CLOUDFLARE_`)
3. No lazy initialization fallback

## Solution Implemented

### 1. **Lazy Initialization** 
- Changed from eager loading to lazy loading
- R2 service only initializes when first accessed
- Prevents crashes if env vars aren't immediately available

### 2. **Flexible Environment Variable Names**
Now supports both naming conventions:
```bash
# Preferred (new)
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_ACCESS_KEY_ID
CLOUDFLARE_SECRET_ACCESS_KEY
CLOUDFLARE_BUCKET_NAME

# Also supported (legacy)
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
```

### 3. **Better Error Messages**
Provides clear, actionable error messages showing exactly which variables are missing.

## Files Updated

1. **`/apps/backend/src/services/r2.service.ts`**
   - Added `getR2Service()` function for lazy loading
   - Implemented Proxy-based backwards compatibility
   - Improved error messages with exact variable names

2. **`/apps/backend/src/controllers/upload.controller.ts`**
   - Updated all references to use `getR2Service()`
   - Ensures service is only initialized when endpoints are accessed

## How to Configure

### Quick Start

1. **Create `.env.local` in `apps/backend/`:**
   ```bash
   CLOUDFLARE_ACCOUNT_ID=your_account_id_from_r2_endpoint
   CLOUDFLARE_ACCESS_KEY_ID=your_api_token_access_key
   CLOUDFLARE_SECRET_ACCESS_KEY=your_api_token_secret_key
   CLOUDFLARE_BUCKET_NAME=your_r2_bucket_name
   ```

2. **Restart dev server:**
   ```bash
   pnpm dev
   ```

3. **Verify setup** (optional):
   ```bash
   bash check-r2-env.sh
   ```

### Getting Your Credentials

See **[R2_SETUP.md](./R2_SETUP.md)** for detailed step-by-step instructions on:
- Creating an R2 bucket
- Finding your Account ID
- Generating API credentials
- Testing the integration
- Production deployment

## Testing

### Verify No Crashes
```bash
cd apps/backend
pnpm dev
# Should start without errors, even if R2 env vars aren't set yet
```

### Test Upload Endpoint
```bash
curl -X POST http://localhost:4000/api/v1/media/presigned-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "filename":"test.jpg",
    "contentType":"image/jpeg",
    "size":1024
  }'
```

## How It Works Now

1. **Module Load**: R2 service is NOT initialized (no crash)
2. **First API Call**: Service initializes with env vars
3. **Validation**: If env vars missing, clear error on first use
4. **Subsequent Calls**: Service is cached and reused

## Backwards Compatibility

✅ Existing code using `r2Service` directly continues to work via Proxy
✅ New code can use `getR2Service()` explicitly
✅ Both naming conventions supported

## Next Steps

1. Set your environment variables (see R2_SETUP.md)
2. Start the dev server
3. Test file uploads with the admin dashboard
4. Deploy to production with proper env var configuration

---

**Still having issues?**
- Check [R2_SETUP.md](./R2_SETUP.md) troubleshooting section
- Run `bash check-r2-env.sh` to verify variables
- Ensure you're using correct Cloudflare credentials from API token page
