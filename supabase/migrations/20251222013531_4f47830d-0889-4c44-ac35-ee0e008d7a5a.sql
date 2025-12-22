-- Create bank_accounts table for merchant bank account management
CREATE TABLE public.bank_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    branch_code TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add disbursement_schedule column to merchants table
ALTER TABLE public.merchants 
ADD COLUMN IF NOT EXISTS disbursement_schedule TEXT DEFAULT 'weekly';

-- Enable RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Merchants can view their bank accounts"
ON public.bank_accounts
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM merchants m
    WHERE m.id = bank_accounts.merchant_id AND m.user_id = auth.uid()
));

CREATE POLICY "Merchants can insert their bank accounts"
ON public.bank_accounts
FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM merchants m
    WHERE m.id = bank_accounts.merchant_id AND m.user_id = auth.uid()
));

CREATE POLICY "Merchants can update their bank accounts"
ON public.bank_accounts
FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM merchants m
    WHERE m.id = bank_accounts.merchant_id AND m.user_id = auth.uid()
));

CREATE POLICY "Merchants can delete their bank accounts"
ON public.bank_accounts
FOR DELETE
USING (EXISTS (
    SELECT 1 FROM merchants m
    WHERE m.id = bank_accounts.merchant_id AND m.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all bank accounts"
ON public.bank_accounts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_bank_accounts_updated_at
BEFORE UPDATE ON public.bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();