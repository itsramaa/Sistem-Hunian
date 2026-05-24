import { apiClient } from '@/lib/axios';
import { PropertyGuardian } from '../types';

export const guardianService = {
  async fetchGuardians(merchantId: string): Promise<(PropertyGuardian & { property_name?: string })[]> {
    const response = await apiClient.get('/property-guardians', {
      params: { merchant_id: merchantId, order: 'created_at', ascending: false },
    });
    const data = response.data?.data || response.data || [];
    return data.map((g: any) => ({
      ...g,
      property_name: g.properties?.name || g.property_name || '-',
    }));
  },

  async fetchGuardiansByProperty(propertyId: string): Promise<PropertyGuardian[]> {
    const response = await apiClient.get('/property-guardians', {
      params: { property_id: propertyId, order: 'created_at', ascending: false },
    });
    return response.data?.data || response.data || [];
  },

  async createGuardian(payload: Omit<PropertyGuardian, 'id' | 'created_at' | 'updated_at'>): Promise<PropertyGuardian> {
    const response = await apiClient.post('/property-guardians', payload);
    return response.data?.data || response.data;
  },

  async updateGuardian(id: string, payload: Partial<PropertyGuardian>): Promise<PropertyGuardian> {
    const { id: _, created_at, updated_at, ...rest } = payload as any;
    const response = await apiClient.patch(`/property-guardians/${id}`, rest);
    return response.data?.data || response.data;
  },

  async deleteGuardian(id: string): Promise<void> {
    await apiClient.delete(`/property-guardians/${id}`);
  },

  // Guardian Property Assignments
  async fetchAssignments(guardianId: string): Promise<any[]> {
    const response = await apiClient.get('/guardian-property-assignments', {
      params: { guardian_id: guardianId, order: 'created_at', ascending: false },
    });
    return response.data?.data || response.data || [];
  },

  async assignToProperty(guardianId: string, propertyId: string, role: string = 'primary'): Promise<any> {
    const response = await apiClient.post('/guardian-property-assignments', {
      guardian_id: guardianId,
      property_id: propertyId,
      role,
    });
    return response.data?.data || response.data;
  },

  async removeAssignment(assignmentId: string): Promise<void> {
    await apiClient.delete(`/guardian-property-assignments/${assignmentId}`);
  },
};
