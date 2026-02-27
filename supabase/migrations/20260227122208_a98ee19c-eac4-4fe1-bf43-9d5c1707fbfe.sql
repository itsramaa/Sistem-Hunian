
-- collections_interactions table for logging contact attempts
CREATE TABLE public.collections_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.collections_cases(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id),
  interaction_type text NOT NULL,
  direction text NOT NULL DEFAULT 'outbound',
  outcome text,
  notes text,
  contact_person text,
  follow_up_date timestamptz,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_collections_interactions_case_id ON public.collections_interactions(case_id);
CREATE INDEX idx_collections_interactions_merchant_id ON public.collections_interactions(merchant_id);

-- Enable RLS
ALTER TABLE public.collections_interactions ENABLE ROW LEVEL SECURITY;

-- RLS: merchant can manage own interactions
CREATE POLICY "Merchants manage own interactions"
  ON public.collections_interactions
  FOR ALL
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.collections_interactions;
