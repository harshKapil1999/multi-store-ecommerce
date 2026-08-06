"use client";

import { useState } from 'react';
import { useCart } from '@/lib/cart-store';
import { useStore } from '@/lib/store-context';
import { Button } from '@/components/ui/Button';
import { ShoppingBag, ChevronRight, Truck, CreditCard, Lock } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { OtpModal } from '@/components/auth/OtpModal';
import { useAuth } from '@/lib/auth-store';
import { User, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

type PendingOnlineOrder = {
  _id: string;
  orderNumber?: string;
};

export default function CheckoutPage() {
  const { store } = useStore();
  const { items, getSubtotal, clearCart } = useCart();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingOnlineOrder, setPendingOnlineOrder] = useState<PendingOnlineOrder | null>(null);

  const [formData, setFormData] = useState({
    firstName: user?.name.split(' ')[0] || '',
    lastName: user?.name.split(' ')[1] || '',
    email: user?.email || '',
    phone: user?.addresses?.[0]?.phone || '',
    address: user?.addresses?.[0]?.address1 || '',
    address2: user?.addresses?.[0]?.address2 || '',
    city: user?.addresses?.[0]?.city || '',
    pincode: user?.addresses?.[0]?.postalCode || '',
    state: user?.addresses?.[0]?.state || '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');

  const storeItems = store ? items.filter((item) => item.storeId === store._id) : [];
  const subtotal = store ? getSubtotal(store._id) : 0;
  const delivery = subtotal > 2500 ? 0 : 750; // Updated delivery fee to be more realistic
  const total = subtotal + delivery;

  const buildOrderSuccessUrl = (storeSlug: string, orderId: string, transactionId?: string) => {
    const params = new URLSearchParams({
      orderId,
      email: formData.email,
    });

    if (transactionId) {
      params.set('transactionId', transactionId);
    }

    return `/${storeSlug}/order-success?${params.toString()}`;
  };

  const loadRazorpayCheckout = () => new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Unable to load Razorpay checkout')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load Razorpay checkout'));
    document.body.appendChild(script);
  });

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Store not found</h1>
        <p className="text-gray-500 mb-4">Unable to load the store. Please try again.</p>
        <Link href="/">
           <Button>Go to Home</Button>
        </Link>
      </div>
    );
  }

  if (storeItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Your bag is empty</h1>
        <Link href={`/${store.slug}`}>
           <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const processOrder = async () => {
    setLoading(true);
    try {
      // 1. Create order in backend
      const orderPayload = {
        storeId: store._id,
        items: storeItems.map(item => ({
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
          addressLine2: formData.address2,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: 'India',
        },
        billingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          addressLine1: formData.address,
          addressLine2: formData.address2,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: 'India',
        },
        paymentMethod: paymentMethod,
      };

      let order: PendingOnlineOrder;

      if (paymentMethod === 'razorpay' && pendingOnlineOrder) {
        order = pendingOnlineOrder;
      } else {
        order = await api.post<PendingOnlineOrder>('/orders', orderPayload);

        if (paymentMethod === 'razorpay') {
          setPendingOnlineOrder(order);
        }
      }

      // 2. Handle based on payment method
      if (paymentMethod === 'cod') {
        clearCart(store._id);
        router.push(buildOrderSuccessUrl(store.slug, order._id));
        return;
      }

      // 3. Create Razorpay order (for razorpay payment method)
      await loadRazorpayCheckout();

      const razorpayData = await api.post<any>('/payment/create-order', {
        currency: 'INR',
        orderId: order._id,
        storeId: store._id,
        notes: {
          customer_email: formData.email,
          customer_phone: formData.phone,
        }
      });

      if (!razorpayData.keyId || !razorpayData.razorpayOrderId) {
        throw new Error('Online payment is not configured correctly. Please contact support.');
      }

      await new Promise<void>((resolve, reject) => {
        const options = {
          key: razorpayData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY,
          amount: razorpayData.amount,
          currency: razorpayData.currency,
          name: store.name,
          description: `Order #${order.orderNumber}`,
          image: store.logo,
          order_id: razorpayData.razorpayOrderId,
          handler: async function (response: any) {
            // 5. Verify payment
            const verifyPayload = {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            };

            try {
              const verifyResult = await api.post<any>('/payment/verify', verifyPayload);

              if (verifyResult) {
                setPendingOnlineOrder(null);
                clearCart(store._id);
                router.replace(buildOrderSuccessUrl(store.slug, verifyResult.orderId || order._id, verifyResult.transactionId || razorpayData.transactionId));
                resolve();
              } else {
                reject(new Error('Payment verification failed. Please contact support.'));
              }
            } catch (error) {
              // Razorpay has already reported success. The webhook is authoritative if the
              // browser cannot complete the verification request (network interruptions,
              // capture delay, or a navigation during checkout).
              console.error('Payment verification follow-up failed:', error);
              setPendingOnlineOrder(null);
              clearCart(store._id);
              toast.message('Payment received. We are confirming your order now.');
              router.replace(buildOrderSuccessUrl(store.slug, order._id, razorpayData.transactionId));
              resolve();
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
          modal: {
            ondismiss: () => {
              resolve();
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          reject(new Error(response?.error?.description || 'Payment failed. You can retry from checkout.'));
        });
        rzp.open();
      });

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Something went wrong during checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowOtpModal(true);
      return;
    }

    await processOrder();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black py-12">
      <OtpModal
        key={formData.email}
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onSuccess={() => {
           setShowOtpModal(false);
           processOrder();
        }}
        initialEmail={formData.email}
      />
      <div className="container mx-auto px-4 max-w-7xl">
        <header className="flex justify-between items-center mb-12 border-b border-gray-100 dark:border-white/10 pb-6">
          <Link href={`/${store.slug}`}>
            <span className="text-2xl font-black italic tracking-tighter uppercase">{store.name}</span>
          </Link>
          <div className="flex items-center gap-6">
            {!isAuthenticated ? (
               <button
                 onClick={() => setShowOtpModal(true)}
                 className="text-sm font-bold flex items-center gap-2 hover:text-gray-500 transition-colors"
               >
                 <User size={18} />
                 Verify Email
               </button>
            ) : (
               <div className="text-sm font-bold flex items-center gap-2">
                 <CheckCircle2 size={18} className="text-green-500" />
                 Hi, {user?.name.split(' ')[0]}
               </div>
            )}
            <Link href={`/${store.slug}/bag`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-black">
              <ShoppingBag size={18} />
              <span>Back to Bag</span>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-12">
            {!isAuthenticated && (
              <div className="bg-gray-50 dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold mb-1">Faster Checkout</h3>
                  <p className="text-sm text-gray-500">Verify your email to save your details and track orders.</p>
                </div>
                <Button
                  onClick={() => setShowOtpModal(true)}
                  variant="outline"
                   className="rounded-full px-8"
                >
                  Verify Email
                </Button>
              </div>
            )}

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
                  <input required name="firstName" placeholder="First Name" className="w-full p-4 border border-gray-300 dark:border-white/20 rounded-md bg-transparent dark:text-white" value={formData.firstName} onChange={handleInputChange} />
                  <input required name="lastName" placeholder="Last Name" className="w-full p-4 border border-gray-300 dark:border-white/20 rounded-md bg-transparent dark:text-white" value={formData.lastName} onChange={handleInputChange} />
                </div>
                <input
                  required
                  name="address"
                  placeholder="House number and street address"
                  autoComplete="street-address"
                  className="w-full p-4 border border-gray-300 dark:border-white/20 rounded-md bg-transparent dark:text-white"
                  value={formData.address}
                  onChange={handleInputChange}
                />
                <input
                  name="address2"
                  placeholder="Apartment, suite or landmark (optional)"
                  autoComplete="address-line2"
                  className="w-full p-4 border border-gray-300 dark:border-white/20 rounded-md bg-transparent dark:text-white"
                  value={formData.address2}
                  onChange={handleInputChange}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required name="city" placeholder="City" className="w-full p-4 border border-gray-300 dark:border-white/20 rounded-md bg-transparent dark:text-white" value={formData.city} onChange={handleInputChange} />
                  <input required name="pincode" placeholder="Pincode" className="w-full p-4 border border-gray-300 dark:border-white/20 rounded-md bg-transparent dark:text-white" value={formData.pincode} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required name="state" placeholder="State" className="w-full p-4 border border-gray-300 dark:border-white/20 rounded-md bg-transparent dark:text-white" value={formData.state} onChange={handleInputChange} />
                  <input name="country" value="India" disabled className="w-full p-4 border border-gray-300 dark:border-white/10 rounded-md bg-gray-50 dark:bg-white/5 dark:text-white/50" />
                </div>

                <h2 className="text-2xl font-semibold mt-12 mb-8">What&apos;s your contact information?</h2>
                <div className="space-y-4">
                  <input required type="email" name="email" placeholder="Email" className="w-full p-4 border border-gray-300 dark:border-white/20 rounded-md bg-transparent dark:text-white" value={formData.email} onChange={handleInputChange} />
                  <input required name="phone" placeholder="Phone Number" className="w-full p-4 border border-gray-300 dark:border-white/20 rounded-md bg-transparent dark:text-white" value={formData.phone} onChange={handleInputChange} />
                </div>

                <h2 className="text-2xl font-semibold mt-12 mb-8">Payment Method</h2>
                <div className="space-y-4">
                   <div
                     onClick={() => setPaymentMethod('razorpay')}
                     className={`p-6 border-2 rounded-xl cursor-pointer transition-all flex items-center gap-4 ${paymentMethod === 'razorpay' ? 'border-black dark:border-white bg-black/5' : 'border-gray-200 dark:border-white/10'}`}
                   >
                     <CreditCard className="w-6 h-6" />
                     <div className="flex-1">
                        <span className="font-bold block">Online Payment</span>
                        <span className="text-sm text-gray-500">Razorpay (Cards, UPI, Netbanking)</span>
                     </div>
                     {paymentMethod === 'razorpay' && <div className="w-4 h-4 bg-black dark:bg-white rounded-full" />}
                   </div>

                   <div
                     onClick={() => setPaymentMethod('cod')}
                     className={`p-6 border-2 rounded-xl cursor-pointer transition-all flex items-center gap-4 ${paymentMethod === 'cod' ? 'border-black dark:border-white bg-black/5' : 'border-gray-200 dark:border-white/10'}`}
                   >
                     <ShoppingBag className="w-6 h-6" />
                     <div className="flex-1">
                        <span className="font-bold block">Cash on Delivery</span>
                        <span className="text-sm text-gray-500">Pay when you receive your order</span>
                     </div>
                     {paymentMethod === 'cod' && <div className="w-4 h-4 bg-black dark:bg-white rounded-full" />}
                   </div>
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
                <h3 className="font-bold">Delivery estimate</h3>
                <p className="text-sm text-gray-500">The confirmed delivery timeline will be included with your order update.</p>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {storeItems.map((item) => (
                    <div key={`${item.productId}-${item.variantId}`} className="flex gap-4">
                      <img src={item.variant?.images?.[item.variant?.featuredImageIndex || 0] || item.product?.featuredImage} alt={item.product?.name} className="w-20 h-20 object-cover" />
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
                <p>Online payments are completed in Razorpay&apos;s secure checkout.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
