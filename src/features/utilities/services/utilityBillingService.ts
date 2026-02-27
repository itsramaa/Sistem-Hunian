import { supabase } from "@/integrations/supabase/client";

export interface UtilitySetting {
  id?: string;
  merchant_id: string;
  property_id: string;
  utility_type: string;
  allocation_method: string;
  rate_per_unit?: number | null;
  fixed_monthly?: number | null;
  weight_config?: Record<string, number> | null;
  is_active: boolean;
}

export interface MeterReading {
  id?: string;
  merchant_id: string;
  property_id: string;
  unit_id: string;
  utility_type: string;
  reading_date: string;
  previous_reading: number;
  current_reading: number;
  rate_per_unit: number;
  photo_url?: string | null;
  notes?: string | null;
}

export interface UtilityCharge {
  id?: string;
  merchant_id: string;
  property_id: string;
  unit_id: string;
  contract_id?: string | null;
  tenant_user_id?: string | null;
  billing_period: string;
  utility_type: string;
  allocation_method: string;
  total_cost: number;
  unit_share: number;
  quantity?: number | null;
  rate?: number | null;
  invoice_id?: string | null;
  status: string;
}

// ===== SETTINGS =====

export async function fetchUtilitySettings(propertyId: string) {
  const { data, error } = await supabase
    .from('utility_settings')
    .select('*')
    .eq('property_id', propertyId)
    .order('utility_type');
  if (error) throw error;
  return data as UtilitySetting[];
}

export async function saveUtilitySettings(settings: UtilitySetting[]) {
  const results = [];
  for (const setting of settings) {
    const { id, ...rest } = setting;
    if (id) {
      const { data, error } = await supabase
        .from('utility_settings')
        .update(rest)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      results.push(data);
    } else {
      const { data, error } = await supabase
        .from('utility_settings')
        .upsert(rest, { onConflict: 'property_id,utility_type' })
        .select()
        .single();
      if (error) throw error;
      results.push(data);
    }
  }
  return results;
}

// ===== METER READINGS =====

export async function fetchMeterReadings(propertyId: string, period: string) {
  // period format: '2026-02'
  const startDate = `${period}-01`;
  const [year, month] = period.split('-').map(Number);
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // last day of month

  const { data, error } = await supabase
    .from('utility_meter_readings')
    .select('*, units!inner(unit_number, status)')
    .eq('property_id', propertyId)
    .gte('reading_date', startDate)
    .lte('reading_date', endDate)
    .order('reading_date');
  if (error) throw error;
  return data;
}

export async function submitMeterReadings(readings: MeterReading[]) {
  const { data, error } = await supabase
    .from('utility_meter_readings')
    .insert(readings)
    .select();
  if (error) throw error;
  return data;
}

export async function getLastReadings(propertyId: string, utilityType: string) {
  const { data, error } = await supabase
    .from('utility_meter_readings')
    .select('unit_id, current_reading, reading_date')
    .eq('property_id', propertyId)
    .eq('utility_type', utilityType)
    .order('reading_date', { ascending: false });
  if (error) throw error;

  // Get latest reading per unit
  const latestByUnit = new Map<string, { current_reading: number; reading_date: string }>();
  for (const r of data || []) {
    if (!latestByUnit.has(r.unit_id)) {
      latestByUnit.set(r.unit_id, { current_reading: r.current_reading, reading_date: r.reading_date });
    }
  }
  return latestByUnit;
}

// ===== CHARGES =====

export async function fetchUtilityCharges(propertyId: string, period: string) {
  const { data, error } = await supabase
    .from('utility_charges')
    .select('*, units!inner(unit_number)')
    .eq('property_id', propertyId)
    .eq('billing_period', period)
    .order('utility_type');
  if (error) throw error;
  return data;
}

export async function generateCharges(
  merchantId: string,
  propertyId: string,
  period: string
): Promise<UtilityCharge[]> {
  // Check if charges already exist
  const existing = await fetchUtilityCharges(propertyId, period);
  if (existing && existing.length > 0) {
    throw new Error('Tagihan utilitas untuk periode ini sudah ada');
  }

  // Get settings
  const settings = await fetchUtilitySettings(propertyId);
  const activeSettings = settings.filter(s => s.is_active);

  // Get occupied units with contracts
  const { data: contracts, error: contractError } = await supabase
    .from('contracts')
    .select('id, unit_id, tenant_user_id, units!inner(unit_number, unit_type)')
    .eq('status', 'active')
    .in('unit_id', (
      await supabase.from('units').select('id').eq('property_id', propertyId).eq('status', 'occupied')
    ).data?.map(u => u.id) || []);
  if (contractError) throw contractError;

  if (!contracts || contracts.length === 0) {
    throw new Error('Tidak ada unit yang terisi untuk properti ini');
  }

  const charges: Omit<UtilityCharge, 'id'>[] = [];

  for (const setting of activeSettings) {
    if (setting.allocation_method === 'metered') {
      // Get meter readings for this period
      const readings = await fetchMeterReadings(propertyId, period);
      const typeReadings = readings?.filter(r => r.utility_type === setting.utility_type) || [];

      for (const reading of typeReadings) {
        const contract = contracts.find(c => c.unit_id === reading.unit_id);
        if (!contract) continue;

        const usage = reading.current_reading - reading.previous_reading;
        const cost = usage * reading.rate_per_unit;

        charges.push({
          merchant_id: merchantId,
          property_id: propertyId,
          unit_id: reading.unit_id,
          contract_id: contract.id,
          tenant_user_id: contract.tenant_user_id,
          billing_period: period,
          utility_type: setting.utility_type,
          allocation_method: 'metered',
          total_cost: cost,
          unit_share: cost,
          quantity: usage,
          rate: reading.rate_per_unit,
          status: 'pending',
        });
      }
    } else if (setting.allocation_method === 'equal_split') {
      const totalCost = setting.fixed_monthly || 0;
      const share = totalCost / contracts.length;

      for (const contract of contracts) {
        charges.push({
          merchant_id: merchantId,
          property_id: propertyId,
          unit_id: contract.unit_id,
          contract_id: contract.id,
          tenant_user_id: contract.tenant_user_id,
          billing_period: period,
          utility_type: setting.utility_type,
          allocation_method: 'equal_split',
          total_cost: totalCost,
          unit_share: Math.round(share),
          quantity: null,
          rate: null,
          status: 'pending',
        });
      }
    } else if (setting.allocation_method === 'weighted_split') {
      const totalCost = setting.fixed_monthly || 0;
      const weights = setting.weight_config || {};
      let totalWeight = 0;

      for (const contract of contracts) {
        const unitType = (contract as any).units?.unit_type || 'default';
        totalWeight += weights[unitType] || 1;
      }

      for (const contract of contracts) {
        const unitType = (contract as any).units?.unit_type || 'default';
        const weight = weights[unitType] || 1;
        const share = totalCost * (weight / totalWeight);

        charges.push({
          merchant_id: merchantId,
          property_id: propertyId,
          unit_id: contract.unit_id,
          contract_id: contract.id,
          tenant_user_id: contract.tenant_user_id,
          billing_period: period,
          utility_type: setting.utility_type,
          allocation_method: 'weighted_split',
          total_cost: totalCost,
          unit_share: Math.round(share),
          quantity: weight,
          rate: null,
          status: 'pending',
        });
      }
    } else if (setting.allocation_method === 'fixed') {
      const fixedAmount = setting.fixed_monthly || 0;

      for (const contract of contracts) {
        charges.push({
          merchant_id: merchantId,
          property_id: propertyId,
          unit_id: contract.unit_id,
          contract_id: contract.id,
          tenant_user_id: contract.tenant_user_id,
          billing_period: period,
          utility_type: setting.utility_type,
          allocation_method: 'fixed',
          total_cost: fixedAmount,
          unit_share: fixedAmount,
          quantity: null,
          rate: null,
          status: 'pending',
        });
      }
    }
  }

  if (charges.length === 0) {
    throw new Error('Tidak ada tagihan yang bisa digenerate');
  }

  // Insert charges
  const { data, error } = await supabase
    .from('utility_charges')
    .insert(charges)
    .select();
  if (error) throw error;
  return data as UtilityCharge[];
}
