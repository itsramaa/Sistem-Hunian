import { apiClient } from '@/lib/axios';
import { CreateUnitPayload, Unit, UpdateUnitPayload } from '../types';
import { dataQualityService } from './dataQualityService';

export const unitService = {
  async fetchUnits(propertyId: string): Promise<Unit[]> {
    const response = await apiClient.get('/units', { params: { property_id: propertyId } });
    return (response.data.data || []) as Unit[];
  },

  async fetchMerchantUnits(merchantId: string): Promise<Unit[]> {
    const response = await apiClient.get('/units', { params: { merchant_id: merchantId } });
    return (response.data.data || []) as Unit[];
  },

  async createUnit(payload: CreateUnitPayload): Promise<Unit> {
    try {
      const response = await apiClient.post('/units', payload);
      return response.data.data as Unit;
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message || '';
      if (msg.includes('units_property_id_unit_number_key')) {
        throw new Error('Nomor unit sudah digunakan di properti ini. Silakan gunakan nomor unit yang berbeda.');
      }
      throw error;
    }
  },

  async updateUnit(id: string, payload: UpdateUnitPayload): Promise<Unit> {
    // Auto-versioning: snapshot current data before update
    try {
      const current = await apiClient.get(`/units/${id}`);
      if (current.data.data) {
        const currentData = current.data.data;
        const changedFields = Object.keys(payload).filter(k => (currentData as any)[k] !== (payload as any)[k]);
        const summary = changedFields.length > 0
          ? `Updated: ${changedFields.join(', ')}`
          : 'Update (no field diff detected)';
        await dataQualityService.createVersion('unit', id, currentData as any, summary);
      }
    } catch (e) {
      console.warn('Auto-versioning failed for unit:', e);
    }

    try {
      const response = await apiClient.put(`/units/${id}`, payload);
      return response.data.data as Unit;
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message || '';
      if (msg.includes('units_property_id_unit_number_key')) {
        throw new Error('Nomor unit sudah digunakan di properti ini. Silakan gunakan nomor unit yang berbeda.');
      }
      throw error;
    }
  },

  async deleteUnit(id: string): Promise<void> {
    await apiClient.delete(`/units/${id}`);
  },
};
