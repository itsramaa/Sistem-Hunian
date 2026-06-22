export const env = {
  API_URL: (import.meta.env.VITE_API_URL as string) || 'http://localhost:9090/api/v1',
  // true hanya jika VITE_WA_MOCK secara eksplisit di-set 'true'
  WA_MOCK: import.meta.env.VITE_WA_MOCK === 'true',
} as const;
