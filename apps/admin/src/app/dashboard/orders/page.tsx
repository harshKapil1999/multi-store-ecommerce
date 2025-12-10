'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelectedStore } from '@/contexts/store-context';
import { useOrders } from '@/hooks/useOrders';
import { DataTable, Button, Card, FormSelect } from '@/components/index';
import type { ColumnDef } from '@tanstack/react-table';
import type { Order, OrderStatus } from '@repo/types';
import { Eye, Package } from 'lucide-react';

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
};

export default function OrdersPage() {
  const router = useRouter();
  const { selectedStoreId } = useSelectedStore();
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const { data, isLoading } = useOrders(selectedStoreId || undefined, {
    status: statusFilter ? (statusFilter as OrderStatus) : undefined,
  });

  const orders = (data?.data?.data || []) as Order[];

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'orderNumber',
      header: 'Order #',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.orderNumber}</span>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.customer.name}</p>
          <p className="text-sm text-muted-foreground">{row.original.customer.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'items',
      header: 'Items',
      cell: ({ row }) => (
        <span>{row.original.items.length} item(s)</span>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <span className="font-semibold">${row.original.total.toFixed(2)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            statusColors[row.original.status]
          }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Payment',
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.original.paymentStatus === 'paid'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
          }`}
        >
          {row.original.paymentStatus}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/orders/${row.original._id}`)}
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (!selectedStoreId) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Please select a store first</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {orders.length} order(s)
          </span>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <FormSelect
            placeholder="All Statuses"
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'processing', label: 'Processing' },
              { value: 'shipped', label: 'Shipped' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'refunded', label: 'Refunded' },
            ]}
            value={statusFilter}
            onValueChange={setStatusFilter}
          />
        </div>

        <DataTable<Order>
          columns={columns}
          data={orders}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
}
