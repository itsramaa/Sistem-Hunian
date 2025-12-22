-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-documents', 'verification-documents', false);

-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);

-- RLS policies for verification documents (private)
CREATE POLICY "Users can upload their own verification documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own verification documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all verification documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'verification-documents' AND public.has_role(auth.uid(), 'admin'));

-- RLS policies for property images (public read, owner write)
CREATE POLICY "Anyone can view property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

CREATE POLICY "Merchants can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Merchants can update their property images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Merchants can delete their property images"
ON storage.objects FOR DELETE
USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);