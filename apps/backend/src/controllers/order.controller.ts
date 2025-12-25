import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/order.model';
import { Product } from '../models/product.model';
import { AppError } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';
import { generateOrderNumber } from '@repo/utils';

export const getAllOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const query: any = {};

    // If customer, show only their orders
    if (req.user!.role === 'customer') {
      query['customer.userId'] = req.user!.id;
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
      req.user!.role === 'customer' &&
      order.customer.userId !== req.user!.id
    ) {
      throw new AppError('Not authorized to view this order', 403);
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

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { storeId, items, customer, shippingAddress, billingAddress } = req.body;

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        throw new AppError(`Product ${item.productId} not found`, 404);
      }

      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient inventory for ${product.name}`, 400);
      }

      const itemTotal = product.sellingPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: String(product._id),
        name: product.name,
        quantity: item.quantity,
        price: product.sellingPrice,
        total: itemTotal,
        image: product.featuredImage,
      });

      // Update stock
      product.stock -= item.quantity;
      await product.save();
    }

    const tax = subtotal * 0.1; // 10% tax
    const shipping = 10; // Flat shipping
    const total = subtotal + tax + shipping;

    const order = await Order.create({
      storeId,
      orderNumber: generateOrderNumber(),
      customer: {
        ...customer,
        userId: req.user!.id,
      },
      items: orderItems,
      subtotal,
      tax,
      shipping,
      total,
      shippingAddress,
      billingAddress,
    });

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
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    order.status = status;
    await order.save();

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
