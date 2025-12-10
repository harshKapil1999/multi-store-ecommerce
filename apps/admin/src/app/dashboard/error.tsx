'use client';

import { useEffect } from 'react';
import { Button } from '@/components/index';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-900 mb-2">
            Something went wrong!
          </h1>
          <p className="text-red-700 mb-6">
            {error.message || 'An unexpected error occurred while loading the dashboard.'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full sm:w-auto">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left">
          <h3 className="font-semibold text-sm text-slate-900 mb-2">
            Common Causes:
          </h3>
          <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
            <li>Database connection issues</li>
            <li>Missing or invalid store data</li>
            <li>Network connectivity problems</li>
            <li>Backend server not running</li>
          </ul>
          <p className="text-xs text-slate-500 mt-3">
            If the problem persists, please check the browser console for more details.
          </p>
        </div>
      </div>
    </div>
  );
}
