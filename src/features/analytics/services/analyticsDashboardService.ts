import { supabase } from "@/integrations/supabase/client";

export interface DashboardFilters {
  propertyType?: string;
  city?: string;
  constructionYearMin?: number;
  constructionYearMax?: number;
}

export async function fetchProperties(merchantId: string) {
  const { data, error } = await supabase
    .from("properties")
    .select("id, name, property_type, city, latitude, longitude, disaster_risk_level, construction_cost, renovation_cost, construction_year, total_units, occupied_units")
    .eq("merchant_id", merchantId);
  if (error) throw error;
  return data || [];
}

export async function fetchUnits(merchantId: string) {
  // Use explicit typing to avoid TS2589 deep instantiation on units table
  const { data, error } = await (supabase
    .from("units" as any)
    .select("id, property_id, rent_amount, status")
    .eq("merchant_id", merchantId) as any);
  if (error) throw error;
  return (data || []) as { id: string; property_id: string; rent_amount: number | null; status: string }[];
}

export async function fetchContracts(merchantId: string) {
  const { data, error } = await supabase
    .from("contracts")
    .select("id, unit_id, status, start_date, end_date, rent_amount, created_at")
    .eq("merchant_id", merchantId);
  if (error) throw error;
  return data || [];
}

export async function fetchTenantRiskScores(merchantId: string) {
  const { data, error } = await supabase
    .from("tenant_risk_scores")
    .select("id, risk_score, risk_level")
    .eq("merchant_id", merchantId);
  if (error) throw error;
  return data || [];
}

export async function fetchDisasterRiskProfiles(merchantId: string) {
  const { data, error } = await supabase
    .from("disaster_risk_profiles")
    .select("id, property_id, overall_risk_score, flood_risk, earthquake_risk, fire_risk, landslide_risk, risk_zone")
    .eq("merchant_id", merchantId);
  if (error) throw error;
  return data || [];
}
