import { supabase } from '@/lib/integrations/supabase/client';
import { CreatePropertyPayload, Property, UpdatePropertyPayload } from '../types';
import { dataQualityService } from './dataQualityService';

export const propertyService = {
  async fetchProperties(merchantId: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from('v_properties_with_addresses' as any)
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ((data || []) as any[]).map((p: any) => ({
      ...p,
      address: p.resolved_address,
      city: p.resolved_city,
      province: p.resolved_province,
      postal_code: p.resolved_postal_code,
      latitude: p.resolved_latitude,
      longitude: p.resolved_longitude,
    })) as Property[];
  },

  async fetchPropertyById(id: string): Promise<Property & { units?: any[] }> {
    const { data, error } = await supabase
      .from('properties')
      .select('*, units(*), addresses:address_id(street_address, city, province, postal_code, latitude, longitude)')
      .eq('id', id)
      .single();

    if (error) throw error;
    const raw = data as any;
    return {
      ...raw,
      address: raw.addresses?.street_address || '',
      city: raw.addresses?.city || '',
      province: raw.addresses?.province || '',
      postal_code: raw.addresses?.postal_code || '',
      latitude: raw.addresses?.latitude,
      longitude: raw.addresses?.longitude,
    } as Property & { units?: any[] };
  },

  async fetchPropertiesWithUnits(merchantId: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select('id, name, address_id, units(id, unit_number, status, rent_amount)')
      .eq('merchant_id', merchantId);

    if (error) throw error;
    return (data as unknown as Property[]) || [];
  },

  async createProperty(payload: CreatePropertyPayload, merchantId: string): Promise<Property> {
    // Extract address fields and upsert into addresses table
    const { address, city, province, postal_code, latitude, longitude, ...propertyFields } = payload as any;
    
    let addressId: string | null = null;
    if (address && city && province) {
      const { data: addr, error: addrErr } = await (supabase
        .from('addresses' as any)
        .insert({ street_address: address, city, province, postal_code: postal_code || '', latitude, longitude, address_type: 'property' } as any)
        .select('id')
        .single() as any);
      if (addrErr) throw addrErr;
      addressId = addr.id;
    }

    const { data, error } = await supabase
      .from('properties')
      .insert({ ...propertyFields, merchant_id: merchantId, address_id: addressId })
      .select()
      .single();

    if (error) throw error;
    return { ...data, address, city, province, postal_code, latitude, longitude } as unknown as Property;
  },

  async updateProperty(id: string, payload: UpdatePropertyPayload): Promise<Property> {
    // Extract address fields
    const { address, city, province, postal_code, latitude, longitude, ...propertyFields } = payload as any;

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

    // Update address if address fields provided
    if (address !== undefined || city !== undefined || province !== undefined) {
      const { data: prop } = await (supabase.from('properties').select('address_id') as any).eq('id', id).single();
      if (prop?.address_id) {
        const addrUpdate: any = {};
        if (address !== undefined) addrUpdate.street_address = address;
        if (city !== undefined) addrUpdate.city = city;
        if (province !== undefined) addrUpdate.province = province;
        if (postal_code !== undefined) addrUpdate.postal_code = postal_code || '';
        if (latitude !== undefined) addrUpdate.latitude = latitude;
        if (longitude !== undefined) addrUpdate.longitude = longitude;
        await (supabase.from('addresses' as any).update(addrUpdate) as any).eq('id', prop.address_id);
      } else if (address && city && province) {
        const { data: addr } = await (supabase
          .from('addresses' as any)
          .insert({ street_address: address, city, province, postal_code: postal_code || '', latitude, longitude, address_type: 'property' } as any)
          .select('id')
          .single() as any);
        if (addr) propertyFields.address_id = addr.id;
      }
    }

    const updatePayload = Object.keys(propertyFields).length > 0 ? propertyFields : { updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('properties')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { ...data, address, city, province, postal_code, latitude, longitude } as unknown as Property;
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
