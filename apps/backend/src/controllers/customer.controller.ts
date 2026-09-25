import { NextFunction, Response } from 'express';
import { sql } from 'drizzle-orm';
import { getDB } from '../config/database';
import { OrderTable } from '../db/schema';
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

    const result = await getDB().execute(sql`
      WITH customers AS (
        SELECT lower(customer->>'email') AS id, lower(customer->>'email') AS email,
          (array_agg(customer->>'name' ORDER BY "createdAt" DESC))[1] AS name,
          (array_agg(customer->>'phone' ORDER BY "createdAt" DESC))[1] AS phone,
          (array_agg(customer->>'userId' ORDER BY "createdAt" DESC))[1] AS "userId",
          count(*)::int AS "orderCount",
          sum(CASE WHEN "paymentStatus" = 'paid' AND status NOT IN ('cancelled','refunded') THEN total ELSE 0 END) AS "totalSpent",
          max("createdAt") AS "lastOrderAt",
          (array_agg(status ORDER BY "createdAt" DESC))[1] AS "lastOrderStatus",
          (array_agg("shippingAddress" ORDER BY "createdAt" DESC))[1] AS "latestShippingAddress"
        FROM ${OrderTable} WHERE "storeId" = ${storeId} GROUP BY lower(customer->>'email')
      ), filtered AS (
        SELECT * FROM customers WHERE ${search} = '' OR position(lower(${search}) in lower(concat(email, ' ', name, ' ', phone))) > 0
      ) SELECT (SELECT count(*)::int FROM filtered) AS total,
        coalesce((SELECT jsonb_agg(row_to_json(page_rows)) FROM
          (SELECT * FROM filtered ORDER BY "lastOrderAt" DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}) page_rows), '[]'::jsonb) AS customers
    `);
    const total = Number(result.rows[0]?.total || 0);

    res.json({
      success: true,
      data: {
        data: result.rows[0]?.customers || [],
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
      (order) => order.paymentStatus === 'paid' && order.status !== 'cancelled' && order.status !== 'refunded'
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
