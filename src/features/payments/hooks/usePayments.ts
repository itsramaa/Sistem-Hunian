import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentApi } from "../api/paymentApi";
import { CreatePaymentPayload, UpdatePaymentPayload } from "../types";

export const PAYMENTS_KEY = "payments";

export function usePayments(
  page = 1,
  limit = 20,
  room_id?: string,
  tenant_id?: string,
  status?: string,
  property_id?: string,
  period?: string,
) {
  return useQuery({
    queryKey: [
      PAYMENTS_KEY,
      { page, limit, room_id, tenant_id, status, property_id, period },
    ],
    queryFn: () =>
      paymentApi.list(
        page,
        limit,
        room_id,
        tenant_id,
        status,
        property_id,
        period,
      ),
  });
}

export function usePaymentById(id: string | undefined) {
  return useQuery({
    queryKey: [PAYMENTS_KEY, id],
    queryFn: () => paymentApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => paymentApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PAYMENTS_KEY] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useMarkPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payment_date }: { id: string; payment_date?: string }) =>
      paymentApi.markPaid(id, payment_date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PAYMENTS_KEY] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUploadBukti() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      paymentApi.uploadBukti(id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PAYMENTS_KEY] }),
  });
}

export function useWriteOff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentApi.writeOff(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PAYMENTS_KEY] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePaymentPayload;
    }) => paymentApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PAYMENTS_KEY] });
    },
  });
}
