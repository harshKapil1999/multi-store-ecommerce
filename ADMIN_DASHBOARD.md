# Admin Dashboard Implementation Guide

## Overview

The admin dashboard has been fully implemented with a complete multi-store management interface. This document describes the architecture, components, and how to use the dashboard.

## Project Structure

```
apps/admin/src/
├── app/
│   ├── layout.tsx                 # Root layout with Providers
│   ├── page.tsx                   # Redirect to dashboard
│   └── (dashboard)/
│       ├── layout.tsx             # Dashboard layout with sidebar & header
│       ├── page.tsx               # Dashboard home with stats & quick actions
│       ├── stores/
│       │   ├── page.tsx           # Stores CRUD list page
│       │   └── store-form.tsx     # Store creation/edit form
│       ├── billboards/
│       │   ├── page.tsx           # Billboards CRUD list page
│       │   └── billboard-form.tsx # Billboard creation/edit form
│       ├── categories/
│       │   ├── page.tsx           # Categories CRUD list page
│       │   └── category-form.tsx  # Category creation/edit form
│       ├── products/
│       │   ├── page.tsx           # Products CRUD list page with filtering
│       │   └── product-form.tsx   # Product creation/edit form
│       └── orders/
│           └── page.tsx           # Orders list page (placeholder)
├── components/
│   ├── ui/                        # Shadcn UI components (auto-generated)
│   ├── index.ts                   # Component exports barrel
│   ├── providers.tsx              # TanStack Query + Store context provider
│   ├── store-switcher.tsx         # Header dropdown for store selection
│   ├── data-table.tsx             # Reusable TanStack React Table wrapper
│   ├── media-upload.tsx           # Drag-and-drop media upload component
│   └── form-fields.tsx            # Reusable form field wrappers
├── contexts/
│   └── store-context.tsx          # React Context for selected store state
└── hooks/
    ├── useStores.ts              # Stores CRUD hooks
    ├── useBillboards.ts          # Billboards CRUD hooks
    ├── useCategories.ts          # Categories CRUD hooks
    ├── useProducts.ts            # Products CRUD hooks with advanced filtering
    ├── useMedia.ts               # Media upload/delete hooks
    └── index.ts                  # Hooks exports barrel
```

## Core Features

### 1. **Store Switcher**
- **Location**: Header (`StoreSwitcher` component)
- **Functionality**:
  - Dropdown to select active store
  - Shows all stores with pagination
  - Syncs selection via React Context
  - Displays store logo and name
- **Usage**: Header component automatically fetches stores and allows selection

### 2. **Dashboard Home Page**
- **Location**: `/dashboard`
- **Features**:
  - Store selection prompt if no store is selected
  - Quick statistics (total stores, products, categories)
  - Quick action buttons (new product, new category, etc.)
  - Recent products table
  - Links to all management pages

### 3. **Stores Management**
- **Location**: `/dashboard/stores`
- **Features**:
  - List all stores with search/pagination
  - Create new store (modal form)
  - Edit store (modal form)
  - Delete store (confirmation dialog)
  - Toggle store active status
  - Columns: Name/Logo, Domain, Status, Actions
- **Form Fields**: Name, Slug, Domain, Description, Logo URL

### 4. **Billboards Management** (Store-Scoped)
- **Location**: `/dashboard/billboards`
- **Features**:
  - List all billboards for selected store
  - Create new billboard (modal form with media upload)
  - Edit billboard
  - Delete billboard
  - Reorder billboards (drag-and-drop support)
  - Columns: Order, Title, Image, Order, Status, Actions
- **Form Fields**: Title, Subtitle, CTA Text, CTA Link, Image (media upload), Is Active

### 5. **Categories Management** (Store-Scoped)
- **Location**: `/dashboard/categories`
- **Features**:
  - List all categories for selected store
  - Create new category (modal form with media upload)
  - Edit category
  - Delete category
  - Toggle featured status
  - Columns: Name/Image, Featured Badge, Status, Actions
- **Form Fields**: Name, Slug, Description, Image (media upload), Is Featured, Is Active

### 6. **Products Management** (Store-Scoped)
- **Location**: `/dashboard/products`
- **Features**:
  - Advanced filtering:
    - Search by name/description
    - Filter by category
    - Filter by price range (coming soon)
    - Sort by name/price/date
  - Create new product (modal form with media upload)
  - Edit product
  - Delete product
  - Update stock (dedicated modal)
  - Columns: Product/Image, Price/MRP, Stock, Status, Actions
- **Form Fields**: 
  - Name, Slug, Description
  - Category (dropdown)
  - MRP, Selling Price, Stock
  - Featured Image (media upload)
  - Is Featured, Is Active

### 7. **Media Upload Component**
- **Features**:
  - Drag-and-drop file upload
  - Click to browse files
  - File type validation (images: JPEG/PNG/WebP/GIF, videos: MP4/WebM)
  - File size validation (default 50MB max)
  - Upload progress indication
  - Preview thumbnails
  - Error handling with user-friendly messages
  - Direct upload to Cloudflare R2 via presigned URLs
- **Supports**: Single and multiple file uploads

### 8. **Data Table Component**
- **Features**:
  - Server-side pagination
  - Sorting by columns
  - Global search/filter
  - Customizable page sizes (10, 20, 30, 40, 50)
  - Loading states
  - Row selection support
  - Responsive design
  - Empty state handling

### 9. **Form Fields**
- **Components**:
  - `FormInput`: Text input with label, error, helper text
  - `FormTextarea`: Textarea with label, error, helper text
  - `FormSelect`: Dropdown with label, error, helper text
  - `FormCheckbox`: Checkbox with label, error, helper text
- **Features**:
  - Automatic error display
  - Required field indicators
  - Helper text support
  - React Hook Form integration
  - Zod validation

## Navigation & Routing

### Dashboard Routes

```
/                                 → Redirect to /dashboard
/dashboard                        → Dashboard home page
/dashboard/stores                 → Stores management
/dashboard/billboards             → Billboards management (store-scoped)
/dashboard/categories             → Categories management (store-scoped)
/dashboard/products               → Products management (store-scoped)
/dashboard/orders                 → Orders management
```

### Sidebar Navigation

The dashboard includes a collapsible sidebar with quick navigation:
- Dashboard (Home icon)
- Stores (Package icon)
- Billboards (Image icon)
- Categories (Grid icon)
- Products (Package icon)
- Orders (ShoppingCart icon)

The sidebar can be toggled to show/hide labels.

## State Management

### React Context (Store Selection)
```typescript
// Context file: contexts/store-context.tsx
const { selectedStoreId, setSelectedStoreId, clearSelectedStore } = useSelectedStore();
```

### TanStack React Query (Server State)
```typescript
// Example: useProducts hook
const { data, isLoading, error } = useProducts(storeId, filters);

// Mutations for CRUD
const { mutateAsync: create, isPending } = useCreateProduct(storeId);
await create({ name: 'Product', ...data });
```

## Form Validation

All forms use **Zod** for schema validation with **React Hook Form** for state management:

```typescript
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.coerce.number().positive('Must be positive'),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

## API Integration

All admin operations integrate with the backend API:

### Endpoints Used
```
GET    /api/v1/stores                              # List stores
POST   /api/v1/stores                              # Create store
PUT    /api/v1/stores/:id                          # Update store
DELETE /api/v1/stores/:id                          # Delete store
PATCH  /api/v1/stores/:id/toggle                   # Toggle active

GET    /api/v1/stores/:storeId/billboards          # List billboards
POST   /api/v1/stores/:storeId/billboards          # Create billboard
PUT    /api/v1/stores/:storeId/billboards/:id      # Update billboard
DELETE /api/v1/stores/:storeId/billboards/:id      # Delete billboard
PATCH  /api/v1/stores/:storeId/billboards/reorder  # Reorder billboards

GET    /api/v1/stores/:storeId/categories          # List categories
POST   /api/v1/stores/:storeId/categories          # Create category
PUT    /api/v1/stores/:storeId/categories/:id      # Update category
DELETE /api/v1/stores/:storeId/categories/:id      # Delete category

GET    /api/v1/stores/:storeId/products            # List products
POST   /api/v1/stores/:storeId/products            # Create product
PUT    /api/v1/stores/:storeId/products/:id        # Update product
PATCH  /api/v1/stores/:storeId/products/:id/stock  # Update stock
DELETE /api/v1/stores/:storeId/products/:id        # Delete product

POST   /api/v1/media/presigned-url                 # Get upload URL
POST   /api/v1/media/confirm                       # Confirm upload
DELETE /api/v1/media/:key                          # Delete media
```

## Media Upload Flow

1. **Request Presigned URL**
   ```
   POST /api/v1/media/presigned-url
   { filename, contentType, size }
   ↓ Returns { uploadUrl, key, mediaUrl }
   ```

2. **Upload Directly to R2**
   ```
   PUT {uploadUrl}
   Body: file content
   ```

3. **Confirm Upload**
   ```
   POST /api/v1/media/confirm
   { key }
   ↓ Returns { url, key, filename }
   ```

## Dependencies

### Production Dependencies
```json
{
  "@tanstack/react-query": "^5.59.20",
  "@tanstack/react-table": "^8.21.3",
  "react-hook-form": "^7.x",
  "zod": "^3.x",
  "@hookform/resolvers": "^3.x",
  "lucide-react": "latest",
  "class-variance-authority": "latest",
  "clsx": "latest",
  "tailwind-merge": "latest"
}
```

### Build Setup
```json
{
  "@types/react": "rc",
  "@types/react-dom": "rc",
  "typescript": "^5.6.3",
  "tailwindcss": "^3.4.15",
  "postcss": "^8.4.49",
  "autoprefixer": "^10.4.20"
}
```

## Styling

All components use **Tailwind CSS** with custom Shadcn theme (New York style, Neutral colors).

### Customization
- Color scheme: Neutral (grays and blues)
- Component library: shadcn/ui
- Icons: Lucide React
- Layout: CSS Grid + Flexbox
- Responsive: Mobile-first design

## Getting Started

### 1. Start the Admin Dashboard
```bash
cd apps/admin
pnpm dev
```

Runs on `http://localhost:3001`

### 2. Select a Store
- Use the dropdown in the header to select a store
- Or navigate to `/dashboard/stores` to create a new store

### 3. Start Managing
- Create products, categories, and billboards
- Upload media for products and categories
- Manage inventory and pricing

## Best Practices

1. **Always select a store** before managing resources - most pages are store-scoped
2. **Use drag-and-drop media upload** for better UX than manually entering URLs
3. **Verify images** have appropriate dimensions for best display
4. **Use featured** flag strategically to highlight products on home page
5. **Keep slugs** URL-friendly (lowercase, hyphens)
6. **Monitor stock** regularly and update as inventory changes

## Troubleshooting

### Store selector shows "No stores available"
- Create a store first in the Stores page
- Ensure you're logged in and have admin privileges

### Media upload fails
- Check file size (max 50MB)
- Verify file type (image: JPEG/PNG/WebP/GIF, video: MP4/WebM)
- Ensure Cloudflare R2 credentials are configured correctly (see `R2_SETUP.md`)

### Forms won't submit
- Fill all required fields (marked with *)
- Check for validation errors displayed below fields
- Ensure your API backend is running

### Page shows "Please select a store"
- Use the StoreSwitcher dropdown in the header
- Select or create a store first

## Future Enhancements

- [ ] Bulk product import/export
- [ ] Advanced analytics dashboard
- [ ] Product variants & SKUs
- [ ] Order management UI
- [ ] Customer management
- [ ] Marketing campaigns & promotions
- [ ] Inventory alerts
- [ ] Multi-language support

## Support

For issues or questions:
1. Check error messages in the UI
2. Check browser console for API errors
3. Verify backend is running on correct port (4000)
4. Review API response in Network tab
5. Check `R2_SETUP.md` for media upload issues
