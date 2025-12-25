import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { Transaction } from '../models/transaction.model';
import { Order } from '../models/order.model';
import { AppError } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

export const createRazorpayOrder = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { amount, currency, orderId, storeId, notes } = req.body;

        if (!amount || amount <= 0) {
            throw new AppError('Invalid amount', 400);
        }

        // Create Razorpay order
        const razorpayOrder = await PaymentService.createOrder({
            amount,
            currency: currency || 'INR',
            receipt: orderId,
            notes,
        });

        // Create transaction record
        const transaction = await Transaction.create({
            orderId,
            storeId,
            razorpayOrderId: razorpayOrder.id,
            amount,
            currency: currency || 'INR',
            status: 'created',
            notes,
        });

        res.status(201).json({
            success: true,
            data: {
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                transactionId: transaction._id,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const verifyPayment = async (
    req: AuthRequest,
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

        // Update transaction
        const transaction = await Transaction.findOne({ razorpayOrderId });
        if (!transaction) {
            throw new AppError('Transaction not found', 404);
        }

        transaction.razorpayPaymentId = razorpayPaymentId;
        transaction.razorpaySignature = razorpaySignature;
        transaction.status = 'captured';

        // Fetch payment details from Razorpay
        try {
            const paymentDetails = await PaymentService.fetchPayment(razorpayPaymentId);
            transaction.method = paymentDetails.method;
            transaction.email = paymentDetails.email;
            transaction.phone = String(paymentDetails.contact || '');
        } catch (error) {
            // Continue even if fetch fails
        }

        await transaction.save();

        // Update order payment status
        const order = await Order.findById(transaction.orderId);
        if (order) {
            order.paymentStatus = 'paid';
            order.transactionId = String(transaction._id);
            order.razorpayOrderId = razorpayOrderId;
            await order.save();
        }

        res.json({
            success: true,
            message: 'Payment verified successfully',
            data: {
                orderId: transaction.orderId,
                transactionId: String(transaction._id),
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
        const webhookSignature = req.headers['x-razorpay-signature'] as string;
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            throw new AppError('Webhook secret not configured', 500);
        }

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (webhookSignature !== expectedSignature) {
            throw new AppError('Invalid webhook signature', 400);
        }

        const event = req.body.event;
        const payload = req.body.payload;

        // Handle different events
        switch (event) {
            case 'payment.captured':
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
    const transaction = await Transaction.findOne({
        razorpayOrderId: payment.order_id,
    });

    if (transaction) {
        transaction.razorpayPaymentId = payment.id;
        transaction.status = 'captured';
        transaction.method = payment.method;
        transaction.email = payment.email;
        transaction.phone = payment.contact;
        await transaction.save();

        const order = await Order.findById(transaction.orderId);
        if (order) {
            order.paymentStatus = 'paid';
            order.transactionId = String(transaction._id);
            await order.save();
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
