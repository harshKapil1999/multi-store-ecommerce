import { eq } from 'drizzle-orm';
import { ShipmentTable } from '../db/schema';
import { getDB, DatabaseSession } from '../config/database';
export async function hasBlockingShipment(orderId: string, session?: DatabaseSession) {
  const [shipment] = await (session?.db || getDB()).select().from(ShipmentTable).where(eq(ShipmentTable.orderId, orderId));
  return Boolean(shipment && shipment.state !== 'cancelled');
}
