-- Create vouchers table for tenant referral rewards
CREATE TABLE public.vouchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'fixed', -- 'fixed' or 'percentage'
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order NUMERIC DEFAULT 0,
  max_discount NUMERIC DEFAULT NULL,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  applicable_to TEXT DEFAULT 'marketplace_orders', -- 'marketplace_orders', 'rent', 'all'
  usage_limit INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  referral_id UUID REFERENCES public.referrals(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referral_commissions table for merchant commission tracking
CREATE TABLE public.referral_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID NOT NULL REFERENCES public.referrals(id),
  referrer_id UUID NOT NULL,
  referee_id UUID NOT NULL,
  month_number INTEGER NOT NULL DEFAULT 1,
  subscription_amount NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0.20,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'eligible', 'paid', 'cancelled'
  eligible_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to referrals table
ALTER TABLE public.referrals 
ADD COLUMN IF NOT EXISTS referee_subscription_tier TEXT,
ADD COLUMN IF NOT EXISTS referee_monthly_payment NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_payment_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bonus_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bonus_paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS referee_order_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referee_avg_rating NUMERIC DEFAULT 0;

-- Add referral discount columns to merchants table
ALTER TABLE public.merchants
ADD COLUMN IF NOT EXISTS referral_discount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_discount_months INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referred_by UUID;

-- Add referral discount columns to tenants table (assuming we track tenant-specific bonuses)
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS referral_bonus_applied BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS referral_bonus_amount NUMERIC DEFAULT 0;

-- Add earnings columns to vendors
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS referral_earnings NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS referred_by UUID;

-- Enable RLS on new tables
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

-- Vouchers policies
CREATE POLICY "Users can view their vouchers"
ON public.vouchers FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "System can insert vouchers"
ON public.vouchers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their vouchers (use them)"
ON public.vouchers FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Admins can manage all vouchers"
ON public.vouchers FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Referral commissions policies
CREATE POLICY "Referrers can view their commissions"
ON public.referral_commissions FOR SELECT
USING (referrer_id = auth.uid());

CREATE POLICY "System can manage commissions"
ON public.referral_commissions FOR ALL
USING (true);

CREATE POLICY "Admins can manage all commissions"
ON public.referral_commissions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update referrals RLS to allow referee updates
CREATE POLICY "Referees can update their referral status"
ON public.referrals FOR UPDATE
USING (referee_user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vouchers_owner ON public.vouchers(owner_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON public.vouchers(code);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer ON public.referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON public.referral_commissions(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON public.referrals(referral_code);

-- Create function to generate unique voucher codes
CREATE OR REPLACE FUNCTION generate_voucher_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'VCHR-' || UPPER(SUBSTRING(md5(random()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM vouchers WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;