import mongoose, { Schema, Document } from 'mongoose';
import type { User as UserType } from '@repo/types';

export interface IUser extends Omit<UserType, '_id'>, Document {
  password: string;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'store_owner'],
      default: 'customer',
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
