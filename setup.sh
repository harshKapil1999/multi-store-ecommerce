#!/bin/bash

echo "🚀 Setting up Multi-Store E-Commerce Platform..."
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null
then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

echo "✅ pnpm is installed"
echo ""

# Check if MongoDB is running
if ! command -v mongod &> /dev/null
then
    echo "⚠️  MongoDB is not installed or not in PATH"
    echo "   Install MongoDB from: https://www.mongodb.com/try/download/community"
    echo "   Or use MongoDB Atlas: https://www.mongodb.com/cloud/atlas"
    echo ""
else
    echo "✅ MongoDB is installed"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install
echo ""

# Create environment files
echo "📝 Creating environment files..."

# Backend .env
if [ ! -f "apps/backend/.env" ]; then
    cp apps/backend/.env.example apps/backend/.env
    echo "✅ Created apps/backend/.env (Please update with your values)"
else
    echo "ℹ️  apps/backend/.env already exists"
fi

# Frontend .env.local
if [ ! -f "apps/frontend/.env.local" ]; then
    cp apps/frontend/.env.local.example apps/frontend/.env.local
    echo "✅ Created apps/frontend/.env.local"
else
    echo "ℹ️  apps/frontend/.env.local already exists"
fi

# Admin .env.local
if [ ! -f "apps/admin/.env.local" ]; then
    cp apps/admin/.env.local.example apps/admin/.env.local
    echo "✅ Created apps/admin/.env.local"
else
    echo "ℹ️  apps/admin/.env.local already exists"
fi

echo ""

# Build shared packages
echo "🔨 Building shared packages..."
pnpm build --filter=@repo/types --filter=@repo/utils --filter=@repo/ui
echo ""

echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update apps/backend/.env with your MongoDB URI and secrets"
echo "2. Start MongoDB if running locally"
echo "3. Run 'pnpm dev' to start all applications"
echo ""
echo "Applications will run on:"
echo "  - Frontend:  http://localhost:3000"
echo "  - Admin:     http://localhost:3001"
echo "  - Backend:   http://localhost:4000"
echo ""
echo "Happy coding! 🎉"
