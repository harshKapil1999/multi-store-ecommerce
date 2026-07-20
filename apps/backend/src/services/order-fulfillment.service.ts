import type { OrderItem } from '@repo/types';
import { AppError } from '../middleware/error-handler';
import { Order } from '../models/order.model';
import { Product } from '../models/product.model';
import { Transaction } from '../models/transaction.model';
import { ProductVariant } from '../models/variant.model';

type AppliedInventoryChange = {
  kind: 'product' | 'variant';
  id: string;
  quantity: number;
};

type FulfillmentResult = {
  order: InstanceType<typeof Order> | null;
  transaction: InstanceType<typeof Transaction>;
  state: 'fulfilled' | 'already_fulfilled' | 'processing' | 'manual_review';
};

function appendOrderNote(existing: string | undefined, note: string) {
  if (!existing) {
    return note;
  }

  if (existing.includes(note)) {
    return existing;
  }

  return `${existing}\n${note}`;
}

async function decrementInventory(items: OrderItem[]) {
  const appliedChanges: AppliedInventoryChange[] = [];

  try {
    for (const item of items) {
      if (item.variantId) {
        const updatedVariant = await ProductVariant.findOneAndUpdate(
          { _id: item.variantId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true }
        );

        if (!updatedVariant) {
          throw new AppError(`Insufficient inventory for ${item.name}`, 409);
        }

        appliedChanges.push({ kind: 'variant', id: item.variantId, quantity: item.quantity });
        continue;
      }

      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        throw new AppError(`Insufficient inventory for ${item.name}`, 409);
      }

      appliedChanges.push({ kind: 'product', id: item.productId, quantity: item.quantity });
    }
  } catch (error) {
    for (const change of appliedChanges.reverse()) {
      if (change.kind === 'variant') {
        await ProductVariant.findByIdAndUpdate(change.id, {
          $inc: { stock: change.quantity },
        });
        continue;
      }

      await Product.findByIdAndUpdate(change.id, {
        $inc: { stock: change.quantity },
      });
    }

    throw error;
  }
}

export async function finalizeCapturedPayment(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  method?: string;
  email?: string;
  phone?: string;
}) : Promise<FulfillmentResult> {
  const transaction = await Transaction.findOne({
    razorpayOrderId: params.razorpayOrderId,
  });

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  if (!['created', 'authorized', 'captured'].includes(transaction.status)) {
    throw new AppError('Transaction cannot be fulfilled in its current state', 409);
  }

  if (transaction.status !== 'captured') {
    transaction.status = 'captured';
  }

  transaction.razorpayPaymentId = params.razorpayPaymentId;

  if (params.razorpaySignature) {
    transaction.razorpaySignature = params.razorpaySignature;
  }

  if (params.method) {
    transaction.method = params.method;
  }

  if (params.email) {
    transaction.email = params.email;
  }

  if (params.phone) {
    transaction.phone = params.phone;
  }

  await transaction.save();

  let order = await Order.findById(transaction.orderId);

  if (!order) {
    throw new AppError('Order not found for transaction', 404);
  }

  if (order.paymentStatus === 'paid') {
    return {
      order,
      transaction,
      state: 'already_fulfilled',
    };
  }

  const claimedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      paymentStatus: 'pending',
      $or: [
        { transactionId: { $exists: false } },
        { transactionId: null },
        { transactionId: '' },
      ],
    },
    {
      $set: {
        transactionId: String(transaction._id),
        razorpayOrderId: params.razorpayOrderId,
      },
    },
    { new: true }
  );

  if (!claimedOrder) {
    order = await Order.findById(transaction.orderId);

    if (order?.paymentStatus === 'paid') {
      return {
        order,
        transaction,
        state: 'already_fulfilled',
      };
    }

    return {
      order,
      transaction,
      state: 'processing',
    };
  }

  try {
    await decrementInventory(claimedOrder.items);
  } catch (error: any) {
    const reviewNote = appendOrderNote(
      claimedOrder.notes,
      `Payment captured but inventory reconciliation is required: ${error.message || 'Unknown inventory error'}`
    );

    order = await Order.findByIdAndUpdate(
      claimedOrder._id,
      {
        $set: {
          paymentStatus: 'paid',
          status: 'pending',
          notes: reviewNote,
        },
      },
      { new: true }
    );

    return {
      order,
      transaction,
      state: 'manual_review',
    };
  }

  order = await Order.findByIdAndUpdate(
    claimedOrder._id,
    {
      $set: {
        paymentStatus: 'paid',
        status: 'confirmed',
      },
    },
    { new: true }
  );

  return {
    order,
    transaction,
    state: 'fulfilled',
  };
}