-- Create contract-documents storage bucket for PDF uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contract-documents', 'contract-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy for contract documents - merchants can upload/view their own
CREATE POLICY "Merchants can upload contract documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contract-documents' AND
  EXISTS (
    SELECT 1 FROM merchants m 
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "Merchants can view their contract documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contract-documents' AND
  EXISTS (
    SELECT 1 FROM merchants m 
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "Tenants can view their contract documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contract-documents' AND
  EXISTS (
    SELECT 1 FROM contracts c 
    WHERE c.tenant_user_id = auth.uid() 
    AND c.contract_document_url LIKE '%' || storage.objects.name || '%'
  )
);

-- Add billing_day column to contracts for per-contract billing
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS billing_day integer DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.contracts.billing_day IS 'Optional billing day (1-28) for this contract. Falls back to merchant billing_day if null.';