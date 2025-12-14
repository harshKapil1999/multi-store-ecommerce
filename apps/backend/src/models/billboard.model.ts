import mongoose, { Schema, Document } from 'mongoose';
import type { Billboard as BillboardType } from '@repo/types';

export interface IBillboard extends Omit<BillboardType, '_id'>, Document { }

const billboardSchema = new Schema<IBillboard>(
  {
    storeId: {
      type: String,
      required: true,
      index: true,
    },
    categoryId: {
      type: String,
      index: true,
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    ctaText: {
      type: String,
      trim: true,
    },
    ctaLink: {
      type: String,
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

// Compound index for store and order
billboardSchema.index({ storeId: 1, order: 1 });

export const Billboard = mongoose.model<IBillboard>('Billboard', billboardSchema);
