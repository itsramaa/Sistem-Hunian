
-- ═══════════════════════════════════════════════════════════════════════
-- DSS Health Monitoring: RLS Access Logs table
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE public.rls_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  operation text NOT NULL, -- SELECT, INSERT, UPDATE, DELETE
  user_id uuid,
  user_role text,
  was_denied boolean NOT NULL DEFAULT false,
  policy_name text,
  error_message text,
  ip_address text,
  user_agent text,
  request_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rls_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can view all RLS access logs"
  ON public.rls_access_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role inserts (edge functions / triggers)
CREATE POLICY "Service role can insert RLS access logs"
  ON public.rls_access_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Indexes for dashboard queries
CREATE INDEX idx_rls_access_logs_created_at ON public.rls_access_logs (created_at DESC);
CREATE INDEX idx_rls_access_logs_denied ON public.rls_access_logs (was_denied, created_at DESC) WHERE was_denied = true;
CREATE INDEX idx_rls_access_logs_table ON public.rls_access_logs (table_name, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- OCR Validation Audit Trail table
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE public.dss_validation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL, -- 'ocr_result', 'payment_verification', 'dss_recommendation'
  entity_id uuid NOT NULL,
  validation_type text NOT NULL, -- 'schema', 'state_transition', 'business_rule'
  validation_result text NOT NULL, -- 'passed', 'failed', 'warning'
  validation_details jsonb DEFAULT '{}'::jsonb,
  old_state text,
  new_state text,
  performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dss_validation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view DSS validation logs"
  ON public.dss_validation_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Merchants can view own DSS validation logs"
  ON public.dss_validation_logs FOR SELECT
  TO authenticated
  USING (
    performed_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.merchants m WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert DSS validation logs"
  ON public.dss_validation_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow authenticated users to insert validation logs (edge functions running as user)
CREATE POLICY "Authenticated users can insert DSS validation logs"
  ON public.dss_validation_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_dss_validation_logs_entity ON public.dss_validation_logs (entity_type, entity_id);
CREATE INDEX idx_dss_validation_logs_result ON public.dss_validation_logs (validation_result, created_at DESC);
CREATE INDEX idx_dss_validation_logs_created ON public.dss_validation_logs (created_at DESC);
