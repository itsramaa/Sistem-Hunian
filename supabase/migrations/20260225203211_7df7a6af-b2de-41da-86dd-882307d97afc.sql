
-- =============================================
-- MIGRATION 1: Phase 1 Completion (Partials)
-- =============================================

-- === 1D: Missing CHECK Constraints (5) ===

-- 1. merchants.penalty_rate BETWEEN 0 AND 1
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_penalty_rate'
    AND conrelid = 'public.merchants'::regclass
  ) THEN
    ALTER TABLE public.merchants
    ADD CONSTRAINT check_penalty_rate CHECK (penalty_rate BETWEEN 0 AND 1);
  END IF;
END $$;

-- 2. units.deposit_amount >= 0
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_units_deposit_nonneg'
    AND conrelid = 'public.units'::regclass
  ) THEN
    ALTER TABLE public.units
    ADD CONSTRAINT check_units_deposit_nonneg CHECK (deposit_amount >= 0);
  END IF;
END $$;

-- 3. referral_commissions.commission_amount >= 0
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_commission_nonneg'
    AND conrelid = 'public.referral_commissions'::regclass
  ) THEN
    ALTER TABLE public.referral_commissions
    ADD CONSTRAINT check_commission_nonneg CHECK (commission_amount >= 0);
  END IF;
END $$;

-- 4. payments.amount >= 0
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_payment_amount_nonneg'
    AND conrelid = 'public.payments'::regclass
  ) THEN
    ALTER TABLE public.payments
    ADD CONSTRAINT check_payment_amount_nonneg CHECK (amount >= 0);
  END IF;
END $$;

-- 5. payments.status IN (...)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payments_status_check'
    AND conrelid = 'public.payments'::regclass
  ) THEN
    ALTER TABLE public.payments
    ADD CONSTRAINT payments_status_check CHECK (status IN ('pending','paid','completed','failed','refunded'));
  END IF;
END $$;

-- === 1E: Missing Columns + Generation Triggers + UNIQUE ===

-- 1. properties.property_code
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_code TEXT;

CREATE OR REPLACE FUNCTION public.generate_property_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'PROP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM public.properties WHERE property_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_property_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.property_code IS NULL THEN
    NEW.property_code := public.generate_property_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_set_property_code ON public.properties;
CREATE TRIGGER tr_set_property_code
  BEFORE INSERT ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_property_code();

-- Backfill existing rows
UPDATE public.properties
SET property_code = 'PROP-' || UPPER(SUBSTRING(MD5(id::TEXT || RANDOM()::TEXT) FROM 1 FOR 6))
WHERE property_code IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'properties_property_code_key'
    AND conrelid = 'public.properties'::regclass
  ) THEN
    ALTER TABLE public.properties ADD CONSTRAINT properties_property_code_key UNIQUE (property_code);
  END IF;
END $$;

-- 2. contracts.contract_number
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS contract_number TEXT;

CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  year_month TEXT;
  seq_num INTEGER;
BEGIN
  IF NEW.contract_number IS NULL THEN
    year_month := to_char(now(), 'YYYYMM');
    SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM 12) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM public.contracts
    WHERE contract_number LIKE 'CTR-' || year_month || '-%';
    
    NEW.contract_number := 'CTR-' || year_month || '-' || LPAD(seq_num::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_set_contract_number ON public.contracts;
CREATE TRIGGER tr_set_contract_number
  BEFORE INSERT ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.generate_contract_number();

-- Backfill existing contracts
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn,
         to_char(created_at, 'YYYYMM') as ym
  FROM public.contracts
  WHERE contract_number IS NULL
)
UPDATE public.contracts c
SET contract_number = 'CTR-' || n.ym || '-' || LPAD(n.rn::TEXT, 4, '0')
FROM numbered n
WHERE c.id = n.id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contracts_contract_number_key'
    AND conrelid = 'public.contracts'::regclass
  ) THEN
    ALTER TABLE public.contracts ADD CONSTRAINT contracts_contract_number_key UNIQUE (contract_number);
  END IF;
END $$;

-- 3. subscription_invoices.invoice_number
ALTER TABLE public.subscription_invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;

CREATE OR REPLACE FUNCTION public.generate_subscription_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  year_month TEXT;
  seq_num INTEGER;
BEGIN
  IF NEW.invoice_number IS NULL THEN
    year_month := to_char(now(), 'YYYYMM');
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 13) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM public.subscription_invoices
    WHERE invoice_number LIKE 'SINV-' || year_month || '-%';
    
    NEW.invoice_number := 'SINV-' || year_month || '-' || LPAD(seq_num::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_set_subscription_invoice_number ON public.subscription_invoices;
CREATE TRIGGER tr_set_subscription_invoice_number
  BEFORE INSERT ON public.subscription_invoices
  FOR EACH ROW EXECUTE FUNCTION public.generate_subscription_invoice_number();

-- Backfill existing subscription invoices
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn,
         to_char(created_at, 'YYYYMM') as ym
  FROM public.subscription_invoices
  WHERE invoice_number IS NULL
)
UPDATE public.subscription_invoices si
SET invoice_number = 'SINV-' || n.ym || '-' || LPAD(n.rn::TEXT, 4, '0')
FROM numbered n
WHERE si.id = n.id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscription_invoices_invoice_number_key'
    AND conrelid = 'public.subscription_invoices'::regclass
  ) THEN
    ALTER TABLE public.subscription_invoices ADD CONSTRAINT subscription_invoices_invoice_number_key UNIQUE (invoice_number);
  END IF;
END $$;
