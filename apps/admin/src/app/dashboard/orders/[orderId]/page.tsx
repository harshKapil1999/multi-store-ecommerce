'use client';

import { useRouter } from 'next/navigation';
import { useOrder, useUpdateOrderStatus } from '@/hooks/useOrders';
import { Button, Card, FormSelect } from '@/components/index';
import { ArrowLeft, Package, User, MapPin, CreditCard, Loader2 } from 'lucide-react';
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

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate(newStatus as OrderStatus);
  };

  const subtotal = order.items.reduce((sum: number, item: OrderItem) => sum + item.price * item.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
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
                      ${item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">
                    ${item.total.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

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
            </div>
          </Card>

          {/* Order Summary */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax:</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping:</span>
                <span>${order.shipping.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold text-base">
                <span>Total:</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Update Status */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Update Status</h2>
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
              value={order.status}
              onValueChange={handleStatusChange}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
