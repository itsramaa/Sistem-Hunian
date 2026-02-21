
import { supabase } from '@/lib/integrations/supabase/client';
import { AdminProperty } from '../types/admin';

export const adminPropertyService = {
  async getAllProperties(): Promise<AdminProperty[]> {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        id,
        name,
        merchant_id,
        property_type,
        address,
        city,
        total_units,
        occupied_units,
        status,
        created_at,
        merchants (
          business_name
        )
      `)
      .order('name');

    if (error) throw error;

    return (data || []).map((property: any) => ({
      id: property.id,
      name: property.name,
      merchantName: property.merchants?.business_name || 'Unknown',
      type: property.property_type as AdminProperty['type'],
      address: property.address,
      city: property.city,
      totalUnits: property.total_units || 0,
      occupiedUnits: property.occupied_units || 0,
      status: (property.status || 'active') as AdminProperty['status'],
      rating: 0, // Placeholder as rating is not in properties table
      joinedDate: property.created_at,
    }));
  },

  async updatePropertyStatus(id: string, status: AdminProperty['status']): Promise<void> {
    const { error } = await supabase
      .from('properties')
      .update({ status })
      .eq('id', id);
    
    if (error) throw error;
  },
};
