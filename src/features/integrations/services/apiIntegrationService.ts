import { supabase } from '@/integrations/supabase/client';

// --- API Keys ---

export interface ApiKey {
  id: string;
  merchant_id: string;
  key_prefix: string;
  name: string;
  scopes: string[];
  rate_limit: number;
  last_used_at: string | null;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateApiKey(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return 'pk_live_' + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function createApiKey(merchantId: string, name: string, scopes: string[] = ['read']): Promise<string> {
  const plainKey = generateApiKey();
  const keyHash = await hashKey(plainKey);
  const keyPrefix = plainKey.substring(0, 16) + '...';

  const { error } = await supabase.from('api_keys').insert({
    merchant_id: merchantId,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    name,
    scopes: scopes as any,
  });

  if (error) throw error;
  return plainKey;
}

export async function listApiKeys(merchantId: string): Promise<ApiKey[]> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(d => ({
    ...d,
    scopes: (d.scopes as string[]) || ['read'],
  }));
}

export async function revokeApiKey(id: string): Promise<void> {
  const { error } = await supabase.from('api_keys').update({ is_active: false }).eq('id', id);
  if (error) throw error;
}

// --- Webhooks ---

export interface WebhookEndpoint {
  id: string;
  merchant_id: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  last_triggered_at: string | null;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: any;
  response_status: number | null;
  response_body: string | null;
  delivered_at: string;
}

export const WEBHOOK_EVENTS = [
  'payment.received',
  'payment.verified',
  'invoice.created',
  'invoice.overdue',
  'maintenance.created',
  'maintenance.completed',
  'tenant.moved_in',
  'tenant.moved_out',
  'contract.signed',
  'contract.expired',
] as const;

function generateSecret(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return 'whsec_' + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function createWebhook(merchantId: string, url: string, events: string[]): Promise<WebhookEndpoint> {
  const secret = generateSecret();
  const { data, error } = await supabase
    .from('webhook_endpoints')
    .insert({ merchant_id: merchantId, url, events: events as any, secret })
    .select()
    .single();

  if (error) throw error;
  return { ...data, events: data.events as string[] };
}

export async function listWebhooks(merchantId: string): Promise<WebhookEndpoint[]> {
  const { data, error } = await supabase
    .from('webhook_endpoints')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(d => ({ ...d, events: (d.events as string[]) || [] }));
}

export async function updateWebhook(id: string, url: string, events: string[]): Promise<void> {
  const { error } = await supabase.from('webhook_endpoints').update({ url, events: events as any }).eq('id', id);
  if (error) throw error;
}

export async function deleteWebhook(id: string): Promise<void> {
  const { error } = await supabase.from('webhook_endpoints').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchWebhookLogs(webhookId: string): Promise<WebhookLog[]> {
  const { data, error } = await supabase
    .from('webhook_logs')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('delivered_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}
