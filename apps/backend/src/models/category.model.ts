import mongoose, { Schema, Document } from 'mongoose';
import type { Category as CategoryType } from '@repo/types';

export interface ICategory extends Omit<CategoryType, '_id'>, Document {}

const categorySchema = new Schema<ICategory>(
  {
    storeId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    parentId: {
      type: String,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
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

// Compound index for store and slug
categorySchema.index({ storeId: 1, slug: 1 }, { unique: true });

export const Category = mongoose.model<ICategory>('Category', categorySchema);
