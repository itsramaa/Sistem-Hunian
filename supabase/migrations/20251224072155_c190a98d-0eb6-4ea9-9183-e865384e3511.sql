-- Add columns for fee tracking in escrow_transactions
ALTER TABLE public.escrow_transactions 
  ADD COLUMN IF NOT EXISTS platform_fee NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gateway_fee NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gross_amount NUMERIC;

-- Add penalty_rate to merchants table (default 2%)
ALTER TABLE public.merchants 
  ADD COLUMN IF NOT EXISTS penalty_rate NUMERIC DEFAULT 0.02;

-- Add late fee tracking columns to invoices table
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS late_fee NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS late_fee_applied_at TIMESTAMP WITH TIME ZONE;