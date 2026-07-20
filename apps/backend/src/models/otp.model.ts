import mongoose, { Schema, Document } from 'mongoose';

export interface IOtp extends Document {
    email: string;
    otp: string;
    type: 'login' | 'register' | 'order_confirmation';
    expiresAt: Date;
}

const otpSchema = new Schema<IOtp>(
    {
        email: {
            type: String,
            required: true,
            index: true,
            lowercase: true,
            trim: true,
        },
        otp: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['login', 'register', 'order_confirmation'],
            default: 'login',
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: '10m' }, // Automatically delete after 10 minutes
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for email and type
otpSchema.index({ email: 1, type: 1 });

export const Otp = mongoose.model<IOtp>('Otp', otpSchema);
