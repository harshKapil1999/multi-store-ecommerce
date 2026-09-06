import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import { checkoutSchema } from '../validators/checkout.schema';
import { changeInventory } from '../services/inventory.service';
import { getShipping, DEFAULT_COMMERCE_SETTINGS, ORDER_TRANSITIONS, type OrderItem } from '@repo/types';
import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/order.model';
import { Product } from '../models/product.model';
import { ProductVariant } from '../models/variant.model';
import { Store } from '../models/store.model';
import { AppError } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';
import { generateOrderNumber } from '@repo/utils';
import { mailService } from '../services/mail.service';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const;

const cleanOptionalText = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
};

const shouldCommitInventoryAtOrderCreation = (paymentMethod?: string) => paymentMethod === 'cod';

const userOwnsStore = async (userId: string, storeId: string) => {
  const store = await Store.findOne({ _id: storeId, owner: userId }).select('_id').lean();
  return Boolean(store);
};

export const getAllOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, storeId } = req.query;
    const query: any = {};

    if (storeId) query.storeId = String(storeId);

    // If customer, show only their orders
    if (req.user && req.user.role === 'customer') {
      query.$or = [
        { 'customer.userId': req.user.id },
        { 'customer.email': req.user.email.toLowerCase() },
      ];
    }

    if (req.user?.role === 'store_owner') {
      const stores = await Store.find({ owner: req.user.id }).select('_id').lean();
      query.storeId = { $in: stores.map((store) => String(store._id)) };
    }

    const orders = await Order.find(query)
      .limit(Math.min(100, Math.max(1, Math.floor(Number(limit) || 20))))
      .skip((Math.max(1, Math.floor(Number(page) || 1)) - 1) * Math.min(100, Math.max(1, Math.floor(Number(limit) || 20))))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        data: orders,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Check access
    if (
      req.user &&
      req.user.role === 'customer' &&
      order.customer.userId !== req.user.id &&
      order.customer.email.toLowerCase() !== req.user.email.toLowerCase()
    ) {
      throw new AppError('Not authorized to view this order', 403);
    }

    if (req.user?.role === 'store_owner' && !(await userOwnsStore(req.user.id, order.storeId))) {
      throw new AppError('Not authorized to view this order', 403);
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const trackOrder = getOrderById;

export const getOrdersByStore = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { storeId } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    const query: any = { storeId };
    if (status) query.status = status;

    if (req.user!.role === 'store_owner' && !(await userOwnsStore(req.user!.id, storeId))) {
      throw new AppError('Not authorized to view this store', 403);
    }

    const orders = await Order.find(query)
      .limit(Math.min(100, Math.max(1, Math.floor(Number(limit) || 20))))
      .skip((Math.max(1, Math.floor(Number(page) || 1)) - 1) * Math.min(100, Math.max(1, Math.floor(Number(limit) || 20))))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        data: orders,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0]?.message || 'Invalid checkout data', 400);
    const { storeId, items, customer, shippingAddress, billingAddress, paymentMethod, checkoutKey } = parsed.data;
    if (customer.email !== req.user!.email.toLowerCase()) throw new AppError('Verify the email used for this order.', 403);
    const fingerprint = createHash('sha256').update(JSON.stringify(parsed.data)).digest('hex');
    const previous = await Order.findOne({ checkoutKey }).select('+checkoutFingerprint');
    if (previous) {
      if (previous.customer.userId !== req.user!.id || previous.checkoutFingerprint !== fingerprint) throw new AppError('Checkout changed. Please start a new checkout.', 409);
      return res.json({ success: true, data: previous });
    }
    const store = await Store.findOne({ _id: storeId, isActive: true }).lean();
    if (!store) throw new AppError('Store not found or inactive', 404);
    const settings = { ...DEFAULT_COMMERCE_SETTINGS, ...store.commerce };
    if (paymentMethod === 'cod' && !settings.codEnabled) throw new AppError('Cash on delivery is unavailable for this store.', 400);
    const session = await mongoose.startSession();
    let order: InstanceType<typeof Order> | undefined;
    try {
      await session.withTransaction(async () => {
        const orderItems: (OrderItem & { selectedAttributes?: Record<string, string> })[] = [];
        const quantities = new Map<string, number>();
        let subtotalPaise = 0;
        for (const item of items) {
          const key = `${item.productId}:${item.variantId || ''}`;
          const quantity = (quantities.get(key) || 0) + item.quantity;
          if (quantity > 20) throw new AppError('Maximum quantity is 20 per product option.', 400);
          quantities.set(key, quantity);
          const product = await Product.findOne({ _id: item.productId, storeId, isActive: true }).session(session);
          if (!product) throw new AppError('A product is no longer available.', 404);
          if (product.hasVariants !== Boolean(item.variantId)) throw new AppError('Choose a valid product option.', 400);
          const variant = item.variantId ? await ProductVariant.findOne({ _id: item.variantId, productId: item.productId, isActive: true }).session(session) : null;
          if (item.variantId && !variant) throw new AppError('Product option is unavailable.', 400);
          if ((variant?.stock ?? product.stock) < quantity) throw new AppError(`Insufficient inventory for ${product.name}`, 409);
          const paise = Math.round((variant?.price ?? product.sellingPrice) * 100);
          if (!Number.isSafeInteger(paise) || paise < 100) throw new AppError('Product price is unavailable. Contact support.', 400);
          subtotalPaise += paise * item.quantity;
          orderItems.push({
            productId: String(product._id), variantId: item.variantId,
            name: variant ? `${product.name} (${variant.name})` : product.name,
            sku: variant?.sku || product.sku, quantity: item.quantity, price: paise / 100, total: paise * item.quantity / 100,
            image: variant?.images?.[variant.featuredImageIndex || 0] || product.featuredImage,
            selectedAttributes: variant ? Object.fromEntries(Object.entries(variant.attributes instanceof Map ? Object.fromEntries(variant.attributes) : variant.attributes)) : undefined,
          });
        }
        const subtotal = subtotalPaise / 100;
        const shipping = getShipping(subtotal, settings);
        const initialStatus = paymentMethod === 'cod' ? 'confirmed' : 'pending';
        const convertAddress = (address: typeof shippingAddress) => ({ ...address, address1: address.addressLine1, address2: address.addressLine2, postalCode: address.pincode, phone: customer.phone });
        if (paymentMethod === 'cod') await changeInventory(orderItems, storeId, -1, session);
        [order] = await Order.create([{
          storeId, checkoutKey, checkoutFingerprint: fingerprint, orderNumber: generateOrderNumber(),
          customer: { userId: req.user!.id, email: req.user!.email, name: `${customer.firstName} ${customer.lastName}`.trim(), phone: customer.phone },
          items: orderItems, subtotal, shipping, total: (subtotalPaise + Math.round(shipping * 100)) / 100,
          status: initialStatus, paymentStatus: 'pending', paymentMethod,
          inventoryStatus: paymentMethod === 'cod' ? 'committed' : 'uncommitted',
          shippingAddress: convertAddress(shippingAddress), billingAddress: convertAddress(billingAddress),
          statusHistory: [{ status: initialStatus, at: new Date(), note: paymentMethod === 'cod' ? 'Order confirmed. Pay on delivery.' : 'Awaiting online payment.' }],
        }], { session });
      });
    } catch (error: any) {
      if (error.code === 11000) {
        const existing = await Order.findOne({ checkoutKey, 'customer.userId': req.user!.id }).select('+checkoutFingerprint');
        if (existing?.checkoutFingerprint === fingerprint) return res.json({ success: true, data: existing });
      }
      throw error;
    } finally { await session.endSession(); }
    if (order?.paymentMethod === 'cod') {
      try { await mailService.sendOrderConfirmation(order.customer.email, order); }
      catch { console.error('Order confirmation email failed', { orderId: String(order._id) }); }
    }
    res.status(201).json({ success: true, data: order });
  } catch (error) { next(error); }
};

export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, fulfillment: fulfillmentInput, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

	    if (req.user!.role === 'store_owner' && !(await userOwnsStore(req.user!.id, order.storeId))) {
	      throw new AppError('Not authorized to update this order', 403);
	    }

    if (!ORDER_STATUSES.includes(status)) {
      throw new AppError('A valid order status is required', 400);
    }

    const previousStatus = order.status;
    if (status !== previousStatus && !ORDER_TRANSITIONS[previousStatus].includes(status)) throw new AppError('This order status transition is not allowed. Use the payment refund action for refunds.', 409);
    if (['confirmed', 'processing', 'shipped', 'delivered'].includes(status) && (order.inventoryStatus === 'review' || (order.paymentMethod !== 'cod' && order.paymentStatus !== 'paid'))) throw new AppError('Confirm payment and reconcile stock before fulfillment.', 409);
    if (status === 'shipped' && !(fulfillmentInput?.carrier || order.fulfillment?.carrier || '')?.trim()) throw new AppError('Enter the shipping carrier before dispatch.', 400);
    if (status === 'shipped' && !(fulfillmentInput?.trackingNumber || order.fulfillment?.trackingNumber || '')?.trim()) throw new AppError('Enter a tracking number before dispatch.', 400);
    const historyNote = cleanOptionalText(note, 500);
    const fulfillment = fulfillmentInput && typeof fulfillmentInput === 'object'
      ? {
          carrier: cleanOptionalText(fulfillmentInput.carrier, 120),
          trackingNumber: cleanOptionalText(fulfillmentInput.trackingNumber, 160),
          trackingUrl: cleanOptionalText(fulfillmentInput.trackingUrl, 500),
          estimatedDelivery: fulfillmentInput.estimatedDelivery ? new Date(fulfillmentInput.estimatedDelivery) : undefined,
        }
      : undefined;

    if (fulfillment?.estimatedDelivery && Number.isNaN(fulfillment.estimatedDelivery.getTime())) {
      throw new AppError('Estimated delivery must be a valid date', 400);
    }

    if (fulfillment?.trackingUrl && !/^https:\/\//i.test(fulfillment.trackingUrl)) throw new AppError('Tracking URL must use HTTPS.', 400);
    order.status = status;
    if (fulfillment) {
      const currentFulfillment = order.fulfillment || {};
      order.fulfillment = {
        ...currentFulfillment,
        ...Object.fromEntries(Object.entries(fulfillment).filter(([, value]) => value !== undefined)),
      };
    }

    if (status === 'shipped' && !order.fulfillment?.shippedAt) {
      order.fulfillment = { ...(order.fulfillment || {}), shippedAt: new Date() };
    }

    if (status === 'delivered' && !order.fulfillment?.deliveredAt) {
      order.fulfillment = { ...(order.fulfillment || {}), deliveredAt: new Date() };
    }

    if (previousStatus !== status || historyNote) {
      order.statusHistory = [
        ...(order.statusHistory || []),
        { status, at: new Date(), note: historyNote },
      ];
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const current = await Order.findOne({ _id: order._id, status: previousStatus, updatedAt: order.updatedAt }).session(session);
        if (!current) throw new AppError('Order changed. Refresh before saving.', 409);
        if (status === 'cancelled' && current.inventoryStatus === 'committed') {
          await changeInventory(current.items, current.storeId, 1, session);
          order.inventoryStatus = 'released';
        }
        if (status === 'delivered' && order.paymentMethod === 'cod') order.paymentStatus = 'paid';
        await Order.updateOne({ _id: order._id }, { $set: { status: order.status, paymentStatus: order.paymentStatus, inventoryStatus: order.inventoryStatus, fulfillment: order.fulfillment, statusHistory: order.statusHistory } }, { session, runValidators: true });
      });
    } finally { await session.endSession(); }

    if (previousStatus !== status || historyNote) {
	      try {
	        await mailService.sendOrderStatusUpdate(order.customer.email, order, previousStatus);
	      } catch (error) {
	        console.error('Error sending order status update email:', error);
	      }
	    }

	    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
