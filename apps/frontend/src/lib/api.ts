const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function fetcher<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
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
        throw new Error(data.message || 'An error occurred while fetching the data.');
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
