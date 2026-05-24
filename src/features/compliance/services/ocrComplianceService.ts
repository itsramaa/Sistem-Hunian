// DSS/OCR feature was removed in PR #1. This service is stubbed.

export async function invokeOcrCompliance(_params: {
  document_path: string;
  property_id: string;
  expected_type?: string;
  bucket?: string;
}) {
  throw new Error('OCR compliance feature is not available.');
}
