import { z } from 'zod';

export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Helper for optional URL fields that transforms empty strings to undefined
const optionalUrl = z.string().url().optional().or(z.literal('')).transform(val => val === '' ? undefined : val);
const optionalString = z.string().optional().or(z.literal('')).transform(val => val === '' ? undefined : val);
const navLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  categoryId: z.string().optional(),
});
const homeSectionSchema = z.object({
  id: z.string().min(1).max(80),
  type: z.enum(['featured_categories', 'category_collection', 'spotlight', 'featured_products', 'newsletter']),
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
  theme: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      fontFamily: z.string().optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
  homeBillboards: z.array(z.string()).optional(),
  homeSections: z.array(homeSectionSchema).max(12).optional(),
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
    href: z.string().optional(),
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
