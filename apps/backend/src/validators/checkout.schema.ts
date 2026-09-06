import { z } from 'zod';
export const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid record ID');
const text = z.string().trim().min(1).max(120);
const address = z.object({
  firstName: text, lastName: z.string().trim().max(120).default(''),
  addressLine1: z.string().trim().min(5).max(300), addressLine2: z.string().trim().max(300).optional(),
  city: text, state: text, pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Enter a valid Indian PIN code'), country: z.literal('India'),
});
export const checkoutSchema = z.object({
  storeId: objectId,
  items: z.array(z.object({ productId: objectId, variantId: objectId.optional(), quantity: z.number().int().min(1).max(20) })).min(1).max(50),
  customer: z.object({ firstName: text, lastName: z.string().trim().max(120).default(''), email: z.string().trim().email().toLowerCase(), phone: z.string().trim().regex(/^(?:\+91[ -]?)?[6-9]\d{9}$/, 'Enter a valid Indian mobile number') }),
  shippingAddress: address, billingAddress: address,
  paymentMethod: z.enum(['cod', 'razorpay']), checkoutKey: z.string().uuid(),
});
