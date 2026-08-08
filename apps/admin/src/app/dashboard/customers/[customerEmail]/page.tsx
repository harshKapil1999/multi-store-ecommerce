'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Mail, MapPin, Package, Phone, User } from 'lucide-react';
import { Button, Card } from '@/components/index';
import { useSelectedStore } from '@/contexts/store-context';
import { useCustomer } from '@/hooks/useCustomers';

export default function CustomerDetailPage() {
  const params = useParams<{ customerEmail: string }>();
  const router = useRouter();
  const { selectedStoreId } = useSelectedStore();
  const email = decodeURIComponent(params.customerEmail || '');
  const { data: customer, isLoading } = useCustomer(selectedStoreId || undefined, email);

  if (isLoading) {
    return <div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!customer) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Customer not found for this store</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/dashboard/customers')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/customers')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{customer.name || 'Guest customer'}</h1>
          <p className="text-muted-foreground">Customer history for the selected store</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 md:col-span-2">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold"><User className="h-5 w-5" /> Contact details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs uppercase text-muted-foreground">Email</p><p className="mt-1 flex items-center gap-2"><Mail className="h-4 w-4" />{customer.email}</p></div>
            <div><p className="text-xs uppercase text-muted-foreground">Phone</p><p className="mt-1 flex items-center gap-2"><Phone className="h-4 w-4" />{customer.phone || 'Not provided'}</p></div>
            <div><p className="text-xs uppercase text-muted-foreground">First order</p><p className="mt-1">{new Date(customer.firstOrderAt).toLocaleString()}</p></div>
            <div><p className="text-xs uppercase text-muted-foreground">Last order</p><p className="mt-1">{new Date(customer.lastOrderAt).toLocaleString()}</p></div>
          </div>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Lifetime value</p>
          <p className="mt-1 text-3xl font-bold">₹{customer.totalSpent.toLocaleString('en-IN')}</p>
          <p className="mt-5 text-sm text-muted-foreground">Orders</p>
          <p className="mt-1 text-2xl font-semibold">{customer.orderCount}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold"><MapPin className="h-5 w-5" /> Addresses used at checkout</h2>
        {customer.addresses.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {customer.addresses.map((address, index) => (
              <div key={`${address.address1}-${address.postalCode}-${index}`} className="rounded-md border p-4 text-sm">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{address.source}</p>
                <p className="font-medium">{address.firstName} {address.lastName}</p>
                <p>{address.address1}</p>
                {address.address2 && <p>{address.address2}</p>}
                <p>{address.city}, {address.state} {address.postalCode}</p>
                <p>{address.country}</p>
                {address.phone && <p className="mt-2">{address.phone}</p>}
              </div>
            ))}
          </div>
        ) : <p className="text-muted-foreground">No address has been recorded.</p>}
      </Card>

      <Card className="p-6">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold"><Package className="h-5 w-5" /> Order history</h2>
        <div className="divide-y rounded-md border">
          {customer.orders.map((order) => (
            <Link key={order._id} href={`/dashboard/orders/${order._id}`} className="grid gap-2 p-4 transition-colors hover:bg-muted/50 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-6">
              <div><p className="font-mono text-sm font-medium">{order.orderNumber}</p><p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p></div>
              <p className="text-sm">{order.items.length} item(s)</p>
              <p className="text-sm capitalize">{order.status}</p>
              <p className="font-semibold">₹{order.total.toLocaleString('en-IN')}</p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
