# Multi-Store E-Commerce Platform

A scalable multi-tenant e-commerce platform built with Turborepo, Next.js 16, Node.js, Express, and MongoDB.

## 🏗️ Architecture

This monorepo contains:

### Apps
- **Frontend** (`apps/frontend`) - Customer-facing store (Next.js 16 + TanStack Query)
- **Admin** (`apps/admin`) - Multi-tenant admin dashboard (Next.js 16)
- **Backend** (`apps/backend`) - RESTful API server (Node.js + Express + MongoDB)

### Packages
- **@repo/types** - Shared TypeScript interfaces and types
- **@repo/ui** - Shared UI components (shadcn/ui)
- **@repo/utils** - Common utility functions

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 9
- MongoDB (local or cloud instance)
- Git

### Installation

1. **Clone the repository:**
   ```bash
   cd ecommerce-multi-store
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**

   **Backend** (`apps/backend/.env`):
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```
   Edit the file and add your MongoDB URI and other credentials.

   **Frontend** (`apps/frontend/.env.local`):
   ```bash
   cp apps/frontend/.env.local.example apps/frontend/.env.local
   ```

   **Admin** (`apps/admin/.env.local`):
   ```bash
   cp apps/admin/.env.local.example apps/admin/.env.local
   ```

4. **Build shared packages:**
   ```bash
   pnpm build
   ```

5. **Run development servers:**
   ```bash
   pnpm dev
   ```

This will start:
- Frontend: http://localhost:3000
- Admin: http://localhost:3001
- Backend API: http://localhost:4000

## 📁 Project Structure

```
ecommerce-multi-store/
├── apps/
│   ├── frontend/          # Customer-facing Next.js app
│   │   ├── src/
│   │   │   ├── app/       # App Router pages
│   │   │   ├── components/
│   │   │   └── lib/
│   │   └── package.json
│   │
│   ├── admin/             # Admin dashboard Next.js app
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   └── lib/
│   │   └── package.json
│   │
│   └── backend/           # Express API server
│       ├── src/
│       │   ├── controllers/
│       │   ├── models/
│       │   ├── routes/
│       │   ├── middleware/
│       │   └── config/
│       └── package.json
│
├── packages/
│   ├── types/             # Shared TypeScript types
│   ├── ui/                # Shared UI components
│   └── utils/             # Shared utilities
│
├── package.json           # Root package.json
├── turbo.json            # Turborepo configuration
├── pnpm-workspace.yaml   # pnpm workspace config
└── tsconfig.base.json    # Base TypeScript config
```

## 🔧 Development

### Running individual apps

```bash
# Frontend only
cd apps/frontend && pnpm dev

# Admin only
cd apps/admin && pnpm dev

# Backend only
cd apps/backend && pnpm dev
```

### Building for production

```bash
# Build all apps
pnpm build

# Build specific app
pnpm build --filter=@repo/frontend
```

### Linting

```bash
# Lint all apps
pnpm lint

# Lint specific app
pnpm lint --filter=@repo/backend
```

### Clean build artifacts

```bash
pnpm clean
```

## 🗄️ Database Setup

### MongoDB

The backend requires MongoDB. You can use:

1. **Local MongoDB:**
   ```bash
   mongod --dbpath /path/to/data
   ```

2. **MongoDB Atlas (Cloud):**
   - Create a free cluster at https://www.mongodb.com/cloud/atlas
   - Get connection string and add to `apps/backend/.env`

3. **Docker:**
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

Update `MONGODB_URI` in `apps/backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/ecommerce
```

## 📦 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/me` - Get current user (authenticated)

### Stores
- `GET /api/stores` - List all stores
- `GET /api/stores/:id` - Get store by ID
- `GET /api/stores/slug/:slug` - Get store by slug
- `POST /api/stores` - Create store (authenticated)
- `PUT /api/stores/:id` - Update store (authenticated)
- `DELETE /api/stores/:id` - Delete store (authenticated)

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/slug/:slug` - Get product by slug
- `GET /api/products/store/:storeId` - Get products by store
- `POST /api/products` - Create product (authenticated)
- `PUT /api/products/:id` - Update product (authenticated)
- `DELETE /api/products/:id` - Delete product (authenticated)

### Categories
- `GET /api/categories/store/:storeId` - Get categories by store
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (authenticated)
- `PUT /api/categories/:id` - Update category (authenticated)
- `DELETE /api/categories/:id` - Delete category (authenticated)

### Orders
- `GET /api/orders` - List orders (authenticated)
- `GET /api/orders/:id` - Get order by ID (authenticated)
- `GET /api/orders/store/:storeId` - Get orders by store (authenticated)
- `POST /api/orders` - Create order (authenticated)
- `PUT /api/orders/:id/status` - Update order status (authenticated)

### File Upload
- `POST /api/upload/presigned-url` - Get presigned URL for Cloudflare R2 (authenticated)

## 🎨 Tech Stack

### Frontend & Admin
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Data Fetching:** TanStack Query
- **HTTP Client:** Axios
- **State Management:** Zustand

### Backend
- **Runtime:** Node.js
- **Framework:** Express
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT + bcrypt
- **Validation:** express-validator
- **File Storage:** Cloudflare R2 (S3 compatible)

### DevOps
- **Monorepo:** Turborepo
- **Package Manager:** pnpm
- **Build Tool:** TypeScript compiler
- **Linting:** ESLint

## 🌟 Features

### Multi-Tenancy
- Single backend managing multiple stores
- Each store has isolated products, orders, and customization
- Store-specific slugs and branding

### Admin Dashboard
- Manage multiple stores from one interface
- Product inventory management
- Order tracking and status updates
- User role management (customer, store_owner, admin)

### Customer Frontend
- Server-side rendering for SEO with React Server Components
- Product browsing with filters and search
- Shopping cart functionality
- Optimistic UI updates with TanStack Query
- React 19 features support
- Responsive design

### API Features
- RESTful architecture
- JWT authentication
- Role-based authorization
- Input validation
- Error handling
- Pagination support
- Text search on products and stores
- Indexed queries for performance

### File Storage
- Cloudflare R2 integration
- Presigned URLs for secure uploads
- Support for product images

## 🔐 Security

- Passwords hashed with bcrypt
- JWT tokens for authentication
- Role-based access control
- Input validation on all endpoints
- CORS configuration
- Environment variable management

## 📝 Environment Variables

### Backend (`apps/backend/.env`)
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

### Frontend & Admin (`apps/*/. env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## 🚢 Deployment

### Frontend & Admin (Vercel)
```bash
cd apps/frontend
vercel deploy

cd apps/admin
vercel deploy
```

### Backend (Any Node.js host)
```bash
cd apps/backend
pnpm build
pnpm start
```

Consider deploying to:
- Heroku
- Railway
- Render
- AWS EC2
- DigitalOcean

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

MIT

## 👥 Team

Built with ❤️ by your development team
# multi-store-ecommerce
