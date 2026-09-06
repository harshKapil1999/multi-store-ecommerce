import mongoose from 'mongoose';
import { z } from 'zod';
import { changeInventory } from '../services/inventory.service';
import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { Transaction } from '../models/transaction.model';
import { Order } from '../models/order.model';
import { AppError } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';
import { mailService } from '../services/mail.service';
import { finalizeCapturedPayment } from '../services/order-fulfillment.service';
import crypto from 'crypto';
import { Store } from '../models/store.model';

type WebhookRequest = Request & {
    rawBody?: string;
};

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
        const { orderId, storeId } = z.object({ orderId: z.string().regex(/^[a-f0-9]{24}$/i), storeId: z.string().regex(/^[a-f0-9]{24}$/i) }).parse(req.body);
        const order = await Order.findOne({ _id: orderId, storeId, 'customer.userId': (req as AuthRequest).user!.id });
        if (!order) throw new AppError('Order not found', 404);
        if (order.paymentMethod !== 'razorpay' || ['paid', 'refunded'].includes(order.paymentStatus) || ['cancelled', 'refunded'].includes(order.status)) throw new AppError('This order cannot accept an online payment.', 409);
        const existingTransaction = await Transaction.findOne({ orderId, storeId }).sort({ createdAt: -1 });
        if (existingTransaction) {
            return res.json({ success: true, data: { razorpayOrderId: existingTransaction.razorpayOrderId, amount: Math.round(existingTransaction.amount * 100), currency: existingTransaction.currency, transactionId: existingTransaction._id, keyId: process.env.RAZORPAY_KEY_ID } });
        }
        const claimed = await Order.findOneAndUpdate({ _id: orderId, $or: [{ paymentCreationStartedAt: { $exists: false } }, { paymentCreationStartedAt: { $lt: new Date(Date.now() - 120_000) } }] }, { $set: { paymentCreationStartedAt: new Date() } });
        if (!claimed) throw new AppError('Payment is being prepared. Please retry shortly.', 409);
        let razorpayOrder;
        let transaction;
        try {
            const notes = { orderId, storeId, orderNumber: order.orderNumber };
            razorpayOrder = await PaymentService.createOrder({ amount: order.total, currency: 'INR', receipt: order.orderNumber, notes });
            transaction = await Transaction.create({ orderId, storeId, razorpayOrderId: razorpayOrder.id, amount: order.total, currency: 'INR', status: 'created', notes });
        } finally {
            await Order.updateOne({ _id: orderId }, { $unset: { paymentCreationStartedAt: 1 } });
        }

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
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = z.object({ razorpayOrderId: z.string().regex(/^order_[a-zA-Z0-9]+$/), razorpayPaymentId: z.string().regex(/^pay_[a-zA-Z0-9]+$/), razorpaySignature: z.string().regex(/^[a-f0-9]{64}$/i) }).parse(req.body);

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

        if (!(await Order.exists({ _id: transaction.orderId, 'customer.userId': (req as AuthRequest).user!.id }))) throw new AppError('Order not found', 404);

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

        if (paymentDetails.currency !== transaction.currency) throw new AppError('Payment currency mismatch', 400);
        if (paymentDetails.status !== 'captured' && paymentDetails.captured !== true) {
            if (transaction.status === 'captured' || transaction.status === 'refunded') return res.json({ success: true, data: { orderId: transaction.orderId, state: 'already_fulfilled' } });
            if (paymentDetails.status !== 'authorized') throw new AppError('Payment has not succeeded. You can retry checkout.', 409);
            transaction.status = 'authorized';
            transaction.razorpayPaymentId = razorpayPaymentId;
            transaction.razorpaySignature = razorpaySignature;
            transaction.method = paymentDetails.method;
            transaction.email = paymentDetails.email;
            transaction.phone = String(paymentDetails.contact || '');
            await Transaction.updateOne({ _id: transaction._id, status: { $nin: ['captured', 'refunded'] } }, { $set: { status: 'authorized', razorpayPaymentId, method: paymentDetails.method } });

            return res.status(202).json({
                success: true,
                message: 'Payment is authorized and awaiting Razorpay capture confirmation.',
                data: {
                    orderId: transaction.orderId,
                    transactionId: String(transaction._id),
                    state: 'processing',
                },
            });
        }

        const fulfillment = await finalizeCapturedPayment({
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            method: paymentDetails.method,
            email: paymentDetails.email,
            phone: String(paymentDetails.contact || ''), amount: Number(paymentDetails.amount), currency: paymentDetails.currency,
        });

        if (['fulfilled', 'manual_review'].includes(fulfillment.state) && fulfillment.order) {
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
            case 'refund.processed':
            case 'refund.failed':
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

export const refundPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const transaction = await Transaction.findById(req.body.transactionId);
        if (!transaction) throw new AppError('Transaction not found', 404);
        if (req.user!.role !== 'admin' && !(await Store.exists({ _id: transaction.storeId, owner: req.user!.id }))) throw new AppError('Not authorized', 403);
        if (req.body.amount !== undefined && req.body.amount !== transaction.amount) throw new AppError('Only full refunds are supported here. Reconcile partial refunds through Razorpay.', 400);
        if (transaction.status !== 'captured' || !transaction.razorpayPaymentId) throw new AppError('Only captured payments can be refunded.', 409);
        const claim = await Transaction.findOneAndUpdate({ _id: transaction._id, refundPending: { $ne: true }, status: 'captured' }, { $set: { refundPending: true } });
        if (!claim) throw new AppError('Refund already requested. Check Razorpay before retrying.', 409);
        // Keep the claim on an ambiguous network failure: a retry could otherwise refund twice.
        let refund;
        try { refund = await PaymentService.createRefund(transaction.razorpayPaymentId, transaction.amount); }
        catch (error) {
            // A definitive provider rejection created no refund. Keep ambiguous failures locked for reconciliation.
            if (error instanceof AppError && error.statusCode === 400) await Transaction.updateOne({_id: transaction._id}, {$set:{refundPending:false, refundError:error.message}});
            throw error;
        }
        await Transaction.updateOne({_id: transaction._id}, {$unset:{refundError:1}});
        await Transaction.updateOne({ _id: transaction._id }, { $set: { refundId: refund.id } });
        await handleRefundCreated(refund);
        res.json({ success: true, message: 'Refund requested. Status updates after Razorpay confirms processing.', data: refund });
    } catch (error) { next(error); }
};

// Helper functions for webhook event handlers
async function handlePaymentCaptured(payment: any) {
    if (!(await Transaction.exists({ razorpayOrderId: payment.order_id }))) return;
    const fulfillment = await finalizeCapturedPayment({
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
        method: payment.method,
        email: payment.email,
        phone: String(payment.contact || ''), amount: Number(payment.amount), currency: payment.currency,
    });

    if (['fulfilled', 'manual_review'].includes(fulfillment.state) && fulfillment.order) {
        try {
            await mailService.sendOrderConfirmation(fulfillment.order.customer.email, fulfillment.order);
        } catch (error) {
            console.error('Error sending order confirmation email:', error);
        }
    }
}

async function handlePaymentFailed(payment: any) {
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const transaction = await Transaction.findOneAndUpdate({ razorpayOrderId: payment.order_id, status: { $in: ['created', 'failed'] } }, { $set: { status: 'failed', errorCode: payment.error_code, errorDescription: payment.error_description } }, { new: true, session });
            if (transaction) await Order.updateOne({ _id: transaction.orderId, paymentStatus: { $in: ['pending', 'failed'] } }, { $set: { paymentStatus: 'failed' } }, { session });
        });
    } finally { await session.endSession(); }
}

async function handleRefundCreated(refund: any) {
    const transaction = await Transaction.findOne({ razorpayPaymentId: refund.payment_id });
    if (!transaction || transaction.status === 'refunded') return;
    // Provider lookup reconciles the total across partial refunds and out-of-order events.
    const payment = await PaymentService.fetchPayment(refund.payment_id);
    const fullRefund = payment.refund_status === 'full' && Number(payment.amount_refunded) >= Math.round(transaction.amount * 100);
    if (!fullRefund) {
        await Transaction.updateOne({ _id: transaction._id }, { $set: { refundPending: !['failed', 'processed'].includes(refund.status), refundId: refund.id } });
        return;
    }
    const session = await mongoose.startSession();
    let updatedOrder: InstanceType<typeof Order> | null = null;
    try {
        await session.withTransaction(async () => {
            updatedOrder = null;
            const changed = await Transaction.updateOne({ _id: transaction._id, status: { $ne: 'refunded' } }, { $set: { status: 'refunded', refundPending: false, refundId: refund.id } }, { session });
            if (!changed.modifiedCount) return;
            const currentOrder = await Order.findById(transaction.orderId).session(session);
            if (!currentOrder) throw new AppError('Order not found', 404);
            const release = currentOrder.inventoryStatus === 'committed' && ['pending', 'confirmed', 'processing'].includes(currentOrder.status);
            if (release) await changeInventory(currentOrder.items, currentOrder.storeId, 1, session);
            updatedOrder = await Order.findByIdAndUpdate(transaction.orderId, { $set: { status: 'refunded', paymentStatus: 'refunded', ...(release ? {inventoryStatus: 'released'} : {}) }, $push: { statusHistory: { status: 'refunded', at: new Date(), note: 'Razorpay confirmed the full refund.' } } }, { session, new: true });
        });
    } finally { await session.endSession(); }
    if (updatedOrder) {
        const order = updatedOrder as InstanceType<typeof Order>;
        try { await mailService.sendOrderStatusUpdate(order.customer.email, order, 'cancelled'); } catch { console.error('Refund notification failed', { orderId: String(order._id) }); }
    }
}
