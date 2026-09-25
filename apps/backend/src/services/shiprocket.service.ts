import { createHash } from 'node:crypto';
import { z } from 'zod';
import { AppError } from '../middleware/error-handler';
import { cacheGet, cacheSet } from './cache.service';
import type { Order } from '@repo/types';

const API = 'https://apiv2.shiprocket.in/v1/external';
let memoryToken: { value: string; expires: number } | undefined;
let pendingToken: Promise<string> | undefined;
export const parcelSchema = z.object({
  pickupLocation: z.string().trim().min(1).max(100),
  pickupPincode: z.string().regex(/^\d{6}$/),
  weight: z.number().positive().max(1000),
  length: z.number().positive().max(1000),
  breadth: z.number().positive().max(1000),
  height: z.number().positive().max(1000),
}).strict();
export type Parcel = z.infer<typeof parcelSchema>;
export function shippingConfigured() { return Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD && !process.env.SHIPROCKET_EMAIL.endsWith('.test') && !process.env.SHIPROCKET_PASSWORD.startsWith('test-')); }
async function token(refresh = false): Promise<string> {
  if (!shippingConfigured()) throw new AppError('Add Shiprocket API credentials before creating a shipment.', 503);
  if (!refresh && memoryToken && memoryToken.expires > Date.now()) return memoryToken.value;
  if (pendingToken) return pendingToken;
  pendingToken = (async () => {
    // Tokens stay in process memory; they are never included in API responses or logs.
    let response: globalThis.Response;
    try { response = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: process.env.SHIPROCKET_EMAIL, password: process.env.SHIPROCKET_PASSWORD }), signal: AbortSignal.timeout(15_000) }); }
    catch { throw new AppError('Shiprocket authentication is unavailable.', 503); }
    const data = await response.json() as any;
    if (!response.ok || typeof data.token !== 'string') throw new AppError('Shiprocket API credentials were rejected.', 503);
    memoryToken = { value: data.token, expires: Date.now() + 9 * 24 * 3600_000 };
    return data.token;
  })().finally(() => { pendingToken = undefined; });
  return pendingToken;
}
export async function shiprocketRequest(endpoint: string, body?: unknown): Promise<any> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const accessToken = await token(attempt > 0);
    let response: globalThis.Response;
    try { response = await fetch(`${API}${endpoint}`, { method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(20_000) }); }
    catch { throw new AppError('Shiprocket response was not received. Reconcile the shipment before retrying.', 502); }
    if (response.status === 401 && attempt === 0) { memoryToken = undefined; continue; }
    const data = await response.json().catch(() => null) as any;
    if (!response.ok || !data || data.status_code >= 400) throw new AppError('Shiprocket could not complete this request. Check the shipment in its dashboard.', 502);
    return data;
  }
  throw new AppError('Shiprocket authentication failed.', 503);
}
export function shipmentPayload(order: Order, parcel: Parcel) {
  const addressFields = (prefix: string, address: Order['shippingAddress']) => ({
    [`${prefix}_customer_name`]: address.firstName, [`${prefix}_last_name`]: address.lastName,
    [`${prefix}_address`]: address.address1, [`${prefix}_address_2`]: address.address2 || '',
    [`${prefix}_city`]: address.city, [`${prefix}_state`]: address.state,
    [`${prefix}_country`]: address.country === 'IN' ? 'India' : address.country,
    [`${prefix}_pincode`]: address.postalCode, [`${prefix}_email`]: order.customer.email,
    [`${prefix}_phone`]: address.phone || order.customer.phone,
  });
  if (!/^\d{6}$/.test(order.shippingAddress.postalCode)) throw new AppError('A valid Indian delivery pincode is required.', 400);
  return {
    order_id: String(order._id), order_date: new Date(order.createdAt).toISOString().slice(0, 16).replace('T', ' '),
    pickup_location: parcel.pickupLocation, ...addressFields('billing', order.billingAddress || order.shippingAddress),
    shipping_is_billing: false, ...addressFields('shipping', order.shippingAddress),
    order_items: order.items.map(item => ({ name: item.name, sku: item.sku || item.variantId || item.productId,
      units: item.quantity, selling_price: item.price })),
    payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
    sub_total: order.subtotal + order.tax, shipping_charges: order.shipping, total_discount: order.discount,
    length: parcel.length, breadth: parcel.breadth, height: parcel.height, weight: parcel.weight,
  };
}
export async function courierRates(parcel: Parcel, deliveryPincode: string, cod: boolean) {
  const params = new URLSearchParams({ pickup_postcode: parcel.pickupPincode, delivery_postcode: deliveryPincode,
    cod: cod ? '1' : '0', weight: String(parcel.weight), length: String(parcel.length), breadth: String(parcel.breadth), height: String(parcel.height) });
  const key = `commerce:v1:rates:${createHash('sha256').update(`${process.env.SHIPROCKET_EMAIL}:${params}`).digest('hex')}`;
  const cached = await cacheGet(key);
  if (cached) return JSON.parse(cached);
  const data = await shiprocketRequest(`/courier/serviceability/?${params}`);
  const rates = data.data?.available_courier_companies;
  if (!Array.isArray(rates)) throw new AppError('Shipping rates are unavailable for this address.', 502);
  const result = rates.map((rate: any) => ({ id: rate.courier_company_id, name: rate.courier_name, rate: rate.rate, estimatedDays: rate.estimated_delivery_days }));
  await cacheSet(key, JSON.stringify(result), 300);
  return result;
}
export async function shipmentTracking(id: string) {
  const key = `commerce:v1:tracking:${id}`;
  const cached = await cacheGet(key);
  if (cached) return JSON.parse(cached);
  const data = await shiprocketRequest(`/courier/track/shipment/${encodeURIComponent(id)}`);
  const tracking = data.tracking_data;
  if (!tracking) throw new AppError('Tracking is not available yet.', 502);
  const result = { status: tracking.shipment_status, trackingUrl: tracking.track_url,
    estimatedDelivery: tracking.etd, activities: tracking.shipment_track_activities || [] };
  await cacheSet(key, JSON.stringify(result), 60);
  return result;
}
