export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  API_URL: (import.meta.env.VITE_API_URL as string) || 'http://localhost:9090/v1',
  // false hanya jika VITE_WA_MOCK secara eksplisit di-set 'false'
  WA_MOCK: import.meta.env.VITE_WA_MOCK !== 'false',
} as const;
