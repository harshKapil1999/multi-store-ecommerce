'use client';

import { useSelectedStore } from '@/contexts/store-context';
import { useTransactions } from '@/hooks/useTransactions';
import { DataTable, Card } from '@/components/index';
import type { ColumnDef } from '@tanstack/react-table';
import type { Transaction } from '@repo/types';
import { CreditCard, DollarSign } from 'lucide-react';

export default function TransactionsPage() {
  const { selectedStoreId } = useSelectedStore();
  const { data, isLoading } = useTransactions(selectedStoreId || undefined);

  const transactions = (data || []) as Transaction[];

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'razorpayPaymentId',
      header: 'Payment ID',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.razorpayPaymentId}</span>
      ),
    },
    {
      accessorKey: 'orderId',
      header: 'Order',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.orderId}</span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-semibold text-green-600 dark:text-green-400">
          ₹{(row.original.amount / 100).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`capitalize inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.original.status === 'captured'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : row.original.status === 'failed'
              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
          }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'method',
      header: 'Method',
      cell: ({ row }) => (
        <span className="text-sm capitalize">{row.original.method || '-'}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.original.createdAt).toLocaleString()}
        </span>
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
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">Track all payments and refunds</p>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {transactions.length} transaction(s)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Captured</p>
              <p className="text-2xl font-bold">
                ₹{(transactions
                  .filter(t => t.status === 'captured')
                  .reduce((acc, t) => acc + t.amount, 0) / 100).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <DataTable<Transaction>
          columns={columns}
          data={transactions}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
}
