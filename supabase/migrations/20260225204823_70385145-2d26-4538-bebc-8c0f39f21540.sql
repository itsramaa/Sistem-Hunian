
-- Migration 3: Views, Materialized View, Analytics Summary, Invoice Status History

-- 2.2 N+1 Prevention View
CREATE OR REPLACE VIEW public.merchant_property_summary AS
SELECT
  m.id AS merchant_id,
  m.business_name,
  m.verification_status,
  m.subscription_tier,
  COUNT(DISTINCT p.id) AS property_count,
  COUNT(DISTINCT u.id) AS unit_count,
  COUNT(DISTINCT CASE WHEN u.status = 'occupied' THEN u.id END) AS occupied_units,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') AS active_contracts,
  COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'paid'), 0) AS total_revenue
FROM public.merchants m
LEFT JOIN public.properties p ON p.merchant_id = m.id
LEFT JOIN public.units u ON u.property_id = p.id
LEFT JOIN public.contracts c ON c.merchant_id = m.id
LEFT JOIN public.invoices i ON i.merchant_id = m.id
GROUP BY m.id, m.business_name, m.verification_status, m.subscription_tier;

-- 2.8 Materialized View for Analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.merchant_occupancy_analysis AS
SELECT
  m.id AS merchant_id,
  m.business_name,
  COUNT(DISTINCT p.id) AS total_properties,
  COUNT(DISTINCT u.id) AS total_units,
  COUNT(DISTINCT CASE WHEN u.status = 'occupied' THEN u.id END) AS occupied_units,
  CASE 
    WHEN COUNT(DISTINCT u.id) > 0 
    THEN ROUND(COUNT(DISTINCT CASE WHEN u.status = 'occupied' THEN u.id END)::numeric / COUNT(DISTINCT u.id) * 100, 2)
    ELSE 0 
  END AS occupancy_rate,
  COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'paid' AND i.created_at >= date_trunc('month', now())), 0) AS monthly_revenue,
  COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'paid'), 0) AS total_revenue,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') AS active_contracts,
  now() AS refreshed_at
FROM public.merchants m
LEFT JOIN public.properties p ON p.merchant_id = m.id
LEFT JOIN public.units u ON u.property_id = p.id
LEFT JOIN public.contracts c ON c.merchant_id = m.id
LEFT JOIN public.invoices i ON i.merchant_id = m.id
GROUP BY m.id, m.business_name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_merchant_occupancy_merchant_id ON public.merchant_occupancy_analysis (merchant_id);

-- 2.7 Analytics Summary Table
CREATE TABLE IF NOT EXISTS public.merchant_analytics_summary (
  merchant_id UUID PRIMARY KEY REFERENCES public.merchants(id) ON DELETE CASCADE,
  total_properties INTEGER DEFAULT 0,
  total_units INTEGER DEFAULT 0,
  occupied_units INTEGER DEFAULT 0,
  occupancy_rate NUMERIC(5,2) DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  monthly_revenue NUMERIC DEFAULT 0,
  active_contracts INTEGER DEFAULT 0,
  pending_invoices INTEGER DEFAULT 0,
  overdue_invoices INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for analytics summary
ALTER TABLE public.merchant_analytics_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own analytics" ON public.merchant_analytics_summary
  FOR SELECT USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin can view all analytics" ON public.merchant_analytics_summary
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
  );

-- Function to refresh analytics summary
CREATE OR REPLACE FUNCTION public.refresh_merchant_analytics(p_merchant_id UUID DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.merchant_analytics_summary (
    merchant_id, total_properties, total_units, occupied_units, occupancy_rate,
    total_revenue, monthly_revenue, active_contracts, pending_invoices, overdue_invoices, updated_at
  )
  SELECT
    m.id,
    COUNT(DISTINCT p.id),
    COUNT(DISTINCT u.id),
    COUNT(DISTINCT CASE WHEN u.status = 'occupied' THEN u.id END),
    CASE WHEN COUNT(DISTINCT u.id) > 0
      THEN ROUND(COUNT(DISTINCT CASE WHEN u.status = 'occupied' THEN u.id END)::numeric / COUNT(DISTINCT u.id) * 100, 2)
      ELSE 0 END,
    COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'paid'), 0),
    COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'paid' AND i.created_at >= date_trunc('month', now())), 0),
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active'),
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'pending'),
    COUNT(DISTINCT i.id) FILTER (WHERE i.status IN ('pending','overdue') AND i.due_date < now()),
    now()
  FROM public.merchants m
  LEFT JOIN public.properties p ON p.merchant_id = m.id
  LEFT JOIN public.units u ON u.property_id = p.id
  LEFT JOIN public.contracts c ON c.merchant_id = m.id
  LEFT JOIN public.invoices i ON i.merchant_id = m.id
  WHERE (p_merchant_id IS NULL OR m.id = p_merchant_id)
  GROUP BY m.id
  ON CONFLICT (merchant_id) DO UPDATE SET
    total_properties = EXCLUDED.total_properties,
    total_units = EXCLUDED.total_units,
    occupied_units = EXCLUDED.occupied_units,
    occupancy_rate = EXCLUDED.occupancy_rate,
    total_revenue = EXCLUDED.total_revenue,
    monthly_revenue = EXCLUDED.monthly_revenue,
    active_contracts = EXCLUDED.active_contracts,
    pending_invoices = EXCLUDED.pending_invoices,
    overdue_invoices = EXCLUDED.overdue_invoices,
    updated_at = now();
END;
$$;

-- 2.11 Invoice Status History (Audit Trail)
CREATE TABLE IF NOT EXISTS public.invoice_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_invoice_status_history_invoice ON public.invoice_status_history (invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status_history_merchant ON public.invoice_status_history (merchant_id);

ALTER TABLE public.invoice_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own invoice history" ON public.invoice_status_history
  FOR SELECT USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin can view all invoice history" ON public.invoice_status_history
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
  );

-- Trigger to track invoice status changes
CREATE OR REPLACE FUNCTION public.track_invoice_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.invoice_status_history (invoice_id, merchant_id, old_status, new_status, changed_by)
    VALUES (NEW.id, NEW.merchant_id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_invoice_status ON public.invoices;
CREATE TRIGGER trg_track_invoice_status
  AFTER UPDATE OF status ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.track_invoice_status_change();
