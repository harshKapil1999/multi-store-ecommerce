import { z } from 'zod';

export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Helper for optional URL fields that transforms empty strings to undefined
const optionalUrl = z.string().url().optional().or(z.literal(''));
const optionalString = z.string().optional().or(z.literal(''));
const safeHref = z.string().refine((value) => !/[\\\s]/.test(value) && !value.startsWith('//') && (/^https:\/\//i.test(value) || /^(mailto:|tel:)/i.test(value) || value.startsWith('/')), 'Use a store path, HTTPS URL, email or phone link');
const navLinkSchema = z.object({
  label: z.string().min(1),
  href: safeHref,
  categoryId: z.string().optional(),
});
const homeSectionSchema = z.object({
  id: z.string().min(1).max(80),
  type: z.enum(['featured_categories', 'category_collection', 'spotlight', 'featured_products', 'editorial_spotlight', 'newsletter']),
  title: z.string().min(1).max(120),
  subtitle: z.string().max(300).optional().or(z.literal('')),
  isVisible: z.boolean(),
  order: z.number().int().min(0),
  categoryIds: z.array(z.string()).max(24).optional(),
  productIds: z.array(z.string()).max(48).optional(),
  limit: z.number().int().min(1).max(24).optional(),
  layout: z.enum(['grid', 'carousel']).optional(),
  buttonLabel: z.string().max(60).optional().or(z.literal('')),
  consentText: z.string().max(300).optional().or(z.literal('')),
});

export const createStoreSchema = z.object({
  name: z.string().min(1, 'name is required').max(120),
  slug: z
    .string()
    .min(1, 'slug is required')
    .max(140)
    .regex(slugRegex, 'slug must be lowercase letters, numbers and hyphens only'),
  description: optionalString,
  logo: optionalUrl,
  domain: optionalString,
  commerce: z.object({
    businessName: z.string().trim().min(1).max(120), supportEmail: z.string().email().max(254),
    grievanceName: z.string().max(120).optional(), grievanceEmail: z.string().email().or(z.literal('')).optional(), gstin: z.string().max(15).optional(),
    supportPhone: z.string().max(30).optional(), businessAddress: z.string().trim().min(1).max(500),
    shippingFee: z.number().nonnegative().max(10000), freeShippingThreshold: z.number().nonnegative().max(1000000),
    codEnabled: z.boolean(), processingDays: z.number().int().min(0).max(30),
    deliveryMinDays: z.number().int().min(1).max(60), deliveryMaxDays: z.number().int().min(1).max(90),
    returnDays: z.number().int().min(1).max(365), refundDays: z.number().int().min(1).max(60),
  }).refine((value) => value.deliveryMaxDays >= value.deliveryMinDays, 'Maximum delivery days must be at least the minimum').optional(),
  seo: z.object({ title: z.string().max(70).optional(), description: z.string().max(180).optional(), image: optionalUrl }).optional(),
  theme: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      fontFamily: z.string().optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
  homeBillboards: z.array(z.string()).optional(),
  homeSections: z.array(homeSectionSchema).max(12).refine((items) => new Set(items.map((item) => item.id)).size === items.length, 'Section IDs must be unique').optional(),
  topBar: z.object({
    isVisible: z.boolean().optional(),
    logo: optionalUrl,
    text: optionalString,
    message: optionalString,
    links: z.array(navLinkSchema).optional(),
    backgroundColor: optionalString,
  }).optional(),
  footer: z.object({
    sections: z.array(z.object({ title: z.string().min(1), links: z.array(navLinkSchema) })).optional(),
    copyright: optionalString,
    bottomLinks: z.array(navLinkSchema).optional(),
  }).optional(),
  navigation: z.array(z.object({
    label: z.string().min(1),
    href: safeHref.optional(),
    categoryId: z.string().optional(),
    columns: z.array(z.object({
      title: z.string().min(1),
      links: z.array(navLinkSchema),
    })).optional(),
  })).optional(),
});

export const updateStoreSchema = createStoreSchema.partial();

export const toggleStoreSchema = z.object({
  isActive: z.boolean().optional(), // if omitted, will toggle
});

export const storeIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listStoresQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
export type ToggleStoreInput = z.infer<typeof toggleStoreSchema>;
