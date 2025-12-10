# Cloudflare R2 Setup Guide

This guide walks you through setting up Cloudflare R2 for media uploads in the e-commerce platform.

## Prerequisites

- Cloudflare account (free tier supports R2)
- Access to Cloudflare dashboard

## Step 1: Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2** (left sidebar)
3. Click **Create Bucket**
4. Enter bucket name: `ecommerce-media` (or your preferred name)
5. Choose region (e.g., US West)
6. Click **Create Bucket**

## Step 2: Get Your Account ID

1. In R2 dashboard, click the bucket you just created
2. Look for **S3 API Endpoint**: `https://<account-id>.r2.cloudflarestorage.com`
3. Copy the `<account-id>` (the alphanumeric string)

Example endpoint: `https://abcd1234ef5678.r2.cloudflarestorage.com`
Your Account ID: `abcd1234ef5678`

## Step 3: Generate API Token

1. Go to **Account Settings** (top-right profile icon → Settings)
2. Navigate to **API Tokens**
3. Look for **R2 API Token** section
4. Click **Create API Token**
5. Configure permissions:
   - **Permissions**: Account > Cloudflare R2 > Edit
   - **Resources**: Include all R2 buckets
6. Click **Create Token**

This will show you:
- **Access Key ID**
- **Secret Access Key**

⚠️ **Copy these immediately** - you won't see them again!

## Step 4: Configure Environment Variables

Create or update `.env.local` in your backend directory:

```bash
# Cloudflare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=abcd1234ef5678
CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id_here
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key_here
CLOUDFLARE_BUCKET_NAME=ecommerce-media
```

### Obtaining Each Variable

| Variable | Where to Find | Example |
|----------|---------------|---------|
| `CLOUDFLARE_ACCOUNT_ID` | R2 bucket S3 endpoint | `abcd1234ef5678` |
| `CLOUDFLARE_ACCESS_KEY_ID` | R2 API Token creation | `a1b2c3d4e5f6g7h8` |
| `CLOUDFLARE_SECRET_ACCESS_KEY` | R2 API Token creation | `abcd1234ef5678ijklmnop` |
| `CLOUDFLARE_BUCKET_NAME` | R2 bucket name | `ecommerce-media` |

## Step 5: Test the Setup

### Start the backend server

```bash
cd apps/backend
pnpm dev
```

### Test presigned URL generation

```bash
# 1. First, get an auth token (mock for testing)
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Save the token from response

# 2. Request presigned URL
curl -X POST http://localhost:4000/api/v1/media/presigned-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "filename":"test.jpg",
    "contentType":"image/jpeg",
    "size":5242880
  }'

# Response should include uploadUrl, mediaUrl, and key
```

### Upload a test file

```bash
# Using the uploadUrl from previous response
curl -X PUT "https://your-upload-url-from-presigned" \
  -H "Content-Type: image/jpeg" \
  --data-binary @path/to/your/test.jpg

# Confirm the upload
curl -X POST http://localhost:4000/api/v1/media/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"key":"uploads/userid/timestamp-test.jpg"}'
```

## Step 6: Configure Public Access (Optional)

If you want direct public R2 URLs without presigned URLs:

1. In R2 bucket settings, look for **Settings** tab
2. Find **CORS** section
3. Add your frontend domains to allow cross-origin requests

Example CORS Configuration:
```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "DELETE"],
    "AllowedHeaders": ["*"]
  }
]
```

## Step 7: Frontend Integration

In your admin app, use the media hooks:

```typescript
import { useUploadMedia } from '@repo/admin/hooks';

export function MediaUploader() {
  const uploadMedia = useUploadMedia();

  const handleFileUpload = async (file: File) => {
    try {
      const result = await uploadMedia.mutateAsync(file);
      console.log('Upload successful:', result.url);
      // Use result.url in your forms
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <input
      type="file"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
      }}
    />
  );
}
```

## Troubleshooting

### Error: "Missing environment variable: CLOUDFLARE_ACCOUNT_ID"

**Solution**: Ensure all 4 environment variables are set in `.env.local`:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ACCESS_KEY_ID`
- `CLOUDFLARE_SECRET_ACCESS_KEY`
- `CLOUDFLARE_BUCKET_NAME`

Restart the dev server after adding variables.

### Error: "InvalidAccessKeyId"

**Solution**: Your Access Key ID or Secret Access Key is incorrect. Regenerate API token in Cloudflare dashboard.

### Error: "NoSuchBucket"

**Solution**: Bucket name in `CLOUDFLARE_BUCKET_NAME` doesn't exist. Create the bucket or check spelling.

### Presigned URL expires immediately

**Solution**: Check your system clock is synced. AWS SDK uses strict timestamp validation.

### File uploads work but files are not publicly accessible

**Solution**: By default, R2 files are private. Either:
1. Use presigned URLs (current implementation)
2. Enable public access in bucket settings
3. Use custom domains for public access

## Production Deployment

### Best Practices

1. **Use separate tokens per environment**
   - Create one token for development
   - Create one for production
   - Never commit `.env` files with real tokens

2. **Enable versioning** (optional)
   - In R2 bucket settings
   - Helps recover deleted files

3. **Set lifecycle rules** (optional)
   - Auto-delete old uploads after X days
   - Archive to Glacier after X days

4. **Monitor costs**
   - R2 is extremely cost-effective (~$0.015/GB)
   - Monitor storage usage in dashboard

5. **Enable access logs**
   - Set up CloudTrail for audit trail
   - Helpful for debugging issues

### Environment Variables on Deployment

For Vercel/Netlify/Railway/etc:

1. Add environment variables in deployment dashboard
2. Never commit `.env.local` to git
3. Use `.env.example` for reference

Example `.env.example`:
```bash
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_BUCKET_NAME=your_bucket_name
```

## File Organization

Files uploaded to R2 follow this structure:

```
uploads/
├── user-id-1/
│   ├── 1699617200000-profile.jpg
│   ├── 1699617300000-banner.png
│   └── 1699617400000-product-1.jpg
├── user-id-2/
│   └── 1699617500000-image.webp
```

This ensures:
- Easy file organization
- Security (users can only delete their own files)
- Easy cleanup (delete user folder to purge all their uploads)

## API Reference

### POST /api/v1/media/presigned-url

Get a presigned URL for uploading a file.

**Request:**
```json
{
  "filename": "product-image.jpg",
  "contentType": "image/jpeg",
  "size": 5242880
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://...",
    "mediaUrl": "https://...",
    "key": "uploads/userid/timestamp-product-image.jpg",
    "expiresIn": 3600
  }
}
```

### POST /api/v1/media/confirm

Confirm upload and get permanent URL.

**Request:**
```json
{
  "key": "uploads/userid/timestamp-product-image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://ecommerce-media.abcd1234.r2.cloudflarestorage.com/uploads/userid/timestamp-product-image.jpg",
    "key": "uploads/userid/timestamp-product-image.jpg",
    "filename": "product-image.jpg"
  }
}
```

### DELETE /api/v1/media/:key

Delete a media file.

**Response:**
```json
{
  "success": true,
  "message": "Media deleted successfully",
  "data": {
    "key": "uploads/userid/timestamp-product-image.jpg"
  }
}
```

## Further Reading

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS S3 SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/)
- [Presigned URLs Guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
