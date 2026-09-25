import { createRepository, Entity } from '../db/repository';
import { TransactionTable } from '../db/schema';
import type { Transaction as TransactionType } from '@repo/types';

export interface ITransaction extends Omit<TransactionType, '_id'>, Entity { }


export const Transaction = createRepository<ITransaction>('Transaction', TransactionTable);
