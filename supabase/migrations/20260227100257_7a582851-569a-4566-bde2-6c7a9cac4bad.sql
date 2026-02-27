
-- tenant_screenings table
CREATE TABLE public.tenant_screenings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  tenant_user_id uuid,
  candidate_name text NOT NULL,
  candidate_email text,
  candidate_phone text,
  occupation text,
  employer_name text,
  monthly_income numeric,
  income_proof_url text,
  previous_landlord_name text,
  previous_landlord_phone text,
  previous_rental_notes text,
  guarantor_name text,
  guarantor_phone text,
  guarantor_relation text,
  guarantor_id_url text,
  screening_score numeric,
  screening_grade text,
  ai_assessment jsonb,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- updated_at trigger
CREATE TRIGGER set_updated_at_tenant_screenings
  BEFORE UPDATE ON public.tenant_screenings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.tenant_screenings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants manage own screenings"
  ON public.tenant_screenings
  FOR ALL
  TO authenticated
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
  )
  WITH CHECK (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
  );
