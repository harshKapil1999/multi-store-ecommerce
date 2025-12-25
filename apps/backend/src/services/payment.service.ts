import { getRazorpayInstance } from '../config/razorpay.config';
import crypto from 'crypto';
import { AppError } from '../middleware/error-handler';

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
        try {
            const order = await getRazorpayInstance().orders.create({
                amount: params.amount * 100, // Convert to paise
                currency: params.currency || 'INR',
                receipt: params.receipt,
                notes: params.notes,
            });

            return order;
        } catch (error: any) {
            throw new AppError(`Razorpay order creation failed: ${error.message}`, 500);
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

            return generatedSignature === signature;
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
        } catch (error: any) {
            throw new AppError(`Failed to fetch payment: ${error.message}`, 500);
        }
    }

    /**
     * Create a refund
     */
    static async createRefund(paymentId: string, amount?: number) {
        try {
            const refund = await getRazorpayInstance().payments.refund(paymentId, {
                amount: amount ? amount * 100 : undefined, // Convert to paise if provided
            });
            return refund;
        } catch (error: any) {
            throw new AppError(`Refund failed: ${error.message}`, 500);
        }
    }

    /**
     * Fetch refund details
     */
    static async fetchRefund(refundId: string) {
        try {
            const refund = await getRazorpayInstance().refunds.fetch(refundId);
            return refund;
        } catch (error: any) {
            throw new AppError(`Failed to fetch refund: ${error.message}`, 500);
        }
    }
}
