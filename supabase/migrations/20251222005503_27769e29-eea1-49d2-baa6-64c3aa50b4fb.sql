-- Create vendors table
CREATE TABLE public.vendors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    business_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    service_categories TEXT[] DEFAULT '{}',
    description TEXT,
    address TEXT,
    city TEXT,
    province TEXT,
    verification_status TEXT DEFAULT 'pending',
    rating NUMERIC DEFAULT 0,
    total_jobs INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create disputes table
CREATE TABLE public.disputes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID NOT NULL,
    tenant_user_id UUID NOT NULL,
    contract_id UUID REFERENCES public.contracts(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    resolution TEXT,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Vendors policies
CREATE POLICY "Admins can manage all vendors" ON public.vendors FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendors can view their own data" ON public.vendors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Vendors can update their own data" ON public.vendors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Vendors can insert their own data" ON public.vendors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Merchants can view verified vendors" ON public.vendors FOR SELECT USING (verification_status = 'verified' AND has_role(auth.uid(), 'merchant'));

-- Disputes policies
CREATE POLICY "Admins can manage all disputes" ON public.disputes FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Merchants can view their disputes" ON public.disputes FOR SELECT USING (EXISTS (SELECT 1 FROM merchants m WHERE m.id = disputes.merchant_id AND m.user_id = auth.uid()));
CREATE POLICY "Merchants can create disputes" ON public.disputes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM merchants m WHERE m.id = disputes.merchant_id AND m.user_id = auth.uid()));
CREATE POLICY "Tenants can view their disputes" ON public.disputes FOR SELECT USING (tenant_user_id = auth.uid());
CREATE POLICY "Tenants can create disputes" ON public.disputes FOR INSERT WITH CHECK (tenant_user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Add updated_at triggers
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();