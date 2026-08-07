"use client";

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { User } from '@repo/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Button } from '@/components/ui/Button';

export default function ProfilePage() {
  const { setAuth, token } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<User>('/auth/me').then((data) => { setProfile(data); setName(data.name); }).catch((error) => toast.error(error.message));
  }, []);

  const save = async () => {
    if (!profile || !token) return;
    setSaving(true);
    try {
      const updated = await api.put<User>('/auth/profile', { name });
      setProfile(updated);
      setAuth(updated, token);
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error(error.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold">Personal details</h2>
      <p className="mt-2 text-gray-500 dark:text-gray-400">Your verified email connects purchases and delivery updates to this account.</p>
      <div className="mt-8 space-y-5 border border-gray-200 p-6 dark:border-white/10">
        <label className="block text-sm font-semibold">Name
          <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full border border-gray-300 bg-transparent px-4 py-3 outline-none focus:border-black dark:border-white/20 dark:focus:border-white" />
        </label>
        <label className="block text-sm font-semibold">Verified email
          <input value={profile?.email || ''} readOnly className="mt-2 w-full border border-gray-200 bg-gray-50 px-4 py-3 text-gray-500 dark:border-white/10 dark:bg-white/5" />
        </label>
        <Button onClick={save} disabled={saving || !name.trim()} className="rounded-full px-8">{saving ? 'Saving...' : 'Save details'}</Button>
      </div>
    </div>
  );
}
