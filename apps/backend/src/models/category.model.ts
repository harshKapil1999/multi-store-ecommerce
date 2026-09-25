import { createRepository, Entity } from '../db/repository';
import { CategoryTable } from '../db/schema';
import type { Category as CategoryType } from '@repo/types';

export interface ICategory extends Omit<CategoryType, '_id'>, Entity { }


export const Category = createRepository<ICategory>('Category', CategoryTable);
