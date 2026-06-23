import axios, { AxiosError } from "axios";
import { getApiErrorMessage } from "@/shared/utils/api-errors";

// Base URL from env, fallback to Go/Fiber default
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1";
const TOKEN_KEY = "sihuni_access_token";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: inject JWT — cek localStorage dulu, fallback ke sessionStorage
apiClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: unwrap { success, data } envelope + handle errors
apiClient.interceptors.response.use(
  (response) => {
    // For list responses that have pagination, keep the full envelope
    // so services can access both data and pagination
    // Only unwrap simple { success, data } without pagination (single object responses)
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data &&
      !("pagination" in response.data)
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear kedua storage
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      const path = window.location.pathname;
      const isAuthPage =
        path === "/login" ||
        path === "/auth" ||
        path.startsWith("/reset-password") ||
        path.startsWith("/update-password");
      if (!isAuthPage) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export { TOKEN_KEY };
