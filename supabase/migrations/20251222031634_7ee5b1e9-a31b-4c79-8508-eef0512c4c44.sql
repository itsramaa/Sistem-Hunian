-- Create vendor_jobs table (junction between vendors and maintenance_requests)
CREATE TABLE public.vendor_jobs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    maintenance_request_id UUID NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    quoted_price NUMERIC,
    agreed_price NUMERIC,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'))
);

-- Create vendor_earnings table
CREATE TABLE public.vendor_earnings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    vendor_job_id UUID NOT NULL REFERENCES public.vendor_jobs(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    fee_amount NUMERIC NOT NULL DEFAULT 0,
    net_amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT valid_earning_status CHECK (status IN ('pending', 'processing', 'paid', 'failed'))
);

-- Create vendor_bank_accounts table
CREATE TABLE public.vendor_bank_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    branch_code TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.vendor_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_jobs
CREATE POLICY "Vendors can view their jobs"
ON public.vendor_jobs FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_jobs.vendor_id AND v.user_id = auth.uid()
));

CREATE POLICY "Vendors can update their jobs"
ON public.vendor_jobs FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_jobs.vendor_id AND v.user_id = auth.uid()
));

CREATE POLICY "Merchants can view jobs for their requests"
ON public.vendor_jobs FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.merchants m
    WHERE m.id = vendor_jobs.merchant_id AND m.user_id = auth.uid()
));

CREATE POLICY "Merchants can insert jobs"
ON public.vendor_jobs FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.merchants m
    WHERE m.id = vendor_jobs.merchant_id AND m.user_id = auth.uid()
));

CREATE POLICY "Merchants can update jobs for their requests"
ON public.vendor_jobs FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.merchants m
    WHERE m.id = vendor_jobs.merchant_id AND m.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all vendor jobs"
ON public.vendor_jobs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for vendor_earnings
CREATE POLICY "Vendors can view their earnings"
ON public.vendor_earnings FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_earnings.vendor_id AND v.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all vendor earnings"
ON public.vendor_earnings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert vendor earnings"
ON public.vendor_earnings FOR INSERT
WITH CHECK (true);

-- RLS Policies for vendor_bank_accounts
CREATE POLICY "Vendors can view their bank accounts"
ON public.vendor_bank_accounts FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_bank_accounts.vendor_id AND v.user_id = auth.uid()
));

CREATE POLICY "Vendors can insert their bank accounts"
ON public.vendor_bank_accounts FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_bank_accounts.vendor_id AND v.user_id = auth.uid()
));

CREATE POLICY "Vendors can update their bank accounts"
ON public.vendor_bank_accounts FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_bank_accounts.vendor_id AND v.user_id = auth.uid()
));

CREATE POLICY "Vendors can delete their bank accounts"
ON public.vendor_bank_accounts FOR DELETE
USING (EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_bank_accounts.vendor_id AND v.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all vendor bank accounts"
ON public.vendor_bank_accounts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_vendor_jobs_updated_at
BEFORE UPDATE ON public.vendor_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_earnings_updated_at
BEFORE UPDATE ON public.vendor_earnings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_bank_accounts_updated_at
BEFORE UPDATE ON public.vendor_bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_vendor_jobs_vendor_id ON public.vendor_jobs(vendor_id);
CREATE INDEX idx_vendor_jobs_maintenance_request_id ON public.vendor_jobs(maintenance_request_id);
CREATE INDEX idx_vendor_jobs_merchant_id ON public.vendor_jobs(merchant_id);
CREATE INDEX idx_vendor_jobs_status ON public.vendor_jobs(status);
CREATE INDEX idx_vendor_earnings_vendor_id ON public.vendor_earnings(vendor_id);
CREATE INDEX idx_vendor_earnings_status ON public.vendor_earnings(status);
CREATE INDEX idx_vendor_bank_accounts_vendor_id ON public.vendor_bank_accounts(vendor_id);