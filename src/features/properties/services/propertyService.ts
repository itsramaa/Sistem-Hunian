import { supabase } from '@/lib/integrations/supabase/client';
import { apiClient } from '@/lib/axios';
import { CreatePropertyPayload, Property, UpdatePropertyPayload } from '../types';
import { dataQualityService } from './dataQualityService';

export const propertyService = {
  async fetchProperties(merchantId: string): Promise<Property[]> {
    try {
      const response = await apiClient.get('/properties', { params: { merchant_id: merchantId } });
      return response.data.data || [];
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to fetch properties');
    }
  },

  async fetchPropertyById(id: string): Promise<Property & { units?: any[] }> {
    try {
      const response = await apiClient.get(`/properties/${id}`);
      return response.data.data;
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to fetch property');
    }
  },

  async fetchPropertiesWithUnits(merchantId: string): Promise<Property[]> {
    try {
      const response = await apiClient.get('/properties', {
        params: { merchant_id: merchantId, include_units: true },
      });
      return response.data.data || [];
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to fetch properties with units');
    }
  },

  async createProperty(payload: CreatePropertyPayload, merchantId: string): Promise<Property> {
    try {
      const response = await apiClient.post('/properties', { ...payload, merchant_id: merchantId });
      return response.data.data;
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to create property');
    }
  },

  async updateProperty(id: string, payload: UpdatePropertyPayload): Promise<Property> {
    // Auto-versioning: snapshot current data before update
    try {
      const { data: current } = await supabase.from('properties').select('*').eq('id', id).single();
      if (current) {
        const changedFields = Object.keys(payload).filter(k => (current as any)[k] !== (payload as any)[k]);
        const summary = changedFields.length > 0
          ? `Updated: ${changedFields.join(', ')}`
          : 'Update (no field diff detected)';
        await dataQualityService.createVersion('property', id, current as any, summary);
      }
    } catch (e) {
      console.warn('Auto-versioning failed for property:', e);
    }

    try {
      const response = await apiClient.put(`/properties/${id}`, payload);
      return response.data.data;
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to update property');
    }
  },

  async deleteProperty(id: string): Promise<void> {
    try {
      await apiClient.delete(`/properties/${id}`);
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to delete property');
    }
  },

  async canDeleteProperty(id: string): Promise<{ canDelete: boolean; reason?: string }> {
    // Check for units with active contracts
    const { data: activeUnits, error: unitsError } = await supabase
      .from('units')
      .select('id, unit_number')
      .eq('property_id', id)
      .eq('status', 'occupied');

    if (unitsError) throw unitsError;

    if (activeUnits && activeUnits.length > 0) {
      return { 
        canDelete: false, 
        reason: `Property has ${activeUnits.length} occupied unit(s). Please end all contracts before deleting.` 
      };
    }

    // Check for active contracts
    const { data: activeContracts, error: contractsError } = await supabase
      .from('contracts')
      .select('id, units!inner(property_id)')
      .eq('units.property_id', id)
      .in('status', ['active', 'pending']);

    if (contractsError) throw contractsError;

    if (activeContracts && activeContracts.length > 0) {
      return { 
        canDelete: false, 
        reason: `Property has ${activeContracts.length} active or pending contract(s). Please end all contracts before deleting.` 
      };
    }

    return { canDelete: true };
  }
};
