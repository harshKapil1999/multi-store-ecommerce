import { z } from 'zod';

export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Helper for optional URL fields that transforms empty strings to undefined
const optionalUrl = z.string().url().optional().or(z.literal('')).transform(val => val === '' ? undefined : val);
const optionalString = z.string().optional().or(z.literal('')).transform(val => val === '' ? undefined : val);

// Billboard Schemas
export const createBillboardSchema = z.object({
  title: z.string().min(1, 'title is required').max(200),
  subtitle: optionalString,
  imageUrl: z.string().url('imageUrl must be a valid URL'),
  ctaText: optionalString,
  ctaLink: optionalUrl,
  order: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const updateBillboardSchema = createBillboardSchema.partial();

export const reorderBillboardsSchema = z.object({
  billboards: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().nonnegative(),
    })
  ),
});

export type CreateBillboardInput = z.infer<typeof createBillboardSchema>;
export type UpdateBillboardInput = z.infer<typeof updateBillboardSchema>;

// Category Schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'name is required').max(120),
  slug: z
    .string()
    .min(1, 'slug is required')
    .max(140)
    .regex(slugRegex, 'slug must be lowercase letters, numbers and hyphens only'),
  description: optionalString,
  imageUrl: optionalUrl,
  parentId: z.string().optional(),
  isFeatured: z.boolean().optional(),
  order: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// Product Media and Attribute Schemas
export const mediaSchema = z.object({
  url: z.string().url(),
  type: z.enum(['image', 'video']),
  mimeType: z.string(),
  order: z.number().int().nonnegative(),
  alt: z.string().optional(),
});

export const attributeSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
  isFilterable: z.boolean().optional(),
});

// Product Schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'name is required').max(200),
  slug: z
    .string()
    .min(1, 'slug is required')
    .max(140)
    .regex(slugRegex, 'slug must be lowercase letters, numbers and hyphens only'),
  description: optionalString,
  featuredImage: z.string().url('featuredImage must be a valid URL'),
  mediaGallery: z.array(mediaSchema).optional(),
  mrp: z.number().positive('mrp must be greater than 0'),
  sellingPrice: z.number().positive('sellingPrice must be greater than 0'),
  categoryId: z.string().min(1, 'categoryId is required'),
  attributes: z.array(attributeSchema).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  stock: z.number().int().nonnegative().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const updateStockSchema = z.object({
  stock: z.number().int().nonnegative('stock must be non-negative'),
});

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  isFeatured: z.coerce.boolean().optional(),
  sortBy: z.enum(['createdAt', 'name', 'sellingPrice']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
