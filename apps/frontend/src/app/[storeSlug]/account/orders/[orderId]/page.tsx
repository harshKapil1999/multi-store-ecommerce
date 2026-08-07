"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Download, ExternalLink, Package } from 'lucide-react';
import type { Order } from '@repo/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export default function CustomerOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get<Order>(`/orders/${orderId}`).then(setOrder).catch((reason) => setError(reason.message)); }, [orderId]);
  if (error) return <p className="text-red-600">{error}</p>;
  if (!order) return <p className="text-gray-500">Loading order...</p>;
  const printInvoice = () => window.print();

  return (
    <div className="space-y-8 print:text-black">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-gray-500">Order #{order.orderNumber}</p><h2 className="mt-1 text-3xl font-bold capitalize">{order.status}</h2><p className="mt-2 text-gray-500">Placed {new Date(order.createdAt).toLocaleString('en-IN')}</p></div><Button variant="outline" className="rounded-full print:hidden" onClick={printInvoice}><Download className="mr-2 h-4 w-4" /> Print / save invoice</Button></div>
      <div className="grid gap-6 md:grid-cols-3"><div className="border border-gray-200 p-5 dark:border-white/10"><p className="text-xs font-bold uppercase text-gray-400">Payment</p><p className="mt-2 font-semibold capitalize">{order.paymentStatus} · {order.paymentMethod}</p><p className="mt-1 break-all text-xs text-gray-500">{order.transactionId || 'Awaiting transaction'}</p></div><div className="border border-gray-200 p-5 dark:border-white/10"><p className="text-xs font-bold uppercase text-gray-400">Total</p><p className="mt-2 text-xl font-bold">₹{order.total.toLocaleString('en-IN')}</p></div><div className="border border-gray-200 p-5 dark:border-white/10"><p className="text-xs font-bold uppercase text-gray-400">Tracking</p><p className="mt-2 font-semibold">{order.fulfillment?.carrier || 'Not dispatched yet'}</p>{order.fulfillment?.trackingUrl && <a href={order.fulfillment.trackingUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm underline">Track parcel <ExternalLink className="h-3 w-3" /></a>}</div></div>
      <section><h3 className="text-xl font-bold">Items</h3><div className="mt-4 divide-y border-y border-gray-200 dark:divide-white/10 dark:border-white/10">{order.items.map((item) => <div key={`${item.productId}-${item.variantId || ''}`} className="flex gap-4 py-5">{item.image ? <img src={item.image} alt="" className="h-20 w-20 bg-gray-100 object-cover" /> : <Package className="h-20 w-20 p-6" />}<div className="flex-1"><p className="font-semibold">{item.name}</p><p className="text-sm text-gray-500">Qty {item.quantity}{item.sku ? ` · ${item.sku}` : ''}</p></div><p className="font-semibold">₹{item.total.toLocaleString('en-IN')}</p></div>)}</div></section>
      <section className="grid gap-6 md:grid-cols-2"><div><h3 className="font-bold">Delivery address</h3><p className="mt-3 text-sm text-gray-500">{order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />{order.shippingAddress.address1}<br />{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />{order.shippingAddress.country}</p></div><div><h3 className="font-bold">Order timeline</h3><div className="mt-3 space-y-4">{order.statusHistory?.slice().reverse().map((entry,index) => <div key={`${entry.status}-${index}`} className="border-l-2 pl-4"><p className="font-semibold capitalize">{entry.status}</p>{entry.note && <p className="text-sm text-gray-500">{entry.note}</p>}<p className="text-xs text-gray-400">{new Date(entry.at).toLocaleString('en-IN')}</p></div>)}</div></div></section>
      <footer className="border-t pt-5 text-xs text-gray-500">Invoice for order {order.orderNumber}. Customer: {order.customer.name} ({order.customer.email}).</footer>
    </div>
  );
}
