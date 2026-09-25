import { createRepository, Entity } from '../db/repository';
import { OtpTable } from '../db/schema';

export interface IOtp extends Entity {
    attempts: number;
    email: string;
    otp: string;
    type: 'login' | 'register' | 'order_confirmation';
    expiresAt: Date;
}


export const Otp = createRepository<IOtp>('Otp', OtpTable);
