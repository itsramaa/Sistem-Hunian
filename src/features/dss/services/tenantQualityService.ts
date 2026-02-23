import { supabase } from "@/lib/integrations/supabase/client";

export interface PaymentReliability {
  score: number;
  on_time_ratio: number;
  avg_days_late: number;
  trend: "improving" | "stable" | "declining";
  prediction_next_6_months: "reliable" | "moderate_risk" | "high_risk";
}

export interface RiskFlag {
  flag: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
}

export interface RiskProfile {
  level: "low" | "medium" | "high" | "critical";
  flags: RiskFlag[];
  churn_probability: number;
}

export interface ScreeningRecommendation {
  decision: "approve" | "approve_with_conditions" | "review" | "reject";
  conditions: string[];
  reasoning: string;
  suggested_deposit_multiplier: number;
}

export interface BehavioralInsight {
  category: string;
  observation: string;
  impact: "positive" | "neutral" | "negative";
}

export interface TenantQualityResult {
  quality_score: number;
  quality_grade: "A" | "B" | "C" | "D" | "F";
  payment_reliability: PaymentReliability;
  risk_profile: RiskProfile;
  screening_recommendation: ScreeningRecommendation;
  behavioral_insights: BehavioralInsight[];
  summary: string;
  confidence: number;
}

export interface BatchTenantResult extends TenantQualityResult {
  tenant_user_id: string;
  name: string;
  error?: string;
}

export interface ScreeningData {
  name: string;
  occupation: string;
  monthly_income: number;
  previous_rental_history?: string;
  references?: string;
}

export async function invokeTenantQualityScoring(params: {
  tenant_user_id?: string;
  screening_data?: ScreeningData;
  batch?: boolean;
}) {
  const { data, error } = await supabase.functions.invoke("ml-tenant-quality-scoring", {
    body: params,
  });

  if (error) throw new Error(error.message || "Failed to invoke tenant quality scoring");
  if (!data?.success) throw new Error(data?.error || data?.message || "Tenant quality scoring failed");

  if (params.batch) {
    return data as {
      success: true;
      batch: true;
      results: BatchTenantResult[];
      execution_time_ms: number;
      tier: string;
    };
  }

  return data as {
    success: true;
    model_run_id: string;
    scoring: TenantQualityResult;
    execution_time_ms: number;
    tier: string;
  };
}
