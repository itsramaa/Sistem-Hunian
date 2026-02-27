import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listApiKeys, createApiKey, revokeApiKey,
  listWebhooks, createWebhook, updateWebhook, deleteWebhook,
  fetchWebhookLogs,
} from '../services/apiIntegrationService';
import { toast } from 'sonner';

export function useApiKeys(merchantId: string | undefined) {
  return useQuery({
    queryKey: ['api-keys', merchantId],
    queryFn: () => listApiKeys(merchantId!),
    enabled: !!merchantId,
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { merchantId: string; name: string; scopes: string[] }) =>
      createApiKey(p.merchantId, p.name, p.scopes),
    onSuccess: (_data, p) => {
      qc.invalidateQueries({ queryKey: ['api-keys', p.merchantId] });
      toast.success('API key berhasil dibuat');
    },
    onError: () => toast.error('Gagal membuat API key'),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; merchantId: string }) => revokeApiKey(p.id),
    onSuccess: (_data, p) => {
      qc.invalidateQueries({ queryKey: ['api-keys', p.merchantId] });
      toast.success('API key berhasil dicabut');
    },
    onError: () => toast.error('Gagal mencabut API key'),
  });
}

export function useWebhooks(merchantId: string | undefined) {
  return useQuery({
    queryKey: ['webhooks', merchantId],
    queryFn: () => listWebhooks(merchantId!),
    enabled: !!merchantId,
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { merchantId: string; url: string; events: string[] }) =>
      createWebhook(p.merchantId, p.url, p.events),
    onSuccess: (_data, p) => {
      qc.invalidateQueries({ queryKey: ['webhooks', p.merchantId] });
      toast.success('Webhook endpoint berhasil dibuat');
    },
    onError: () => toast.error('Gagal membuat webhook'),
  });
}

export function useUpdateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; merchantId: string; url: string; events: string[] }) =>
      updateWebhook(p.id, p.url, p.events),
    onSuccess: (_data, p) => {
      qc.invalidateQueries({ queryKey: ['webhooks', p.merchantId] });
      toast.success('Webhook berhasil diperbarui');
    },
    onError: () => toast.error('Gagal memperbarui webhook'),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; merchantId: string }) => deleteWebhook(p.id),
    onSuccess: (_data, p) => {
      qc.invalidateQueries({ queryKey: ['webhooks', p.merchantId] });
      toast.success('Webhook berhasil dihapus');
    },
    onError: () => toast.error('Gagal menghapus webhook'),
  });
}

export function useWebhookLogs(webhookId: string | undefined) {
  return useQuery({
    queryKey: ['webhook-logs', webhookId],
    queryFn: () => fetchWebhookLogs(webhookId!),
    enabled: !!webhookId,
  });
}
