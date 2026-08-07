import axios from 'axios';

export const apiClient = axios.create({
  // Keep browser requests on the admin origin. The route handler validates the
  // HTTP-only admin session before forwarding the request to the backend.
  baseURL: '/api/backend',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired - redirect to login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
