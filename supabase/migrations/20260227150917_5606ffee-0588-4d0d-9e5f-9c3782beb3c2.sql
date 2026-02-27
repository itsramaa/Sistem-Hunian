
-- Add negotiation fields to contract_amendments
ALTER TABLE public.contract_amendments 
  ADD COLUMN IF NOT EXISTS tenant_user_id uuid,
  ADD COLUMN IF NOT EXISTS merchant_offer jsonb,
  ADD COLUMN IF NOT EXISTS tenant_counter_offer jsonb,
  ADD COLUMN IF NOT EXISTS negotiation_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS merchant_signature text,
  ADD COLUMN IF NOT EXISTS tenant_signature text,
  ADD COLUMN IF NOT EXISTS tenant_signed_at timestamptz;

-- Create preventive_maintenance_schedules table
CREATE TABLE IF NOT EXISTS public.preventive_maintenance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id),
  property_id uuid REFERENCES public.properties(id),
  unit_id uuid REFERENCES public.units(id),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  frequency text NOT NULL DEFAULT 'monthly',
  custom_interval_days integer,
  preferred_vendor_id uuid REFERENCES public.vendors(id),
  estimated_cost numeric DEFAULT 0,
  priority text DEFAULT 'medium',
  next_scheduled_date date NOT NULL,
  last_executed_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.preventive_maintenance_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants manage own schedules" ON public.preventive_maintenance_schedules
  FOR ALL USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
  );

-- Updated_at trigger
CREATE TRIGGER set_updated_at_preventive_maintenance
  BEFORE UPDATE ON public.preventive_maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
