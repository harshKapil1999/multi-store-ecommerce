'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import type { CustomerSummary } from '@repo/types';
import { Eye, MapPin, Users } from 'lucide-react';
import { Button, Card, DataTable } from '@/components/index';
import { useSelectedStore } from '@/contexts/store-context';
import { useCustomers } from '@/hooks/useCustomers';

const formatAddress = (customer: CustomerSummary) => {
  const address = customer.latestShippingAddress;
  if (!address) return 'No address recorded';
  return [address.city, address.state, address.postalCode].filter(Boolean).join(', ');
};

export default function CustomersPage() {
  const router = useRouter();
  const { selectedStoreId } = useSelectedStore();
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const { data, isLoading } = useCustomers(selectedStoreId || undefined, {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: search || undefined,
  });

  const customers = data?.data || [];
  const pageCount = data?.totalPages || 1;
  const columns: ColumnDef<CustomerSummary>[] = [
    {
      accessorKey: 'name',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name || 'Guest customer'}</p>
          <p className="text-sm text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => row.original.phone || '-',
    },
    {
      accessorKey: 'orderCount',
      header: 'Orders',
      cell: ({ row }) => <span className="font-medium">{row.original.orderCount}</span>,
    },
    {
      accessorKey: 'totalSpent',
      header: 'Total spent',
      cell: ({ row }) => (
        <span className="font-semibold">₹{row.original.totalSpent.toLocaleString('en-IN')}</span>
      ),
    },
    {
      id: 'address',
      header: 'Latest delivery area',
      cell: ({ row }) => (
        <span className="inline-flex max-w-xs items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {formatAddress(row.original)}
        </span>
      ),
    },
    {
      accessorKey: 'lastOrderAt',
      header: 'Last order',
      cell: ({ row }) => (
        <div>
          <p className="text-sm">{new Date(row.original.lastOrderAt).toLocaleDateString()}</p>
          <p className="text-xs capitalize text-muted-foreground">{row.original.lastOrderStatus}</p>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          title="View customer"
          onClick={() => router.push(`/dashboard/customers/${encodeURIComponent(row.original.email)}`)}
        >
          <Eye className="h-4 w-4" />
        </Button>
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Contact, address, order, and spend history for this store</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-5 w-5" />
          {data?.total || 0} customer(s)
        </div>
      </div>

      <Card className="p-6">
        <DataTable<CustomerSummary>
          columns={columns}
          data={customers}
          isLoading={isLoading}
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          pageCount={pageCount}
          onPaginationChange={setPagination}
          globalFilter={search}
          onGlobalFilterChange={(value) => {
            setSearch(value);
            setPagination((current) => ({ ...current, pageIndex: 0 }));
          }}
        />
      </Card>
    </div>
  );
}
