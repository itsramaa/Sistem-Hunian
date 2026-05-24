export async function invokeOcrCompliance(params: {
  document_path: string;
  property_id: string;
  expected_type?: string;
  bucket?: string;
}) {
  // OCR compliance endpoint not yet available via REST API — stub
  console.warn('[ocrComplianceService] ocr-compliance-document not yet migrated to REST API');
  return null;
}
