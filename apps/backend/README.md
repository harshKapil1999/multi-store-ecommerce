# Backend API

RESTful API server for the multi-store e-commerce platform.

## Features

- Multi-tenant architecture
- MongoDB with Mongoose
- JWT authentication
- Role-based authorization
- Express validation
- Cloudflare R2 file storage
- Indexed search

## Development

```bash
pnpm dev
```

Runs on http://localhost:4000

## Build

```bash
pnpm build
pnpm start
```

## Environment Variables

Create `.env`:

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your-super-secret-jwt-key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-public-r2-url.com
```

## API Documentation

See main README for complete API documentation.
