import { apiClient } from "@/lib/axios";

export interface DashboardFilters {
  propertyType?: string;
  city?: string;
  yearMin?: number;
  yearMax?: number;
}

export async function fetchProperties(merchantId: string, filters?: DashboardFilters) {
  try {
    const params: Record<string, unknown> = { merchant_id: merchantId };
    if (filters?.yearMin) params.gte_construction_year = filters.yearMin;
    if (filters?.yearMax) params.lte_construction_year = filters.yearMax;

    const r = await apiClient.get('/properties', { params });
    return ((r.data || []) as any[]).map((p: any) => ({
      ...p,
      city: p.resolved_city ?? p.city,
      latitude: p.resolved_latitude ?? p.latitude,
      longitude: p.resolved_longitude ?? p.longitude,
    }));
  } catch {
    // TODO: implement Go endpoint — was: supabase.from('v_properties_with_addresses').select(...)
    return [];
  }
}

export async function fetchUnits(merchantId: string) {
  try {
    const r = await apiClient.get('/units', { params: { merchant_id: merchantId } });
    return (r.data || []) as { id: string; property_id: string; rent_amount: number | null; status: string }[];
  } catch {
    // TODO: implement Go endpoint — was: supabase.from('units').select(...)
    return [] as { id: string; property_id: string; rent_amount: number | null; status: string }[];
  }
}

export async function fetchContracts(merchantId: string, filters?: DashboardFilters) {
  try {
    const params: Record<string, unknown> = { merchant_id: merchantId };
    if (filters?.yearMin) params.gte_created_at = `${filters.yearMin}-01-01`;
    if (filters?.yearMax) params.lte_created_at = `${filters.yearMax}-12-31`;

    const r = await apiClient.get('/contracts', { params });
    return r.data || [];
  } catch {
    // TODO: implement Go endpoint — was: supabase.from('contracts').select(...)
    return [];
  }
}

export async function fetchTenantRiskScores(merchantId: string) {
  try {
    const r = await apiClient.get('/tenant-risk-scores', { params: { merchant_id: merchantId } });
    return r.data || [];
  } catch {
    // TODO: implement Go endpoint — was: supabase.from('tenant_risk_scores').select(...)
    return [];
  }
}

export async function fetchDisasterRiskProfiles(merchantId: string) {
  try {
    const r = await apiClient.get('/disaster-risk-profiles', { params: { merchant_id: merchantId } });
    return r.data || [];
  } catch {
    // TODO: implement Go endpoint — was: supabase.from('disaster_risk_profiles').select(...)
    return [];
  }
}
