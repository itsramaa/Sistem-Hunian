import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:9090/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: inject JWT from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('sihuni_access_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 with token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Attempt token refresh on 401, but only once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('sihuni_refresh_token');
      if (!refreshToken) {
        // No refresh token — clear state and redirect
        localStorage.removeItem('sihuni_access_token');
        localStorage.removeItem('sihuni_refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post('http://localhost:9090/v1/auth/refresh', {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;
        localStorage.setItem('sihuni_access_token', access_token);
        if (refresh_token) {
          localStorage.setItem('sihuni_refresh_token', refresh_token);
        }

        // Retry original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch {
        // Refresh failed — clear tokens and redirect
        localStorage.removeItem('sihuni_access_token');
        localStorage.removeItem('sihuni_refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
