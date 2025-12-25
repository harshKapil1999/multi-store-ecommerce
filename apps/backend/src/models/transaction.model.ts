import mongoose, { Schema, Document } from 'mongoose';
import type { Transaction as TransactionType } from '@repo/types';

export interface ITransaction extends Omit<TransactionType, '_id'>, Document { }

const transactionSchema = new Schema<ITransaction>(
    {
        orderId: {
            type: String,
            required: true,
            index: true,
        },
        storeId: {
            type: String,
            required: true,
            index: true,
        },
        razorpayOrderId: {
            type: String,
            required: true,
            unique: true,
        },
        razorpayPaymentId: {
            type: String,
            sparse: true,
        },
        razorpaySignature: {
            type: String,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            required: true,
            default: 'INR',
        },
        status: {
            type: String,
            enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
            default: 'created',
            index: true,
        },
        method: {
            type: String,
        },
        email: {
            type: String,
        },
        phone: {
            type: String,
        },
        notes: {
            type: Map,
            of: String,
        },
        errorCode: {
            type: String,
        },
        errorDescription: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Index for payment ID
transactionSchema.index({ razorpayPaymentId: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
