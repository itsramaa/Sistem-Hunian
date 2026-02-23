
-- =============================================
-- FASE 2: Property & Unit Enhancement
-- =============================================

-- 1. Add new columns to properties table
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS guardian_name text,
  ADD COLUMN IF NOT EXISTS guardian_phone text,
  ADD COLUMN IF NOT EXISTS marketing_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS construction_year integer,
  ADD COLUMN IF NOT EXISTS floor_count integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS building_condition text DEFAULT 'baik',
  ADD COLUMN IF NOT EXISTS land_ownership text DEFAULT 'milik_sendiri',
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS nearby_facilities jsonb DEFAULT '[]'::jsonb;

-- 2. Add new columns to units table
ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS occupancy_type text DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS electricity_included boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS electricity_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS electricity_cost_type text DEFAULT 'flat',
  ADD COLUMN IF NOT EXISTS water_included boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS water_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS water_cost_type text DEFAULT 'flat',
  ADD COLUMN IF NOT EXISTS wifi_included boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS wifi_speed_mbps integer,
  ADD COLUMN IF NOT EXISTS wifi_cost_sharing text DEFAULT 'included',
  ADD COLUMN IF NOT EXISTS additional_costs jsonb DEFAULT '[]'::jsonb;

-- 3. Create property_guardians table for full guardian management
CREATE TABLE IF NOT EXISTS public.property_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  address text,
  id_number text,
  salary numeric DEFAULT 0,
  salary_frequency text DEFAULT 'monthly',
  start_date date,
  end_date date,
  status text DEFAULT 'active',
  notes text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage their own guardians"
  ON public.property_guardians
  FOR ALL
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_property_guardians_updated_at
  BEFORE UPDATE ON public.property_guardians
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create nearby_facilities table for GPS-based facility distances
CREATE TABLE IF NOT EXISTS public.property_nearby_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  facility_type text NOT NULL,
  facility_name text NOT NULL,
  distance_meters numeric,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_nearby_facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view nearby facilities"
  ON public.property_nearby_facilities
  FOR SELECT
  USING (true);

CREATE POLICY "Merchants can manage nearby facilities for their properties"
  ON public.property_nearby_facilities
  FOR ALL
  USING (property_id IN (
    SELECT id FROM public.properties WHERE merchant_id IN (
      SELECT id FROM public.merchants WHERE user_id = auth.uid()
    )
  ))
  WITH CHECK (property_id IN (
    SELECT id FROM public.properties WHERE merchant_id IN (
      SELECT id FROM public.merchants WHERE user_id = auth.uid()
    )
  ));
