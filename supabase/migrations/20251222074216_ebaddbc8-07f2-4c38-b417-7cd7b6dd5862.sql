-- Add churn_reason column to contracts for tenant churn tracking
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS churn_reason text;

-- Add billing_day column to merchants for custom billing dates
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS billing_day integer DEFAULT 1 CHECK (billing_day >= 1 AND billing_day <= 28);

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net extension for HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;