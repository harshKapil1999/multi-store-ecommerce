'use client';

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Loading Dashboard</h2>
          <p className="text-slate-600 text-sm mt-1">Please wait...</p>
        </div>
      </div>
    </div>
  );
}
