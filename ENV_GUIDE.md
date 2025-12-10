# Environment Variables Guide

This guide explains all environment variables used in the project.

## Backend Environment Variables

File: `apps/backend/.env`

### Required Variables

```env
# Application Environment
NODE_ENV=development              # Options: development, production, test
PORT=4000                         # API server port

# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/database

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Optional Variables (Cloudflare R2)

```env
# Cloudflare R2 Configuration (for file uploads)
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-public-r2-url.com
```

### Setting up Cloudflare R2

1. Go to Cloudflare Dashboard
2. Navigate to R2 Object Storage
3. Create a new bucket
4. Generate API tokens
5. Get the public URL for the bucket
6. Update the variables above

## Frontend Environment Variables

File: `apps/frontend/.env.local`

```env
# API Endpoint
NEXT_PUBLIC_API_URL=http://localhost:4000/api
# Production: https://api.yourdomain.com/api
```

### Notes:
- Variables with `NEXT_PUBLIC_` prefix are exposed to the browser
- Update `NEXT_PUBLIC_API_URL` when deploying to production

## Admin Environment Variables

File: `apps/admin/.env.local`

```env
# API Endpoint
NEXT_PUBLIC_API_URL=http://localhost:4000/api
# Production: https://api.yourdomain.com/api
```

## Development vs Production

### Development Setup

Backend `.env`:
```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=dev-secret-change-in-production
```

Frontend/Admin `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### Production Setup

Backend `.env`:
```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ecommerce
JWT_SECRET=<generated-secure-32-byte-hex-string>
R2_ENDPOINT=https://abc123.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<your-key>
R2_SECRET_ACCESS_KEY=<your-secret>
R2_BUCKET_NAME=ecommerce-uploads
R2_PUBLIC_URL=https://cdn.yourdomain.com
```

Frontend/Admin `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

## MongoDB Connection Strings

### Local MongoDB
```
mongodb://localhost:27017/ecommerce
```

### MongoDB Atlas (Cloud)
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ecommerce?retryWrites=true&w=majority
```

### Docker MongoDB
```
mongodb://localhost:27017/ecommerce
```

### MongoDB with Authentication
```
mongodb://username:password@localhost:27017/ecommerce?authSource=admin
```

## Generating Secure Secrets

### JWT Secret
```bash
# Method 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Method 2: Using OpenSSL
openssl rand -hex 32

# Method 3: Using built-in tools
head -c 32 /dev/urandom | base64
```

### Best Practices for Secrets
- Never commit `.env` files to Git
- Use different secrets for dev/prod
- Rotate secrets regularly
- Use at least 32 bytes for JWT secrets
- Store production secrets in secure vaults

## Environment Variable Checklist

### Before Starting Development

- [ ] Backend `.env` created from `.env.example`
- [ ] MongoDB URI configured
- [ ] JWT secret generated
- [ ] Frontend `.env.local` created
- [ ] Admin `.env.local` created
- [ ] All URLs point to localhost

### Before Deploying to Production

- [ ] Generate new JWT secret
- [ ] Update MongoDB to production database
- [ ] Configure R2 credentials (if using)
- [ ] Update API URLs in frontend/admin
- [ ] Test all environment variables
- [ ] Verify CORS settings
- [ ] Check MongoDB firewall rules

## Troubleshooting

### Issue: "Cannot connect to MongoDB"
- Check `MONGODB_URI` format
- Verify MongoDB is running
- Check network connectivity
- Verify credentials

### Issue: "JWT token invalid"
- Check `JWT_SECRET` is set
- Verify secret matches between deployments
- Check token expiration

### Issue: "CORS error"
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend CORS configuration
- Ensure frontend URL is allowed

### Issue: "Environment variable not found"
- Check file naming (`.env` vs `.env.local`)
- Restart development server
- Verify variable prefix (`NEXT_PUBLIC_` for client-side)

## Example Complete Setup

### Development

**apps/backend/.env**
```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=dev-secret-12345-change-in-production
```

**apps/frontend/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

**apps/admin/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### Production (Vercel + Railway)

**Backend on Railway**
```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ecommerce
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
R2_ENDPOINT=https://abc123.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=1234567890abcdef
R2_SECRET_ACCESS_KEY=abcdef1234567890
R2_BUCKET_NAME=my-store-uploads
R2_PUBLIC_URL=https://cdn.mystore.com
```

**Frontend on Vercel**
```env
NEXT_PUBLIC_API_URL=https://api.mystore.com/api
```

**Admin on Vercel**
```env
NEXT_PUBLIC_API_URL=https://api.mystore.com/api
```

## Quick Commands

```bash
# Copy example files
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.local.example apps/frontend/.env.local
cp apps/admin/.env.local.example apps/admin/.env.local

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test environment variables
cd apps/backend && node -e "require('dotenv').config(); console.log(process.env.JWT_SECRET)"
```

## Security Notes

⚠️ **Never commit these files to Git:**
- `.env`
- `.env.local`
- `.env.production`
- Any file containing secrets

✅ **Always commit:**
- `.env.example`
- `.env.local.example`
- Documentation

🔒 **Production Security:**
- Use environment variable management services
- Rotate secrets regularly
- Use strong, unique secrets
- Monitor access logs
- Enable 2FA where possible
