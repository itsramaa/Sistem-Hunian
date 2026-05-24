import { apiClient } from '@/lib/axios';
import { AdminProperty } from '../types/admin';

export const adminPropertyService = {
  async getAllProperties(): Promise<AdminProperty[]> {
    const response = await apiClient.get('/admin/properties');
    return (response.data.data || []) as AdminProperty[];
  },

  async updatePropertyStatus(id: string, status: AdminProperty['status']): Promise<void> {
    await apiClient.patch(`/admin/properties/${id}/status`, { status });
  },
};
