import { createRepository, Entity } from '../db/repository';
import { BillboardTable } from '../db/schema';
import type { Billboard as BillboardType } from '@repo/types';

export interface IBillboard extends Omit<BillboardType, '_id'>, Entity { }


export const Billboard = createRepository<IBillboard>('Billboard', BillboardTable);
