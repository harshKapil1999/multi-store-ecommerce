import { createRepository, Entity } from '../db/repository';
import { StoreTable } from '../db/schema';
import type { Store as StoreType } from '@repo/types';

export interface IStore extends Omit<StoreType, '_id'>, Entity { }


export const Store = createRepository<IStore>('Store', StoreTable);
