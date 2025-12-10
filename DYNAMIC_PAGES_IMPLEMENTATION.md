# Dynamic Pages System Implementation

## Overview
Implemented a complete dynamic page management system that allows store owners to create customizable pages with multiple section types including billboards, featured products, featured categories, and custom content.

## Backend Implementation

### 1. Page Model (`apps/backend/src/models/page.model.ts`)
- **Page Schema**: Main page entity with title, slug, meta information
- **Page Section Schema**: Flexible sections that can be added to pages
- **Section Types**:
  - `hero`: Hero banner section
  - `billboard`: Display billboard from billboard collection
  - `featured_products`: Showcase featured products (with filters)
  - `featured_categories`: Display featured categories
  - `product_grid`: Grid of products
  - `category_grid`: Grid of categories
  - `text_content`: Custom text/markdown content
  - `custom_html`: Custom HTML blocks

**Key Features**:
- Only one home page per store (enforced by pre-save hook)
- Sections are ordered and can be toggled visible/invisible
- Each section type has specific configuration options
- Support for layout customization (grid, carousel, list, masonry)

### 2. Page Controller (`apps/backend/src/controllers/page.controller.ts`)
**Endpoints Implemented**:
- `GET /pages` - List all pages for a store
- `GET /pages/:pageId` - Get single page
- `GET /pages/slug/:slug` - Get page by slug (public)
- `GET /pages/home` - Get home page (public)
- `POST /pages` - Create new page
- `PUT /pages/:pageId` - Update page
- `DELETE /pages/:pageId` - Delete page
- `PATCH /pages/:pageId/publish` - Toggle publish status
- `POST /pages/:pageId/sections` - Add section
- `PUT /pages/:pageId/sections/:sectionId` - Update section
- `DELETE /pages/:pageId/sections/:sectionId` - Delete section
- `POST /pages/:pageId/sections/reorder` - Reorder sections

### 3. Routes (`apps/backend/src/routes/page.routes.ts`)
- All routes scoped under `/api/v1/stores/:storeId/pages`
- Public routes for fetching published pages
- Protected routes for page management (requires authentication)

### 4. Types (`packages/types/src/index.ts`)
Added comprehensive TypeScript types:
- `Page` - Main page interface
- `PageSection` - Section interface
- `SectionType` - Union type for all section types
- `CreatePageInput` - Page creation input
- `UpdatePageInput` - Page update input
- `AddPageSectionInput` - Section creation input
- `UpdatePageSectionInput` - Section update input

## Frontend Implementation (Admin Dashboard)

### 1. React Hooks (`apps/admin/src/hooks/usePages.ts`)
**Hooks Created**:
- `usePages(storeId, published?)` - List pages
- `usePage(storeId, pageId)` - Get single page
- `usePageBySlug(storeId, slug)` - Get page by slug
- `useHomePage(storeId)` - Get home page
- `useCreatePage(storeId)` - Create page mutation
- `useUpdatePage(storeId, pageId)` - Update page mutation
- `useDeletePage(storeId)` - Delete page mutation
- `useTogglePublish(storeId)` - Toggle publish status
- `useAddSection(storeId, pageId)` - Add section mutation
- `useUpdateSection(storeId, pageId)` - Update section mutation
- `useDeleteSection(storeId, pageId)` - Delete section mutation
- `useReorderSections(storeId, pageId)` - Reorder sections mutation

All mutations include:
- Toast notifications on success/error
- Automatic cache invalidation
- Error handling

### 2. Pages List View (`apps/admin/src/app/dashboard/pages/page.tsx`)
**Features**:
- Displays all pages in a table format
- Shows page title, slug, section count, publish status
- Indicates home page with icon
- Quick actions: Publish/Unpublish, Edit, Delete
- "Create Page" button
- Empty state with call-to-action

### 3. New Page Form (`apps/admin/src/app/dashboard/pages/new/page.tsx`)
**Features**:
- Title input with auto-slug generation
- Slug editor with URL preview
- Description textarea
- "Set as Home Page" checkbox
- Form validation
- Cancel and Submit actions
- Redirects to page editor after creation

### 4. Page Editor (`apps/admin/src/app/dashboard/pages/[pageId]/page.tsx`)
**Features**:
- **Page Information Section**:
  - Edit title, slug, description
  - Toggle home page status
  - Save button with loading state

- **Sections Management**:
  - List all sections with drag handles
  - Show section type badges
  - Display section configuration preview
  - Toggle section visibility
  - Delete sections
  - Add new sections modal

- **Add Section Modal**:
  - Select from available section types
  - Quick creation with default values
  - Cancel option

### 5. Navigation Update (`apps/admin/src/app/dashboard/layout.tsx`)
- Added "Pages" menu item with FileText icon
- Positioned between Stores and Billboards

## How It Works

### For Store Owners:

1. **Create a Page**:
   - Go to Dashboard → Pages
   - Click "Create Page"
   - Enter title (slug auto-generates)
   - Optionally set as home page
   - Click "Create Page"

2. **Add Content Sections**:
   - Click "Add Section"
   - Choose section type:
     - **Billboard**: Link to existing billboard
     - **Featured Products**: Select specific products or filter by category
     - **Featured Categories**: Display category grid
     - **Text Content**: Add custom text/content

3. **Customize Each Section**:
   - Set section title
   - Configure specific options (products, categories, billboards)
   - Choose layout (grid, carousel, list)
   - Set columns, colors, padding
   - Toggle visibility

4. **Publish**:
   - Toggle publish status when ready
   - Published pages are accessible via `/slug` URL

### Section Types Explained:

1. **Hero**: Large banner at top of page
2. **Billboard**: Display promotional banners from billboard manager
3. **Featured Products**: 
   - Show specific products by ID
   - Filter by category
   - Show only featured products
   - Set limit on number of products
4. **Featured Categories**:
   - Select specific categories
   - Set display limit
   - Show featured categories only
5. **Product Grid**: Filterable product catalog
6. **Category Grid**: Category navigation
7. **Text Content**: Rich text or markdown
8. **Custom HTML**: Advanced custom code

## Database Schema

```typescript
Page {
  _id: ObjectId
  storeId: String (indexed)
  title: String
  slug: String (unique per store)
  description: String
  metaTitle: String
  metaDescription: String
  isPublished: Boolean (indexed)
  isHomePage: Boolean (indexed)
  sections: [PageSection]
  createdAt: Date
  updatedAt: Date
}

PageSection {
  _id: String
  type: SectionType (enum)
  title: String
  order: Number
  isVisible: Boolean
  
  // Billboard Section
  billboardId: String
  
  // Product Sections
  productIds: [String]
  productsLimit: Number
  showFeaturedOnly: Boolean
  categoryFilter: String
  
  // Category Sections
  categoryIds: [String]
  categoriesLimit: Number
  
  // Content Sections
  content: String
  html: String
  
  // Layout
  layout: 'grid' | 'carousel' | 'list' | 'masonry'
  columns: Number
  backgroundColor: String
  padding: String
}
```

## API Endpoints

### Public Endpoints (No Auth Required)
- `GET /api/v1/stores/:storeId/pages` - List pages (can filter by `?published=true`)
- `GET /api/v1/stores/:storeId/pages/home` - Get home page
- `GET /api/v1/stores/:storeId/pages/slug/:slug` - Get page by slug
- `GET /api/v1/stores/:storeId/pages/:pageId` - Get page by ID

### Protected Endpoints (Auth Required)
- `POST /api/v1/stores/:storeId/pages` - Create page
- `PUT /api/v1/stores/:storeId/pages/:pageId` - Update page
- `DELETE /api/v1/stores/:storeId/pages/:pageId` - Delete page
- `PATCH /api/v1/stores/:storeId/pages/:pageId/publish` - Toggle publish
- `POST /api/v1/stores/:storeId/pages/:pageId/sections` - Add section
- `PUT /api/v1/stores/:storeId/pages/:pageId/sections/:sectionId` - Update section
- `DELETE /api/v1/stores/:storeId/pages/:pageId/sections/:sectionId` - Delete section
- `POST /api/v1/stores/:storeId/pages/:pageId/sections/reorder` - Reorder sections

## Next Steps / Future Enhancements

1. **Frontend Store Implementation**:
   - Create public-facing page renderer
   - Implement section components for each type
   - Add responsive layouts

2. **Section Enhancements**:
   - Rich text editor for text_content
   - Image upload for sections
   - Video embed section
   - Testimonials section
   - FAQ section
   - Contact form section

3. **Advanced Features**:
   - Page templates
   - Copy/duplicate pages
   - Page analytics
   - A/B testing
   - SEO optimization tools
   - Page preview before publish

4. **Visual Editor**:
   - Drag-and-drop page builder
   - Live preview
   - Mobile preview
   - Theme customization per page

## Files Created/Modified

### Backend:
- ✅ `apps/backend/src/models/page.model.ts` (NEW)
- ✅ `apps/backend/src/controllers/page.controller.ts` (NEW)
- ✅ `apps/backend/src/routes/page.routes.ts` (NEW)
- ✅ `apps/backend/src/index.ts` (MODIFIED - added page routes)

### Types:
- ✅ `packages/types/src/index.ts` (MODIFIED - added page types)

### Admin Frontend:
- ✅ `apps/admin/src/hooks/usePages.ts` (NEW)
- ✅ `apps/admin/src/app/dashboard/pages/page.tsx` (NEW)
- ✅ `apps/admin/src/app/dashboard/pages/new/page.tsx` (NEW)
- ✅ `apps/admin/src/app/dashboard/pages/[pageId]/page.tsx` (NEW)
- ✅ `apps/admin/src/app/dashboard/layout.tsx` (MODIFIED - added Pages nav)

## Testing

To test the implementation:

1. Start backend: `cd apps/backend && npm run dev`
2. Start admin: `cd apps/admin && npm run dev`
3. Login to admin dashboard
4. Select a store
5. Navigate to Pages
6. Create a new page
7. Add sections
8. Publish the page

The system is now fully functional for managing dynamic store pages! 🎉
