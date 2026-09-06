import { redirect } from 'next/navigation';
export default async function TrackOrder({params}:{params:Promise<{storeSlug:string}>}) { const {storeSlug} = await params; redirect(`/${storeSlug}/account/orders`); }
