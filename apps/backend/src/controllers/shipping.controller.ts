import { Response, NextFunction, Request } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';
import { Order } from '../models/order.model';
import { Store } from '../models/store.model';
import { ShipmentTable } from '../db/schema';
import { getDB, startSession } from '../config/database';
import { courierRates, parcelSchema, Parcel, shipmentPayload, shipmentTracking, shiprocketRequest, shippingConfigured } from '../services/shiprocket.service';

async function authorizedOrder(req: AuthRequest, manage = false) {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  const user = req.user!;
  if (user.role === 'admin') return order;
  if (user.role === 'store_owner' && await Store.exists({ _id: order.storeId, owner: user.id })) return order;
  if (!manage && user.role === 'customer' && (order.customer.userId === user.id || order.customer.email.toLowerCase() === user.email.toLowerCase())) return order;
  throw new AppError('Not authorized to access this shipment', 403);
}
function fulfillable(order: any) {
  if (!['confirmed', 'processing'].includes(order.status) || order.inventoryStatus !== 'committed' ||
      (order.paymentMethod !== 'cod' && order.paymentStatus !== 'paid')) throw new AppError('Payment and inventory must be confirmed before shipping.', 409);
}
const shipmentFor = async (id: string) => (await getDB().select().from(ShipmentTable).where(eq(ShipmentTable.orderId, id)))[0];
const setShipment = async (id: string, changes: Partial<typeof ShipmentTable.$inferInsert>) =>
  (await getDB().update(ShipmentTable).set({ ...changes, updatedAt: new Date() }).where(eq(ShipmentTable.orderId, id)).returning())[0];
export const getShipment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await authorizedOrder(req);
    const shipment = await shipmentFor(order._id);
    res.json({ success: true, data: { configured: shippingConfigured(), shipment: shipment || null } });
  } catch (error) { next(error); }
};
export const getRates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await authorizedOrder(req, true);
    const parcel = parcelSchema.parse(req.body);
    res.json({ success: true, data: await courierRates(parcel, order.shippingAddress.postalCode, order.paymentMethod === 'cod') });
  } catch (error) { next(error); }
};
export const createShipment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await authorizedOrder(req, true);
    fulfillable(order);
    const parcel = parcelSchema.parse(req.body);
    if (!shippingConfigured()) throw new AppError('Add real Shiprocket API credentials to enable shipping.', 503);
    const payload = shipmentPayload(order, parcel);
    // Claim and validate under the same order lock used by cancellation/refunds.
    const session = await startSession();
    let claimed = false;
    try {
      await session.withTransaction(async () => {
        const current = await Order.findById(order._id).session(session);
        fulfillable(current);
        const rows = await session.db.insert(ShipmentTable).values({ orderId: order._id, parcel, state: 'creating', operation: 'create' }).onConflictDoNothing().returning();
        claimed = rows.length > 0;
      });
    } finally { await session.endSession(); }
    if (!claimed) {
      const existing = await shipmentFor(order._id);
      if (existing?.providerShipmentId) return res.json({ success: true, data: existing });
      throw new AppError('Shipment creation is pending or uncertain. Reconcile it in Shiprocket before retrying.', 409);
    }
    try {
      const data = await shiprocketRequest('/orders/create/adhoc', payload);
      if (!data.order_id || !data.shipment_id) throw new AppError('Shiprocket did not confirm shipment creation.', 502);
      const shipment = await setShipment(order._id, { providerOrderId: String(data.order_id), providerShipmentId: String(data.shipment_id), state: 'created', operation: null });
      res.status(201).json({ success: true, data: shipment });
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 503) await getDB().delete(ShipmentTable).where(eq(ShipmentTable.orderId, order._id));
      else await setShipment(order._id, { state: 'needs_review' });
      throw error;
    }
  } catch (error) { next(error); }
};
export const shipmentAction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await authorizedOrder(req, true);
    const action = z.enum(['assign', 'pickup', 'label', 'cancel']).parse(req.params.action);
    const shipment = await shipmentFor(order._id);
    if (!shipment?.providerShipmentId) throw new AppError('Create the shipment first.', 409);
    if (['assign', 'pickup'].includes(action)) fulfillable(order);
    if (shipment.state === 'cancelled') throw new AppError('This shipment is cancelled.', 409);
    if ((action === 'assign' && shipment.awb) || (action === 'pickup' && shipment.pickupScheduled) || (action === 'label' && shipment.labelUrl)) return res.json({ success: true, data: shipment });
    if (['pickup', 'label'].includes(action) && !shipment.awb) throw new AppError('Assign a courier first.', 409);
    const courierId = action === 'assign' ? z.number().int().positive().parse(req.body.courierId) : undefined;
    const session = await startSession();
    try {
      await session.withTransaction(async () => {
        const current = await Order.findById(order._id).session(session);
        if (['assign', 'pickup'].includes(action)) fulfillable(current);
        const [claim] = await session.db.update(ShipmentTable).set({ operation: action, updatedAt: new Date() }).where(and(eq(ShipmentTable.orderId, order._id), eq(ShipmentTable.state, 'created'), isNull(ShipmentTable.operation))).returning();
        if (!claim) throw new AppError('Another shipping action is pending or needs reconciliation.', 409);
      });
    } finally { await session.endSession(); }
    try {
      let changes: Partial<typeof ShipmentTable.$inferInsert> = { operation: null };
      if (action === 'assign') {
        const data = await shiprocketRequest('/courier/assign/awb', { shipment_id: Number(shipment.providerShipmentId), courier_id: courierId });
        if (data.awb_assign_status !== 1 || !data.response?.data?.awb_code) throw new AppError('Courier assignment was not confirmed.', 502);
        changes = { ...changes, awb: String(data.response.data.awb_code), courier: data.response.data.courier_name };
      } else if (action === 'pickup') {
        const data = await shiprocketRequest('/courier/generate/pickup', { shipment_id: [Number(shipment.providerShipmentId)] });
        if (Number(data.pickup_status) !== 1) throw new AppError('Pickup was not confirmed. Check Shiprocket.', 502);
        changes.pickupScheduled = true;
      } else if (action === 'label') {
        const data = await shiprocketRequest('/courier/generate/label', { shipment_id: [Number(shipment.providerShipmentId)] });
        if (!data.label_url || !String(data.label_url).startsWith('https://')) throw new AppError('Shipping label is not available.', 502);
        changes.labelUrl = data.label_url;
      } else {
        await shiprocketRequest('/orders/cancel', { ids: [Number(shipment.providerOrderId)] });
        // A cancellation request is not confirmation. Block inventory release until
        // the provider's authenticated tracking webhook confirms cancellation.
        changes = { state: 'cancellation_pending', operation: null };
      }
      const updated = await setShipment(order._id, changes);
      if (updated.awb) await Order.updateOne({ _id: order._id }, { $set: {
        'fulfillment.carrier': updated.courier || 'Shiprocket', 'fulfillment.trackingNumber': updated.awb,
        'fulfillment.trackingUrl': `https://shiprocket.co/tracking/${encodeURIComponent(updated.awb)}` } });
      res.json({ success: true, data: updated });
    } catch (error) { await setShipment(order._id, { state: 'needs_review' }); throw error; }
  } catch (error) { next(error); }
};
export const getTracking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await authorizedOrder(req);
    const shipment = await shipmentFor(order._id);
    if (!shipment?.providerShipmentId) throw new AppError('Shipment is not created yet.', 404);
    res.json({ success: true, data: await shipmentTracking(shipment.providerShipmentId) });
  } catch (error) { next(error); }
};
export const reconcileShipment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await authorizedOrder(req, true);
    const { providerOrderId } = z.object({ providerOrderId: z.string().regex(/^\d+$/) }).parse(req.body);
    const existing = await shipmentFor(order._id);
    if (!existing || !['creating', 'needs_review', 'cancellation_pending'].includes(existing.state)) throw new AppError('This shipment does not need reconciliation.', 409);
    const { data } = await shiprocketRequest(`/orders/show/${providerOrderId}`);
    if (String(data?.channel_order_id) !== order._id) throw new AppError('Shiprocket order does not match this order.', 409);
    const item = Array.isArray(data.shipments) ? data.shipments[0] : data.shipments;
    if (!item?.id) throw new AppError('Provider shipment was not found.', 409);
    const cancelled = String(data.status).toUpperCase() === 'CANCELED' || String(data.status).toUpperCase() === 'CANCELLED';
    // Reconcile known state, but do not clear an uncertain pickup operation unless
    // provider pickup metadata confirms it (avoids duplicate pickup scheduling).
    if (existing.operation === 'pickup' && !item.pickup_scheduled_date && !cancelled) throw new AppError('Confirm pickup with Shiprocket support before retrying.', 409);
    const updated = await setShipment(order._id, { providerOrderId, providerShipmentId: String(item.id),
      awb: item.awb ? String(item.awb) : null, courier: item.courier || null,
      pickupScheduled: Boolean(item.pickup_scheduled_date), state: cancelled ? 'cancelled' : 'created', operation: null });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
};

export const shippingWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const secret = process.env.SHIPROCKET_WEBHOOK_SECRET;
    const supplied = req.get('x-api-key') || '';
    if (!secret || secret.startsWith('test-') || Buffer.byteLength(supplied) !== Buffer.byteLength(secret) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(secret))) throw new AppError('Invalid shipping webhook token', 401);
    const input = z.object({ sr_order_id: z.union([z.string(), z.number()]), awb: z.string().optional(), courier_name: z.string().max(120).optional(),
      current_status: z.string().max(120), current_timestamp: z.string() }).parse(req.body);
    const [shipment] = await getDB().select().from(ShipmentTable).where(eq(ShipmentTable.providerOrderId, String(input.sr_order_id)));
    if (!shipment) throw new AppError('Shipment has not been reconciled yet.', 409);
    if (shipment.awb && input.awb !== shipment.awb) throw new AppError('Shipment tracking number mismatch', 409);
    // Shiprocket sends DD MM YYYY HH:mm:ss in IST.
    const match = input.current_timestamp.match(/^(\d{2}) (\d{2}) (\d{4}) (\d{2}:\d{2}:\d{2})$/);
    if (!match) throw new AppError('Invalid tracking timestamp', 400);
    const eventAt = new Date(`${match[3]}-${match[2]}-${match[1]}T${match[4]}+05:30`);
    if (!Number.isFinite(eventAt.getTime()) || eventAt.getTime() > Date.now() + 300_000) throw new AppError('Invalid tracking timestamp', 400);
    const status = input.current_status.toUpperCase();
    const session = await startSession();
    try {
      await session.withTransaction(async () => {
        const order = await Order.findById(shipment.orderId).session(session);
        const [current] = await session.db.select().from(ShipmentTable).where(eq(ShipmentTable.orderId, shipment.orderId)).for('update');
        if (!order || (current.lastEventAt && current.lastEventAt >= eventAt)) return;
        await session.db.update(ShipmentTable).set({ lastEventAt: eventAt, lastStatus: status, updatedAt: new Date(),
          ...(['CANCELLED', 'CANCELED'].includes(status) ? { state: 'cancelled', operation: null } : {}) }).where(eq(ShipmentTable.orderId, shipment.orderId));
        if (['cancelled', 'refunded', 'delivered'].includes(order.status)) return;
        if (order.inventoryStatus !== 'committed' || (order.paymentMethod !== 'cod' && order.paymentStatus !== 'paid')) return;
        const delivered = status === 'DELIVERED';
        const shipped = ['SHIPPED', 'IN TRANSIT', 'OUT FOR DELIVERY', 'PICKED UP'].includes(status);
        if (!delivered && !shipped) return;
        const newStatus = delivered ? 'delivered' : 'shipped';
        if (order.status === newStatus) return;
        order.status = newStatus;
        order.fulfillment = { ...order.fulfillment, carrier: input.courier_name || shipment.courier || 'Shiprocket', trackingNumber: input.awb || shipment.awb || undefined,
          shippedAt: order.fulfillment?.shippedAt || eventAt, ...(delivered ? { deliveredAt: eventAt } : {}) };
        if (delivered && order.paymentMethod === 'cod') order.paymentStatus = 'paid';
        order.statusHistory = [...(order.statusHistory || []), { status: newStatus, at: eventAt, note: 'Delivery carrier update.' }];
        await order.save({ session });
      });
    } finally { await session.endSession(); }
    res.json({ success: true });
  } catch (error) { next(error); }
};
