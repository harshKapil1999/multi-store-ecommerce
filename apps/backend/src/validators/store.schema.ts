import { z } from 'zod';

export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Helper for optional URL fields that transforms empty strings to undefined
const optionalUrl = z.string().url().optional().or(z.literal('')).transform(val => val === '' ? undefined : val);
const optionalString = z.string().optional().or(z.literal('')).transform(val => val === '' ? undefined : val);

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