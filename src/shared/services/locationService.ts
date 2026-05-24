import { apiClient } from '@/lib/axios';
import { City, Province } from '../types';

export const locationService = {
  async getProvinces(): Promise<Province[]> {
    try {
      const r = await apiClient.get('/provinces', { params: { order_by: 'name' } });
      return (r.data ?? []) as Province[];
    } catch {
      // TODO: implement Go endpoint — was: supabase.from('provinces').select('*').order('name')
      return [];
    }
  },

  async getCities(provinceId: string): Promise<City[]> {
    try {
      const r = await apiClient.get('/cities', { params: { province_id: provinceId, order_by: 'name' } });
      return (r.data ?? []) as City[];
    } catch {
      // TODO: implement Go endpoint — was: supabase.from('cities').select('*').eq('province_id', provinceId).order('name')
      return [];
    }
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
