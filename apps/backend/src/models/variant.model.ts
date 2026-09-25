import { createRepository, Entity } from '../db/repository';
import { ProductVariantTable } from '../db/schema';
import type { ProductVariant as ProductVariantType } from '@repo/types';

export interface IProductVariant extends Omit<ProductVariantType, '_id'>, Entity { }


export const ProductVariant = createRepository<IProductVariant>('ProductVariant', ProductVariantTable);
