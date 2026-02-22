
-- ============================================================================
-- DSS Layer: 6 Tables, RLS Policies, Indexes, Triggers
-- ============================================================================

-- ─── Table 1: ml_model_runs (created first — referenced by others) ─────────
CREATE TABLE public.ml_model_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  model_name TEXT NOT NULL DEFAULT 'google/gemini-2.5-pro',
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  input_summary TEXT,
  output_summary TEXT,
  confidence_score NUMERIC,
  execution_time_ms INTEGER,
  tokens_used INTEGER,
  cost_estimate NUMERIC,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ml_model_runs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ml_model_runs_function_name ON public.ml_model_runs(function_name);
CREATE INDEX idx_ml_model_runs_merchant_id ON public.ml_model_runs(merchant_id);
CREATE INDEX idx_ml_model_runs_created_at ON public.ml_model_runs(created_at DESC);

-- RLS: Merchants view own; Admins full; No update/delete for anyone
CREATE POLICY "Merchants can view own ml_model_runs"
  ON public.ml_model_runs FOR SELECT TO authenticated
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Insert only via service role (edge functions use service role key)
-- No INSERT policy for authenticated users — edge functions insert via service role

-- ─── Table 2: ocr_results ──────────────────────────────────────────────────
CREATE TABLE public.ocr_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'ktp', 'payment_proof', 'business_document', 'maintenance_receipt'
  document_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing', -- processing, completed, failed, requires_review
  extracted_data JSONB DEFAULT '{}'::jsonb,
  confidence_score NUMERIC,
  requires_review BOOLEAN NOT NULL DEFAULT false,
  review_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  ml_model_run_id UUID REFERENCES public.ml_model_runs(id),
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ocr_results ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ocr_results_user_id ON public.ocr_results(user_id);
CREATE INDEX idx_ocr_results_merchant_id ON public.ocr_results(merchant_id);
CREATE INDEX idx_ocr_results_document_type ON public.ocr_results(document_type);
CREATE INDEX idx_ocr_results_status ON public.ocr_results(status);

CREATE TRIGGER update_ocr_results_updated_at
  BEFORE UPDATE ON public.ocr_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: Users view own; Merchants view via merchant_id; Admins full
CREATE POLICY "Users can view own ocr_results"
  ON public.ocr_results FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Merchants can update own ocr_results"
  ON public.ocr_results FOR UPDATE TO authenticated
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- ─── Table 3: payment_verifications ────────────────────────────────────────
CREATE TABLE public.payment_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ocr_result_id UUID NOT NULL REFERENCES public.ocr_results(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  tenant_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, auto_matched, confirmed, rejected
  matched_amount NUMERIC,
  declared_amount NUMERIC,
  amount_difference NUMERIC,
  match_confidence NUMERIC,
  bank_name TEXT,
  sender_name TEXT,
  recipient_name TEXT,
  transfer_date DATE,
  reference_number TEXT,
  rejection_reason TEXT,
  confirmed_by UUID,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_payment_verifications_invoice_id ON public.payment_verifications(invoice_id);
CREATE INDEX idx_payment_verifications_merchant_id ON public.payment_verifications(merchant_id);
CREATE INDEX idx_payment_verifications_status ON public.payment_verifications(status);

CREATE TRIGGER update_payment_verifications_updated_at
  BEFORE UPDATE ON public.payment_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: Merchants manage via merchant_id; Tenants view own; Admins full
CREATE POLICY "Merchants can view own payment_verifications"
  ON public.payment_verifications FOR SELECT TO authenticated
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    OR tenant_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Merchants can update own payment_verifications"
  ON public.payment_verifications FOR UPDATE TO authenticated
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- ─── Table 4: maintenance_expenses ─────────────────────────────────────────
CREATE TABLE public.maintenance_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_request_id UUID NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
  ocr_result_id UUID REFERENCES public.ocr_results(id),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  vendor_name TEXT,
  receipt_number TEXT,
  receipt_date DATE,
  line_items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'IDR',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_expenses ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_maintenance_expenses_request_id ON public.maintenance_expenses(maintenance_request_id);
CREATE INDEX idx_maintenance_expenses_merchant_id ON public.maintenance_expenses(merchant_id);

CREATE TRIGGER update_maintenance_expenses_updated_at
  BEFORE UPDATE ON public.maintenance_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: Merchants manage via merchant_id; Admins full
CREATE POLICY "Merchants can view own maintenance_expenses"
  ON public.maintenance_expenses FOR SELECT TO authenticated
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Merchants can insert own maintenance_expenses"
  ON public.maintenance_expenses FOR INSERT TO authenticated
  WITH CHECK (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Merchants can update own maintenance_expenses"
  ON public.maintenance_expenses FOR UPDATE TO authenticated
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Merchants can delete own maintenance_expenses"
  ON public.maintenance_expenses FOR DELETE TO authenticated
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- ─── Table 5: tenant_risk_scores ───────────────────────────────────────────
CREATE TABLE public.tenant_risk_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_user_id UUID NOT NULL,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  risk_score NUMERIC NOT NULL DEFAULT 50,
  risk_level TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  payment_history_score NUMERIC,
  late_payment_count INTEGER DEFAULT 0,
  average_days_late NUMERIC DEFAULT 0,
  total_outstanding NUMERIC DEFAULT 0,
  contract_compliance_score NUMERIC,
  factors JSONB DEFAULT '{}'::jsonb,
  ml_model_run_id UUID REFERENCES public.ml_model_runs(id),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_user_id, merchant_id)
);

ALTER TABLE public.tenant_risk_scores ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tenant_risk_scores_merchant_id ON public.tenant_risk_scores(merchant_id);
CREATE INDEX idx_tenant_risk_scores_risk_level ON public.tenant_risk_scores(risk_level);
CREATE INDEX idx_tenant_risk_scores_valid_until ON public.tenant_risk_scores(valid_until);

CREATE TRIGGER update_tenant_risk_scores_updated_at
  BEFORE UPDATE ON public.tenant_risk_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: Merchants view own; Admins full
CREATE POLICY "Merchants can view own tenant_risk_scores"
  ON public.tenant_risk_scores FOR SELECT TO authenticated
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- ─── Table 6: dss_recommendations ──────────────────────────────────────────
CREATE TABLE public.dss_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  ml_model_run_id UUID REFERENCES public.ml_model_runs(id),
  type TEXT NOT NULL, -- 'pricing', 'collection', 'maintenance', 'investment'
  title TEXT NOT NULL,
  description TEXT,
  recommendation_data JSONB DEFAULT '{}'::jsonb,
  impact_estimate JSONB DEFAULT '{}'::jsonb,
  confidence_score NUMERIC,
  status TEXT NOT NULL DEFAULT 'generated', -- generated, viewed, accepted, rejected, measured
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  measured_impact JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dss_recommendations ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_dss_recommendations_merchant_id ON public.dss_recommendations(merchant_id);
CREATE INDEX idx_dss_recommendations_type ON public.dss_recommendations(type);
CREATE INDEX idx_dss_recommendations_status ON public.dss_recommendations(status);

CREATE TRIGGER update_dss_recommendations_updated_at
  BEFORE UPDATE ON public.dss_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: Merchants manage own; Admins full
CREATE POLICY "Merchants can view own dss_recommendations"
  ON public.dss_recommendations FOR SELECT TO authenticated
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Merchants can update own dss_recommendations"
  ON public.dss_recommendations FOR UPDATE TO authenticated
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
