import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '../api/paymentService';
import { CreatePaymentPayload } from '../types';

export const PAYMENTS_KEY = 'payments';

export function usePayments(page = 1, limit = 20, room_id?: string, tenant_id?: string, status?: string, property_id?: string, periode?: string) {
  return useQuery({
    queryKey: [PAYMENTS_KEY, { page, limit, room_id, tenant_id, status, property_id, periode }],
    queryFn: () => paymentService.list(page, limit, room_id, tenant_id, status, property_id, periode),
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => paymentService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PAYMENTS_KEY] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useMarkPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentService.markPaid(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PAYMENTS_KEY] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUploadBukti() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => paymentService.uploadBukti(id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PAYMENTS_KEY] }),
  });
}
