import { supabase } from '@/lib/integrations/supabase/client';
import { CreatePropertyPayload, Property, UpdatePropertyPayload } from '../types';
import { dataQualityService } from './dataQualityService';

export const propertyService = {
  async fetchProperties(merchantId: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Property[]) || [];
  },

  async fetchPropertyById(id: string): Promise<Property & { units?: any[] }> {
    const { data, error } = await supabase
      .from('properties')
      .select('*, units(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as Property & { units?: any[] };
  },

  async fetchPropertiesWithUnits(merchantId: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select('id, name, units(id, unit_number, status, rent_amount)')
      .eq('merchant_id', merchantId);

    if (error) throw error;
    return (data as unknown as Property[]) || [];
  },

  async createProperty(payload: CreatePropertyPayload, merchantId: string): Promise<Property> {
    const { data, error } = await supabase
      .from('properties')
      .insert({ ...payload, merchant_id: merchantId })
      .select()
      .single();

    if (error) throw error;
    return data as Property;
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

    const { data, error } = await supabase
      .from('properties')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Property;
  },

  async deleteProperty(id: string): Promise<void> {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw error;
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
