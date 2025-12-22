-- =============================================
-- PRIORITY 1: Xendit Payment Gateway Tables
-- =============================================

-- Xendit transactions table for payment tracking
CREATE TABLE public.xendit_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    xendit_invoice_id TEXT,
    external_id TEXT NOT NULL,
    payment_id UUID,
    invoice_id UUID REFERENCES public.invoices(id),
    order_id UUID REFERENCES public.orders(id),
    user_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    payment_channel TEXT,
    payment_url TEXT,
    qr_code_url TEXT,
    virtual_account_number TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    expired_at TIMESTAMP WITH TIME ZONE,
    callback_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Disbursements table for merchant/vendor payouts
CREATE TABLE public.disbursements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    escrow_account_id UUID REFERENCES public.escrow_accounts(id),
    vendor_id UUID REFERENCES public.vendors(id),
    type TEXT NOT NULL DEFAULT 'rent',
    amount NUMERIC NOT NULL,
    fee_amount NUMERIC DEFAULT 0,
    net_amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    bank_account_id UUID,
    xendit_disbursement_id TEXT,
    xendit_reference TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- PRIORITY 2: Referral System Tables
-- =============================================

-- Referrals tracking table
CREATE TABLE public.referrals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_user_id UUID NOT NULL,
    referee_user_id UUID,
    referrer_role TEXT NOT NULL,
    referee_role TEXT,
    referral_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    reward_amount NUMERIC DEFAULT 0,
    reward_paid BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Referral rewards table
CREATE TABLE public.referral_rewards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    referral_id UUID REFERENCES public.referrals(id),
    type TEXT NOT NULL DEFAULT 'subscription_credit',
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    credited_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- PRIORITY 2: E-Signature Updates
-- =============================================

-- Add signature columns to contracts
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS signature_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS tenant_signature_url TEXT,
ADD COLUMN IF NOT EXISTS merchant_signature_url TEXT,
ADD COLUMN IF NOT EXISTS tenant_signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS merchant_signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS contract_document_url TEXT;

-- =============================================
-- PRIORITY 3: Vendor Verification Table
-- =============================================

CREATE TABLE public.vendor_verifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id),
    document_type TEXT NOT NULL,
    document_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- PRIORITY 3: Maintenance Updates Timeline
-- =============================================

CREATE TABLE public.maintenance_updates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    maintenance_request_id UUID NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    author_role TEXT NOT NULL,
    content TEXT NOT NULL,
    photos TEXT[],
    status_change_to TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- PRIORITY 3: Analytics Events Table
-- =============================================

CREATE TABLE public.analytics_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    page TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- Subscription billing columns
-- =============================================

ALTER TABLE public.merchant_subscriptions
ADD COLUMN IF NOT EXISTS xendit_recurring_id TEXT,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0;

-- =============================================
-- RLS Policies
-- =============================================

-- Enable RLS on all new tables
ALTER TABLE public.xendit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Xendit Transactions Policies
CREATE POLICY "Users can view their own transactions" ON public.xendit_transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create transactions" ON public.xendit_transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update transactions" ON public.xendit_transactions
    FOR UPDATE USING (true);

CREATE POLICY "Admins can manage all transactions" ON public.xendit_transactions
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Disbursements Policies
CREATE POLICY "Merchants can view their disbursements" ON public.disbursements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM escrow_accounts ea
            JOIN merchants m ON m.id = ea.merchant_id
            WHERE ea.id = disbursements.escrow_account_id AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Vendors can view their disbursements" ON public.disbursements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM vendors v
            WHERE v.id = disbursements.vendor_id AND v.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all disbursements" ON public.disbursements
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Referrals Policies
CREATE POLICY "Users can view their referrals" ON public.referrals
    FOR SELECT USING (referrer_user_id = auth.uid() OR referee_user_id = auth.uid());

CREATE POLICY "Users can create referrals" ON public.referrals
    FOR INSERT WITH CHECK (referrer_user_id = auth.uid());

CREATE POLICY "Admins can manage all referrals" ON public.referrals
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Referral Rewards Policies
CREATE POLICY "Users can view their rewards" ON public.referral_rewards
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all rewards" ON public.referral_rewards
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Vendor Verifications Policies
CREATE POLICY "Vendors can view their verifications" ON public.vendor_verifications
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_verifications.vendor_id AND v.user_id = auth.uid())
    );

CREATE POLICY "Vendors can insert their verifications" ON public.vendor_verifications
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_verifications.vendor_id AND v.user_id = auth.uid())
    );

CREATE POLICY "Admins can manage all vendor verifications" ON public.vendor_verifications
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Maintenance Updates Policies
CREATE POLICY "Users can view updates for their requests" ON public.maintenance_updates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM maintenance_requests mr
            WHERE mr.id = maintenance_updates.maintenance_request_id
            AND (mr.tenant_user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM merchants m WHERE m.id = mr.merchant_id AND m.user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Tenants can create updates for their requests" ON public.maintenance_updates
    FOR INSERT WITH CHECK (
        author_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM maintenance_requests mr
            WHERE mr.id = maintenance_updates.maintenance_request_id
            AND mr.tenant_user_id = auth.uid()
        )
    );

CREATE POLICY "Merchants can create updates for their requests" ON public.maintenance_updates
    FOR INSERT WITH CHECK (
        author_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM maintenance_requests mr
            JOIN merchants m ON m.id = mr.merchant_id
            WHERE mr.id = maintenance_updates.maintenance_request_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all maintenance updates" ON public.maintenance_updates
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Analytics Events Policies (insert-only for users, full access for admins)
CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all analytics" ON public.analytics_events
    FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- Triggers for updated_at
-- =============================================

CREATE TRIGGER update_xendit_transactions_updated_at
    BEFORE UPDATE ON public.xendit_transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_disbursements_updated_at
    BEFORE UPDATE ON public.disbursements
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON public.referrals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referral_rewards_updated_at
    BEFORE UPDATE ON public.referral_rewards
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Generate unique referral code function
-- =============================================

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
    code TEXT;
    exists_count INTEGER;
BEGIN
    LOOP
        code := upper(substring(md5(random()::text) from 1 for 8));
        SELECT COUNT(*) INTO exists_count FROM public.referrals WHERE referral_code = code;
        EXIT WHEN exists_count = 0;
    END LOOP;
    NEW.referral_code := code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER generate_referral_code_trigger
    BEFORE INSERT ON public.referrals
    FOR EACH ROW
    WHEN (NEW.referral_code IS NULL OR NEW.referral_code = '')
    EXECUTE FUNCTION public.generate_referral_code();