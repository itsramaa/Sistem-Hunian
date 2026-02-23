import { supabase } from '@/lib/integrations/supabase/client';
import { PropertyGuardian } from '../types';

export const guardianService = {
  async fetchGuardians(merchantId: string): Promise<(PropertyGuardian & { property_name?: string })[]> {
    const { data, error } = await (supabase as any)
      .from('property_guardians')
      .select('*, properties:property_id(name)')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((g: any) => ({
      ...g,
      property_name: g.properties?.name || '-',
    }));
  },

  async fetchGuardiansByProperty(propertyId: string): Promise<PropertyGuardian[]> {
    const { data, error } = await (supabase as any)
      .from('property_guardians')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createGuardian(payload: Omit<PropertyGuardian, 'id' | 'created_at' | 'updated_at'>): Promise<PropertyGuardian> {
    const { data, error } = await (supabase as any)
      .from('property_guardians')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateGuardian(id: string, payload: Partial<PropertyGuardian>): Promise<PropertyGuardian> {
    const { id: _, created_at, updated_at, ...rest } = payload as any;
    const { data, error } = await (supabase as any)
      .from('property_guardians')
      .update(rest)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteGuardian(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('property_guardians')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
