
-- Add reconciliation_status to payments
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS reconciliation_status text NOT NULL DEFAULT 'unmatched';

COMMENT ON COLUMN public.payments.reconciliation_status
  IS 'Payment reconciliation status: unmatched, auto_matched, manually_matched, pending_review';

-- Create payment_invoice_match table for tracking matches
CREATE TABLE IF NOT EXISTS public.payment_invoice_match (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments(id),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id),
  matched_amount numeric NOT NULL DEFAULT 0,
  match_type text NOT NULL DEFAULT 'manual',
  match_confidence numeric DEFAULT 0,
  match_reason text,
  matched_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_invoice_match_payment ON public.payment_invoice_match(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_invoice_match_invoice ON public.payment_invoice_match(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_invoice_match_merchant ON public.payment_invoice_match(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payments_reconciliation ON public.payments(merchant_id, reconciliation_status);

-- RLS
ALTER TABLE public.payment_invoice_match ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view their own matches"
  ON public.payment_invoice_match FOR SELECT
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants can insert their own matches"
  ON public.payment_invoice_match FOR INSERT
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants can update their own matches"
  ON public.payment_invoice_match FOR UPDATE
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Updated_at trigger
CREATE TRIGGER set_updated_at_payment_invoice_match
  BEFORE UPDATE ON public.payment_invoice_match
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
