import mongoose, { Schema, Document } from 'mongoose';

export interface IOtp extends Document {
    attempts: number;
    email: string;
    otp: string;
    type: 'login' | 'register' | 'order_confirmation';
    expiresAt: Date;
}

const otpSchema = new Schema<IOtp>(
    {
        attempts: { type: Number, default: 0 },
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
            index: { expires: 0 }, // Automatically delete after 10 minutes
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for email and type
otpSchema.index({ email: 1, type: 1 }, { unique: true });

export const Otp = mongoose.model<IOtp>('Otp', otpSchema);
