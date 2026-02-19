import { supabase } from '@/lib/integrations/supabase/client';
import { CreatePropertyPayload, Property, UpdatePropertyPayload } from '../types';

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

  async fetchPropertiesWithUnits(merchantId: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select('id, name, units(id, unit_number, status, rent_amount)')
      .eq('merchant_id', merchantId);

    if (error) throw error;
    return (data as Property[]) || [];
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
