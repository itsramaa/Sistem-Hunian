import { supabase } from "@/lib/integrations/supabase/client";

// Financial Analytics types
export interface RoiAnalysis {
  total_investment: number;
  annual_revenue: number;
  annual_expenses: number;
  net_annual_income: number;
  roi_percentage: number;
  payback_period_years: number;
}

export interface CashFlow {
  year: number;
  revenue: number;
  expenses: number;
  net: number;
}

export interface NpvIrr {
  npv: number;
  irr: number;
  discount_rate_used: number;
  cash_flows: CashFlow[];
  recommendation: "invest" | "hold" | "divest";
}

export interface SensitivityScenario {
  scenario_name: string;
  variable_changed: string;
  change_percentage: number;
  resulting_roi: number;
  resulting_npv: number;
  impact_level: "low" | "medium" | "high";
}

export interface BreakEven {
  monthly_fixed_costs: number;
  variable_cost_per_unit: number;
  avg_revenue_per_unit: number;
  break_even_units: number;
  break_even_occupancy_rate: number;
  months_to_break_even: number;
}

export interface FinancialAnalysisResult {
  roi_analysis: RoiAnalysis;
  npv_irr: NpvIrr;
  sensitivity: SensitivityScenario[];
  break_even: BreakEven;
  summary: string;
  confidence: number;
}

// Risk Assessment types
export interface RiskFactor {
  factor: string;
  score: number;
  description: string;
  weight: number;
}

export interface DisasterRiskScore {
  overall_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
  factors: RiskFactor[];
}

export interface PreventiveMaintenance {
  strategy: string;
  priority: "low" | "medium" | "high" | "critical";
  estimated_cost: number;
  frequency: string;
  risk_reduction_percentage: number;
  description: string;
}

export interface LossScenario {
  disaster_type: string;
  probability: number;
  estimated_damage_cost: number;
  estimated_revenue_loss_months: number;
  total_potential_loss: number;
}

export interface PotentialLossEstimate {
  scenarios: LossScenario[];
  annual_expected_loss: number;
  worst_case_loss: number;
}

export interface InsuranceRecommendation {
  coverage_type: string;
  recommended_coverage_amount: number;
  estimated_premium: number;
  reason: string;
  priority: "low" | "medium" | "high" | "critical";
  gap_identified: boolean;
}

export interface RiskAssessmentResult {
  disaster_risk_score: DisasterRiskScore;
  preventive_maintenance: PreventiveMaintenance[];
  potential_loss_estimate: PotentialLossEstimate;
  insurance_recommendations: InsuranceRecommendation[];
  summary: string;
  confidence: number;
}

export async function invokeFinancialAnalytics(propertyId: string, discountRate?: number) {
  const { data, error } = await supabase.functions.invoke("ml-financial-analytics", {
    body: { property_id: propertyId, discount_rate: discountRate ?? 12 },
  });

  if (error) throw new Error(error.message || "Failed to invoke financial analytics");
  if (!data?.success) throw new Error(data?.error || data?.message || "Financial analytics failed");

  return data as {
    success: true;
    model_run_id: string;
    analysis: FinancialAnalysisResult;
    execution_time_ms: number;
    tier: string;
  };
}

export async function invokeRiskAssessment(propertyId: string) {
  const { data, error } = await supabase.functions.invoke("ml-risk-assessment", {
    body: { property_id: propertyId },
  });

  if (error) throw new Error(error.message || "Failed to invoke risk assessment");
  if (!data?.success) throw new Error(data?.error || data?.message || "Risk assessment failed");

  return data as {
    success: true;
    model_run_id: string;
    assessment: RiskAssessmentResult;
    execution_time_ms: number;
    tier: string;
  };
}
