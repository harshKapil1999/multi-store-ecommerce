# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────┐       ┌─────────────────────┐         │
│  │   Frontend App      │       │   Admin Dashboard   │         │
│  │   (Next.js 16)      │       │   (Next.js 16)      │         │
│  │   Port: 3000        │       │   Port: 3001        │         │
│  │                     │       │                     │         │
│  │  - Product Browse   │       │  - Store Mgmt       │         │
│  │  - Shopping Cart    │       │  - Product Mgmt     │         │
│  │  - Checkout         │       │  - Order Tracking   │         │
│  │  - TanStack Query   │       │  - Analytics        │         │
│  └──────────┬──────────┘       └──────────┬──────────┘         │
│             │                             │                     │
└─────────────┼─────────────────────────────┼─────────────────────┘
              │                             │
              │    HTTP/REST API            │
              └─────────────┬───────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                     API LAYER                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────┐      │
│  │           Express.js API Server                       │      │
│  │           (Node.js + TypeScript)                      │      │
│  │           Port: 4000                                  │      │
│  │                                                        │      │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │      │
│  │  │ Middleware   │  │ Controllers  │  │  Routes    │ │      │
│  │  ├──────────────┤  ├──────────────┤  ├────────────┤ │      │
│  │  │ - Auth       │  │ - Store      │  │ - /stores  │ │      │
│  │  │ - CORS       │  │ - Product    │  │ - /products│ │      │
│  │  │ - Validation │  │ - Order      │  │ - /orders  │ │      │
│  │  │ - Error      │  │ - User       │  │ - /users   │ │      │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │      │
│  └──────────────────────────────────────────────────────┘      │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   MongoDB       │ │  Cloudflare R2  │ │   JWT Tokens    │
│                 │ │  (File Storage) │ │   (Auth)        │
│  Collections:   │ │                 │ │                 │
│  - stores       │ │  - Product Imgs │ │  - User Auth    │
│  - products     │ │  - Store Logos  │ │  - Role-based   │
│  - orders       │ │                 │ │                 │
│  - users        │ │                 │ │                 │
│  - categories   │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Data Flow

### 1. Customer Browsing Products
```
Customer → Frontend → API → MongoDB
                ↓
         TanStack Query
         (Caching & Optimization)
```

### 2. Place Order
```
Customer → Frontend → API → Validate → Update Inventory
                      ↓
                   MongoDB
                   (Order Created)
```

### 3. Admin Managing Products
```
Admin → Dashboard → API → Auth Check → MongoDB
                     ↓
              Upload to R2
         (Product Images)
```

## Multi-Tenancy Model

### Database Design
```
Store A (ID: store-a)
  ├── Products (storeId: store-a)
  ├── Orders (storeId: store-a)
  └── Categories (storeId: store-a)

Store B (ID: store-b)
  ├── Products (storeId: store-b)
  ├── Orders (storeId: store-b)
  └── Categories (storeId: store-b)

Shared:
  └── Users (role: customer, admin, store_owner)
```

### Access Control
- **Customer**: View products, place orders
- **Store Owner**: Manage own store, products, orders
- **Admin**: Manage all stores, users, global settings

## Package Dependencies

```
┌─────────────────────────────────────────────────────┐
│                    Monorepo Root                     │
│                   (Turborepo + pnpm)                 │
└─────────────────────┬───────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │ Frontend│  │  Admin  │  │ Backend │
   └────┬────┘  └────┬────┘  └────┬────┘
        │            │            │
        └────────────┼────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   ┌─────────┐              ┌─────────┐
   │ @repo/  │              │ @repo/  │
   │ types   │              │ utils   │
   └─────────┘              └─────────┘
        │
        └──────────────┐
                       ▼
                  ┌─────────┐
                  │ @repo/  │
                  │   ui    │
                  └─────────┘
```

## Technology Stack

### Frontend Stack
```
Next.js 16
  ├── React 19 RC
  ├── TypeScript
  ├── Tailwind CSS
  ├── shadcn/ui Components
  ├── TanStack Query (Data Fetching)
  ├── Axios (HTTP Client)
  └── Zustand (State Management)
```

### Backend Stack
```
Node.js + Express
  ├── TypeScript
  ├── MongoDB + Mongoose
  ├── JWT + bcrypt (Auth)
  ├── Express Validator
  ├── AWS SDK (R2 Storage)
  └── Morgan (Logging)
```

### Shared Packages
```
@repo/types
  └── TypeScript Interfaces

@repo/utils
  ├── formatCurrency()
  ├── slugify()
  ├── generateOrderNumber()
  └── ... more utilities

@repo/ui
  └── Shared React Components
```

## API Structure

```
/api
├── /stores
│   ├── GET    /              # List stores
│   ├── GET    /:id           # Get store
│   ├── GET    /slug/:slug    # Get by slug
│   ├── POST   /              # Create (Auth)
│   ├── PUT    /:id           # Update (Auth)
│   └── DELETE /:id           # Delete (Auth)
│
├── /products
│   ├── GET    /              # List with filters
│   ├── GET    /:id           # Get product
│   ├── GET    /slug/:slug    # Get by slug
│   ├── GET    /store/:id     # By store
│   ├── POST   /              # Create (Auth)
│   ├── PUT    /:id           # Update (Auth)
│   └── DELETE /:id           # Delete (Auth)
│
├── /orders
│   ├── GET    /              # List (Auth)
│   ├── GET    /:id           # Get order (Auth)
│   ├── GET    /store/:id     # By store (Auth)
│   ├── POST   /              # Create (Auth)
│   └── PUT    /:id/status    # Update status (Auth)
│
├── /categories
│   ├── GET    /store/:id     # List by store
│   ├── GET    /:id           # Get category
│   ├── POST   /              # Create (Auth)
│   ├── PUT    /:id           # Update (Auth)
│   └── DELETE /:id           # Delete (Auth)
│
├── /users
│   ├── POST   /register      # Register
│   ├── POST   /login         # Login
│   └── GET    /me            # Current user (Auth)
│
└── /upload
    └── POST   /presigned-url # Get R2 upload URL (Auth)
```

## Security Layers

```
┌─────────────────────────────────────┐
│  1. CORS (Cross-Origin Protection)  │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  2. JWT Authentication              │
│     (Bearer Token in Headers)       │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  3. Role-Based Authorization        │
│     (customer / store_owner / admin)│
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  4. Input Validation                │
│     (express-validator)             │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  5. MongoDB Injection Protection    │
│     (Mongoose Sanitization)         │
└─────────────────────────────────────┘
```

## Deployment Architecture

```
┌──────────────────────────────────────────────┐
│              Production Setup                 │
├──────────────────────────────────────────────┤
│                                               │
│  Frontend (Vercel)                           │
│    ↓                                         │
│  CDN Edge Locations                          │
│    ↓                                         │
│                                               │
│  Admin Dashboard (Vercel)                    │
│    ↓                                         │
│  CDN Edge Locations                          │
│    ↓                                         │
│         ┌────────────┐                       │
│         │  API Load  │                       │
│         │  Balancer  │                       │
│         └─────┬──────┘                       │
│               │                               │
│      ┌────────┼────────┐                    │
│      │        │        │                     │
│   Server1  Server2  Server3                 │
│      │        │        │                     │
│      └────────┼────────┘                    │
│               │                               │
│         MongoDB Atlas                         │
│         (Cloud Database)                      │
│                                               │
│         Cloudflare R2                         │
│         (File Storage)                        │
│                                               │
└──────────────────────────────────────────────┘
```

## Performance Optimizations

### Frontend
- Server-Side Rendering (SSR)
- Static Generation for product pages
- Image optimization with Next.js Image
- Code splitting
- TanStack Query caching
- Optimistic UI updates

### Backend
- MongoDB indexes on:
  - Store ID
  - Product slug
  - Order status
  - Text search fields
- Connection pooling
- Pagination for large datasets
- Efficient query projections

### Caching Strategy
```
Browser Cache
  ↓
TanStack Query Cache (5 min)
  ↓
API Server
  ↓
MongoDB (with indexes)
```
