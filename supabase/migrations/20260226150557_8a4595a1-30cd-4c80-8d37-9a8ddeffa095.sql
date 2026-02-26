
-- Step 2.3a: contract_amendments table
CREATE TABLE IF NOT EXISTS public.contract_amendments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id),
  amendment_type TEXT NOT NULL DEFAULT 'rent_adjustment',
  old_values JSONB DEFAULT '{}'::jsonb,
  new_values JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  effective_date DATE,
  notes TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_contract_amendments_contract ON public.contract_amendments(contract_id);
CREATE INDEX idx_contract_amendments_merchant ON public.contract_amendments(merchant_id, status);
CREATE INDEX idx_lease_renewal_alerts_merchant ON public.lease_renewal_alerts(merchant_id, contract_id);

-- RLS
ALTER TABLE public.contract_amendments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants manage own amendments"
  ON public.contract_amendments
  FOR ALL
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
  )
  WITH CHECK (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
  );

-- Updated_at trigger
CREATE TRIGGER set_contract_amendments_updated_at
  BEFORE UPDATE ON public.contract_amendments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for collections_cases
ALTER PUBLICATION supabase_realtime ADD TABLE public.collections_cases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.waiting_list;
