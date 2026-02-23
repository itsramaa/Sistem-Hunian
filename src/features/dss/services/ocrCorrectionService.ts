import { supabase } from "@/integrations/supabase/client";

export interface CorrectionSuggestion {
  field: string;
  current_value: string;
  suggested_value: string;
  reason: string;
  confidence: number;
}

export interface CorrectionResult {
  suggestions: CorrectionSuggestion[];
  overall_assessment: string;
}

export async function fetchCorrectionSuggestions(ocrResultId: string): Promise<CorrectionResult> {
  const { data, error } = await supabase.functions.invoke("ml-ocr-correction-suggest", {
    body: { ocr_result_id: ocrResultId },
  });

  if (error) {
    throw new Error(error.message || "Failed to get correction suggestions");
  }

  return data as CorrectionResult;
}
