
-- =============================================
-- MIGRATION 2: Phase 2A - Address Normalization
-- =============================================

-- Create addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  street_address TEXT,
  city VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_city_province ON public.addresses(city, province);
CREATE INDEX IF NOT EXISTS idx_addresses_coordinates ON public.addresses(latitude, longitude) WHERE latitude IS NOT NULL;

-- Add address_id FK FIRST (before RLS references it)
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_merchants_address_id ON public.merchants(address_id) WHERE address_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_address_id ON public.properties(address_id) WHERE address_id IS NOT NULL;

-- Now enable RLS with policies
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Addresses viewable by authenticated users"
  ON public.addresses FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.merchants m WHERE m.address_id = addresses.id AND m.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.properties p 
      JOIN public.merchants m ON p.merchant_id = m.id 
      WHERE p.address_id = addresses.id AND m.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Addresses manageable by owner merchants"
  ON public.addresses FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.merchants m WHERE m.address_id = addresses.id AND m.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.properties p 
      JOIN public.merchants m ON p.merchant_id = m.id 
      WHERE p.address_id = addresses.id AND m.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (true);

-- Migrate existing merchant address data
INSERT INTO public.addresses (street_address, city, province, postal_code)
SELECT DISTINCT m.address, m.city, m.province, m.postal_code
FROM public.merchants m
WHERE m.city IS NOT NULL AND m.province IS NOT NULL AND m.address_id IS NULL;

UPDATE public.merchants m
SET address_id = a.id
FROM public.addresses a
WHERE m.address_id IS NULL
  AND m.city IS NOT NULL AND m.province IS NOT NULL
  AND COALESCE(m.address, '') = COALESCE(a.street_address, '')
  AND m.city = a.city
  AND m.province = a.province
  AND COALESCE(m.postal_code, '') = COALESCE(a.postal_code, '');

-- Migrate existing property address data
INSERT INTO public.addresses (street_address, city, province, postal_code, latitude, longitude)
SELECT p.address, p.city, p.province, p.postal_code, p.latitude, p.longitude
FROM public.properties p
WHERE p.city IS NOT NULL AND p.province IS NOT NULL AND p.address_id IS NULL;

WITH prop_addr AS (
  SELECT DISTINCT ON (p.id) p.id as property_id, a.id as address_id
  FROM public.properties p
  JOIN public.addresses a ON 
    COALESCE(p.address, '') = COALESCE(a.street_address, '')
    AND p.city = a.city
    AND p.province = a.province
    AND COALESCE(p.postal_code, '') = COALESCE(a.postal_code, '')
  WHERE p.address_id IS NULL
)
UPDATE public.properties p
SET address_id = pa.address_id
FROM prop_addr pa
WHERE p.id = pa.property_id;

-- Backward-compatible views
CREATE OR REPLACE VIEW public.v_merchants_with_addresses AS
SELECT m.*, 
  COALESCE(a.street_address, m.address) as resolved_address,
  COALESCE(a.city, m.city) as resolved_city,
  COALESCE(a.province, m.province) as resolved_province,
  COALESCE(a.postal_code, m.postal_code) as resolved_postal_code
FROM public.merchants m
LEFT JOIN public.addresses a ON m.address_id = a.id;

CREATE OR REPLACE VIEW public.v_properties_with_addresses AS
SELECT p.*,
  COALESCE(a.street_address, p.address) as resolved_address,
  COALESCE(a.city, p.city) as resolved_city,
  COALESCE(a.province, p.province) as resolved_province,
  COALESCE(a.postal_code, p.postal_code) as resolved_postal_code,
  COALESCE(a.latitude, p.latitude) as resolved_latitude,
  COALESCE(a.longitude, p.longitude) as resolved_longitude
FROM public.properties p
LEFT JOIN public.addresses a ON p.address_id = a.id;
