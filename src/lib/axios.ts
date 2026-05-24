import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: inject Supabase JWT when available
apiClient.interceptors.request.use((config) => {
  // Token injection is handled by individual feature services
  // via apiClient.defaults.headers.common['Authorization']
  return config;
});

// Response interceptor: normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize API error shape for consistent handling in feature services
    return Promise.reject(error);
  }
);
