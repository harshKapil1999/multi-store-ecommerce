import { useAuth } from './auth-store';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function fetcher<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const { headers, ...requestOptions } = options;

    const res = await fetch(`${API_URL}${endpoint}`, {
        signal: AbortSignal.timeout(20000),
        cache: 'no-store',
        ...requestOptions,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...headers,
        },
    });

    // Check if the response is actually JSON
    const contentType = res.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!isJson) {
        throw new Error(`Invalid response content-type: ${contentType || 'unknown'}. Expected JSON but received ${res.status === 404 ? 'HTML (404)' : 'non-JSON'}.`);
    }

    const data = await res.json();

    if (!res.ok) {
        if (res.status === 401 && typeof window !== 'undefined') useAuth.getState().logout();
        throw Object.assign(new Error(data.message || data.error || `Request failed with status ${res.status}.`), { status: res.status });
    }

    return data.data || data;
}

export const api = {
    get: <T>(endpoint: string) => fetcher<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, body: any) =>
        fetcher<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(endpoint: string, body: any) =>
        fetcher<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: <T>(endpoint: string) => fetcher<T>(endpoint, { method: 'DELETE' }),
};
