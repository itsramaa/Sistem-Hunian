import { supabase } from '@/lib/integrations/supabase/client';
import { City, Province } from '../types';

export const locationService = {
  async getProvinces(): Promise<Province[]> {
    const { data, error } = await supabase
      .from('provinces')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return (data as Province[]) || [];
  },

  async getCities(provinceId: string): Promise<City[]> {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('province_id', provinceId)
      .order('name');
    
    if (error) throw error;
    return (data as City[]) || [];
  },

  async searchAddress(query: string): Promise<{ lat: number; lng: number; display_name: string } | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=id&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          display_name: data[0].display_name
        };
      }
      return null;
    } catch (error) {
      console.error('Error searching address:', error);
      throw error;
    }
  },

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data?.display_name || null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      throw error;
    }
  }
};
