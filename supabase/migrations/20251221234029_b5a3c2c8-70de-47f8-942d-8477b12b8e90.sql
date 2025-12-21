
-- Create tenant_invitations table
CREATE TABLE public.tenant_invitations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    phone TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contracts table
CREATE TABLE public.contracts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    tenant_user_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rent_amount NUMERIC NOT NULL,
    deposit_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'terminated')),
    terms TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create escrow_accounts table
CREATE TABLE public.escrow_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    balance NUMERIC NOT NULL DEFAULT 0,
    pending_balance NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create escrow_transactions table
CREATE TABLE public.escrow_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    escrow_account_id UUID NOT NULL REFERENCES public.escrow_accounts(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'rent_payment', 'disbursement', 'refund', 'fee')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    reference TEXT,
    description TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

-- RLS for tenant_invitations
CREATE POLICY "Merchants can manage their invitations" ON public.tenant_invitations
FOR ALL USING (EXISTS (
    SELECT 1 FROM merchants m WHERE m.id = tenant_invitations.merchant_id AND m.user_id = auth.uid()
));

CREATE POLICY "Admins can view all invitations" ON public.tenant_invitations
FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS for contracts
CREATE POLICY "Merchants can manage their contracts" ON public.contracts
FOR ALL USING (EXISTS (
    SELECT 1 FROM merchants m WHERE m.id = contracts.merchant_id AND m.user_id = auth.uid()
));

CREATE POLICY "Tenants can view their contracts" ON public.contracts
FOR SELECT USING (tenant_user_id = auth.uid());

CREATE POLICY "Admins can manage all contracts" ON public.contracts
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS for escrow_accounts
CREATE POLICY "Merchants can view their escrow" ON public.escrow_accounts
FOR SELECT USING (EXISTS (
    SELECT 1 FROM merchants m WHERE m.id = escrow_accounts.merchant_id AND m.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all escrow accounts" ON public.escrow_accounts
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS for escrow_transactions
CREATE POLICY "Merchants can view their transactions" ON public.escrow_transactions
FOR SELECT USING (EXISTS (
    SELECT 1 FROM escrow_accounts ea
    JOIN merchants m ON m.id = ea.merchant_id
    WHERE ea.id = escrow_transactions.escrow_account_id AND m.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all transactions" ON public.escrow_transactions
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create updated_at triggers
CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON public.contracts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_escrow_accounts_updated_at
    BEFORE UPDATE ON public.escrow_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create escrow account for each merchant automatically
CREATE OR REPLACE FUNCTION public.create_merchant_escrow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.escrow_accounts (merchant_id, balance, pending_balance)
    VALUES (NEW.id, 0, 0);
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_merchant_created_create_escrow
    AFTER INSERT ON public.merchants
    FOR EACH ROW
    EXECUTE FUNCTION public.create_merchant_escrow();
