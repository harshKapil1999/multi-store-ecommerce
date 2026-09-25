import { createRepository, Entity } from '../db/repository';
import { OrderTable } from '../db/schema';
import type { Order as OrderType } from '@repo/types';

export interface IOrder extends Omit<OrderType, '_id'>, Entity { }


export const Order = createRepository<IOrder>('Order', OrderTable);
