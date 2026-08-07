'use client';

import { useState } from 'react';
import { Loader2, LockKeyhole, Mail, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card } from '@/components/index';
import { useAuth } from '@/hooks/useAuth';
import { sendAdminPasswordReset } from '@/lib/firebase/client';

export default function ProfilePage() {
  const { user } = useAuth();
  const [sendingReset, setSendingReset] = useState(false);

  const requestPasswordReset = async () => {
    if (!user?.email) return;

    setSendingReset(true);
    try {
      await sendAdminPasswordReset(user.email);
      toast.success('Firebase password reset email sent');
    } catch (error: any) {
      toast.error(error.message || 'Could not send the password reset email');
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Your administrator identity and sign-in security.</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <User className="h-8 w-8" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold">{user?.name || user?.email?.split('@')[0] || 'Administrator'}</h2>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{user?.role}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="border border-border p-5">
            <Mail className="h-5 w-5" />
            <p className="mt-4 text-sm font-semibold">Sign-in email</p>
            <p className="mt-1 break-all text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="border border-border p-5">
            <ShieldCheck className="h-5 w-5" />
            <p className="mt-4 text-sm font-semibold">Authentication provider</p>
            <p className="mt-1 text-sm text-muted-foreground">Firebase Authentication</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-3">
          <LockKeyhole className="mt-0.5 h-5 w-5" />
          <div>
            <h2 className="font-semibold">Password security</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Password changes are handled by Firebase. A reset link will be sent to the authenticated admin email.
            </p>
          </div>
        </div>
        <Button className="mt-6" onClick={requestPasswordReset} disabled={sendingReset || !user?.email}>
          {sendingReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send password reset email
        </Button>
      </Card>
    </div>
  );
}
