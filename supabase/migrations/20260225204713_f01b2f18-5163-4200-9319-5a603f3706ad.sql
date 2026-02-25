
-- Migration 1: Performance Indexes (GIN + Text Search + JSONB + Full-Text Search)

-- Section 2.4 - Text Search B-tree Indexes
CREATE INDEX IF NOT EXISTS idx_merchants_business_name_btree ON public.merchants (business_name);
CREATE INDEX IF NOT EXISTS idx_properties_name_btree ON public.properties (name);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number_btree ON public.invoices (invoice_number);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number_btree ON public.contracts (contract_number);

-- Section 2.5 - Array GIN Indexes
CREATE INDEX IF NOT EXISTS idx_properties_amenities_gin ON public.properties USING GIN (amenities);
CREATE INDEX IF NOT EXISTS idx_properties_images_gin ON public.properties USING GIN (images);
CREATE INDEX IF NOT EXISTS idx_units_amenities_gin ON public.units USING GIN (amenities);
CREATE INDEX IF NOT EXISTS idx_units_photos_gin ON public.units USING GIN (photos);

-- Section 2.6 - JSONB GIN Indexes (jsonb_path_ops for smaller index size)
CREATE INDEX IF NOT EXISTS idx_subscription_features_gin ON public.subscription_tiers USING GIN (features jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_unit_additional_costs_gin ON public.units USING GIN (additional_costs jsonb_path_ops);

-- Section 2.4 - Full-Text Search on merchants
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Trigger function to auto-populate search_vector
CREATE OR REPLACE FUNCTION public.merchants_search_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.business_name, '') || ' ' ||
    coalesce(NEW.merchant_code, '') || ' ' ||
    coalesce(NEW.business_type, '') || ' ' ||
    coalesce(NEW.city, '') || ' ' ||
    coalesce(NEW.province, '')
  );
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS trg_merchants_search_update ON public.merchants;
CREATE TRIGGER trg_merchants_search_update
  BEFORE INSERT OR UPDATE OF business_name, merchant_code, business_type, city, province
  ON public.merchants
  FOR EACH ROW
  EXECUTE FUNCTION public.merchants_search_update();

-- GIN index on search_vector
CREATE INDEX IF NOT EXISTS idx_merchants_search_gin ON public.merchants USING GIN (search_vector);

-- Backfill existing rows
UPDATE public.merchants SET search_vector = to_tsvector('simple',
  coalesce(business_name, '') || ' ' ||
  coalesce(merchant_code, '') || ' ' ||
  coalesce(business_type, '') || ' ' ||
  coalesce(city, '') || ' ' ||
  coalesce(province, '')
);
