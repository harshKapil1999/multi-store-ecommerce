import mongoose, { Schema, Document } from 'mongoose';
import type { Product as ProductType, Media, Attribute } from '@repo/types';

export interface IProduct extends Omit<ProductType, '_id'>, Document {}

const mediaSchema = new Schema<Media>(
  {
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    alt: {
      type: String,
    },
  },
  { _id: false }
);

const attributeSchema = new Schema<Attribute>(
  {
    name: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    isFilterable: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
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
      required: true,
    },
    featuredImage: {
      type: String,
      required: true,
    },
    mediaGallery: {
      type: [mediaSchema],
      default: [],
    },
    mrp: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    categoryId: {
      type: String,
      required: true,
      index: true,
    },
    attributes: {
      type: [attributeSchema],
      default: [],
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for store and slug
productSchema.index({ storeId: 1, slug: 1 }, { unique: true });

// Text index for search
productSchema.index({ name: 'text', description: 'text' });

export const Product = mongoose.model<IProduct>('Product', productSchema);
