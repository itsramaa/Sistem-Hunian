
-- Fix overly permissive policies on new tables
DROP POLICY IF EXISTS "Service role can manage occupancy snapshots" ON public.occupancy_snapshots;
DROP POLICY IF EXISTS "Service role can manage tenant payment metrics" ON public.tenant_payment_metrics;

-- Occupancy snapshots: only merchants can insert/update their own
CREATE POLICY "Merchants can insert own occupancy snapshots"
  ON public.occupancy_snapshots FOR INSERT
  WITH CHECK (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
  );

CREATE POLICY "Merchants can update own occupancy snapshots"
  ON public.occupancy_snapshots FOR UPDATE
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
  );

-- Tenant payment metrics: only merchants can insert/update their own
CREATE POLICY "Merchants can insert own tenant payment metrics"
  ON public.tenant_payment_metrics FOR INSERT
  WITH CHECK (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
  );

CREATE POLICY "Merchants can update own tenant payment metrics"
  ON public.tenant_payment_metrics FOR UPDATE
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
  );
