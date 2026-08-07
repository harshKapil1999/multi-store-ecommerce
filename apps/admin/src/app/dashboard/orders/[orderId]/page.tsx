'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrder, useUpdateOrderStatus } from '@/hooks/useOrders';
import { Button, Card, FormSelect, FormInput, FormTextarea } from '@/components/index';
import { ArrowLeft, Package, User, MapPin, CreditCard, Loader2, Truck, Printer } from 'lucide-react';
import type { OrderStatus, OrderItem, Order } from '@repo/types';
import Image from 'next/image';

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
};

export default function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const router = useRouter();
  const { data, isLoading } = useOrder(params.orderId);
  const updateStatusMutation = useUpdateOrderStatus(params.orderId);

  const order = data?.data as Order | undefined;
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!order) return;

    setStatus(order.status);
    setCarrier(order.fulfillment?.carrier || '');
    setTrackingNumber(order.fulfillment?.trackingNumber || '');
    setTrackingUrl(order.fulfillment?.trackingUrl || '');
    setEstimatedDelivery(order.fulfillment?.estimatedDelivery
      ? new Date(order.fulfillment.estimatedDelivery).toISOString().slice(0, 10)
      : '');
  }, [order]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Order not found</p>
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/orders')}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </Card>
    );
  }

  const handleFulfillmentUpdate = () => {
    updateStatusMutation.mutate({
      status,
      note: note || undefined,
      fulfillment: {
        carrier: carrier || undefined,
        trackingNumber: trackingNumber || undefined,
        trackingUrl: trackingUrl || undefined,
        estimatedDelivery: estimatedDelivery || undefined,
      },
    }, {
      onSuccess: () => setNote(''),
    });
  };

  const subtotal = order.items.reduce((sum: number, item: OrderItem) => sum + item.price * item.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print invoice
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/orders')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Order {order.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
              statusColors[order.status]
            }`}
          >
            {order.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Order Items */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Order Items</h2>
            </div>
            <div className="space-y-4">
              {order.items.map((item: OrderItem, index: number) => (
                <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-0">
                  {item.image && (
                    <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    {item.sku && (
                      <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">
                    ₹{item.total.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {order.statusHistory && order.statusHistory.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Order Timeline</h2>
              <div className="space-y-4">
                {order.statusHistory.slice().reverse().map((entry, index) => (
                  <div key={`${entry.status}-${entry.at}-${index}`} className="border-l-2 border-border pl-4">
                    <p className="font-medium capitalize">{entry.status}</p>
                    {entry.note && <p className="mt-1 text-sm text-muted-foreground">{entry.note}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(entry.at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Shipping Address</h2>
              </div>
              <div className="space-y-1 text-sm">
                <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                <p>{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Billing Address</h2>
              </div>
              <div className="space-y-1 text-sm">
                <p>{order.billingAddress.firstName} {order.billingAddress.lastName}</p>
                <p>{order.billingAddress.address1}</p>
                {order.billingAddress.address2 && <p>{order.billingAddress.address2}</p>}
                <p>
                  {order.billingAddress.city}, {order.billingAddress.state}{' '}
                  {order.billingAddress.postalCode}
                </p>
                <p>{order.billingAddress.country}</p>
                {order.billingAddress.phone && <p>{order.billingAddress.phone}</p>}
              </div>
            </Card>
          </div>
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Customer</h2>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{order.customer.name}</p>
              <p className="text-muted-foreground">{order.customer.email}</p>
              {order.customer.phone && (
                <p className="text-muted-foreground">{order.customer.phone}</p>
              )}
            </div>
          </Card>

          {/* Payment Info */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Payment</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    order.paymentStatus === 'paid'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method:</span>
                <span className="font-medium capitalize">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction:</span>
                <span className="font-mono text-xs">{order.transactionId || '-'}</span>
              </div>
            </div>
          </Card>

          {/* Order Summary */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax:</span>
                <span>₹{order.tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping:</span>
                <span>₹{order.shipping.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold text-base">
                <span>Total:</span>
                <span>₹{order.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </Card>

          {/* Fulfilment and Status */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Fulfilment</h2>
            </div>
            <FormSelect
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'processing', label: 'Processing' },
                { value: 'shipped', label: 'Shipped' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'refunded', label: 'Refunded' },
              ]}
              value={status}
              onValueChange={(value) => setStatus(value as OrderStatus)}
            />
            <div className="mt-4 space-y-4">
              <FormInput label="Carrier" value={carrier} onChange={(event) => setCarrier(event.target.value)} placeholder="e.g. Delhivery" />
              <FormInput label="Tracking number" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Carrier reference" />
              <FormInput label="Carrier tracking URL" type="url" value={trackingUrl} onChange={(event) => setTrackingUrl(event.target.value)} placeholder="https://..." />
              <FormInput label="Estimated delivery" type="date" value={estimatedDelivery} onChange={(event) => setEstimatedDelivery(event.target.value)} />
              <FormTextarea label="Customer-visible update note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note to include in this status update" />
              <Button className="w-full" onClick={handleFulfillmentUpdate} disabled={updateStatusMutation.isPending}>
                {updateStatusMutation.isPending ? 'Saving...' : 'Save fulfilment update'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
