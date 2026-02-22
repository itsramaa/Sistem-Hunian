import { supabase } from "@/integrations/supabase/client";

export async function invokeRevenueForecast(forecastMonths = 6, propertyId?: string) {
  const { data, error } = await supabase.functions.invoke("ml-revenue-forecast", {
    body: { forecast_months: forecastMonths, property_id: propertyId },
  });
  if (error) throw error;
  return data;
}

export async function invokeTenantRiskScore(tenantUserId?: string, batch = false) {
  const { data, error } = await supabase.functions.invoke("ml-tenant-risk-score", {
    body: { tenant_user_id: tenantUserId, batch },
  });
  if (error) throw error;
  return data;
}

export async function invokeChurnPrediction(windowMonths = 3) {
  const { data, error } = await supabase.functions.invoke("ml-churn-prediction", {
    body: { window_months: windowMonths },
  });
  if (error) throw error;
  return data;
}

export async function invokeOptimalPricing(propertyId: string) {
  const { data, error } = await supabase.functions.invoke("ml-optimal-pricing", {
    body: { property_id: propertyId },
  });
  if (error) throw error;
  return data;
}
