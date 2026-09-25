import { createRepository, Entity } from '../db/repository';
import { UserTable } from '../db/schema';
import type { User as UserType } from '@repo/types';

export interface IUser extends Omit<UserType, '_id'>, Entity {
  password: string;
  emailVerified: boolean;
}


export const User = createRepository<IUser>('User', UserTable);
