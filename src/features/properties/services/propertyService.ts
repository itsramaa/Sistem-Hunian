import { apiClient } from '@/lib/axios';
import { CreatePropertyPayload, Property, UpdatePropertyPayload } from '../types';
import { dataQualityService } from './dataQualityService';

export const propertyService = {
  async fetchProperties(merchantId: string): Promise<Property[]> {
    const response = await apiClient.get('/properties', { params: { merchant_id: merchantId } });
    return (response.data.data || []) as Property[];
  },

  async fetchPropertyById(id: string): Promise<Property & { units?: any[] }> {
    const response = await apiClient.get(`/properties/${id}`);
    return response.data.data as Property & { units?: any[] };
  },

  async fetchPropertiesWithUnits(merchantId: string): Promise<Property[]> {
    const response = await apiClient.get('/properties', { params: { merchant_id: merchantId, include_units: true } });
    return (response.data.data || []) as Property[];
  },

  async createProperty(payload: CreatePropertyPayload, merchantId: string): Promise<Property> {
    const response = await apiClient.post('/properties', { ...payload, merchant_id: merchantId });
    return response.data.data as Property;
  },

  async updateProperty(id: string, payload: UpdatePropertyPayload): Promise<Property> {
    // Auto-versioning: snapshot current data before update
    try {
      const current = await apiClient.get(`/properties/${id}`);
      if (current.data.data) {
        const currentData = current.data.data;
        const changedFields = Object.keys(payload).filter(k => (currentData as any)[k] !== (payload as any)[k]);
        const summary = changedFields.length > 0
          ? `Updated: ${changedFields.join(', ')}`
          : 'Update (no field diff detected)';
        await dataQualityService.createVersion('property', id, currentData as any, summary);
      }
    } catch (e) {
      console.warn('Auto-versioning failed for property:', e);
    }

    const response = await apiClient.put(`/properties/${id}`, payload);
    return response.data.data as Property;
  },

  async deleteProperty(id: string): Promise<void> {
    await apiClient.delete(`/properties/${id}`);
  },

  async canDeleteProperty(id: string): Promise<{ canDelete: boolean; reason?: string }> {
    const response = await apiClient.get(`/properties/${id}/can-delete`);
    return response.data.data as { canDelete: boolean; reason?: string };
  },
};
