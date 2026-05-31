import { apiClient } from '@/lib/axios';
import { CreateUnitPayload, Unit, UpdateUnitPayload } from '../types';

export const unitService = {
  async fetchUnits(propertyId: string): Promise<Unit[]> {
    const response = await apiClient.get(`/properties/${propertyId}/units`);
    return (response.data.data || []) as Unit[];
  },

  async fetchMerchantUnits(merchantId: string): Promise<Unit[]> {
    // TODO: /units?merchant_id= not in BE — fetch per property instead
    try {
      const propertiesRes = await apiClient.get('/properties', { params: { merchant_id: merchantId } });
      const properties: Array<{ id: string }> = propertiesRes.data.data || propertiesRes.data || [];
      const unitArrays = await Promise.all(
        properties.map((p) => apiClient.get(`/properties/${p.id}/units`).then((r) => r.data.data || []).catch(() => [])),
      );
      return unitArrays.flat() as Unit[];
    } catch {
      return [];
    }
  },

  async createUnit(payload: CreateUnitPayload): Promise<Unit> {
    try {
      const { property_id, ...rest } = payload;
      const response = await apiClient.post(`/properties/${property_id}/units`, { property_id, ...rest });
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
