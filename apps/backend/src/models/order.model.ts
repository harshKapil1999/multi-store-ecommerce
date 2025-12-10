import mongoose, { Schema, Document } from 'mongoose';
import type { Order as OrderType } from '@repo/types';

export interface IOrder extends Omit<OrderType, '_id'>, Document {}

const orderSchema = new Schema<IOrder>(
  {
    storeId: {
      type: String,
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      userId: String,
      email: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      phone: String,
    },
    items: [
      {
        productId: {
          type: String,
          required: true,
        },
        variantId: String,
        name: {
          type: String,
          required: true,
        },
        sku: String,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        total: {
          type: Number,
          required: true,
        },
        image: String,
      },
    ],
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    shipping: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: String,
    shippingAddress: {
      firstName: String,
      lastName: String,
      address1: String,
      address2: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
      phone: String,
    },
    billingAddress: {
      firstName: String,
      lastName: String,
      address1: String,
      address2: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
      phone: String,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Index for customer email
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ 'customer.userId': 1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
