
-- Add financial tracking columns to properties
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS construction_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS renovation_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS funding_source text DEFAULT 'modal_sendiri',
  ADD COLUMN IF NOT EXISTS monthly_amortization numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_maintenance_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_annual_unexpected_cost numeric DEFAULT 0;
