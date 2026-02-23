import { supabase } from "@/integrations/supabase/client";

export interface OcrResultFilters {
  documentType?: string;
  status?: string;
  requiresReview?: boolean;
}

export async function fetchOcrResults(merchantId: string, filters?: OcrResultFilters) {
  let query = supabase
    .from("ocr_results")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false });

  if (filters?.documentType) {
    query = query.eq("document_type", filters.documentType);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.requiresReview !== undefined) {
    query = query.eq("requires_review", filters.requiresReview);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchOcrResultById(id: string) {
  const { data, error } = await supabase
    .from("ocr_results")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateOcrResult(
  id: string,
  updates: {
    extracted_data?: Record<string, unknown>;
    status?: string;
    review_notes?: string;
    reviewed_by?: string;
    reviewed_at?: string;
    requires_review?: boolean;
  }
) {
  const { data, error } = await supabase
    .from("ocr_results")
    .update(updates as any)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDocumentPreviewUrl(documentUrl: string): Promise<string> {
  // If it's already a full URL, return as-is
  if (documentUrl.startsWith("http")) return documentUrl;

  // Otherwise generate a signed URL from the verification-documents bucket
  const { data, error } = await supabase.storage
    .from("verification-documents")
    .createSignedUrl(documentUrl, 3600); // 1 hour
  if (error) throw error;
  return data.signedUrl;
}
