-- Create storage bucket for maintenance photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('maintenance-photos', 'maintenance-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for maintenance photos
CREATE POLICY "Anyone can view maintenance photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'maintenance-photos');

CREATE POLICY "Authenticated users can upload maintenance photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'maintenance-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own maintenance photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'maintenance-photos' AND auth.uid()::text = (storage.foldername(name))[1]);