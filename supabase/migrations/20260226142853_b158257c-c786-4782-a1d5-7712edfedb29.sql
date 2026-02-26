
-- View: v_outstanding_summary
-- Aggregates outstanding invoices by merchant and aging bucket
-- Payments link to contracts (not invoices), so we join via contract_id
CREATE OR REPLACE VIEW public.v_outstanding_summary AS
WITH outstanding AS (
  SELECT
    i.id AS invoice_id,
    i.merchant_id,
    i.tenant_user_id,
    i.contract_id,
    i.unit_id,
    i.unit_number,
    i.tenant_name,
    i.invoice_number,
    i.total_amount,
    i.status,
    i.due_date,
    i.created_at,
    COALESCE(paid_sum.total_paid, 0) AS paid_amount,
    i.total_amount - COALESCE(paid_sum.total_paid, 0) AS outstanding_amount,
    GREATEST(CURRENT_DATE - i.due_date, 0) AS days_overdue,
    CASE
      WHEN CURRENT_DATE - i.due_date < 7 THEN '< 7 hari'
      WHEN CURRENT_DATE - i.due_date < 14 THEN '7-14 hari'
      WHEN CURRENT_DATE - i.due_date < 30 THEN '14-30 hari'
      ELSE '> 30 hari'
    END AS aging_bucket,
    CASE
      WHEN CURRENT_DATE - i.due_date < 7 THEN 1
      WHEN CURRENT_DATE - i.due_date < 14 THEN 2
      WHEN CURRENT_DATE - i.due_date < 30 THEN 3
      ELSE 4
    END AS bucket_order,
    last_pay.last_payment_date
  FROM public.invoices i
  LEFT JOIN LATERAL (
    SELECT SUM(p.amount) AS total_paid
    FROM public.payments p
    WHERE p.contract_id = i.contract_id
      AND p.tenant_user_id = i.tenant_user_id
      AND p.status = 'paid'
      AND p.due_date = i.due_date
  ) paid_sum ON true
  LEFT JOIN LATERAL (
    SELECT MAX(p.paid_at) AS last_payment_date
    FROM public.payments p
    WHERE p.contract_id = i.contract_id
      AND p.tenant_user_id = i.tenant_user_id
      AND p.status = 'paid'
  ) last_pay ON true
  WHERE i.status IN ('sent', 'overdue', 'escalated', 'partially_paid')
    AND i.due_date <= CURRENT_DATE
)
SELECT * FROM outstanding;
