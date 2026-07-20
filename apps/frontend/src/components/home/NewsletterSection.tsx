"use client";

import { FormEvent, useState } from 'react';
import { ArrowRight, Check, Mail } from 'lucide-react';
import { api } from '@/lib/api';

type NewsletterSectionProps = {
  storeId: string;
  title: string;
  subtitle?: string;
  buttonLabel?: string;
  consentText?: string;
};

export function NewsletterSection({ storeId, title, subtitle, buttonLabel = 'Join now', consentText }: NewsletterSectionProps) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      await api.post(`/stores/${storeId}/newsletter`, { email, consent });
      setStatus('success');
      setMessage('You are on the list.');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to subscribe right now.');
    }
  };

  return (
    <section className="bg-zinc-950 px-4 py-16 text-white md:px-8 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-end">
        <div>
          <Mail className="mb-7 h-9 w-9" />
          <h2 className="max-w-2xl text-4xl font-semibold md:text-5xl">{title}</h2>
          {subtitle && <p className="mt-4 max-w-xl text-lg leading-7 text-zinc-400">{subtitle}</p>}
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              aria-label="Email address for newsletter"
              className="min-h-14 flex-1 rounded-full border border-white/25 bg-transparent px-6 text-white outline-none placeholder:text-zinc-500 focus:border-white"
            />
            <button disabled={status === 'loading'} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-7 font-semibold text-black hover:bg-zinc-200 disabled:opacity-60">
              {status === 'loading' ? 'Joining...' : buttonLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-400">
            <input required type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4 rounded" />
            <span>{consentText || 'I agree to receive store news and promotional email. I can unsubscribe at any time.'}</span>
          </label>
          {message && (
            <p role="status" className={`flex items-center gap-2 text-sm ${status === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>
              {status === 'success' && <Check className="h-4 w-4" />}
              {message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
