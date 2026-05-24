// OCR compliance feature was removed in PR #1 (DSS function removed).
// This stub preserves the module interface while making the unavailability explicit.

export async function invokeOcrCompliance(_params: {
  document_path: string;
  property_id: string;
  expected_type?: string;
  bucket?: string;
}) {
  throw new Error('OCR compliance feature is not available in this version');
}

export async function checkOcrCompliance() {
  throw new Error('OCR compliance feature is not available in this version');
}
