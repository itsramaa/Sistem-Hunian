-- Priority 1: Subscription Billing Schema Updates

-- Task 1.1: Add missing columns to merchant_subscriptions
ALTER TABLE public.merchant_subscriptions 
ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_effective_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Task 1.2: Create subscription_invoices table
CREATE TABLE public.subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.merchant_subscriptions(id) ON DELETE SET NULL,
  tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id),
  amount NUMERIC NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, cancelled, overdue
  xendit_invoice_id TEXT,
  xendit_payment_url TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  failure_reason TEXT,
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on subscription_invoices
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_invoices
CREATE POLICY "Admins can manage all subscription invoices"
ON public.subscription_invoices FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Merchants can view their subscription invoices"
ON public.subscription_invoices FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.merchants m
  WHERE m.id = subscription_invoices.merchant_id
  AND m.user_id = auth.uid()
));

-- Task 1.3: Create pending_subscription_changes table
CREATE TABLE public.pending_subscription_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.merchant_subscriptions(id) ON DELETE CASCADE,
  current_tier_id UUID REFERENCES public.subscription_tiers(id),
  pending_tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id),
  change_type TEXT NOT NULL DEFAULT 'downgrade', -- upgrade, downgrade
  effective_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, applied, cancelled
  applied_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on pending_subscription_changes
ALTER TABLE public.pending_subscription_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pending_subscription_changes
CREATE POLICY "Admins can manage all pending changes"
ON public.pending_subscription_changes FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Merchants can view their pending changes"
ON public.pending_subscription_changes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.merchants m
  WHERE m.id = pending_subscription_changes.merchant_id
  AND m.user_id = auth.uid()
));

CREATE POLICY "Merchants can insert their pending changes"
ON public.pending_subscription_changes FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.merchants m
  WHERE m.id = pending_subscription_changes.merchant_id
  AND m.user_id = auth.uid()
));

CREATE POLICY "Merchants can cancel their pending changes"
ON public.pending_subscription_changes FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.merchants m
  WHERE m.id = pending_subscription_changes.merchant_id
  AND m.user_id = auth.uid()
));

-- Task 1.4: Create cancellation_feedback table
CREATE TABLE public.cancellation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.merchant_subscriptions(id) ON DELETE SET NULL,
  reason TEXT NOT NULL, -- too_expensive, not_using, missing_features, found_alternative, technical_issues, other
  feedback TEXT,
  would_return BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on cancellation_feedback
ALTER TABLE public.cancellation_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cancellation_feedback
CREATE POLICY "Admins can view all cancellation feedback"
ON public.cancellation_feedback FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Merchants can insert their cancellation feedback"
ON public.cancellation_feedback FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.merchants m
  WHERE m.id = cancellation_feedback.merchant_id
  AND m.user_id = auth.uid()
));

CREATE POLICY "Merchants can view their cancellation feedback"
ON public.cancellation_feedback FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.merchants m
  WHERE m.id = cancellation_feedback.merchant_id
  AND m.user_id = auth.uid()
));

-- Create indexes for better query performance
CREATE INDEX idx_subscription_invoices_merchant_id ON public.subscription_invoices(merchant_id);
CREATE INDEX idx_subscription_invoices_status ON public.subscription_invoices(status);
CREATE INDEX idx_subscription_invoices_due_date ON public.subscription_invoices(due_date);
CREATE INDEX idx_pending_subscription_changes_merchant_id ON public.pending_subscription_changes(merchant_id);
CREATE INDEX idx_pending_subscription_changes_effective_date ON public.pending_subscription_changes(effective_date);
CREATE INDEX idx_pending_subscription_changes_status ON public.pending_subscription_changes(status);
CREATE INDEX idx_cancellation_feedback_merchant_id ON public.cancellation_feedback(merchant_id);

-- Create trigger for updated_at on new tables
CREATE TRIGGER update_subscription_invoices_updated_at
BEFORE UPDATE ON public.subscription_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pending_subscription_changes_updated_at
BEFORE UPDATE ON public.pending_subscription_changes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();