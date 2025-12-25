"use client";

import { useState } from 'react';
import { useCart } from '@/lib/cart-store';
import { useStore } from '@/lib/store-context';
import { Button } from '@/components/ui/Button';
import { ShoppingBag, ChevronRight, Truck, CreditCard, Lock } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const { store } = useStore();
  const { items, getSubtotal, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    state: '',
  });

  const subtotal = getSubtotal();
  const delivery = subtotal > 2500 ? 0 : 1250;
  const total = subtotal + delivery;

  if (!store || items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Your bag is empty</h1>
        <Link href="/">
           <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create order in backend
      const orderPayload = {
        storeId: store._id,
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          selectedAttributes: item.selectedAttributes,
        })),
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        },
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          addressLine1: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: 'India',
        },
        billingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          addressLine1: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: 'India',
        },
        paymentMethod: 'razorpay',
      };

      const { data: order } = await api.post<{ success: boolean; data: any }>('/orders', orderPayload);

      // 2. Create Razorpay order
      const { data: razorpayData } = await api.post<{ success: boolean; data: any }>('/payment/create-order', {
        amount: total,
        currency: 'INR',
        orderId: order._id,
        storeId: store._id,
        notes: {
          customer_email: formData.email,
          customer_phone: formData.phone,
        }
      });

      // 3. Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || 'rzp_test_placeholder', // Should be in env
          amount: razorpayData.amount,
          currency: razorpayData.currency,
          name: store.name,
          description: `Order #${order.orderNumber}`,
          image: store.logo,
          order_id: razorpayData.razorpayOrderId,
          handler: async function (response: any) {
            // 4. Verify payment
            const verifyPayload = {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            };

            const verifyResult = await api.post<{ success: boolean; data: any }>('/payment/verify', verifyPayload);

            if (verifyResult.success) {
              clearCart();
              router.push(`/${store.slug}/order-success?orderId=${order._id}`);
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          },
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: "#000000",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        setLoading(false);
      };
      document.body.appendChild(script);

    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Something went wrong during checkout');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <header className="flex justify-between items-center mb-12 border-b border-gray-100 dark:border-white/10 pb-6">
          <Link href={`/${store.slug}`}>
            <span className="text-2xl font-black italic tracking-tighter uppercase">{store.name}</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href={`/${store.slug}/bag`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-black">
              <ShoppingBag size={18} />
              <span>Back to Bag</span>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h2 className="text-2xl font-semibold mb-8">How would you like to get your order?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-black p-6 rounded-xl flex items-center gap-4">
                  <Truck className="w-8 h-8" />
                  <div>
                    <span className="font-bold block">Deliver It</span>
                    <span className="text-sm text-gray-500">To your address</span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-8">Enter your name and address:</h2>
              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required name="firstName" placeholder="First Name" className="w-full p-4 border border-gray-300 rounded-md" value={formData.firstName} onChange={handleInputChange} />
                  <input required name="lastName" placeholder="Last Name" className="w-full p-4 border border-gray-300 rounded-md" value={formData.lastName} onChange={handleInputChange} />
                </div>
                <input required name="address" placeholder="Address Line 1" className="w-full p-4 border border-gray-300 rounded-md" value={formData.address} onChange={handleInputChange} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required name="city" placeholder="City" className="w-full p-4 border border-gray-300 rounded-md" value={formData.city} onChange={handleInputChange} />
                  <input required name="pincode" placeholder="Pincode" className="w-full p-4 border border-gray-300 rounded-md" value={formData.pincode} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required name="state" placeholder="State" className="w-full p-4 border border-gray-300 rounded-md" value={formData.state} onChange={handleInputChange} />
                  <input name="country" value="India" disabled className="w-full p-4 border border-gray-300 rounded-md bg-gray-50" />
                </div>

                <h2 className="text-2xl font-semibold mt-12 mb-8">What's your contact information?</h2>
                <div className="space-y-4">
                  <input required type="email" name="email" placeholder="Email" className="w-full p-4 border border-gray-300 rounded-md" value={formData.email} onChange={handleInputChange} />
                  <input required name="phone" placeholder="Phone Number" className="w-full p-4 border border-gray-300 rounded-md" value={formData.phone} onChange={handleInputChange} />
                </div>

                <Button disabled={loading} type="submit" className="w-full py-8 mt-12 rounded-full text-lg font-bold">
                  {loading ? 'Processing...' : `Continue to Pay ₹ ${total.toLocaleString('en-IN')}`}
                </Button>
              </form>
            </section>
          </div>

          {/* Order Summary Summary (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              <h2 className="text-2xl font-semibold">Order Summary</h2>
              
              <div className="space-y-4 border-b border-gray-100 dark:border-white/10 pb-6">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>₹ {subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Delivery/Shipping</span>
                  <span>{delivery === 0 ? "Free" : `₹ ${delivery.toLocaleString('en-IN')}`}</span>
                </div>
                <div className="flex justify-between text font-bold pt-4">
                  <span>Total</span>
                  <span>₹ {total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold">Arrives by Thu, Dec 26 - Wed, Jan 1</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.variantId}`} className="flex gap-4">
                      <img src={item.product?.featuredImage} alt={item.product?.name} className="w-20 h-20 object-cover" />
                      <div className="text-xs space-y-1">
                        <p className="font-bold uppercase">{item.product?.name}</p>
                        <p className="text-gray-500">Qty {item.quantity}</p>
                        {item.selectedAttributes && Object.entries(item.selectedAttributes).map(([k,v]) => (
                           <p key={k} className="text-gray-500 uppercase">{k} {v}</p>
                        ))}
                        <p className="text-gray-500">₹ {(item.variant?.price || item.product?.sellingPrice || 0).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100 dark:border-white/10 flex items-center gap-2 text-xs text-gray-400">
                <Lock size={14} />
                <p>Secure payment with SSL encryption and 256-bit security</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
