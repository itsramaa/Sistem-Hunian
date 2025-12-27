-- =============================================
-- Fix RLS policies for tenant onboarding flow
-- =============================================

-- 1. Enable RLS on tenants table (if not already)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing tenants policies if any (to recreate cleanly)
DROP POLICY IF EXISTS "Tenants can view their own profile" ON public.tenants;
DROP POLICY IF EXISTS "Tenants can insert their own profile" ON public.tenants;
DROP POLICY IF EXISTS "Tenants can update their own profile" ON public.tenants;
DROP POLICY IF EXISTS "Merchants can view their linked tenants" ON public.tenants;
DROP POLICY IF EXISTS "Admins have full access to tenants" ON public.tenants;

-- 3. Create RLS policies for tenants table
-- Tenants can view their own profile
CREATE POLICY "Tenants can view their own profile"
ON public.tenants
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Tenants can insert their own profile
CREATE POLICY "Tenants can insert their own profile"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Tenants can update their own profile
CREATE POLICY "Tenants can update their own profile"
ON public.tenants
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Merchants can view tenants linked to them
CREATE POLICY "Merchants can view their linked tenants"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  linked_merchant_id IN (
    SELECT id FROM public.merchants WHERE user_id = auth.uid()
  )
);

-- Admins have full access
CREATE POLICY "Admins have full access to tenants"
ON public.tenants
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 4. Storage policies for verification-documents bucket
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload their own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Merchants can view tenant verification documents" ON storage.objects;

-- Users can upload their own verification documents (file path must contain their user id)
CREATE POLICY "Users can upload their own verification documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND (storage.foldername(name))[1] = 'ktp'
  AND name LIKE '%' || auth.uid()::text || '%'
);

-- Users can view their own verification documents
CREATE POLICY "Users can view their own verification documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND name LIKE '%' || auth.uid()::text || '%'
);

-- Users can delete their own verification documents
CREATE POLICY "Users can delete their own verification documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND name LIKE '%' || auth.uid()::text || '%'
);

-- Admins can view all verification documents
CREATE POLICY "Admins can view all verification documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND public.has_role(auth.uid(), 'admin')
);

-- Merchants can view verification documents of their linked tenants
CREATE POLICY "Merchants can view tenant verification documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND EXISTS (
    SELECT 1 FROM public.tenants t
    JOIN public.merchants m ON t.linked_merchant_id = m.id
    WHERE m.user_id = auth.uid()
    AND name LIKE '%' || t.user_id::text || '%'
  )
);

-- =============================================
-- 5. Fix profiles RLS - ensure users can insert their own profile
-- =============================================
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);