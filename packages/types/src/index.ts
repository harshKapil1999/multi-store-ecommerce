// User Types
export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin' | 'store_owner';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser extends User {
  token: string;
}

// Store Types
export interface Store {
  _id: string;
  name: string;
  slug: string;
  domain?: string; // Custom domain
  description: string;
  logo: string; // Cloudflare R2 URL
  owner?: string; // User ID (optional for backwards compatibility)
  theme?: StoreTheme;
  navigation?: NavItem[];
  footer?: FooterConfig;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  homeBillboards?: Billboard[]; // Populated
}

export interface StoreTheme {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

export interface NavLink {
  label: string;
  href: string;
  categoryId?: string;
}

export interface NavColumn {
  title: string;
  links: NavLink[];
}

export interface NavItem {
  label: string;
  href?: string;
  categoryId?: string;
  columns?: NavColumn[];
}

export interface FooterSection {
  title: string;
  links: NavLink[];
}

export interface FooterConfig {
  sections: FooterSection[];
  copyright: string;
  bottomLinks: NavLink[];
}

// Billboard Types
export interface Billboard {
  _id: string;
  storeId: string; // Reference to Store
  categoryId?: string; // Optional reference to Category
  title: string;
  subtitle?: string;
  imageUrl: string; // Cloudflare R2 URL
  ctaText?: string;
  ctaLink?: string;
  order: number; // Display order
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Media Types
export interface Media {
  url: string; // Cloudflare R2 URL
  type: 'image' | 'video';
  mimeType: string; // image/png, image/jpg, image/webp, video/mp4
  order: number;
  alt?: string;
}

// Attribute Types
export interface Attribute {
  name: string; // Size, Color, Brand, Gender, etc.
  value: string; // Large, Red, Nike, Unisex, etc.
  isFilterable: boolean;
}

// Product Types
export interface Product {
  _id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string;
  featuredImage: string; // Cloudflare R2 URL
  mediaGallery: Media[];
  mrp: number; // Maximum Retail Price
  sellingPrice: number;
  categoryId: string;
  attributes: Attribute[];
  isFeatured: boolean;
  isActive: boolean;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  _id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  inventory: number;
  attributes: Record<string, string>; // e.g., { size: 'M', color: 'Blue' }
}

// Category Types
export interface Category {
  _id: string;
  storeId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string; // Cloudflare R2 URL
  parentId?: string;
  isFeatured: boolean;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  billboards?: Billboard[]; // Populated
}

export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

// Order Types
export interface Order {
  _id: string;
  storeId: string;
  orderNumber: string;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  shippingAddress: Address;
  billingAddress: Address;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  sku?: string;
  quantity: number;
  price: number;
  total: number;
  image?: string;
}

export interface OrderCustomer {
  userId?: string;
  email: string;
  name: string;
  phone?: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Address {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone?: string;
}

// Cart Types
export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  product?: Product;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Store API Input/Output Types
export interface CreateStoreRequest {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  theme?: Partial<StoreTheme>;
  isActive?: boolean;
}

export interface UpdateStoreRequest {
  name?: string;
  slug?: string;
  description?: string;
  logo?: string;
  theme?: Partial<StoreTheme>;
  isActive?: boolean;
}

export interface ToggleStoreRequest {
  isActive?: boolean; // if omitted, server toggles
}

export interface ToggleStoreResponse {
  _id: string;
  isActive: boolean;
}

// Billboard API Input Types
export interface CreateBillboardInput {
  title: string;
  subtitle?: string;
  imageUrl: string;
  categoryId?: string;
  ctaText?: string;
  ctaLink?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateBillboardInput {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  categoryId?: string;
  ctaText?: string;
  ctaLink?: string;
  order?: number;
  isActive?: boolean;
}

// Category API Input Types
export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isFeatured?: boolean;
  order?: number;
  isActive?: boolean;
  billboards?: string[];
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isFeatured?: boolean;
  order?: number;
  isActive?: boolean;
  billboards?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Query Parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductFilters extends PaginationParams {
  storeId?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  isFeatured?: boolean;
  isActive?: boolean;
}

// Product API Input Types (from validators)
export interface CreateProductInput {
  name: string;
  slug: string;
  description: string;
  featuredImage: string;
  mediaGallery?: Media[];
  mrp: number;
  sellingPrice: number;
  categoryId: string;
  attributes?: Attribute[];
  isFeatured?: boolean;
  isActive?: boolean;
  stock?: number;
}

export interface UpdateProductInput {
  name?: string;
  slug?: string;
  description?: string;
  featuredImage?: string;
  mediaGallery?: Media[];
  mrp?: number;
  sellingPrice?: number;
  categoryId?: string;
  attributes?: Attribute[];
  isFeatured?: boolean;
  isActive?: boolean;
  stock?: number;
}

export interface UpdateStockInput {
  stock: number;
}

export interface OrderFilters extends PaginationParams {
  storeId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

// File Upload Types
export interface UploadedFile {
  url: string;
  key: string;
  filename: string;
  size: number;
  contentType: string;
}

// Page Types
export type SectionType = 'hero' | 'billboard' | 'featured_products' | 'featured_categories' | 'product_grid' | 'category_grid' | 'text_content' | 'custom_html';

export interface PageSection {
  _id: string;
  type: SectionType;
  title?: string;
  order: number;
  isVisible: boolean;

  // Billboard Section
  billboardId?: string;

  // Featured Products Section
  productIds?: string[];
  productsLimit?: number;
  showFeaturedOnly?: boolean;
  categoryFilter?: string;

  // Featured Categories Section
  categoryIds?: string[];
  categoriesLimit?: number;

  // Text Content Section
  content?: string;

  // Custom HTML Section
  html?: string;

  // Layout options
  layout?: 'grid' | 'carousel' | 'list' | 'masonry';
  columns?: number;
  backgroundColor?: string;
  padding?: string;
}

export interface Page {
  _id: string;
  storeId: string;
  title: string;
  slug: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished: boolean;
  isHomePage: boolean;
  sections: PageSection[];
  createdAt: Date;
  updatedAt: Date;
}

// Page API Input Types
export interface CreatePageInput {
  title: string;
  slug: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean;
  isHomePage?: boolean;
  sections?: Omit<PageSection, '_id'>[];
}

export interface UpdatePageInput {
  title?: string;
  slug?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean;
  isHomePage?: boolean;
  sections?: Omit<PageSection, '_id'>[];
}

export interface AddPageSectionInput {
  type: SectionType;
  title?: string;
  order?: number;
  isVisible?: boolean;
  billboardId?: string;
  productIds?: string[];
  productsLimit?: number;
  showFeaturedOnly?: boolean;
  categoryFilter?: string;
  categoryIds?: string[];
  categoriesLimit?: number;
  content?: string;
  html?: string;
  layout?: 'grid' | 'carousel' | 'list' | 'masonry';
  columns?: number;
  backgroundColor?: string;
  padding?: string;
}

export interface UpdatePageSectionInput extends Partial<AddPageSectionInput> {
  _id: string;
}
