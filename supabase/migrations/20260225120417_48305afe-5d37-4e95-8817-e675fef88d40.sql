-- Master fasilitas
CREATE TABLE public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'umum',
  purchase_price NUMERIC DEFAULT 0,
  purchase_date DATE,
  useful_life_months INTEGER DEFAULT 60,
  salvage_value NUMERIC DEFAULT 0,
  brand TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fasilitas terpasang di properti
CREATE TABLE public.property_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  installed_date DATE,
  condition TEXT DEFAULT 'baik',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(property_id, facility_id)
);

-- Fasilitas terpasang di unit
CREATE TABLE public.unit_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  installed_date DATE,
  condition TEXT DEFAULT 'baik',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(unit_id, facility_id)
);

-- Add category validation trigger
CREATE OR REPLACE FUNCTION public.validate_facility_category()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.category NOT IN ('umum', 'unit') THEN
    RAISE EXCEPTION 'Invalid category: must be umum or unit';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_facility_category
  BEFORE INSERT OR UPDATE ON public.facilities
  FOR EACH ROW EXECUTE FUNCTION public.validate_facility_category();

-- RLS
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchant manages own facilities" ON public.facilities
  FOR ALL USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchant manages property facilities" ON public.property_facilities
  FOR ALL USING (property_id IN (
    SELECT id FROM properties WHERE merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  ));

CREATE POLICY "Merchant manages unit facilities" ON public.unit_facilities
  FOR ALL USING (unit_id IN (
    SELECT u.id FROM units u JOIN properties p ON u.property_id = p.id
    WHERE p.merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  ));

-- Add estimated_cost to maintenance_requests
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC DEFAULT 0;

-- Add marketing_cost to financial form schema (already exists in properties table)
-- Updated_at triggers
CREATE TRIGGER set_facilities_updated_at
  BEFORE UPDATE ON public.facilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();