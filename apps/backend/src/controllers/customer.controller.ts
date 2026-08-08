import { NextFunction, Response } from 'express';
import type { PipelineStage } from 'mongoose';
import type { CustomerAddress } from '@repo/types';
import { Order } from '../models/order.model';
import { AppError } from '../middleware/error-handler';
import type { AuthRequest } from '../middleware/auth';
import type { StoreContextRequest } from '../middleware/store-context';

type CustomerRequest = AuthRequest & StoreContextRequest;

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeAddressKey = (address: Record<string, unknown>) =>
  [
    address.address1,
    address.address2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .map((value) => String(value || '').trim().toLowerCase())
    .join('|');

export const getStoreCustomers = async (
  req: CustomerRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const storeId = String(req.params.storeId);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = String(req.query.search || '').trim();

    const groupedMatch = search
      ? {
          $or: [
            { _id: { $regex: escapeRegex(search), $options: 'i' } },
            { name: { $regex: escapeRegex(search), $options: 'i' } },
            { phone: { $regex: escapeRegex(search), $options: 'i' } },
          ],
        }
      : undefined;

    const pipeline: PipelineStage[] = [
      { $match: { storeId } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { $toLower: '$customer.email' },
          name: { $first: '$customer.name' },
          phone: { $first: '$customer.phone' },
          userId: { $first: '$customer.userId' },
          orderCount: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [
                { $not: [{ $in: ['$status', ['cancelled', 'refunded']] }] },
                '$total',
                0,
              ],
            },
          },
          lastOrderAt: { $first: '$createdAt' },
          lastOrderStatus: { $first: '$status' },
          latestShippingAddress: { $first: '$shippingAddress' },
        },
      },
    ];

    if (groupedMatch) pipeline.push({ $match: groupedMatch });

    pipeline.push(
      { $sort: { lastOrderAt: -1 } },
      {
        $facet: {
          customers: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                id: '$_id',
                email: '$_id',
                name: 1,
                phone: 1,
                userId: 1,
                orderCount: 1,
                totalSpent: 1,
                lastOrderAt: 1,
                lastOrderStatus: 1,
                latestShippingAddress: 1,
              },
            },
          ],
          count: [{ $count: 'total' }],
        },
      }
    );

    const [result] = await Order.aggregate(pipeline);
    const total = result?.count?.[0]?.total || 0;

    res.json({
      success: true,
      data: {
        data: result?.customers || [],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStoreCustomerByEmail = async (
  req: CustomerRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const storeId = String(req.params.storeId);
    const email = decodeURIComponent(String(req.params.customerEmail || '')).trim().toLowerCase();

    if (!email) throw new AppError('Customer email is required', 400);

    const orders = await Order.find({
      storeId,
      'customer.email': { $regex: `^${escapeRegex(email)}$`, $options: 'i' },
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    if (!orders.length) throw new AppError('Customer not found for this store', 404);

    const latestOrder = orders[0];
    const addresses = new Map<string, CustomerAddress>();

    for (const order of orders) {
      for (const [source, address] of [
        ['shipping', order.shippingAddress],
        ['billing', order.billingAddress],
      ] as const) {
        if (!address?.address1) continue;
        const key = normalizeAddressKey(address as unknown as Record<string, unknown>);
        if (!addresses.has(key)) {
          addresses.set(key, {
            ...address,
            source,
            lastUsedAt: order.createdAt,
          } as CustomerAddress);
        }
      }
    }

    const completedOrders = orders.filter(
      (order) => order.status !== 'cancelled' && order.status !== 'refunded'
    );

    res.json({
      success: true,
      data: {
        id: email,
        email,
        name: latestOrder.customer.name,
        phone: latestOrder.customer.phone,
        userId: latestOrder.customer.userId,
        orderCount: orders.length,
        totalSpent: completedOrders.reduce((sum, order) => sum + order.total, 0),
        firstOrderAt: orders[orders.length - 1].createdAt,
        lastOrderAt: latestOrder.createdAt,
        lastOrderStatus: latestOrder.status,
        latestShippingAddress: latestOrder.shippingAddress,
        addresses: Array.from(addresses.values()),
        orders,
      },
    });
  } catch (error) {
    next(error);
  }
};
