'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/index';
import { AuthDebug } from '@/components/auth-debug';
import { useEffect } from 'react';

export default function DebugPage() {
  const { user, isLoading, isAuthenticated } = useAuth();

  const handleTestLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'harsh@example.com',
          password: 'harsh123456',
        }),
      });
      const data = await response.json();
      console.log('Login response:', data);
      if (data.data?.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.data.token);
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleTestValidate = async () => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('No token in localStorage');
      return;
    }
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log('Validate response:', data);
    } catch (error) {
      console.error('Validate error:', error);
    }
  };

  const handleClearStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Debug Page</h1>

      <AuthDebug />

      <div className="space-y-4 mb-8 p-4 bg-slate-100 rounded mt-4">
        <h2 className="font-bold">Auth State:</h2>
        <p>isLoading: {String(isLoading)}</p>
        <p>isAuthenticated: {String(isAuthenticated)}</p>
        <p>user: {user ? JSON.stringify(user) : 'null'}</p>
      </div>

      <div className="space-y-4 mb-8 p-4 bg-slate-100 rounded">
        <h2 className="font-bold">localStorage:</h2>
        <p>auth_token: {typeof window !== 'undefined' && localStorage.getItem('auth_token')?.substring(0, 20)}...</p>
      </div>

      <div className="space-y-4">
        <Button onClick={handleTestLogin} className="bg-blue-600">
          Test Login
        </Button>
        <Button onClick={handleTestValidate} className="bg-green-600">
          Test Validate Token
        </Button>
        <Button onClick={handleClearStorage} className="bg-red-600">
          Clear Storage & Reload
        </Button>
      </div>

      <div className="mt-8 p-4 bg-yellow-100 rounded">
        <p className="font-bold mb-2">Instructions:</p>
        <ol className="list-decimal list-inside space-y-2">
          <li>Click "Test Login" to login with your credentials</li>
          <li>Check console for response (should have token)</li>
          <li>Page will reload, check Auth State above</li>
          <li>Click "Test Validate Token" to check if token is valid</li>
          <li>Check console for validation response</li>
        </ol>
      </div>
    </div>
  );
}
