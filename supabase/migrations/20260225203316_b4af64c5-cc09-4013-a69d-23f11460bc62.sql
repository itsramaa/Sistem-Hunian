
-- =============================================
-- MIGRATION 3: Phase 2C - Invoice Denormalization
-- + Fix security definer views
-- =============================================

-- Fix security definer views
ALTER VIEW public.v_merchants_with_addresses SET (security_invoker = on);
ALTER VIEW public.v_properties_with_addresses SET (security_invoker = on);

-- Add denormalized columns to invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS property_id UUID;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS unit_id UUID;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tenant_name TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS unit_number TEXT;

-- Backfill from contracts/units/profiles
UPDATE public.invoices i
SET 
  property_id = u.property_id,
  unit_id = c.unit_id,
  tenant_name = COALESCE(pr.full_name, ''),
  unit_number = u.unit_number
FROM public.contracts c
LEFT JOIN public.units u ON u.id = c.unit_id
LEFT JOIN public.profiles pr ON pr.user_id = c.tenant_user_id
WHERE i.contract_id = c.id
  AND i.property_id IS NULL;

-- Trigger to auto-populate on INSERT
CREATE OR REPLACE FUNCTION public.populate_invoice_denorm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.contract_id IS NOT NULL AND (NEW.property_id IS NULL OR NEW.unit_id IS NULL OR NEW.tenant_name IS NULL) THEN
    SELECT c.unit_id, u.property_id, u.unit_number, COALESCE(pr.full_name, '')
    INTO NEW.unit_id, NEW.property_id, NEW.unit_number, NEW.tenant_name
    FROM public.contracts c
    LEFT JOIN public.units u ON u.id = c.unit_id
    LEFT JOIN public.profiles pr ON pr.user_id = c.tenant_user_id
    WHERE c.id = NEW.contract_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_populate_invoice_denorm ON public.invoices;
CREATE TRIGGER tr_populate_invoice_denorm
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.populate_invoice_denorm();

-- Compound index for merchant dashboard queries
CREATE INDEX IF NOT EXISTS idx_invoices_merchant_due_unpaid 
  ON public.invoices(merchant_id, due_date DESC) 
  WHERE status IN ('pending', 'sent', 'overdue', 'partially_paid');

CREATE INDEX IF NOT EXISTS idx_invoices_property_id ON public.invoices(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_unit_id ON public.invoices(unit_id) WHERE unit_id IS NOT NULL;
