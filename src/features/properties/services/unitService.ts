import { supabase } from '@/lib/integrations/supabase/client';
import { CreateUnitPayload, Unit, UpdateUnitPayload } from '../types';
import { dataQualityService } from './dataQualityService';

export const unitService = {
  async fetchUnits(propertyId: string): Promise<Unit[]> {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .eq('property_id', propertyId)
      .order('unit_number', { ascending: true });

    if (error) throw error;
    return (data as Unit[]) || [];
  },

  async fetchMerchantUnits(merchantId: string): Promise<Unit[]> {
    const { data, error } = await supabase
      .from('units')
      .select(`
        *,
        property:properties!inner(id, name, address, property_type)
      `)
      .eq('property.merchant_id', merchantId)
      .order('unit_number', { ascending: true });

    if (error) throw error;
    return (data as Unit[]) || [];
  },

  async createUnit(payload: CreateUnitPayload): Promise<Unit> {
    const { data, error } = await supabase
      .from('units')
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.message?.includes('units_property_id_unit_number_key')) {
        throw new Error('Nomor unit sudah digunakan di properti ini. Silakan gunakan nomor unit yang berbeda.');
      }
      throw error;
    }
    return data as Unit;
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

    const { data, error } = await supabase
      .from('units')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.message?.includes('units_property_id_unit_number_key')) {
        throw new Error('Nomor unit sudah digunakan di properti ini. Silakan gunakan nomor unit yang berbeda.');
      }
      throw error;
    }
    return data as Unit;
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

    const { error } = await supabase
      .from('units')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
