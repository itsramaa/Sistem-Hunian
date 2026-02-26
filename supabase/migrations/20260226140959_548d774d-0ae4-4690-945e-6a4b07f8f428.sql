
-- ============================================================================
-- Phase 0 Step 2: Create 7 Missing Database Tables
-- Tables: expenses, waiting_list, lease_renewal_alerts, dynamic_pricing_rules,
--         occupancy_forecast, payment_reminders_log, feature_flags
-- ============================================================================

-- 1. EXPENSES TABLE (general operating expenses with OCR support)
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'other',
  subcategory text,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'IDR',
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text,
  receipt_url text,
  ocr_data jsonb,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  approval_status text NOT NULL DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamptz,
  notes text,
  is_recurring boolean NOT NULL DEFAULT false,
  recurring_frequency text,
  tax_deductible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_merchant_id ON public.expenses(merchant_id);
CREATE INDEX idx_expenses_property_id ON public.expenses(property_id);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX idx_expenses_approval_status ON public.expenses(approval_status);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own expenses"
  ON public.expenses FOR ALL TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. WAITING_LIST TABLE (applicant queue with scoring)
CREATE TABLE public.waiting_list (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  applicant_name text NOT NULL,
  applicant_phone text,
  applicant_email text,
  budget_min numeric,
  budget_max numeric,
  preferred_move_in date,
  special_needs text,
  status text NOT NULL DEFAULT 'interested',
  quality_score numeric,
  priority_rank integer,
  offered_at timestamptz,
  offer_expires_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_waiting_list_merchant_id ON public.waiting_list(merchant_id);
CREATE INDEX idx_waiting_list_property_id ON public.waiting_list(property_id);
CREATE INDEX idx_waiting_list_status ON public.waiting_list(status);
CREATE INDEX idx_waiting_list_priority ON public.waiting_list(priority_rank);

ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own waiting list"
  ON public.waiting_list FOR ALL TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE TRIGGER update_waiting_list_updated_at
  BEFORE UPDATE ON public.waiting_list
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. LEASE_RENEWAL_ALERTS TABLE (automated renewal tracking)
CREATE TABLE public.lease_renewal_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  tenant_user_id uuid NOT NULL,
  alert_type text NOT NULL,
  alert_days_before integer NOT NULL,
  scheduled_date date NOT NULL,
  sent_at timestamptz,
  channel text NOT NULL DEFAULT 'email',
  status text NOT NULL DEFAULT 'pending',
  response text,
  responded_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lease_renewal_alerts_merchant_id ON public.lease_renewal_alerts(merchant_id);
CREATE INDEX idx_lease_renewal_alerts_contract_id ON public.lease_renewal_alerts(contract_id);
CREATE INDEX idx_lease_renewal_alerts_scheduled_date ON public.lease_renewal_alerts(scheduled_date);
CREATE INDEX idx_lease_renewal_alerts_status ON public.lease_renewal_alerts(status);

ALTER TABLE public.lease_renewal_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own renewal alerts"
  ON public.lease_renewal_alerts FOR ALL TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE TRIGGER update_lease_renewal_alerts_updated_at
  BEFORE UPDATE ON public.lease_renewal_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. DYNAMIC_PRICING_RULES TABLE (occupancy/seasonal/long-lease rules)
CREATE TABLE public.dynamic_pricing_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  rule_name text NOT NULL,
  rule_type text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  conditions jsonb NOT NULL DEFAULT '{}',
  adjustment_type text NOT NULL DEFAULT 'percentage',
  adjustment_value numeric NOT NULL DEFAULT 0,
  min_price numeric,
  max_price numeric,
  valid_from date,
  valid_until date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dynamic_pricing_rules_merchant_id ON public.dynamic_pricing_rules(merchant_id);
CREATE INDEX idx_dynamic_pricing_rules_property_id ON public.dynamic_pricing_rules(property_id);
CREATE INDEX idx_dynamic_pricing_rules_rule_type ON public.dynamic_pricing_rules(rule_type);
CREATE INDEX idx_dynamic_pricing_rules_is_active ON public.dynamic_pricing_rules(is_active);

ALTER TABLE public.dynamic_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own pricing rules"
  ON public.dynamic_pricing_rules FOR ALL TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE TRIGGER update_dynamic_pricing_rules_updated_at
  BEFORE UPDATE ON public.dynamic_pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. OCCUPANCY_FORECAST TABLE (monthly predictions with confidence)
CREATE TABLE public.occupancy_forecast (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  forecast_month date NOT NULL,
  predicted_occupancy_rate numeric NOT NULL,
  confidence_score numeric,
  actual_occupancy_rate numeric,
  model_version text,
  model_run_id uuid REFERENCES public.ml_model_runs(id) ON DELETE SET NULL,
  input_features jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id, forecast_month)
);

CREATE INDEX idx_occupancy_forecast_merchant_id ON public.occupancy_forecast(merchant_id);
CREATE INDEX idx_occupancy_forecast_property_id ON public.occupancy_forecast(property_id);
CREATE INDEX idx_occupancy_forecast_month ON public.occupancy_forecast(forecast_month);

ALTER TABLE public.occupancy_forecast ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own forecasts"
  ON public.occupancy_forecast FOR ALL TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE TRIGGER update_occupancy_forecast_updated_at
  BEFORE UPDATE ON public.occupancy_forecast
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. PAYMENT_REMINDERS_LOG TABLE (audit trail for reminders)
CREATE TABLE public.payment_reminders_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  tenant_user_id uuid NOT NULL,
  reminder_type text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  escalation_level integer NOT NULL DEFAULT 1,
  sent_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz,
  response text,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_reminders_log_merchant_id ON public.payment_reminders_log(merchant_id);
CREATE INDEX idx_payment_reminders_log_invoice_id ON public.payment_reminders_log(invoice_id);
CREATE INDEX idx_payment_reminders_log_tenant_user_id ON public.payment_reminders_log(tenant_user_id);
CREATE INDEX idx_payment_reminders_log_sent_at ON public.payment_reminders_log(sent_at);
CREATE INDEX idx_payment_reminders_log_escalation_level ON public.payment_reminders_log(escalation_level);

ALTER TABLE public.payment_reminders_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own reminder logs"
  ON public.payment_reminders_log FOR ALL TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- 7. FEATURE_FLAGS TABLE (per-merchant, per-feature toggle)
CREATE TABLE public.feature_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key text NOT NULL,
  merchant_id uuid REFERENCES public.merchants(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT false,
  rollout_percentage integer DEFAULT 0,
  description text,
  metadata jsonb,
  enabled_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(feature_key, merchant_id)
);

CREATE INDEX idx_feature_flags_feature_key ON public.feature_flags(feature_key);
CREATE INDEX idx_feature_flags_merchant_id ON public.feature_flags(merchant_id);
CREATE INDEX idx_feature_flags_is_enabled ON public.feature_flags(is_enabled);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Admins can manage all feature flags
CREATE POLICY "Admins can manage feature flags"
  ON public.feature_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Merchants can read their own feature flags
CREATE POLICY "Merchants can read own feature flags"
  ON public.feature_flags FOR SELECT TO authenticated
  USING (
    merchant_id IS NULL 
    OR merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
  );

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
