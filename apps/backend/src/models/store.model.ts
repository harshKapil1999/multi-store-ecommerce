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
      primaryColor: String,
      secondaryColor: String,
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
    homeSections: [{
      _id: false,
      id: { type: String, required: true },
      type: {
        type: String,
        required: true,
        enum: ['featured_categories', 'category_collection', 'spotlight', 'featured_products', 'newsletter'],
      },
      title: { type: String, required: true },
      subtitle: String,
      isVisible: { type: Boolean, default: true },
      order: { type: Number, default: 0 },
      categoryIds: [String],
      productIds: [String],
      limit: Number,
      layout: { type: String, enum: ['grid', 'carousel'] },
      buttonLabel: String,
      consentText: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Index for searching
storeSchema.index({ name: 'text', description: 'text' });

export const Store = mongoose.model<IStore>('Store', storeSchema);
