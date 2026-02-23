import { supabase } from "@/integrations/supabase/client";

export async function invokeOcrCompliance(params: {
  document_path: string;
  property_id: string;
  expected_type?: string;
  bucket?: string;
}) {
  const { data, error } = await supabase.functions.invoke("ocr-compliance-document", {
    body: params,
  });
  if (error) throw error;
  return data;
}
