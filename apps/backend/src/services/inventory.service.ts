import type { ClientSession } from 'mongoose';
import type { OrderItem } from '@repo/types';
import { Product } from '../models/product.model';
import { ProductVariant } from '../models/variant.model';
import { AppError } from '../middleware/error-handler';

export async function changeInventory(items: OrderItem[], storeId: string, direction: -1 | 1, session: ClientSession) {
  for (const item of items) {
    const model = item.variantId ? ProductVariant : Product;
    const identity = item.variantId ? { _id: item.variantId, productId: item.productId } : { _id: item.productId, storeId };
    const result = await (model as typeof Product).updateOne(
      { ...identity, ...(direction === -1 ? { isActive: true, stock: { $gte: item.quantity } } : {}) },
      { $inc: { stock: direction * item.quantity } }, { session }
    );
    if (result.modifiedCount !== 1 && direction === -1) throw new AppError(`Insufficient inventory for ${item.name}`, 409);
  }
}
