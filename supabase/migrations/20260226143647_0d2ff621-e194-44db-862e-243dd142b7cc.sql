
-- Create tenant_quality_scores table for tenant evaluation
CREATE TABLE IF NOT EXISTS public.tenant_quality_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id),
  tenant_user_id uuid NOT NULL,
  contract_id uuid REFERENCES public.contracts(id),
  payment_score integer NOT NULL DEFAULT 50,
  maintenance_score integer NOT NULL DEFAULT 50,
  compliance_score integer NOT NULL DEFAULT 50,
  communication_score integer NOT NULL DEFAULT 50,
  overall_quality_score integer NOT NULL DEFAULT 50,
  risk_level text NOT NULL DEFAULT 'medium',
  recommendation text NOT NULL DEFAULT 'monitor',
  last_calculated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tqs_merchant_score ON public.tenant_quality_scores(merchant_id, overall_quality_score);
CREATE INDEX IF NOT EXISTS idx_tqs_tenant ON public.tenant_quality_scores(tenant_user_id, contract_id);

ALTER TABLE public.tenant_quality_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants view own scores" ON public.tenant_quality_scores
  FOR SELECT USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants insert own scores" ON public.tenant_quality_scores
  FOR INSERT WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants update own scores" ON public.tenant_quality_scores
  FOR UPDATE USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE TRIGGER set_updated_at_tqs
  BEFORE UPDATE ON public.tenant_quality_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
