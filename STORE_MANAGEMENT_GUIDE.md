# Store Management Guide

## Overview

The admin dashboard is now fully equipped with store management capabilities. Users can create stores, select which store to manage, and then add products, categories, and other content to the selected store.

## Features Implemented

### 1. Store Fetching & Selection ✅

**Store Switcher Component**
- Located in the dashboard header
- Displays all stores created by the user
- Shows store logo and name
- Automatically loads from backend API
- Selected store ID is persisted in localStorage (survives page refresh)

**How it works:**
```typescript
// stores/page.tsx - Create/Edit/Delete stores
// components/store-switcher.tsx - Select which store to work with
// contexts/store-context.tsx - Manages selected store globally
```

### 2. Store-Scoped Product Management ✅

**Products Page** (`/dashboard/products`)
- Only visible and editable after selecting a store
- Features:
  - Create new products
  - Edit existing products
  - Delete products
  - Manage product stock
  - Search and filter by category
  - Upload featured images
  - Set prices (MRP and selling price)
  - Mark as featured/active
  - Pagination support

**Product Form includes:**
- Product name and slug
- Description
- Category selection (from store's categories)
- Featured image upload
- Pricing (MRP and selling price)
- Stock management
- Featured/Active toggles

### 3. Store-Scoped Category Management ✅

**Categories Page** (`/dashboard/categories`)
- Only visible and editable after selecting a store
- Features:
  - Create new categories
  - Edit existing categories
  - Delete categories
  - Upload category images
  - Mark as featured
  - Full CRUD operations

**Category Form includes:**
- Category name and slug
- Description
- Category image upload
- Featured toggle
  - Active/Inactive status

## How to Use

### Step 1: Create Your First Store

1. Navigate to **Stores** in the sidebar
2. Click **New Store** button
3. Fill in:
   - Store Name
   - Store Slug (URL-friendly)
   - Domain (optional)
   - Description
   - Logo (optional)
4. Click **Create Store**

### Step 2: Select the Store

1. Look at the dashboard header - you'll see a **Store Selector** dropdown
2. Click it and select your newly created store
3. The selection is automatically saved (persists on refresh)

### Step 3: Add Categories

1. Navigate to **Categories** in the sidebar
2. Click **New Category** button
3. Fill in:
   - Category Name
   - Category Slug
   - Description (optional)
   - Category Image (optional)
   - Mark as Featured (optional)
4. Click **Create Category**

### Step 4: Add Products

1. Navigate to **Products** in the sidebar
2. Click **New Product** button
3. Fill in:
   - Product Name
   - Product Slug
   - Description
   - Category (select from your store's categories)
   - Featured Image (required)
   - MRP (original price)
   - Selling Price
   - Stock Quantity
   - Mark as Featured (optional)
   - Mark as Active (optional)
4. Click **Create Product**

### Step 5: Manage Your Store

**Dashboard View:**
- Shows total stores, products, and categories for the selected store
- Displays quick actions (New Product, New Category, etc.)
- Shows recent products table
- Real-time statistics

**Quick Actions:**
- Create new products
- Create new categories
- Create promotional billboards
- View orders

## Architecture

### Context Management

**Store Context** (`contexts/store-context.tsx`)
- Manages the globally selected store
- Persists to localStorage
- Handles hydration properly

```typescript
// Usage in any component:
const { selectedStoreId, setSelectedStoreId } = useSelectedStore();
```

### API Integration

All store-scoped endpoints follow this pattern:
```
GET/POST /api/v1/stores/{storeId}/products
GET/POST /api/v1/stores/{storeId}/categories
GET/POST /api/v1/stores/{storeId}/billboards
```

### React Query Hooks

**Store Management:**
```typescript
useStores(page, limit, search)           // List all stores
useStore(id)                             // Get single store
useCreateStore()                         // Create store
useUpdateStore(id)                       // Update store
useDeleteStore(id)                       // Delete store
useToggleStore(id)                       // Toggle store active status
```

**Product Management:**
```typescript
useProducts(storeId, filters)            // List products for store
useProduct(storeId, productId)           // Get single product
useCreateProduct(storeId)                // Create product
useUpdateProduct(storeId, productId)     // Update product
useDeleteProduct(storeId, productId)     // Delete product
useUpdateStock(storeId, productId)       // Update stock
useFeaturedProducts(storeId, limit)      // Get featured products
```

**Category Management:**
```typescript
useCategories(storeId, featured?)        // List categories for store
useCategory(storeId, categoryId)         // Get single category
useCreateCategory(storeId)               // Create category
useUpdateCategory(storeId, categoryId)   // Update category
useDeleteCategory(storeId, categoryId)   // Delete category
```

## Data Flow

```
Dashboard (Select Store)
    ↓
StoreSwitcher (displays all user's stores)
    ↓
StoreContext (selectedStoreId stored globally + localStorage)
    ↓
Products Page / Categories Page
    ↓
useProducts(selectedStoreId) / useCategories(selectedStoreId)
    ↓
Backend API (/api/v1/stores/{storeId}/products)
    ↓
List products/categories for selected store
```

## Backend Integration

The backend expects store-scoped endpoints with the following structure:

### Products
- `GET /api/v1/stores/:storeId/products` - List products
- `POST /api/v1/stores/:storeId/products` - Create product
- `GET /api/v1/stores/:storeId/products/:productId` - Get product
- `PUT /api/v1/stores/:storeId/products/:productId` - Update product
- `DELETE /api/v1/stores/:storeId/products/:productId` - Delete product
- `PATCH /api/v1/stores/:storeId/products/:productId/stock` - Update stock

### Categories
- `GET /api/v1/stores/:storeId/categories` - List categories
- `POST /api/v1/stores/:storeId/categories` - Create category
- `GET /api/v1/stores/:storeId/categories/:categoryId` - Get category
- `PUT /api/v1/stores/:storeId/categories/:categoryId` - Update category
- `DELETE /api/v1/stores/:storeId/categories/:categoryId` - Delete category

## Important Notes

### Session Persistence
- Store selection persists in localStorage
- Session stored in httpOnly cookies (secure)
- Survives page refresh and browser restart
- Automatically cleared on logout

### Validation
- All forms use Zod schema validation
- Real-time error handling
- User-friendly error messages

### UI Components
- Responsive design (mobile, tablet, desktop)
- Tailwind CSS styling
- Loading states and error states
- Confirmation dialogs for destructive actions
- Data tables with pagination and sorting

## Troubleshooting

### Store Selector Not Showing Stores
1. Make sure you've created at least one store
2. Check if API is responding (browser DevTools Network tab)
3. Refresh the page
4. Check browser console for errors

### Products/Categories Not Loading
1. Verify a store is selected in the header
2. Check if the store has any products/categories
3. Look for error messages in the UI
4. Check browser console for API errors

### Changes Not Saved
1. Check if the form has validation errors
2. Ensure you clicked the submit button
3. Check network tab to see if request succeeded (HTTP 200)
4. Look for error notifications in the UI

### Store Selection Not Persisting
1. Check if localStorage is enabled in browser
2. Check browser DevTools > Application > Cookies for "session" cookie
3. Make sure you're not in private/incognito mode

## Next Steps

After implementing this guide, you can:

1. **Add Billboards Management** - Create promotional banners for stores
2. **Add Orders Management** - View and manage customer orders per store
3. **Add Analytics** - Track sales, popular products per store
4. **Multi-Tenant Dashboard** - Switch between stores in real-time
5. **Bulk Operations** - Import/export products, bulk pricing updates

## File Locations

```
apps/admin/src/
├── contexts/
│   └── store-context.tsx              # Store selection context + localStorage
├── hooks/
│   ├── useStores.ts                   # Store CRUD operations
│   ├── useProducts.ts                 # Product CRUD operations
│   └── useCategories.ts               # Category CRUD operations
├── components/
│   └── store-switcher.tsx             # Store selector dropdown
└── app/dashboard/
    ├── page.tsx                       # Main dashboard (shows stats)
    ├── stores/
    │   ├── page.tsx                   # Store management page
    │   ├── store-form.tsx             # Store form component
    ├── products/
    │   ├── page.tsx                   # Products page (store-scoped)
    │   └── product-form.tsx           # Product form component
    └── categories/
        ├── page.tsx                   # Categories page (store-scoped)
        └── category-form.tsx          # Category form component
```

---

**Last Updated:** November 18, 2025
**Status:** ✅ Fully Implemented
