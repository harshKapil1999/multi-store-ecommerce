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
    const { page = 1, limit = 20 } = req.query;
    const query: any = {};

    // If customer, show only their orders
    if (req.user && req.user.role === 'customer') {
      query['customer.userId'] = req.user.id;
    }

    if (req.user?.role === 'store_owner') {
      const stores = await Store.find({ owner: req.user.id }).select('_id').lean();
      query.storeId = { $in: stores.map((store) => String(store._id)) };
    }

    const orders = await Order.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
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
      order.customer.userId !== req.user.id
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

export const trackOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();

    if (!email) {
      throw new AppError('Email is required to track this order', 400);
    }

    const order = await Order.findOne({
      _id: req.params.id,
      'customer.email': email,
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

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
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
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

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, items, customer, shippingAddress, billingAddress, paymentMethod } = req.body;
    const authReq = req as AuthRequest;

    if (!storeId || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Store and at least one order item are required', 400);
    }

    const store = await Store.findOne({ _id: storeId, isActive: true }).select('_id').lean();
    if (!store) {
      throw new AppError('Store not found or inactive', 404);
    }

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        throw new AppError('Item quantity must be between 1 and 20', 400);
      }

      const product = await Product.findOne({
        _id: item.productId,
        storeId,
        isActive: true,
      });

      if (!product) {
        throw new AppError(`Product ${item.productId} not found`, 404);
      }

      let price = product.sellingPrice;
      let name = product.name;
      let sku = product.sku || `PRODUCT-${String(product._id).slice(-8)}`;
      let image = product.featuredImage;

      // If variant is selected, use variant details
      if (item.variantId) {
        const variant = await ProductVariant.findOne({
          _id: item.variantId,
          productId: String(product._id),
          isActive: true,
        });
        if (!variant) {
          throw new AppError(`Variant ${item.variantId} not found`, 404);
        }

        if (variant.stock < quantity) {
          throw new AppError(`Insufficient inventory for variant ${variant.name}`, 400);
        }

        price = variant.price;
        name = `${product.name} (${variant.name})`;
        sku = variant.sku;
        if (variant.images && variant.images.length > 0) {
          image = variant.images[variant.featuredImageIndex || 0] || variant.images[0];
        }

        if (shouldCommitInventoryAtOrderCreation(paymentMethod)) {
          variant.stock -= quantity;
          await variant.save();
        }
      } else {
        // Simple product stock check
        if (product.stock < quantity) {
          throw new AppError(`Insufficient inventory for ${product.name}`, 400);
        }

        if (shouldCommitInventoryAtOrderCreation(paymentMethod)) {
          product.stock -= quantity;
          await product.save();
        }
      }

      const itemTotal = price * quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: String(product._id),
        variantId: item.variantId ? String(item.variantId) : undefined,
        name: name,
        sku: sku,
        quantity,
        price: price,
        total: itemTotal,
        image: image,
        selectedAttributes: item.selectedAttributes,
      });
    }

    const shipping = subtotal > 2500 ? 0 : 750;
    const total = subtotal + shipping;

    const initialStatus = paymentMethod === 'cod' ? 'confirmed' : 'pending';
    const order = await Order.create({
      storeId,
      orderNumber: generateOrderNumber(),
      customer: {
        userId: authReq.user?.id,
        email: customer.email,
        name: `${customer.firstName} ${customer.lastName}`,
        phone: customer.phone,
      },
      items: orderItems,
      subtotal,
      shipping,
      total,
      status: initialStatus,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      paymentMethod,
      shippingAddress: {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        address1: shippingAddress.addressLine1,
        address2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.pincode,
        country: shippingAddress.country,
        phone: customer.phone,
      },
      billingAddress: {
        firstName: billingAddress.firstName,
        lastName: billingAddress.lastName,
        address1: billingAddress.addressLine1,
        address2: billingAddress.addressLine2,
        city: billingAddress.city,
        state: billingAddress.state,
        postalCode: billingAddress.pincode,
        country: billingAddress.country,
        phone: customer.phone,
      },
      statusHistory: [{
        status: initialStatus,
        at: new Date(),
        note: paymentMethod === 'cod' ? 'Order placed with Cash on Delivery.' : 'Order created and awaiting online payment.',
      }],
    });

    if (paymentMethod === 'cod') {
      try {
        await mailService.sendOrderConfirmation(customer.email, order);
      } catch (error) {
        console.error('Error sending order confirmation email:', error);
      }
    }

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
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

    await order.save();

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
