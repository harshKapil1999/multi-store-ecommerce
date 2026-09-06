import { z } from 'zod';
const money = z.number().finite().nonnegative().max(10000000).refine(v => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001, 'Use at most two decimal places');
export const variantSchema = z.object({
  name: z.string().trim().min(1).max(200), sku: z.string().trim().min(1).max(100),
  price: money, compareAtPrice: money.optional(), stock: z.number().int().nonnegative().max(1000000),
  attributes: z.record(z.string().max(80), z.string().min(1).max(200)),
  images: z.array(z.string().url().startsWith('https://')).max(20).optional(),
  featuredImageIndex: z.number().int().nonnegative().max(19).optional(), isActive: z.boolean().optional()
});
export const updateVariantSchema = variantSchema.partial();
export const bulkVariantSchema = z.object({ variants: z.array(variantSchema).min(1).max(100) });
