import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmationService } from '../api/confirmationService';
import { ConfirmDPPayload, CreateConfirmationPayload } from '../types';

export const CONFIRMATIONS_KEY = 'confirmations';

export function useConfirmations(page = 1, limit = 20, status?: string, property_id?: string) {
  return useQuery({
    queryKey: [CONFIRMATIONS_KEY, { page, limit, status, property_id }],
    queryFn: () => confirmationService.list(page, limit, status, undefined, property_id),
    staleTime: 0, // Always re-fetch when filter changes (BUG-004 fix)
  });
}

export function useCreateConfirmation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateConfirmationPayload) => confirmationService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONFIRMATIONS_KEY] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useExpireConfirmation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => confirmationService.expire(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONFIRMATIONS_KEY] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useConfirmDP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ConfirmDPPayload }) =>
      confirmationService.confirmDP(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONFIRMATIONS_KEY] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateBatasTanggal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, batas_tanggal_konfirmasi }: { id: string; batas_tanggal_konfirmasi: string }) =>
      confirmationService.updateBatasTanggal(id, batas_tanggal_konfirmasi),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONFIRMATIONS_KEY] });
    },
  });
}
