'use client';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button, Card, FormInput } from '@/components/index';

type Shipment = { state: string; providerOrderId?: string; providerShipmentId?: string; awb?: string; courier?: string; labelUrl?: string; pickupScheduled?: boolean; lastStatus?: string };
type Rate = { id: number; name: string; rate: number; estimatedDays: string };
export function ShiprocketPanel({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [rates, setRates] = useState<Rate[]>([]);
  const [courierId, setCourierId] = useState('');
  const [providerOrderId, setProviderOrderId] = useState('');
  const [parcel, setParcel] = useState({ pickupLocation: '', pickupPincode: '', weight: '', length: '', breadth: '', height: '' });
  const url = `/orders/${orderId}/shipment`;
  async function load() {
    const { data } = await apiClient.get(url);
    setShipment(data.data.shipment); setConfigured(data.data.configured);
  }
  useEffect(() => { load().catch(() => setError('Could not load shipping details.')); }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps
  const parcelBody = () => ({ ...parcel, weight: Number(parcel.weight), length: Number(parcel.length), breadth: Number(parcel.breadth), height: Number(parcel.height) });
  async function action(kind: string) {
    setBusy(true); setError('');
    try {
      if (kind === 'refresh') await load();
      else {
        const body = kind === 'rates' || kind === 'create' ? parcelBody() : kind === 'assign' ? { courierId: Number(courierId) } : kind === 'reconcile' ? { providerOrderId } : {};
        const { data } = await apiClient.post(kind === 'create' ? url : `${url}/${kind}`, body);
        if (kind === 'rates') setRates(data.data); else { await load(); await queryClient.invalidateQueries({ queryKey: ['orders'] }); }
      }
    } catch (e: any) { setError(e.response?.data?.message || 'Shipping request failed. Refresh and check its status.'); }
    finally { setBusy(false); }
  }
  return <Card className="p-6 space-y-4 print:hidden">
    <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Shiprocket delivery</h2><Button variant="outline" disabled={busy} onClick={() => action('refresh')}>Refresh</Button></div>
    {!configured && <p className="text-sm text-amber-700">Shipping setup is incomplete. Add your Shiprocket API credentials, finish KYC, and fund the shipping wallet to dispatch orders.</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {shipment && <div className="text-sm space-y-1"><p>Status: {shipment.lastStatus || shipment.state.replaceAll('_', ' ')}</p>{shipment.providerOrderId && <p>Shiprocket order: {shipment.providerOrderId}</p>}{shipment.awb && <p>{shipment.courier} · Tracking: {shipment.awb}</p>}{shipment.pickupScheduled && <p>Pickup scheduled</p>}</div>}
    {(!shipment || (shipment.state === 'created' && !shipment.awb)) && <>
      <p className="text-sm text-muted-foreground">Enter the packed parcel’s actual weight and dimensions. Pickup name must match your Shiprocket pickup address.</p>
      <div className="grid grid-cols-2 gap-3">{(Object.keys(parcel) as Array<keyof typeof parcel>).map(key => <FormInput key={key} label={({ pickupLocation: 'Pickup location name', pickupPincode: 'Pickup pincode', weight: 'Weight (kg)', length: 'Length (cm)', breadth: 'Breadth (cm)', height: 'Height (cm)' })[key]} type={['pickupLocation', 'pickupPincode'].includes(key) ? 'text' : 'number'} value={parcel[key]} onChange={e => setParcel({ ...parcel, [key]: e.target.value })} />)}</div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy || !configured} onClick={() => action('rates')}>Check couriers & rates</Button>{!shipment && <Button disabled={busy || !configured} onClick={() => action('create')}>Create shipment</Button>}</div>
      {rates.length > 0 && <label className="block text-sm">Courier<select className="mt-1 w-full rounded border bg-background p-2" value={courierId} onChange={e => setCourierId(e.target.value)}><option value="">Choose a courier</option>{rates.map(rate => <option key={rate.id} value={rate.id}>{rate.name} · ₹{rate.rate} · {rate.estimatedDays} days</option>)}</select></label>}
      {shipment && <Button disabled={busy || !configured || !courierId} onClick={() => action('assign')}>Assign selected courier</Button>}
    </>}
    {shipment?.state === 'created' && shipment.awb && <div className="flex flex-wrap gap-2"><Button disabled={busy || !configured || shipment.pickupScheduled} onClick={() => action('pickup')}>{shipment.pickupScheduled ? 'Pickup scheduled' : 'Schedule pickup'}</Button><Button variant="outline" disabled={busy || !configured} onClick={() => action('label')}>Generate label</Button>{shipment.labelUrl?.startsWith('https://') && <a className="underline self-center" href={shipment.labelUrl} target="_blank" rel="noreferrer">Open shipping label</a>}</div>}
    {shipment && ['creating', 'needs_review', 'cancellation_pending'].includes(shipment.state) && <div className="space-y-2"><p className="text-sm">Check this order in Shiprocket before another shipping action. Enter its Shiprocket order ID to reconcile the result.</p><FormInput label="Shiprocket order ID" value={providerOrderId} onChange={e => setProviderOrderId(e.target.value)} /><Button disabled={busy || !configured || !providerOrderId} onClick={() => action('reconcile')}>Reconcile shipment</Button></div>}
    {shipment?.state === 'created' && <Button variant="outline" disabled={busy || !configured} onClick={() => action('cancel')}>Request shipment cancellation</Button>}
  </Card>;
}
