
-- 1. Create facility_types master table
CREATE TABLE public.facility_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'property',
  nature TEXT NOT NULL DEFAULT 'tangible',
  is_trackable BOOLEAN NOT NULL DEFAULT false,
  asset_type TEXT NOT NULL DEFAULT 'lainnya',
  default_useful_life_months INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(merchant_id, name)
);

-- 2. Create assets table (tangible trackable items)
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_type_id UUID NOT NULL REFERENCES public.facility_types(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  serial_number TEXT,
  brand TEXT,
  condition TEXT NOT NULL DEFAULT 'good',
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  purchase_date DATE,
  useful_life_months INTEGER NOT NULL DEFAULT 60,
  salvage_value NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create facility_assignments table (intangible assignments)
CREATE TABLE public.facility_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_type_id UUID NOT NULL REFERENCES public.facility_types(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  capacity INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.facility_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_assignments ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for facility_types
CREATE POLICY "Merchants manage own facility types" ON public.facility_types
  FOR ALL TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- 6. RLS policies for assets
CREATE POLICY "Merchants manage own assets" ON public.assets
  FOR ALL TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- 7. RLS policies for facility_assignments (via facility_type -> merchant)
CREATE POLICY "Merchants manage own facility assignments" ON public.facility_assignments
  FOR ALL TO authenticated
  USING (facility_type_id IN (
    SELECT id FROM public.facility_types WHERE merchant_id IN (
      SELECT id FROM public.merchants WHERE user_id = auth.uid()
    )
  ))
  WITH CHECK (facility_type_id IN (
    SELECT id FROM public.facility_types WHERE merchant_id IN (
      SELECT id FROM public.merchants WHERE user_id = auth.uid()
    )
  ));

-- 8. Migrate data from facilities to facility_types + assets
INSERT INTO public.facility_types (merchant_id, name, scope, nature, is_trackable, asset_type, default_useful_life_months)
SELECT DISTINCT ON (merchant_id, name)
  merchant_id,
  name,
  CASE WHEN category = 'umum' THEN 'property' ELSE 'unit' END,
  'tangible',
  true,
  COALESCE(asset_type, 'lainnya'),
  COALESCE(useful_life_months, 60)
FROM public.facilities
ON CONFLICT (merchant_id, name) DO NOTHING;

-- Migrate facilities with purchase_price > 0 to assets
INSERT INTO public.assets (facility_type_id, merchant_id, purchase_price, purchase_date, useful_life_months, salvage_value, brand, notes)
SELECT 
  ft.id,
  f.merchant_id,
  COALESCE(f.purchase_price, 0),
  f.purchase_date,
  COALESCE(f.useful_life_months, 60),
  COALESCE(f.salvage_value, 0),
  f.brand,
  f.notes
FROM public.facilities f
JOIN public.facility_types ft ON ft.merchant_id = f.merchant_id AND ft.name = f.name
WHERE f.purchase_price > 0;

-- 9. Create indexes for performance
CREATE INDEX idx_facility_types_merchant ON public.facility_types(merchant_id);
CREATE INDEX idx_assets_merchant ON public.assets(merchant_id);
CREATE INDEX idx_assets_facility_type ON public.assets(facility_type_id);
CREATE INDEX idx_assets_property ON public.assets(property_id);
CREATE INDEX idx_assets_unit ON public.assets(unit_id);
CREATE INDEX idx_facility_assignments_facility_type ON public.facility_assignments(facility_type_id);
CREATE INDEX idx_facility_assignments_property ON public.facility_assignments(property_id);
CREATE INDEX idx_facility_assignments_unit ON public.facility_assignments(unit_id);

-- 10. Updated_at trigger for facility_types and assets
CREATE TRIGGER update_facility_types_updated_at BEFORE UPDATE ON public.facility_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
