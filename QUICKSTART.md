# Quick Start Guide

Get your multi-store e-commerce platform running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] pnpm 9+ installed
- [ ] MongoDB running (local or Atlas)
- [ ] Git installed

## Step-by-Step Setup

### 1. Navigate to Project Directory

```bash
cd /Users/harshkapil/Developer/projects/ecommerce-multi-store
```

### 2. Run Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Install all dependencies
- Create environment files
- Build shared packages

### 3. Configure Environment Variables

Edit `apps/backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your-random-secret-key-here
```

> **Tip:** Generate a secure JWT secret:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 4. Start MongoDB

**Option A - Local MongoDB:**
```bash
mongod
```

**Option B - MongoDB Atlas:**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

**Option C - Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Start All Applications

```bash
pnpm dev
```

This starts:
- ✅ Frontend: http://localhost:3000
- ✅ Admin: http://localhost:3001
- ✅ Backend API: http://localhost:4000

## Test the Setup

### 1. Check Backend Health

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{"status":"ok","message":"Server is running"}
```

### 2. Register a Test User

```bash
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123",
    "name": "Admin User",
    "role": "admin"
  }'
```

### 3. Create a Test Store

First, get your token from the registration response, then:

```bash
curl -X POST http://localhost:4000/api/stores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "My First Store",
    "slug": "my-first-store",
    "description": "A test store"
  }'
```

### 4. Open the Frontend

Visit http://localhost:3000 in your browser

### 5. Open the Admin Dashboard

Visit http://localhost:3001 in your browser

## Common Issues & Solutions

### Issue: "Cannot find module"

**Solution:**
```bash
pnpm install
pnpm build
```

### Issue: "MongoDB connection failed"

**Solution:**
- Check if MongoDB is running: `ps aux | grep mongod`
- Verify connection string in `.env`
- Check MongoDB port (default: 27017)

### Issue: "Port already in use"

**Solution:**

Find and kill process:
```bash
# For Backend (port 4000)
lsof -ti:4000 | xargs kill -9

# For Frontend (port 3000)
lsof -ti:3000 | xargs kill -9

# For Admin (port 3001)
lsof -ti:3001 | xargs kill -9
```

### Issue: TypeScript errors

**Solution:**
```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### Issue: "pnpm: command not found"

**Solution:**
```bash
npm install -g pnpm
```

## Development Workflow

### Running Individual Apps

```bash
# Backend only
cd apps/backend
pnpm dev

# Frontend only
cd apps/frontend
pnpm dev

# Admin only
cd apps/admin
pnpm dev
```

### Making Changes to Shared Packages

```bash
# After editing @repo/types, @repo/utils, or @repo/ui
cd packages/types  # or utils or ui
pnpm build

# Or rebuild all packages
pnpm build --filter=@repo/*
```

### Testing API Endpoints

Use the included REST examples or tools like:
- Postman
- Insomnia
- Thunder Client (VS Code extension)
- curl

## Next Steps

1. **Explore the codebase:**
   - `apps/frontend/src/app` - Frontend pages
   - `apps/admin/src/app` - Admin pages
   - `apps/backend/src/routes` - API routes
   - `packages/types/src` - Shared types

2. **Add your first feature:**
   - Create a new product category
   - Add product variants
   - Implement search functionality
   - Add payment integration

3. **Customize the design:**
   - Update Tailwind theme
   - Add your logo
   - Customize color schemes

4. **Deploy to production:**
   - Frontend/Admin → Vercel
   - Backend → Railway/Render/Heroku
   - Database → MongoDB Atlas

## Useful Commands

```bash
# Install dependencies
pnpm install

# Start all apps in development
pnpm dev

# Build all apps
pnpm build

# Lint all apps
pnpm lint

# Clean build artifacts
pnpm clean

# Format code
pnpm format

# Build specific package
pnpm build --filter=@repo/types

# Run specific app
pnpm dev --filter=@repo/frontend
```

## Getting Help

- Check the [main README](./README.md) for detailed documentation
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Check individual app READMEs in `apps/*/README.md`

## What's Next?

Now that everything is running:

1. ✅ Explore the admin dashboard
2. ✅ Create your first store
3. ✅ Add products
4. ✅ Test the customer frontend
5. ✅ Customize for your needs

Happy coding! 🚀
