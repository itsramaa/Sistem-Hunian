
-- Create unit_assets table for inventory management
CREATE TABLE public.unit_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id),
  asset_name text NOT NULL,
  serial_number text,
  brand text,
  model text,
  category text DEFAULT 'other',
  condition text DEFAULT 'good',
  photo_url text,
  barcode_data text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.unit_assets ENABLE ROW LEVEL SECURITY;

-- RLS: Merchants manage own assets
CREATE POLICY "Merchants manage own assets" ON public.unit_assets
  FOR ALL USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Index for fast lookups
CREATE INDEX idx_unit_assets_unit_id ON public.unit_assets(unit_id);
CREATE INDEX idx_unit_assets_merchant_id ON public.unit_assets(merchant_id);

-- Trigger for updated_at
CREATE TRIGGER update_unit_assets_updated_at
  BEFORE UPDATE ON public.unit_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
