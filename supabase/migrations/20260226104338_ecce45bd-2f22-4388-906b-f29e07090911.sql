
-- Drop redundant payment_plan_id column from invoices
ALTER TABLE invoices DROP COLUMN IF EXISTS payment_plan_id;

-- Performance indexes for clear hierarchy
CREATE INDEX IF NOT EXISTS idx_invoices_merchant_due ON invoices (merchant_id, due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status_due ON invoices (status, due_date);
CREATE INDEX IF NOT EXISTS idx_payment_plans_invoice ON payment_plans (invoice_id);
