"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Mail, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { toast } from 'sonner';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialEmail?: string;
}

export function OtpModal({ isOpen, onClose, onSuccess, initialEmail = '' }: OtpModalProps) {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post<any>('/users/send-otp', { email });
      toast.success('OTP sent to your email!');
      setStep('otp');
    } catch (error: any) {
      console.error('Send OTP error:', error);
      toast.error(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post<any>('/users/verify-otp', { 
        email, 
        otp,
        name: name || email.split('@')[0]
      });
      
      if (response.token && response.user) {
        setAuth(response.user, response.token);
        toast.success('Verified successfully!');
        onSuccess();
        onClose();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      toast.error(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setOtp('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>

        {step === 'otp' && (
          <button 
            onClick={handleBack}
            className="absolute top-6 left-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        <div className="mb-8">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">
            {step === 'email' ? 'Quick Checkout' : 'Verify OTP'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {step === 'email' 
              ? 'Enter your email to receive a verification code'
              : `We sent a code to ${email}`
            }
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  required
                  type="email"
                  placeholder="email@example.com"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Name (Optional)</label>
              <input 
                type="text"
                placeholder="Your name"
                className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <Button 
              disabled={loading}
              type="submit" 
              className="w-full py-6 mt-4 rounded-full font-bold"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Enter 6-Digit Code</label>
              <input 
                required
                type="text"
                placeholder="000000"
                maxLength={6}
                pattern="\d{6}"
                className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-center text-2xl tracking-widest font-bold"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <Button 
              disabled={loading || otp.length !== 6}
              type="submit" 
              className="w-full py-6 mt-4 rounded-full font-bold"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </Button>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full text-sm text-gray-500 hover:text-black dark:hover:text-white underline"
            >
              Resend Code
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
