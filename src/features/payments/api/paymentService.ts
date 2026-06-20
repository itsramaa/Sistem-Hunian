import { apiClient } from '@/shared/lib/axios';
import { CreatePaymentPayload, Payment } from '../types';

export const paymentService = {
  async list(page = 1, limit = 20, room_id?: string, tenant_id?: string, status?: string, property_id?: string, periode?: string) {
    const params: Record<string, any> = { page, limit };
    if (room_id) params.room_id = room_id;
    if (tenant_id) params.tenant_id = tenant_id;
    if (status) params.status = status;
    if (property_id) params.property_id = property_id;
    if (periode) params.periode = periode;
    const { data } = await apiClient.get<any>('/payments', { params });
    return { payments: data?.data ?? [], pagination: data?.pagination ?? null };
  },

  async create(payload: CreatePaymentPayload): Promise<Payment> {
    const { data } = await apiClient.post<Payment>('/payments', payload);
    return data as Payment;
  },

  async uploadBukti(id: string, file: File): Promise<string> {
    const form = new FormData();
    form.append('bukti_transfer', file);
    const { data } = await apiClient.patch<any>(`/payments/${id}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data?.bukti_transfer_url ?? '';
  },
};
