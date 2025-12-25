import mongoose, { Schema, Document } from 'mongoose';
import type { ProductVariant as ProductVariantType } from '@repo/types';

export interface IProductVariant extends Omit<ProductVariantType, '_id'>, Document { }

const productVariantSchema = new Schema<IProductVariant>(
    {
        productId: {
            type: String,
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        sku: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        images: {
            type: [String],
            default: [],
        },
        attributes: {
            type: Map,
            of: String,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for product and attributes
productVariantSchema.index({ productId: 1, attributes: 1 });

export const ProductVariant = mongoose.model<IProductVariant>('ProductVariant', productVariantSchema);
