-- Maintenance requests table
CREATE TABLE public.maintenance_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    tenant_user_id UUID NOT NULL,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'pending',
    images TEXT[],
    assigned_to TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payments table
CREATE TABLE public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    tenant_user_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    payment_type TEXT NOT NULL DEFAULT 'rent',
    payment_method TEXT,
    reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Maintenance RLS policies
CREATE POLICY "Admins can manage all maintenance requests"
ON public.maintenance_requests FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Merchants can manage their maintenance requests"
ON public.maintenance_requests FOR ALL
USING (EXISTS (
    SELECT 1 FROM merchants m
    WHERE m.id = maintenance_requests.merchant_id
    AND m.user_id = auth.uid()
));

CREATE POLICY "Tenants can view their maintenance requests"
ON public.maintenance_requests FOR SELECT
USING (tenant_user_id = auth.uid());

CREATE POLICY "Tenants can create maintenance requests"
ON public.maintenance_requests FOR INSERT
WITH CHECK (tenant_user_id = auth.uid());

CREATE POLICY "Tenants can update their pending maintenance requests"
ON public.maintenance_requests FOR UPDATE
USING (tenant_user_id = auth.uid() AND status = 'pending');

-- Payments RLS policies
CREATE POLICY "Admins can manage all payments"
ON public.payments FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Merchants can manage their payments"
ON public.payments FOR ALL
USING (EXISTS (
    SELECT 1 FROM merchants m
    WHERE m.id = payments.merchant_id
    AND m.user_id = auth.uid()
));

CREATE POLICY "Tenants can view their payments"
ON public.payments FOR SELECT
USING (tenant_user_id = auth.uid());

-- Updated_at triggers
CREATE TRIGGER update_maintenance_requests_updated_at
BEFORE UPDATE ON public.maintenance_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();