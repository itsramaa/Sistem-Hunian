// Shared CORS utility for edge functions (SR-602)
// Approved origins for the SiHuni platform

const APPROVED_ORIGINS = [
  'https://id-preview--bee2790f-e2a9-4b93-b8ef-4ab6b39e6720.lovable.app',
  'https://testing-sihuni.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

export function getCorsHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers?.get('origin') || '';
  const allowedOrigin = APPROVED_ORIGINS.includes(origin) ? origin : APPROVED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Vary': 'Origin',
  };
}

export function handleCorsPreflightOrError(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  return null;
}
