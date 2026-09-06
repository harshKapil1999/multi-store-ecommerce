import { z } from 'zod';
import { objectId } from './checkout.schema';
const optionalText = z.string().max(20000).optional();
export const pageSectionSchema = z.object({
  _id: objectId.optional(), type: z.enum(['hero','billboard','featured_products','featured_categories','product_grid','category_grid','text_content','custom_html']),
  title: z.string().max(200).optional(), order: z.number().int().nonnegative().optional(), isVisible: z.boolean().optional(),
  billboardId: objectId.optional(), productIds: z.array(objectId).max(100).optional(), categoryIds: z.array(objectId).max(100).optional(),
  productsLimit: z.number().int().min(1).max(100).optional(), categoriesLimit: z.number().int().min(1).max(100).optional(),
  showFeaturedOnly: z.boolean().optional(), categoryFilter: objectId.optional(), content: optionalText, html: optionalText,
  layout: z.enum(['grid','carousel','list','masonry']).optional(), columns: z.number().int().min(1).max(6).optional(),
  backgroundColor: z.string().regex(/^#[a-f0-9]{3,8}$/i).optional(), padding: z.string().max(30).optional(),
});
export const createPageSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(140).refine((slug) => !['account','bag','checkout','wishlist','search','products','product','category','order-success','track-order'].includes(slug), 'This route is reserved'),
  description: z.string().max(500).optional(), metaTitle: z.string().max(70).optional(), metaDescription: z.string().max(180).optional(),
  isPublished: z.boolean().optional(), isHomePage: z.boolean().optional(), sections: z.array(pageSectionSchema).max(30).optional(),
});
