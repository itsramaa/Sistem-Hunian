import { supabase } from '@/lib/integrations/supabase/client';
import { apiClient } from '@/lib/axios';
import { CreateUnitPayload, Unit, UpdateUnitPayload } from '../types';
import { dataQualityService } from './dataQualityService';

export const unitService = {
  async fetchUnits(propertyId: string): Promise<Unit[]> {
    try {
      const response = await apiClient.get(`/properties/${propertyId}/units`);
      return response.data.data || [];
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to fetch units');
    }
  },

  async fetchMerchantUnits(merchantId: string): Promise<Unit[]> {
    try {
      const response = await apiClient.get('/units', { params: { merchant_id: merchantId } });
      return response.data.data || [];
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to fetch merchant units');
    }
  },

  async createUnit(payload: CreateUnitPayload): Promise<Unit> {
    try {
      const { property_id, ...rest } = payload as any;
      const response = await apiClient.post(`/properties/${property_id}/units`, rest);
      return response.data.data;
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      const msg = apiError?.message || error.message || '';
      if (msg.includes('units_property_id_unit_number_key') || msg.includes('unit_number')) {
        throw new Error('Nomor unit sudah digunakan di properti ini. Silakan gunakan nomor unit yang berbeda.');
      }
      throw new Error(msg || 'Failed to create unit');
    }
  },

  async updateUnit(id: string, payload: UpdateUnitPayload): Promise<Unit> {
    // Auto-versioning: snapshot current data before update
    try {
      const { data: current } = await supabase.from('units').select('*').eq('id', id).single();
      if (current) {
        const changedFields = Object.keys(payload).filter(k => (current as any)[k] !== (payload as any)[k]);
        const summary = changedFields.length > 0
          ? `Updated: ${changedFields.join(', ')}`
          : 'Update (no field diff detected)';
        await dataQualityService.createVersion('unit', id, current as any, summary);
      }
    } catch (e) {
      console.warn('Auto-versioning failed for unit:', e);
    }

    try {
      const response = await apiClient.put(`/units/${id}`, payload);
      return response.data.data;
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      const msg = apiError?.message || error.message || '';
      if (msg.includes('units_property_id_unit_number_key') || msg.includes('unit_number')) {
        throw new Error('Nomor unit sudah digunakan di properti ini. Silakan gunakan nomor unit yang berbeda.');
      }
      throw new Error(msg || 'Failed to update unit');
    }
  },

  async deleteUnit(id: string): Promise<void> {
    // Check for active contracts
    const { data: activeContracts, error: contractError } = await supabase
      .from('contracts')
      .select('id, status')
      .eq('unit_id', id)
      .in('status', ['active', 'pending', 'draft', 'notice']);

    if (contractError) throw contractError;

    if (activeContracts && activeContracts.length > 0) {
      throw new Error(`Cannot delete unit with ${activeContracts[0].status} contracts`);
    }

    // Check for pending invitations
    const { data: pendingInvitations, error: inviteError } = await supabase
      .from('tenant_invitations')
      .select('id')
      .eq('unit_id', id)
      .eq('status', 'pending');

    if (inviteError) throw inviteError;

    if (pendingInvitations && pendingInvitations.length > 0) {
      throw new Error('Cannot delete unit with pending tenant invitations');
    }

    try {
      await apiClient.delete(`/units/${id}`);
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to delete unit');
    }
  }
};
