"use client";

import { useEffect, useState } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { UserAddress } from '@repo/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

const emptyAddress: UserAddress = { firstName: '', lastName: '', address1: '', address2: '', city: '', state: '', country: 'India', postalCode: '', phone: '', isDefault: false };

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [form, setForm] = useState<UserAddress>(emptyAddress);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => api.get<UserAddress[]>('/auth/addresses').then(setAddresses).catch((error) => toast.error(error.message));
  useEffect(() => { void load(); }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const next = await api.post<UserAddress[]>('/auth/addresses', form);
      setAddresses(next); setForm(emptyAddress); setShowForm(false); toast.success('Address saved');
    } catch (error: any) { toast.error(error.message || 'Could not save address'); }
    finally { setSaving(false); }
  };

  const remove = async (id?: string) => {
    if (!id) return;
    try { setAddresses(await api.delete<UserAddress[]>(`/auth/addresses/${id}`)); toast.success('Address removed'); }
    catch (error: any) { toast.error(error.message || 'Could not remove address'); }
  };

  const fields: Array<[keyof UserAddress, string]> = [['firstName','First name'],['lastName','Last name'],['address1','Street address / house'],['address2','Apartment, suite or landmark'],['city','City'],['state','State'],['postalCode','Pincode'],['phone','Phone']];

  return (
    <div>
      <div className="flex items-center justify-between gap-4"><div><h2 className="text-2xl font-bold">Saved addresses</h2><p className="mt-2 text-gray-500 dark:text-gray-400">Manage delivery addresses for future purchases.</p></div><Button className="rounded-full" onClick={() => setShowForm(!showForm)}><Plus className="mr-2 h-4 w-4" /> Add address</Button></div>
      {showForm && <form onSubmit={save} className="mt-8 grid gap-4 border border-gray-200 p-6 md:grid-cols-2 dark:border-white/10">
        {fields.map(([key,label]) => <label key={key} className={key === 'address1' || key === 'address2' ? 'md:col-span-2 text-sm font-semibold' : 'text-sm font-semibold'}>{label}<input required={key !== 'address2' && key !== 'phone'} value={String(form[key] || '')} onChange={(event) => setForm({...form,[key]:event.target.value})} className="mt-2 w-full border border-gray-300 bg-transparent px-4 py-3 outline-none focus:border-black dark:border-white/20 dark:focus:border-white" /></label>)}
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.isDefault} onChange={(event) => setForm({...form,isDefault:event.target.checked})} /> Make this my default address</label>
        <div className="md:col-span-2 flex gap-3"><Button disabled={saving} className="rounded-full px-8">{saving ? 'Saving...' : 'Save address'}</Button><Button type="button" variant="outline" className="rounded-full" onClick={() => setShowForm(false)}>Cancel</Button></div>
      </form>}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {addresses.map((address) => <article key={address._id} className="border border-gray-200 p-6 dark:border-white/10"><div className="flex justify-between gap-4"><MapPin className="h-5 w-5" />{address.isDefault && <span className="text-xs font-bold uppercase">Default</span>}</div><p className="mt-5 font-bold">{address.firstName} {address.lastName}</p><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{address.address1}{address.address2 ? `, ${address.address2}` : ''}<br />{address.city}, {address.state} {address.postalCode}<br />{address.country}{address.phone ? ` · ${address.phone}` : ''}</p><button onClick={() => remove(address._id)} className="mt-5 flex items-center gap-2 text-sm font-semibold text-red-600"><Trash2 className="h-4 w-4" /> Remove</button></article>)}
        {addresses.length === 0 && !showForm && <div className="border border-dashed border-gray-300 p-10 text-center text-gray-500 dark:border-white/20">No saved addresses yet.</div>}
      </div>
    </div>
  );
}
