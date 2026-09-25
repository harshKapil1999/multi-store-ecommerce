import { createRepository, Entity } from '../db/repository';
import { ProductTable } from '../db/schema';
import type { Product as ProductType, Media, Attribute } from '@repo/types';

export interface IProduct extends Omit<ProductType, '_id'>, Entity { }


export const Product = createRepository<IProduct>('Product', ProductTable);
