"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Package, ShoppingBag } from 'lucide-react';
import type { Order } from '@repo/types';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useStore } from '@/lib/store-context';

type OrdersResponse = {
  data: Order[];
  total: number;
  page: number;
  totalPages: number;
};

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

export default function AccountOrdersPage() {
  const params = useParams<{ storeSlug: string }>();
  const { isAuthenticated } = useAuth();
  const { store } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated || !store?._id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get<OrdersResponse>(`/orders?storeId=${store._id}`);
        setOrders(Array.isArray(response.data) ? response.data : []);
      } catch (fetchError: any) {
        setError(fetchError.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, store?._id]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-3xl font-black italic tracking-tighter uppercase">Track Your Orders</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Verify your email during checkout to see your order history and live status updates here.
          </p>
          <Link href={`/${params.storeSlug}`}>
            <Button className="rounded-full px-8">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Unable to load orders</h1>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
          <Link href={`/${params.storeSlug}`}>
            <Button className="rounded-full px-8">Back to Store</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase">Your Orders</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Track payment and delivery progress for every purchase.</p>
        </div>
        <Link href={`/${params.storeSlug}`}>
          <Button variant="outline" className="rounded-full px-6">
            <ShoppingBag size={16} className="mr-2" />
            Continue Shopping
          </Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900 p-10 text-center shadow-sm">
          <Package size={42} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Once you place an order, it will appear here with payment and delivery status.</p>
          <Link href={`/${params.storeSlug}`}>
            <Button className="rounded-full px-8">Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order._id}
              href={`/${params.storeSlug}/account/orders/${order._id}`}
              className="block rounded-3xl border border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900 p-6 md:p-8 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Order #{order.orderNumber}</p>
                  <h2 className="text-xl font-bold">₹ {order.total.toLocaleString('en-IN')}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusStyles[order.status] || statusStyles.pending}`}>
                    {order.status}
                  </span>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                    payment {order.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Items</p>
                  <p className="font-semibold">{order.items.length} item(s)</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {order.items.map((item) => item.name).join(', ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Shipping</p>
                  <p className="font-semibold">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {order.shippingAddress.city}, {order.shippingAddress.state}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Payment Method</p>
                  <p className="font-semibold capitalize">{order.paymentMethod || 'razorpay'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {order.transactionId ? `Transaction ${order.transactionId.slice(-8)}` : 'Awaiting payment confirmation'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
