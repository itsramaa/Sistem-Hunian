import { supabase } from "@/lib/integrations/supabase/client";

export interface PriceSegment {
  segment_name: string;
  avg_price: number;
  unit_count: number;
  occupancy_rate: number;
  price_range: { min: number; max: number };
}

export interface PriceRecommendation {
  unit_id: string;
  unit_number?: string;
  current_price: number;
  optimal_price: number;
  reason: string;
  confidence: number;
}

export interface PriceTrend {
  month: string;
  avg_price: number;
  median_price: number;
  sample_count: number;
}

export interface PriceOutlier {
  unit_id: string;
  unit_number?: string;
  current_price: number;
  expected_range: { min: number; max: number };
  anomaly_type: "overpriced" | "underpriced";
  severity: "low" | "medium" | "high";
}

export interface PriceIntelligenceResult {
  segments: PriceSegment[];
  recommendations: PriceRecommendation[];
  price_trends: PriceTrend[];
  outliers: PriceOutlier[];
  summary: string;
  market_context: string;
}

export interface OccupancyPrediction {
  month: string;
  predicted_occupancy_rate: number;
  confidence: number;
  predicted_move_ins: number;
  predicted_move_outs: number;
}

export interface SeasonalPattern {
  period: string;
  pattern_type: "peak" | "low" | "transition";
  description: string;
  months_affected: number[];
}

export interface TurnoverMetrics {
  current_turnover_rate: number;
  predicted_turnover_rate: number;
  avg_vacancy_days: number;
  trend: "improving" | "stable" | "worsening";
}

export interface OccupancyWarning {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  recommended_action: string;
}

export interface OccupancyForecastResult {
  monthly_predictions: OccupancyPrediction[];
  seasonal_patterns: SeasonalPattern[];
  turnover_metrics: TurnoverMetrics;
  warnings: OccupancyWarning[];
  summary: string;
}

export async function invokePriceIntelligence(propertyId?: string) {
  const { data, error } = await supabase.functions.invoke("ml-price-intelligence", {
    body: { property_id: propertyId || null },
  });

  if (error) throw new Error(error.message || "Failed to invoke price intelligence");
  if (!data?.success) throw new Error(data?.error || data?.message || "Price intelligence failed");

  return data as {
    success: true;
    model_run_id: string;
    analysis: PriceIntelligenceResult;
    execution_time_ms: number;
    tier: string;
  };
}

export async function invokeOccupancyForecast(forecastMonths = 6, propertyId?: string) {
  const { data, error } = await supabase.functions.invoke("ml-occupancy-forecast", {
    body: { property_id: propertyId || null, forecast_months: forecastMonths },
  });

  if (error) throw new Error(error.message || "Failed to invoke occupancy forecast");
  if (!data?.success) throw new Error(data?.error || data?.message || "Occupancy forecast failed");

  return data as {
    success: true;
    model_run_id: string;
    forecast: OccupancyForecastResult;
    execution_time_ms: number;
    tier: string;
  };
}
