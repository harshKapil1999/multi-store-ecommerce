"use client";

import { useStore } from '@/lib/store-context';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Package, ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';

export default function OrderSuccessPage() {
  const { store } = useStore();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  if (!store) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-black pt-20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-20 flex flex-col items-center text-center max-w-2xl">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-8">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        
        <h1 className="text-4xl font-black italic tracking-tighter uppercase transform -skew-x-12 mb-4">
          Order Confirmed
        </h1>
        
        <p className="text-xl font-medium mb-2">Thanks for your purchase!</p>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Your order #{orderId?.slice(-8).toUpperCase() || 'SUCCESS'} has been placed successfully. 
          We'll send you a confirmation email with all the details and tracking information soon.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <Link href={`/${store.slug}`} className="w-full">
            <Button className="w-full py-6 rounded-full font-bold">
              Continue Shopping
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href={`/${store.slug}/orders`} className="w-full">
            <Button variant="outline" className="w-full py-6 rounded-full font-bold">
              View Order Status
              <Package className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>

        <div className="mt-16 p-8 border border-gray-100 dark:border-white/10 rounded-2xl bg-gray-50 dark:bg-white/5 w-full text-left">
          <h3 className="font-bold mb-4 uppercase text-sm tracking-widest text-gray-400">Need Help?</h3>
          <div className="space-y-2 text-sm">
            <p>Email us at: support@{store.slug}.com</p>
            <p>Call us: +91 1800-NIKE-SHOP</p>
            <p className="pt-2 text-xs text-gray-500">Available Mon-Sat, 9AM-6PM IST</p>
          </div>
        </div>
      </main>
    </div>
  );
}
