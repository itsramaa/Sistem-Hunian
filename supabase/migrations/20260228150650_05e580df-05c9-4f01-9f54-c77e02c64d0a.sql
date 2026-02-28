
-- Create payment_transfers table
CREATE TABLE public.payment_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES public.payments(id),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id),
  amount numeric NOT NULL,
  platform_fee numeric DEFAULT 0,
  gateway_fee numeric DEFAULT 0,
  net_amount numeric NOT NULL,
  bank_account_id uuid REFERENCES public.bank_accounts(id),
  status text NOT NULL DEFAULT 'pending',
  external_reference text,
  xendit_disbursement_id text,
  failure_reason text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_payment_transfers_merchant_id ON public.payment_transfers(merchant_id);
CREATE INDEX idx_payment_transfers_status ON public.payment_transfers(status);
CREATE INDEX idx_payment_transfers_payment_id ON public.payment_transfers(payment_id);

-- Updated_at trigger
CREATE TRIGGER update_payment_transfers_updated_at
  BEFORE UPDATE ON public.payment_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.payment_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own transfers"
  ON public.payment_transfers
  FOR SELECT
  USING (
    merchant_id IN (
      SELECT id FROM public.merchants WHERE user_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_transfers;
