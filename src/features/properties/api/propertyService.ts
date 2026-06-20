import { apiClient } from '@/shared/lib/axios';
import { CreatePropertyPayload, Property, UpdatePropertyPayload } from '../types';

export const propertyService = {
  async list(search = '', page = 1, limit = 20) {
    const { data } = await apiClient.get<{ data: Property[]; pagination?: { page: number; limit: number; total: number } }>('/properties', {
      params: { search, page, limit },
    });
    // Axios interceptor unwraps { success, data, pagination } → { data, pagination }
    return { properties: (data as any).data ?? [], pagination: (data as any).pagination ?? null };
  },

  async getById(id: string): Promise<Property> {
    const { data } = await apiClient.get<Property>(`/properties/${id}`);
    return data as Property;
  },

  async create(payload: CreatePropertyPayload): Promise<Property> {
    const { data } = await apiClient.post<Property>('/properties', payload);
    return data as Property;
  },

  async update(id: string, payload: UpdatePropertyPayload): Promise<Property> {
    const { data } = await apiClient.put<Property>(`/properties/${id}`, payload);
    return data as Property;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/properties/${id}`);
  },
};
