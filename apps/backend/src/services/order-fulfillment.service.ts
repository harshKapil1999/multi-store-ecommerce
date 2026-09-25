import { startSession } from '../config/database';
import { AppError } from '../middleware/error-handler';
import { Order } from '../models/order.model';
import { Transaction } from '../models/transaction.model';
import { changeInventory } from './inventory.service';

type FulfillmentResult = {
  order: InstanceType<typeof Order> | null;
  transaction: InstanceType<typeof Transaction>;
  state: 'fulfilled' | 'already_fulfilled' | 'processing' | 'manual_review';
};

export async function finalizeCapturedPayment(params: {
  razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature?: string;
  method?: string; email?: string; phone?: string; amount?: number; currency?: string;
}): Promise<FulfillmentResult> {
  const session = await startSession();
  let result: FulfillmentResult | undefined;
  try {
    const apply = async (review: boolean) => {
      const transaction = await Transaction.findOne({ razorpayOrderId: params.razorpayOrderId }).session(session);
      if (!transaction) throw new AppError('Transaction not found', 404);
      if (params.amount !== undefined && params.amount !== Math.round(transaction.amount * 100)) throw new AppError('Payment amount mismatch', 400);
      if (params.currency && params.currency !== transaction.currency) throw new AppError('Payment currency mismatch', 400);
      const order = await Order.findById(transaction.orderId).session(session);
      if (!order) throw new AppError('Order not found', 404);
      if (transaction.status === 'refunded' || order.paymentStatus === 'refunded') {
        result = { order, transaction, state: 'already_fulfilled' }; return;
      }
      if (transaction.razorpayPaymentId && transaction.status === 'captured' && transaction.razorpayPaymentId !== params.razorpayPaymentId) throw new AppError('Unexpected second payment. Contact support.', 409);
      transaction.status = 'captured';
      transaction.razorpayPaymentId = params.razorpayPaymentId;
      if (params.razorpaySignature) transaction.razorpaySignature = params.razorpaySignature;
      if (params.method) transaction.method = params.method;
      if (params.email) transaction.email = params.email;
      if (params.phone) transaction.phone = params.phone;
      await transaction.save({ session });
      if (order.paymentStatus === 'paid') { result = { order, transaction, state: 'already_fulfilled' }; return; }
      const needsReview = review || order.status === 'cancelled';
      if (!needsReview && order.inventoryStatus !== 'committed') await changeInventory(order.items, order.storeId, -1, session);
      order.paymentStatus = 'paid';
      order.transactionId = String(transaction._id);
      order.razorpayOrderId = params.razorpayOrderId;
      order.inventoryStatus = needsReview ? 'review' : 'committed';
      order.status = needsReview ? order.status : 'confirmed';
      order.statusHistory = [...(order.statusHistory || []), { status: order.status, at: new Date(), note: needsReview ? 'Payment received. Our team is reviewing this order and will contact you.' : 'Payment received and order confirmed.' }];
      if (needsReview) order.notes = 'Paid order requires stock reconciliation or refund before fulfillment.';
      await order.save({ session });
      result = { order, transaction, state: needsReview ? 'manual_review' : 'fulfilled' };
    };
    try { await session.withTransaction(() => apply(false)); }
    catch (error) {
      if (!(error instanceof AppError) || error.statusCode !== 409 || !error.message.startsWith('Insufficient inventory')) throw error;
      await session.withTransaction(() => apply(true));
    }
    return result!;
  } finally { await session.endSession(); }
}
