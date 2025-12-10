# Environment Configuration Guide

## Backend Environment Variables

Create `.env` file in `apps/backend/` with the following variables:

### Database
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce-db
```

### JWT
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Cloudflare R2 Configuration

First, set up Cloudflare R2:
1. Go to https://dash.cloudflare.com and sign in
2. Navigate to R2 in the left sidebar
3. Create a new bucket (e.g., `ecommerce-bucket`)
4. Go to Settings > API tokens and create new token with permissions:
   - Account Resources: Read & Write for R2
   - Zone Resources: Not required
   - Copy your Account ID from the URL or credentials page

5. Generate API Token:
   - Click "Create API token"
   - Select "Edit Cloudflare Workers" template (or custom)
   - Permissions: Read & Write for R2
   - Copy the generated token

```
# Cloudflare Account ID (found in R2 dashboard)
CLOUDFLARE_ACCOUNT_ID=your-account-id

# Cloudflare API Token
CLOUDFLARE_ACCESS_KEY_ID=your-access-key-id

# Cloudflare Secret Access Key
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-access-key

# R2 Bucket Name
CLOUDFLARE_BUCKET_NAME=your-bucket-name
```

### Environment
```
PORT=4000
NODE_ENV=development
```

## Frontend/Admin Environment Variables

Create `.env.local` file in `apps/frontend/` and `apps/admin/` with:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

In production, update to:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Complete Example .env Files

### apps/backend/.env
```
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ecommerce

# JWT
JWT_SECRET=your-jwt-secret-key-min-32-chars

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=abc123def456
CLOUDFLARE_ACCESS_KEY_ID=a1b2c3d4e5f6g7h8
CLOUDFLARE_SECRET_ACCESS_KEY=x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6
CLOUDFLARE_BUCKET_NAME=ecommerce-bucket

# Server
PORT=4000
NODE_ENV=development
```

### apps/admin/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Testing R2 Integration

After configuration, test the media upload endpoints:

```bash
# 1. Get presigned URL
curl -X POST http://localhost:4000/api/v1/media/presigned-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.jpg",
    "contentType": "image/jpeg",
    "size": 1024000
  }'

# 2. Upload file using returned uploadUrl (from client)
# Use the uploadUrl from response to upload directly

# 3. Confirm upload
curl -X POST http://localhost:4000/api/v1/media/confirm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key": "uploads/user-id/timestamp-filename.jpg"}'

# 4. Delete media
curl -X DELETE http://localhost:4000/api/v1/media/uploads%2Fuser-id%2Ftimestamp-filename.jpg \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### "Missing environment variable: CLOUDFLARE_*"
- Ensure all Cloudflare variables are set in `.env`
- Restart the backend server after updating `.env`

### Upload fails with 401 Unauthorized
- Check JWT token is valid
- Verify user is authenticated
- Check Authorization header format: `Bearer YOUR_TOKEN`

### Upload fails with 403 Forbidden
- File type not allowed (only image/jpeg, image/png, image/webp, video/mp4, etc.)
- File size exceeds 50MB limit

### Cannot connect to R2
- Verify CLOUDFLARE_ACCOUNT_ID is correct
- Check credentials have R2 permissions
- Test connectivity: `curl https://{ACCOUNT_ID}.r2.cloudflarestorage.com`

## Production Deployment

1. Use environment variables from hosting platform (Vercel, Railway, etc.)
2. Never commit `.env` files to git
3. Rotate Cloudflare API tokens regularly
4. Set appropriate CORS policies on R2 bucket
5. Enable R2 Analytics for monitoring
