
-- Dashboard Preferences
CREATE TABLE public.dashboard_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  widget_order jsonb NOT NULL DEFAULT '["kpi_strip","quick_actions","subscription","charts","property_overview","financial_summary","vacancy"]'::jsonb,
  hidden_widgets jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(merchant_id)
);

ALTER TABLE public.dashboard_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own preferences"
  ON public.dashboard_preferences FOR ALL
  TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE TRIGGER update_dashboard_preferences_updated_at
  BEFORE UPDATE ON public.dashboard_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- API Keys
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  name text NOT NULL,
  scopes jsonb NOT NULL DEFAULT '["read"]'::jsonb,
  rate_limit integer NOT NULL DEFAULT 1000,
  last_used_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own API keys"
  ON public.api_keys FOR ALL
  TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Webhook Endpoints
CREATE TABLE public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  url text NOT NULL,
  events jsonb NOT NULL DEFAULT '[]'::jsonb,
  secret text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_triggered_at timestamptz,
  failure_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own webhooks"
  ON public.webhook_endpoints FOR ALL
  TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE TRIGGER update_webhook_endpoints_updated_at
  BEFORE UPDATE ON public.webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Webhook Logs
CREATE TABLE public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_status integer,
  response_body text,
  delivered_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own webhook logs"
  ON public.webhook_logs FOR SELECT
  TO authenticated
  USING (webhook_id IN (
    SELECT id FROM public.webhook_endpoints 
    WHERE merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
  ));

-- Index for API key lookup
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash) WHERE is_active = true;
CREATE INDEX idx_api_keys_merchant ON public.api_keys(merchant_id);
CREATE INDEX idx_webhook_endpoints_merchant ON public.webhook_endpoints(merchant_id);
CREATE INDEX idx_webhook_logs_webhook ON public.webhook_logs(webhook_id);
