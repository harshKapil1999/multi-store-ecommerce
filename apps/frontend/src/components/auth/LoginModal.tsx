"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Mail, Lock, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { toast } from 'sonner';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post<any>('/auth/login', { email, password });
      
      if (response.token && response.user) {
        setAuth(response.user, response.token);
        toast.success('Logged in successfully');
        onSuccess();
        onClose();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      alert(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
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

        <div className="mb-8">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Member Login</h2>
          <p className="text-gray-500 dark:text-gray-400">Sign in to speed up your checkout process.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                required
                type="password"
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button 
            disabled={loading}
            type="submit" 
            className="w-full py-6 mt-4 rounded-full font-bold flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
          </Button>
        </form>

        <div className="mt-8 text-center">
           <p className="text-sm text-gray-500">
             Not a member? <button className="font-bold text-black dark:text-white underline">Join Us</button>
           </p>
        </div>
      </div>
    </div>
  );
}
