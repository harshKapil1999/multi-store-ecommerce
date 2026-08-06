"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store-context';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Package, Truck, ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

const TERMINAL_ORDER_STATUSES = ['delivered', 'cancelled', 'refunded'];

export default function OrderSuccessPage({ params }: { params: { storeSlug: string } }) {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const email = searchParams.get('email');
  const transactionId = searchParams.get('transactionId');
  const { store } = useStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const query = email ? `?email=${encodeURIComponent(email)}` : '';
        const orderData = await api.get<any>(`/orders/track/${orderId}${query}`);
        setOrder(orderData);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    const interval = window.setInterval(() => {
      if (!orderId || (order?.status && TERMINAL_ORDER_STATUSES.includes(order.status))) {
        return;
      }

      fetchOrder();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [orderId, email, order?.status]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <CheckCircle2 size={64} className="text-green-500 mb-6" />
        <h1 className="text-3xl font-bold mb-2 text-center">Thank you for your order!</h1>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          Your order has been received and is being processed. You will receive an email confirmation soon.
        </p>
        <Link href={`/${params.storeSlug}`}>
          <Button className="rounded-full px-8">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'paid';
  const fulfillment = order.fulfillment || {};
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-white/5">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={40} className="text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase mb-2">
              {isPaid ? 'Order Confirmed' : 'Payment Processing'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Order #{order.orderNumber}</p>
            {!isPaid && (
              <p className="mt-3 max-w-md text-center text-sm text-gray-500 dark:text-gray-400">
                Razorpay is confirming the payment. This page checks your order automatically, so you can keep it open.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10 border-t border-b border-gray-100 dark:border-white/5 py-10">
            <div>
              <h3 className="font-bold mb-4 uppercase text-sm tracking-widest text-gray-400">Shipping To</h3>
              <p className="font-medium">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
              <p className="text-gray-500 dark:text-gray-400">{order.shippingAddress.address1}</p>
              <p className="text-gray-500 dark:text-gray-400">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p className="text-gray-500 dark:text-gray-400">{order.shippingAddress.country}</p>
            </div>
            <div>
              <h3 className="font-bold mb-4 uppercase text-sm tracking-widest text-gray-400">Payment Status</h3>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <p className="font-medium capitalize">{order.paymentStatus}</p>
              </div>
              <p className="text-gray-500 dark:text-gray-400">Method: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
              {(order.transactionId || transactionId) && (
                <p className="mt-2 break-all text-xs text-gray-500 dark:text-gray-400">
                  Payment reference: {order.transactionId || transactionId}
                </p>
              )}

              <h3 className="font-bold mb-4 mt-6 uppercase text-sm tracking-widest text-gray-400">Order Total</h3>
              <p className="text-2xl font-black">₹ {order.total.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="mb-12 rounded-2xl bg-gray-50 p-5 dark:bg-black">
            <h3 className="mb-5 font-bold uppercase text-sm tracking-widest text-gray-400">Live Tracking</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['confirmed', 'Confirmed', Package],
                ['processing', 'Processing', Package],
                ['shipped', 'Shipped', Truck],
                ['delivered', 'Delivered', CheckCircle2],
              ].map(([status, label, Icon]: any) => {
                const activeOrder = ['confirmed', 'processing', 'shipped', 'delivered'];
                const currentIndex = activeOrder.indexOf(order.status);
                const statusIndex = activeOrder.indexOf(status);
                const isActive = currentIndex >= statusIndex && currentIndex !== -1;

                return (
                  <div
                    key={status}
                    className={`rounded-xl border p-4 ${isActive ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-950/30 dark:text-green-300' : 'border-gray-200 bg-white text-gray-400 dark:border-white/10 dark:bg-zinc-900'}`}
                  >
                    <Icon className="mb-3 h-5 w-5" />
                    <p className="text-sm font-semibold">{label}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              This page refreshes order status automatically while fulfillment is in progress.
            </p>
            {(fulfillment.carrier || fulfillment.trackingNumber || fulfillment.estimatedDelivery) && (
              <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 text-sm dark:border-white/10 dark:bg-zinc-900">
                <p className="font-semibold">Shipment details</p>
                {fulfillment.carrier && <p className="mt-1 text-gray-500 dark:text-gray-400">Carrier: {fulfillment.carrier}</p>}
                {fulfillment.trackingNumber && <p className="text-gray-500 dark:text-gray-400">Tracking number: {fulfillment.trackingNumber}</p>}
                {fulfillment.estimatedDelivery && <p className="text-gray-500 dark:text-gray-400">Estimated delivery: {new Date(fulfillment.estimatedDelivery).toLocaleDateString()}</p>}
                {fulfillment.trackingUrl && (
                  <a href={fulfillment.trackingUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block font-semibold underline">
                    Open carrier tracking
                  </a>
                )}
              </div>
            )}
          </div>

          {history.length > 0 && (
            <div className="mb-12 rounded-2xl border border-gray-100 p-5 dark:border-white/10">
              <h3 className="mb-4 font-bold uppercase text-sm tracking-widest text-gray-400">Order updates</h3>
              <div className="space-y-3">
                {history.slice().reverse().map((entry: any, index: number) => (
                  <div key={`${entry.status}-${entry.at}-${index}`} className="flex items-start justify-between gap-4 text-sm">
                    <div>
                      <p className="font-semibold capitalize">{entry.status}</p>
                      {entry.note && <p className="text-gray-500 dark:text-gray-400">{entry.note}</p>}
                    </div>
                    <time className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{new Date(entry.at).toLocaleString()}</time>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6 mb-12">
            <h3 className="font-bold uppercase text-sm tracking-widest text-gray-400">Items Ordered</h3>
            <div className="space-y-4">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-center">
                  <div className="w-16 h-20 bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold uppercase text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Qty {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">₹ {item.total.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href={`/${params.storeSlug}`}>
              <Button variant="outline" className="w-full rounded-full py-6 flex items-center justify-center gap-2">
                <ShoppingBag size={18} />
                Continue Shopping
              </Button>
            </Link>
            <Link href={`/${params.storeSlug}/account/orders`}>
              <Button className="w-full rounded-full py-6 bg-black text-white hover:bg-zinc-800 flex items-center justify-center gap-2">
                Track Order
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
