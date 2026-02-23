
-- Table: data_quality_checks
CREATE TABLE public.data_quality_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  quality_score numeric,
  validation_results jsonb DEFAULT '[]'::jsonb,
  overrides jsonb DEFAULT '[]'::jsonb,
  is_final_validated boolean DEFAULT false,
  validated_by uuid,
  validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.data_quality_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own quality checks"
  ON public.data_quality_checks FOR ALL
  TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE INDEX idx_data_quality_checks_merchant ON public.data_quality_checks(merchant_id);
CREATE INDEX idx_data_quality_checks_entity ON public.data_quality_checks(entity_type, entity_id);

-- Table: property_data_versions
CREATE TABLE public.property_data_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  version_number integer NOT NULL,
  snapshot_data jsonb NOT NULL,
  change_summary text,
  changed_by uuid,
  change_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_data_versions ENABLE ROW LEVEL SECURITY;

-- RLS via join to properties/units owned by merchant
CREATE POLICY "Merchants can view own property versions"
  ON public.property_data_versions FOR SELECT
  TO authenticated
  USING (
    (entity_type = 'property' AND entity_id IN (
      SELECT id FROM public.properties WHERE merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    ))
    OR
    (entity_type = 'unit' AND entity_id IN (
      SELECT u.id FROM public.units u JOIN public.properties p ON u.property_id = p.id
      WHERE p.merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    ))
  );

CREATE POLICY "Merchants can insert own property versions"
  ON public.property_data_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    (entity_type = 'property' AND entity_id IN (
      SELECT id FROM public.properties WHERE merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    ))
    OR
    (entity_type = 'unit' AND entity_id IN (
      SELECT u.id FROM public.units u JOIN public.properties p ON u.property_id = p.id
      WHERE p.merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    ))
  );

CREATE INDEX idx_property_data_versions_entity ON public.property_data_versions(entity_type, entity_id);
CREATE INDEX idx_property_data_versions_number ON public.property_data_versions(entity_id, version_number DESC);
