# Admin Dashboard Quick Start

## Installation & Setup

### 1. Install Dependencies
```bash
cd /Users/harshkapil/Developer/projects/ecommerce-monorepo
pnpm install
```

### 2. Configure Backend
Ensure your backend is configured with proper environment variables:
```bash
# apps/backend/.env.local
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your-secret-key
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_BUCKET_NAME=your-bucket-name
PORT=4000
```

See `R2_SETUP.md` and `.env.example` for complete configuration.

### 3. Start Backend
```bash
cd apps/backend
pnpm dev
# Should run on http://localhost:4000
```

### 4. Start Admin Dashboard
```bash
cd apps/admin
pnpm dev
# Should run on http://localhost:3001
```

## First Steps

### Step 1: Access Dashboard
Open `http://localhost:3001` in your browser.

### Step 2: Create Your First Store
1. Click on the **"Manage Stores"** button on the dashboard
2. Or navigate to `/dashboard/stores`
3. Click **"New Store"** button
4. Fill in:
   - **Store Name**: "Nike Store" (or your store name)
   - **Slug**: "nike-store" (URL-friendly, lowercase with hyphens)
   - **Domain**: "nike.example.com" (optional, custom domain)
   - **Description**: "Your store description"
   - **Logo URL**: Link to store logo (optional)
5. Click **"Create Store"**

### Step 3: Select Your Store
1. Use the dropdown in the header (top-right) labeled "Select a store"
2. Choose the store you just created
3. The dashboard will update to show stats for this store

### Step 4: Create Your First Product
1. Navigate to **Products** from the sidebar
2. Click **"New Product"** button
3. Fill in:
   - **Product Name**: "Nike Air Max"
   - **Slug**: "nike-air-max"
   - **Description**: "Premium running shoe"
   - **Category**: Create or select a category first
   - **MRP**: "5999"
   - **Selling Price**: "4999"
   - **Stock**: "100"
   - **Featured Image**: Click upload area, drag an image, or click to select
   - **Featured**: Check if you want to highlight this product
   - **Active**: Check to make it visible
4. Click **"Create Product"**

### Step 5: Create Categories
1. Navigate to **Categories** from the sidebar
2. Click **"New Category"** button
3. Fill in:
   - **Category Name**: "Running Shoes"
   - **Slug**: "running-shoes"
   - **Description**: "All running shoes collection"
   - **Category Image**: Upload an image
   - **Feature this category**: Check to show on homepage
   - **Active**: Check to make visible
4. Click **"Create Category"**

### Step 6: Create Billboards
1. Navigate to **Billboards** from the sidebar
2. Click **"New Billboard"** button
3. Fill in:
   - **Title**: "Summer Collection 2024"
   - **Subtitle**: "Discover the latest trends"
   - **CTA Text**: "Shop Now"
   - **CTA Link**: "https://your-site.com/collection"
   - **Billboard Image**: Upload a promotional image
   - **Active**: Check to display
4. Click **"Create Billboard"**

## Common Tasks

### Upload Media
1. Click the upload area in any form
2. Either:
   - **Drag files** onto the area
   - **Click to browse** and select files
3. Wait for upload to complete (progress shown)
4. Image preview appears on success
5. Remove uploads with the ✕ button

### Update Product Stock
1. Go to **Products**
2. Find the product in the table
3. Click the **📦** button in the Actions column
4. Enter new stock quantity
5. Click **"Update Stock"**

### Edit Existing Items
1. Find item in the list table
2. Click **Edit** (pencil icon)
3. Modal opens with pre-filled data
4. Make changes
5. Click **"Update [Item]"**

### Delete Items
1. Find item in the list table
2. Click **Delete** (trash icon)
3. Confirm deletion in the dialog
4. Item is removed

### Search & Filter
- **Products**: Search by name, filter by category
- **Stores**: Search by store name
- **Categories**: View all or featured
- **All tables**: Use the search box for global search

### Pagination
- Change rows per page: Select from dropdown (10, 20, 30, 40, 50)
- Navigate pages: Use arrow buttons
- Jump to first/last page: Use chevron buttons

## Keyboard Shortcuts & Tips

### Forms
- **Tab**: Move between fields
- **Enter**: Submit form
- **Escape**: Close modal/dialog

### Modals
- **Escape**: Close without saving
- Click outside modal to close

### Tables
- **Hover** rows for better visibility
- **Click column** data to see full content
- **Right-click** for context menu (browser dependent)

## Data Structure Reference

### Store
```javascript
{
  _id: "123...",
  name: "Nike Store",
  slug: "nike-store",          // Must be unique
  domain: "nike.example.com",
  description: "...",
  logo: "https://...",
  isActive: true,
  createdAt: "2024-01-01...",
  updatedAt: "2024-01-01..."
}
```

### Product
```javascript
{
  _id: "456...",
  storeId: "123...",
  name: "Air Max",
  slug: "air-max",             // Unique per store
  description: "...",
  categoryId: "789...",
  featuredImage: "https://...",
  mediaGallery: [...],         // Additional images/videos
  mrp: 5999,
  sellingPrice: 4999,
  stock: 100,
  isFeatured: true,
  isActive: true
}
```

### Category
```javascript
{
  _id: "789...",
  storeId: "123...",
  name: "Running Shoes",
  slug: "running-shoes",
  description: "...",
  imageUrl: "https://...",
  isFeatured: true,
  isActive: true
}
```

### Billboard
```javascript
{
  _id: "101...",
  storeId: "123...",
  title: "Summer 2024",
  subtitle: "New collection",
  imageUrl: "https://...",
  ctaText: "Shop Now",
  ctaLink: "https://...",
  order: 1,                    // For sorting/reordering
  isActive: true
}
```

## Troubleshooting

### Admin Dashboard Won't Load
```bash
# Check if both services are running
curl http://localhost:3001  # Admin
curl http://localhost:4000  # API
```

### Media Upload Fails
- Check file size (max 50MB)
- Verify file format (JPEG, PNG, WebP, GIF for images; MP4, WebM for videos)
- Check R2 credentials in backend `.env.local`
- See `R2_SETUP.md` for details

### Store Selector Shows No Stores
1. Create a store first (`/dashboard/stores`)
2. Verify backend is returning stores (check Network tab)
3. Clear browser cache if needed

### Form Validation Errors
- Red text below fields indicates validation errors
- Required fields marked with *
- Follow the error message guidance
- Common: slug must be lowercase alphanumeric with hyphens

### Changes Not Appearing
- Check browser Network tab for API responses
- Verify you selected the correct store (header dropdown)
- Try refreshing the page
- Check backend logs for errors

## Development Tips

### Component Reusability
All components are in `components/` folder. Import like:
```typescript
import { DataTable, Button, FormInput, MediaUpload } from '@/components/index';
```

### Adding New CRUD Pages
1. Create page folder: `apps/admin/src/app/(dashboard)/[resource]/`
2. Create form component: `[resource]-form.tsx`
3. Create page component: `page.tsx`
4. Import and use hooks from `hooks/` folder
5. Add navigation link in `app/(dashboard)/layout.tsx`

### Type Safety
All data is typed using types from `@repo/types`:
```typescript
import type { Store, Product, Category, Billboard } from '@repo/types';
```

### Styling
- Use Tailwind CSS utility classes
- Shadcn components already include styling
- Dark mode: Will be supported (CSS variables in place)

## API Integration

The admin app communicates with the backend API at `http://localhost:4000`.

### Making API Calls
```typescript
import { apiClient } from '@/lib/api-client';

// GET
const { data } = await apiClient.get('/api/v1/stores');

// POST
const { data } = await apiClient.post('/api/v1/stores', {...});

// PUT
const { data } = await apiClient.put('/api/v1/stores/:id', {...});

// DELETE
await apiClient.delete('/api/v1/stores/:id');
```

## Performance Tips

1. **Use pagination**: Tables limit to 20 items per page by default
2. **Search before filtering**: Reduces data loaded
3. **Close unused modals**: Prevents unnecessary renders
4. **Avoid excessive uploads**: Large media files can impact performance

## Next Steps

1. **Create multiple stores**: Test multi-store functionality
2. **Populate catalog**: Add products, categories, and billboards
3. **Test filtering**: Try search and category filters
4. **Upload diverse media**: Test with various image/video formats
5. **Monitor performance**: Check Network tab for API response times

## Support Resources

- **Backend API**: See `/apps/backend/README.md`
- **Media Setup**: See `R2_SETUP.md`
- **Full Documentation**: See `ADMIN_DASHBOARD.md`
- **Environment Config**: See `.env.example`

---

**Happy selling! 🚀**
