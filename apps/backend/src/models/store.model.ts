import mongoose, { Schema, Document } from 'mongoose';
import type { Store as StoreType } from '@repo/types';

export interface IStore extends Omit<StoreType, '_id'>, Document {}

const storeSchema = new Schema<IStore>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    domain: {
      type: String,
      sparse: true,
    },
    description: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      index: true,
    },
    theme: {
      primaryColor: String,
      secondaryColor: String,
      fontFamily: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching
storeSchema.index({ name: 'text', description: 'text' });

export const Store = mongoose.model<IStore>('Store', storeSchema);
