import { supabase } from "@/integrations/supabase/client";

export async function invokePricingAdvisor(propertyId: string, context?: string) {
  const { data, error } = await supabase.functions.invoke("dss-pricing-advisor", {
    body: { property_id: propertyId, context },
  });
  if (error) throw error;
  return data;
}

export async function invokeCollectionStrategy(tenantUserId: string) {
  const { data, error } = await supabase.functions.invoke("dss-collection-strategy", {
    body: { tenant_user_id: tenantUserId },
  });
  if (error) throw error;
  return data;
}

export async function invokeMaintenancePriority() {
  const { data, error } = await supabase.functions.invoke("dss-maintenance-priority", {
    body: {},
  });
  if (error) throw error;
  return data;
}

export async function invokeInvestmentInsight(propertyId: string) {
  const { data, error } = await supabase.functions.invoke("dss-investment-insight", {
    body: { property_id: propertyId },
  });
  if (error) throw error;
  return data;
}
