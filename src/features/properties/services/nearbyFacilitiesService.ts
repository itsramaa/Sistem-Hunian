import { supabase } from '@/lib/integrations/supabase/client';

export interface NearbyFacilityResult {
  type: string;
  name: string;
  distance_meters: number;
  latitude: number;
  longitude: number;
}

const FACILITY_TYPES = [
  { key: 'school', query: 'amenity=school', label: 'Sekolah' },
  { key: 'university', query: 'amenity=university', label: 'Universitas' },
  { key: 'hospital', query: 'amenity=hospital', label: 'Rumah Sakit' },
  { key: 'pharmacy', query: 'amenity=pharmacy', label: 'Apotek' },
  { key: 'supermarket', query: 'shop=supermarket', label: 'Supermarket' },
  { key: 'convenience', query: 'shop=convenience', label: 'Minimarket' },
  { key: 'mosque', query: 'amenity=place_of_worship', label: 'Tempat Ibadah' },
  { key: 'restaurant', query: 'amenity=restaurant', label: 'Restoran' },
  { key: 'bus_station', query: 'amenity=bus_station', label: 'Stasiun Bus' },
  { key: 'atm', query: 'amenity=atm', label: 'ATM' },
];

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const nearbyFacilitiesService = {
  getFacilityTypes() {
    return FACILITY_TYPES;
  },

  async fetchNearbyFacilities(lat: number, lng: number, radiusMeters = 2000): Promise<NearbyFacilityResult[]> {
    const results: NearbyFacilityResult[] = [];
    const queries = FACILITY_TYPES.map(f => `node[${f.query}](around:${radiusMeters},${lat},${lng});`).join('');
    const overpassQuery = `[out:json][timeout:25];(${queries});out body;`;
    
    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(overpassQuery)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (!response.ok) throw new Error('Overpass API error');
      const data = await response.json();

      for (const element of (data.elements || [])) {
        if (!element.tags?.name) continue;
        const distance = haversineDistance(lat, lng, element.lat, element.lon);
        const facilityType = FACILITY_TYPES.find(f => {
          const [key, val] = f.query.split('=');
          return element.tags[key] === val;
        });
        results.push({
          type: facilityType?.label || element.tags.amenity || element.tags.shop || 'Lainnya',
          name: element.tags.name,
          distance_meters: Math.round(distance),
          latitude: element.lat,
          longitude: element.lon,
        });
      }

      results.sort((a, b) => a.distance_meters - b.distance_meters);
      const grouped = new Map<string, NearbyFacilityResult[]>();
      for (const r of results) {
        const list = grouped.get(r.type) || [];
        if (list.length < 3) { list.push(r); grouped.set(r.type, list); }
      }
      return Array.from(grouped.values()).flat().sort((a, b) => a.distance_meters - b.distance_meters);
    } catch (error) {
      console.error('Error fetching nearby facilities:', error);
      return [];
    }
  },

  async saveNearbyFacilities(propertyId: string, facilities: NearbyFacilityResult[]): Promise<void> {
    await (supabase as any).from('property_nearby_facilities').delete().eq('property_id', propertyId);
    if (facilities.length === 0) return;
    const rows = facilities.map(f => ({
      property_id: propertyId,
      facility_type: f.type,
      facility_name: f.name,
      distance_meters: f.distance_meters,
      latitude: f.latitude,
      longitude: f.longitude,
    }));
    const { error } = await (supabase as any).from('property_nearby_facilities').insert(rows);
    if (error) throw error;
  },

  async getPropertyFacilities(propertyId: string): Promise<NearbyFacilityResult[]> {
    const { data, error } = await (supabase as any)
      .from('property_nearby_facilities')
      .select('*')
      .eq('property_id', propertyId)
      .order('distance_meters');
    if (error) throw error;
    return (data || []).map((d: any) => ({
      type: d.facility_type,
      name: d.facility_name,
      distance_meters: d.distance_meters || 0,
      latitude: d.latitude || 0,
      longitude: d.longitude || 0,
    }));
  },
};
