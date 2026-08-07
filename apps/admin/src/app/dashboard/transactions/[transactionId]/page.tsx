"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CreditCard, RefreshCcw } from 'lucide-react';
import type { Transaction } from '@repo/types';
import { useRefundTransaction, useTransaction } from '@/hooks/useTransactions';
import { Button, Card } from '@/components';

export default function TransactionDetailPage() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const { data, isLoading } = useTransaction(transactionId);
  const refund = useRefundTransaction();
  const transaction = data?.data as Transaction | undefined;
  if (isLoading) return <p className="text-muted-foreground">Loading transaction...</p>;
  if (!transaction) return <Card className="p-8">Transaction not found.</Card>;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><Link href="/dashboard/transactions" className="mb-3 inline-flex items-center text-sm text-muted-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Transactions</Link><h1 className="text-3xl font-bold">Payment reconciliation</h1><p className="mt-1 font-mono text-sm text-muted-foreground">{transaction._id}</p></div>{transaction.status === 'captured' && <Button variant="destructive" disabled={refund.isPending} onClick={() => { if (window.confirm('Refund this captured payment in full? This cannot be undone.')) refund.mutate(transaction._id); }}><RefreshCcw className="mr-2 h-4 w-4" />{refund.isPending ? 'Refunding...' : 'Issue full refund'}</Button>}</div>
    <div className="grid gap-6 md:grid-cols-3"><Card className="p-6"><CreditCard className="h-5 w-5" /><p className="mt-4 text-sm text-muted-foreground">Amount</p><p className="text-2xl font-bold">₹{transaction.amount.toLocaleString('en-IN')}</p></Card><Card className="p-6"><p className="text-sm text-muted-foreground">Status</p><p className="mt-2 text-xl font-bold capitalize">{transaction.status}</p><p className="mt-2 text-sm capitalize text-muted-foreground">{transaction.method || 'Unknown method'}</p></Card><Card className="p-6"><p className="text-sm text-muted-foreground">Order</p><Link href={`/dashboard/orders/${transaction.orderId}`} className="mt-2 block break-all font-mono text-sm underline">{transaction.orderId}</Link></Card></div>
    <Card className="p-6"><h2 className="font-semibold">Provider references</h2><dl className="mt-5 grid gap-4 text-sm md:grid-cols-2"><div><dt className="text-muted-foreground">Razorpay order</dt><dd className="mt-1 break-all font-mono">{transaction.razorpayOrderId}</dd></div><div><dt className="text-muted-foreground">Razorpay payment</dt><dd className="mt-1 break-all font-mono">{transaction.razorpayPaymentId || '-'}</dd></div><div><dt className="text-muted-foreground">Customer email</dt><dd className="mt-1">{transaction.email || '-'}</dd></div><div><dt className="text-muted-foreground">Created</dt><dd className="mt-1">{new Date(transaction.createdAt).toLocaleString()}</dd></div>{transaction.errorDescription && <div className="md:col-span-2"><dt className="text-red-500">Failure</dt><dd className="mt-1">{transaction.errorCode}: {transaction.errorDescription}</dd></div>}</dl></Card>
  </div>;
}
