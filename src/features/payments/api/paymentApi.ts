import { apiClient } from '@/shared/lib/axios';
import { CreatePaymentPayload, Payment, UpdatePaymentPayload } from '../types';

export const paymentApi = {
  async list(page = 1, limit = 20, room_id?: string, tenant_id?: string, status?: string, property_id?: string, period?: string) {
    const params: Record<string, any> = { page, limit };
    if (room_id) params.room_id = room_id;
    if (tenant_id) params.tenant_id = tenant_id;
    if (status) params.status = status;
    if (property_id) params.property_id = property_id;
    if (period) params.period = period;
    const { data } = await apiClient.get<any>('/payments', { params });
    return { payments: data?.data ?? [], pagination: data?.pagination ?? null };
  },

  async getById(id: string): Promise<Payment> {
    const { data } = await apiClient.get<any>(`/payments/${id}`);
    return data as Payment;
  },

  async create(payload: CreatePaymentPayload): Promise<Payment> {
    const { data } = await apiClient.post<Payment>('/payments', payload);
    return data as Payment;
  },

  async markPaid(id: string, payment_date?: string): Promise<void> {
    await apiClient.patch(`/payments/${id}/mark-paid`, payment_date ? { payment_date } : {});
  },

  async uploadBukti(id: string, file: File): Promise<string> {
    const form = new FormData();
    form.append('bukti_transfer', file);
    const { data } = await apiClient.patch<any>(`/payments/${id}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data?.transfer_proof_url ?? '';
  },

  async update(id: string, payload: UpdatePaymentPayload): Promise<void> {
    await apiClient.put(`/payments/${id}`, payload);
  },

  async writeOff(id: string): Promise<void> {
    await apiClient.patch(`/payments/${id}/write-off`);
  },
};
