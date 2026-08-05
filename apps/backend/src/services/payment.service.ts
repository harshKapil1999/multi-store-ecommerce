import { getRazorpayInstance } from '../config/razorpay.config';
import crypto from 'crypto';
import { AppError } from '../middleware/error-handler';

type RazorpayError = {
    statusCode?: number;
    error?: {
        code?: string;
        description?: string;
        reason?: string;
        field?: string;
    };
    message?: string;
};

function getRazorpayErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (error && typeof error === 'object') {
        const razorpayError = error as RazorpayError;
        const details = razorpayError.error;
        const message = details?.description || details?.reason || razorpayError.message;

        if (message) {
            return details?.field ? `${message} (${details.field})` : message;
        }

        if (details?.code) {
            return details.code;
        }

        if (razorpayError.statusCode) {
            return `Razorpay returned HTTP ${razorpayError.statusCode}`;
        }
    }

    return 'Razorpay did not provide an error message';
}

export class PaymentService {
    /**
     * Create a Razorpay order
     */
    static async createOrder(params: {
        amount: number;
        currency?: string;
        receipt?: string;
        notes?: Record<string, string>;
    }) {
        const amountInPaise = Math.round(Number(params.amount) * 100);

        if (!Number.isSafeInteger(amountInPaise) || amountInPaise < 100) {
            throw new AppError('The order total must be at least ₹1.00', 400);
        }

        try {
            const order = await getRazorpayInstance().orders.create({
                amount: amountInPaise,
                currency: params.currency || 'INR',
                receipt: params.receipt?.slice(0, 40),
                notes: params.notes,
            });

            return order;
        } catch (error) {
            throw new AppError(`Razorpay order creation failed: ${getRazorpayErrorMessage(error)}`, 502);
        }
    }

    /**
     * Verify Razorpay payment signature
     */
    static verifyPaymentSignature(params: {
        orderId: string;
        paymentId: string;
        signature: string;
    }): boolean {
        try {
            const { orderId, paymentId, signature } = params;

            const generatedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
                .update(`${orderId}|${paymentId}`)
                .digest('hex');

            const generatedBuffer = Buffer.from(generatedSignature, 'hex');
            const receivedBuffer = Buffer.from(signature, 'hex');

            return generatedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(generatedBuffer, receivedBuffer);
        } catch (error) {
            return false;
        }
    }

    /**
     * Fetch payment details from Razorpay
     */
    static async fetchPayment(paymentId: string) {
        try {
            const payment = await getRazorpayInstance().payments.fetch(paymentId);
            return payment;
        } catch (error) {
            throw new AppError(`Failed to fetch payment: ${getRazorpayErrorMessage(error)}`, 502);
        }
    }

    /**
     * Create a refund
     */
    static async createRefund(paymentId: string, amount?: number) {
        try {
            const refund = await getRazorpayInstance().payments.refund(paymentId, {
                amount: amount ? Math.round(amount * 100) : undefined, // Convert to paise if provided
            });
            return refund;
        } catch (error) {
            throw new AppError(`Refund failed: ${getRazorpayErrorMessage(error)}`, 502);
        }
    }

    /**
     * Fetch refund details
     */
    static async fetchRefund(refundId: string) {
        try {
            const refund = await getRazorpayInstance().refunds.fetch(refundId);
            return refund;
        } catch (error) {
            throw new AppError(`Failed to fetch refund: ${getRazorpayErrorMessage(error)}`, 502);
        }
    }
}
