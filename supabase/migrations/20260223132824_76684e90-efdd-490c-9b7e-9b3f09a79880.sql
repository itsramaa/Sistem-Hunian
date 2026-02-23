
-- Add profiling fields to tenants table
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS institution TEXT,
  ADD COLUMN IF NOT EXISTS age_group TEXT;

-- Create occupancy_snapshots for monthly tracking
CREATE TABLE public.occupancy_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id),
  property_id UUID REFERENCES public.properties(id),
  snapshot_month TEXT NOT NULL, -- format: YYYY-MM
  total_units INTEGER NOT NULL DEFAULT 0,
  occupied_units INTEGER NOT NULL DEFAULT 0,
  available_units INTEGER NOT NULL DEFAULT 0,
  maintenance_units INTEGER NOT NULL DEFAULT 0,
  occupancy_rate NUMERIC NOT NULL DEFAULT 0,
  avg_rent_amount NUMERIC NOT NULL DEFAULT 0,
  new_move_ins INTEGER NOT NULL DEFAULT 0,
  move_outs INTEGER NOT NULL DEFAULT 0,
  avg_vacancy_days NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint per merchant/property/month
CREATE UNIQUE INDEX idx_occupancy_snapshots_unique 
  ON public.occupancy_snapshots (merchant_id, COALESCE(property_id, '00000000-0000-0000-0000-000000000000'::uuid), snapshot_month);

-- Enable RLS
ALTER TABLE public.occupancy_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Merchants can view own occupancy snapshots"
  ON public.occupancy_snapshots FOR SELECT
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role can manage occupancy snapshots"
  ON public.occupancy_snapshots FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create tenant_payment_metrics for DSS-calculated payment profiling
CREATE TABLE public.tenant_payment_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_user_id UUID NOT NULL,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id),
  total_invoices INTEGER NOT NULL DEFAULT 0,
  paid_on_time INTEGER NOT NULL DEFAULT 0,
  paid_late INTEGER NOT NULL DEFAULT 0,
  unpaid INTEGER NOT NULL DEFAULT 0,
  avg_days_late NUMERIC DEFAULT 0,
  total_late_fees NUMERIC DEFAULT 0,
  payment_score NUMERIC DEFAULT 0, -- 0-100, higher = better
  longest_streak_on_time INTEGER DEFAULT 0,
  current_streak_on_time INTEGER DEFAULT 0,
  first_invoice_date TIMESTAMPTZ,
  last_invoice_date TIMESTAMPTZ,
  renewal_count INTEGER NOT NULL DEFAULT 0,
  total_tenure_months INTEGER NOT NULL DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_user_id, merchant_id)
);

ALTER TABLE public.tenant_payment_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own tenant payment metrics"
  ON public.tenant_payment_metrics FOR SELECT
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role can manage tenant payment metrics"
  ON public.tenant_payment_metrics FOR ALL
  USING (true)
  WITH CHECK (true);
