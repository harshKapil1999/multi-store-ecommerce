import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { Transaction } from '../models/transaction.model';
import { Order } from '../models/order.model';
import { AppError } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';
import { mailService } from '../services/mail.service';
import { finalizeCapturedPayment } from '../services/order-fulfillment.service';
import crypto from 'crypto';

type WebhookRequest = Request & {
    rawBody?: string;
};

const normalizeNotes = (notes: Record<string, unknown> | undefined, order: InstanceType<typeof Order>) => ({
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    storeId: order.storeId,
    ...Object.fromEntries(
        Object.entries(notes || {}).map(([key, value]) => [key, String(value)])
    ),
});

const signaturesMatch = (received: string | undefined, expected: string) => {
    if (!received) return false;

    const receivedBuffer = Buffer.from(received, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');

    return receivedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
};

export const createRazorpayOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { currency, orderId, storeId, notes } = req.body;

        if (!orderId || !storeId) {
            throw new AppError('Order and store are required to start payment', 400);
        }

        const order = await Order.findOne({ _id: orderId, storeId });
        if (!order) {
            throw new AppError('Order not found', 404);
        }

        if (order.paymentStatus === 'paid') {
            throw new AppError('Order has already been paid', 409);
        }

        const existingTransaction = await Transaction.findOne({
            orderId,
            storeId,
            status: { $in: ['created', 'authorized'] },
        }).sort({ createdAt: -1 });

        if (existingTransaction) {
            return res.status(200).json({
                success: true,
                data: {
                    razorpayOrderId: existingTransaction.razorpayOrderId,
                    amount: Math.round(order.total * 100),
                    currency: existingTransaction.currency,
                    transactionId: existingTransaction._id,
                    keyId: process.env.RAZORPAY_KEY_ID,
                },
            });
        }

        const razorpayOrder = await PaymentService.createOrder({
            amount: order.total,
            currency: currency || 'INR',
            receipt: order.orderNumber,
            notes: normalizeNotes(notes, order),
        });

        // Create transaction record
        const transaction = await Transaction.create({
            orderId,
            storeId,
            razorpayOrderId: razorpayOrder.id,
            amount: order.total,
            currency: currency || 'INR',
            status: 'created',
            notes: normalizeNotes(notes, order),
        });

        res.status(201).json({
            success: true,
            data: {
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                transactionId: transaction._id,
                keyId: process.env.RAZORPAY_KEY_ID,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const verifyPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            throw new AppError('Missing payment verification parameters', 400);
        }

        // Verify signature
        const isValid = PaymentService.verifyPaymentSignature({
            orderId: razorpayOrderId,
            paymentId: razorpayPaymentId,
            signature: razorpaySignature,
        });

        if (!isValid) {
            throw new AppError('Invalid payment signature', 400);
        }

        const transaction = await Transaction.findOne({ razorpayOrderId });
        if (!transaction) {
            throw new AppError('Transaction not found', 404);
        }

        // Fetch payment details from Razorpay
        let paymentDetails;
        try {
            paymentDetails = await PaymentService.fetchPayment(razorpayPaymentId);
        } catch (error) {
            throw new AppError('Payment could not be verified with Razorpay', 502);
        }

        if (paymentDetails.order_id !== razorpayOrderId) {
            throw new AppError('Payment does not belong to this Razorpay order', 400);
        }

        if (paymentDetails.amount !== Math.round(transaction.amount * 100)) {
            throw new AppError('Payment amount does not match the transaction amount', 400);
        }

        if (paymentDetails.status !== 'captured' && paymentDetails.captured !== true) {
            throw new AppError('Payment is not captured yet', 409);
        }

        const fulfillment = await finalizeCapturedPayment({
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            method: paymentDetails.method,
            email: paymentDetails.email,
            phone: String(paymentDetails.contact || ''),
        });

        if (fulfillment.state === 'fulfilled' && fulfillment.order) {
            try {
                await mailService.sendOrderConfirmation(fulfillment.order.customer.email, fulfillment.order);
            } catch (error) {
                console.error('Error sending order confirmation email:', error);
            }
        }

        res.json({
            success: true,
            message: fulfillment.state === 'manual_review'
                ? 'Payment verified. Order is awaiting inventory reconciliation.'
                : 'Payment verified successfully',
            data: {
                orderId: transaction.orderId,
                transactionId: String(transaction._id),
                state: fulfillment.state,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const handleWebhook = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const webhookSignature = req.headers['x-razorpay-signature'] as string | undefined;
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const rawBody = (req as WebhookRequest).rawBody;

        if (!webhookSecret) {
            throw new AppError('Webhook secret not configured', 500);
        }

        if (!rawBody) {
            throw new AppError('Webhook raw payload was not captured', 400);
        }

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex');

        if (!signaturesMatch(webhookSignature, expectedSignature)) {
            throw new AppError('Invalid webhook signature', 400);
        }

        const event = req.body.event;
        const payload = req.body.payload;

        // Handle different events
        switch (event) {
            case 'payment.captured':
                await handlePaymentCaptured(payload.payment.entity);
                break;
            case 'order.paid':
                await handlePaymentCaptured(payload.payment.entity);
                break;
            case 'payment.failed':
                await handlePaymentFailed(payload.payment.entity);
                break;
            case 'refund.created':
                await handleRefundCreated(payload.refund.entity);
                break;
            default:
                console.log(`Unhandled webhook event: ${event}`);
        }

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

export const refundPayment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { transactionId, amount } = req.body;

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            throw new AppError('Transaction not found', 404);
        }

        if (!transaction.razorpayPaymentId) {
            throw new AppError('No payment to refund', 400);
        }

        // Create refund
        const refund = await PaymentService.createRefund(
            transaction.razorpayPaymentId,
            amount
        );

        transaction.status = 'refunded';
        await transaction.save();

        // Update order
        const order = await Order.findById(transaction.orderId);
        if (order) {
            order.paymentStatus = 'refunded';
            order.status = 'refunded';
            await order.save();
        }

        res.json({
            success: true,
            message: 'Refund initiated successfully',
            data: refund,
        });
    } catch (error) {
        next(error);
    }
};

// Helper functions for webhook event handlers
async function handlePaymentCaptured(payment: any) {
    const fulfillment = await finalizeCapturedPayment({
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
        method: payment.method,
        email: payment.email,
        phone: String(payment.contact || ''),
    });

    if (fulfillment.state === 'fulfilled' && fulfillment.order) {
        try {
            await mailService.sendOrderConfirmation(fulfillment.order.customer.email, fulfillment.order);
        } catch (error) {
            console.error('Error sending order confirmation email:', error);
        }
    }
}

async function handlePaymentFailed(payment: any) {
    const transaction = await Transaction.findOne({
        razorpayOrderId: payment.order_id,
    });

    if (transaction) {
        transaction.status = 'failed';
        transaction.errorCode = payment.error_code;
        transaction.errorDescription = payment.error_description;
        await transaction.save();

        const order = await Order.findById(transaction.orderId);
        if (order) {
            order.paymentStatus = 'failed';
            await order.save();
        }
    }
}

async function handleRefundCreated(refund: any) {
    const transaction = await Transaction.findOne({
        razorpayPaymentId: refund.payment_id,
    });

    if (transaction) {
        transaction.status = 'refunded';
        await transaction.save();

        const order = await Order.findById(transaction.orderId);
        if (order) {
            order.paymentStatus = 'refunded';
            order.status = 'refunded';
            await order.save();
        }
    }
}
