-- Add disbursement settings columns to vendors table
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS disbursement_schedule text DEFAULT 'weekly',
ADD COLUMN IF NOT EXISTS min_payout_threshold numeric DEFAULT 50000,
ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT '{"email_new_jobs": true, "email_job_updates": true, "email_payments": true, "push_new_jobs": true, "push_job_updates": true}'::jsonb;

-- Create storage bucket for product photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-photos', 'product-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for product photos bucket
CREATE POLICY "Anyone can view product photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-photos');

CREATE POLICY "Vendors can upload product photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Vendors can update their product photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Vendors can delete their product photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);