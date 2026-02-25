
-- Migration 4: Maintenance Expenses View + Security Fixes

-- 1.7 Maintenance expenses view (derive merchant_id from maintenance_requests)
CREATE OR REPLACE VIEW public.v_maintenance_expenses_with_merchant
WITH (security_invoker = true)
AS
SELECT
  me.*,
  mr.merchant_id AS derived_merchant_id,
  mr.title AS request_title,
  mr.status AS request_status
FROM public.maintenance_expenses me
JOIN public.maintenance_requests mr ON mr.id = me.maintenance_request_id;

-- Fix security definer views: recreate merchant_property_summary with security_invoker
DROP VIEW IF EXISTS public.merchant_property_summary;
CREATE VIEW public.merchant_property_summary
WITH (security_invoker = true)
AS
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

-- Revoke direct access to materialized view from anon/authenticated (security fix)
REVOKE ALL ON public.merchant_occupancy_analysis FROM anon, authenticated;
-- Grant only to authenticated (they still need RLS on underlying tables)
GRANT SELECT ON public.merchant_occupancy_analysis TO authenticated;

-- Initial populate of analytics summary
SELECT public.refresh_merchant_analytics();
