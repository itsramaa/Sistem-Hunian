import { apiClient } from '@/shared/lib/axios';
import { CreateTenantPayload, Tenant } from '../types';

export const tenantService = {
  async list(page = 1, limit = 20, status?: string, property_id?: string, room_id?: string) {
    const params: Record<string, any> = { page, limit };
    if (status) params.status = status;
    if (property_id) params.property_id = property_id;
    if (room_id) params.room_id = room_id;

    const { data } = await apiClient.get<any>('/tenants', { params });
    return { tenants: data?.data ?? [], pagination: data?.pagination ?? null };
  },

  async create(payload: CreateTenantPayload): Promise<Tenant> {
    const { data } = await apiClient.post<Tenant>('/tenants', payload);
    return data as Tenant;
  },

  async checkout(id: string, tanggal_keluar: string): Promise<void> {
    await apiClient.post(`/tenants/${id}/checkout`, { tanggal_keluar });
  },
};
