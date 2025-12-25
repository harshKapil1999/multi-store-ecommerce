import mongoose, { Schema, Document } from 'mongoose';
import type { Store as StoreType } from '@repo/types';

export interface IStore extends Omit<StoreType, '_id'>, Document { }

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
      //required: true,
    },
    logo: {
      type: String,
      required: false,
    },
    owner: {
      type: String,
      index: true,
    },
    theme: {
      fontFamily: String,
    },
    navigation: [{
      label: String,
      href: String,
      categoryId: String,
      columns: [{
        title: String,
        links: [{
          label: String,
          href: String,
          categoryId: String
        }]
      }]
    }],
    footer: {
      sections: [{
        title: String,
        links: [{ label: String, href: String }]
      }],
      copyright: String,
      bottomLinks: [{ label: String, href: String }]
    },
    topBar: {
      isVisible: { type: Boolean, default: false },
      logo: String,
      text: String,
      message: String,
      links: [{ label: String, href: String, categoryId: String }],
      backgroundColor: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    homeBillboards: [{
      type: Schema.Types.ObjectId,
      ref: 'Billboard'
    }],
  },
  {
    timestamps: true,
  }
);

// Index for searching
storeSchema.index({ name: 'text', description: 'text' });

export const Store = mongoose.model<IStore>('Store', storeSchema);
