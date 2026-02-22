import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DssHealthMetrics {
  totalOcrRuns: number;
  ocrSuccessRate: number;
  ocrAvgConfidence: number;
  ocrAvgProcessingMs: number;
  totalModelRuns: number;
  modelErrorRate: number;
  recentOcrResults: Array<{
    id: string;
    document_type: string;
    status: string;
    confidence_score: number;
    processing_time_ms: number;
    created_at: string;
  }>;
  ocrByType: Array<{ type: string; count: number; avgConfidence: number }>;
  modelRunsByFunction: Array<{ function_name: string; count: number; avgTime: number; errorCount: number }>;
  validationStats: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

export function useDssHealthMetrics() {
  return useQuery({
    queryKey: ["dss-health-metrics"],
    queryFn: async (): Promise<DssHealthMetrics> => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const since = thirtyDaysAgo.toISOString();

      const [ocrRes, modelRes, validationRes] = await Promise.all([
        supabase
          .from("ocr_results")
          .select("id, document_type, status, confidence_score, processing_time_ms, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("ml_model_runs")
          .select("id, function_name, execution_time_ms, error_message, confidence_score, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("dss_validation_logs")
          .select("id, validation_result, entity_type, created_at")
          .gte("created_at", since)
          .limit(500),
      ]);

      const ocrData = ocrRes.data || [];
      const modelData = modelRes.data || [];
      const validationData = validationRes.data || [];

      // OCR aggregates
      const completedOcr = ocrData.filter((r) => r.status === "completed");
      const ocrSuccessRate = ocrData.length > 0 ? (completedOcr.length / ocrData.length) * 100 : 0;
      const ocrAvgConfidence = completedOcr.length > 0
        ? completedOcr.reduce((s, r) => s + (r.confidence_score || 0), 0) / completedOcr.length
        : 0;
      const ocrAvgProcessingMs = ocrData.length > 0
        ? ocrData.reduce((s, r) => s + (r.processing_time_ms || 0), 0) / ocrData.length
        : 0;

      // OCR by type
      const typeMap = new Map<string, { count: number; totalConf: number }>();
      ocrData.forEach((r) => {
        const e = typeMap.get(r.document_type) || { count: 0, totalConf: 0 };
        e.count++;
        e.totalConf += r.confidence_score || 0;
        typeMap.set(r.document_type, e);
      });
      const ocrByType = Array.from(typeMap.entries()).map(([type, v]) => ({
        type,
        count: v.count,
        avgConfidence: v.count > 0 ? v.totalConf / v.count : 0,
      }));

      // Model runs by function
      const fnMap = new Map<string, { count: number; totalTime: number; errors: number }>();
      modelData.forEach((r) => {
        const e = fnMap.get(r.function_name) || { count: 0, totalTime: 0, errors: 0 };
        e.count++;
        e.totalTime += r.execution_time_ms || 0;
        if (r.error_message) e.errors++;
        fnMap.set(r.function_name, e);
      });
      const modelRunsByFunction = Array.from(fnMap.entries()).map(([function_name, v]) => ({
        function_name,
        count: v.count,
        avgTime: v.count > 0 ? v.totalTime / v.count : 0,
        errorCount: v.errors,
      }));

      const modelErrorRate = modelData.length > 0
        ? (modelData.filter((r) => r.error_message).length / modelData.length) * 100
        : 0;

      // Validation stats
      const validationStats = {
        total: validationData.length,
        passed: validationData.filter((v) => v.validation_result === "passed").length,
        failed: validationData.filter((v) => v.validation_result === "failed").length,
        warnings: validationData.filter((v) => v.validation_result === "warning").length,
      };

      return {
        totalOcrRuns: ocrData.length,
        ocrSuccessRate,
        ocrAvgConfidence,
        ocrAvgProcessingMs,
        totalModelRuns: modelData.length,
        modelErrorRate,
        recentOcrResults: ocrData.slice(0, 20),
        ocrByType,
        modelRunsByFunction,
        validationStats,
      };
    },
    refetchInterval: 30_000, // real-time polling every 30s
  });
}
