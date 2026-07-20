import mongoose, { Document, Schema } from 'mongoose';

export interface INewsletterSubscriber extends Document {
  storeId: string;
  email: string;
  status: 'subscribed' | 'unsubscribed';
  consentAt: Date;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

const newsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    storeId: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    status: { type: String, enum: ['subscribed', 'unsubscribed'], default: 'subscribed' },
    consentAt: { type: Date, required: true, default: Date.now },
    source: { type: String, default: 'storefront_home' },
  },
  { timestamps: true }
);

newsletterSubscriberSchema.index({ storeId: 1, email: 1 }, { unique: true });

export const NewsletterSubscriber = mongoose.model<INewsletterSubscriber>(
  'NewsletterSubscriber',
  newsletterSubscriberSchema
);
