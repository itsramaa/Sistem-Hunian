-- Add missing columns to contracts for late payment settings
ALTER TABLE public.contracts 
  ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS late_fee_type TEXT DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS late_payment_penalty_rate NUMERIC DEFAULT 0.02;

-- Add missing columns to invoices for grace period and payment plan tracking
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS grace_period_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS overdue_since TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_plan_id UUID;

-- Create late_fee_records table for audit trail
CREATE TABLE IF NOT EXISTS public.late_fee_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  original_amount NUMERIC NOT NULL,
  late_fee_amount NUMERIC NOT NULL,
  days_overdue INTEGER NOT NULL,
  calculation_method TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on late_fee_records
ALTER TABLE public.late_fee_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for late_fee_records
CREATE POLICY "Merchants can view late fee records for their invoices"
ON public.late_fee_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.invoices i
    JOIN public.merchants m ON i.merchant_id = m.id
    WHERE i.id = late_fee_records.invoice_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Tenants can view their own late fee records"
ON public.late_fee_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = late_fee_records.invoice_id
    AND i.tenant_user_id = auth.uid()
  )
);

-- Create payment_plans table
CREATE TABLE IF NOT EXISTS public.payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  tenant_user_id UUID NOT NULL,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  original_amount NUMERIC NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'installments',
  installment_count INTEGER NOT NULL DEFAULT 3,
  installment_amount NUMERIC NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'bi-weekly',
  start_date DATE NOT NULL,
  late_fee_waived BOOLEAN DEFAULT false,
  waived_amount NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_acceptance',
  terms TEXT,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  defaulted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on payment_plans
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_plans
CREATE POLICY "Merchants can manage payment plans for their tenants"
ON public.payment_plans FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.merchants m
    WHERE m.id = payment_plans.merchant_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Tenants can view and update their payment plans"
ON public.payment_plans FOR SELECT
USING (tenant_user_id = auth.uid());

CREATE POLICY "Tenants can update their payment plans (accept/decline)"
ON public.payment_plans FOR UPDATE
USING (tenant_user_id = auth.uid())
WITH CHECK (tenant_user_id = auth.uid());

-- Create payment_plan_installments table
CREATE TABLE IF NOT EXISTS public.payment_plan_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_plan_id UUID NOT NULL REFERENCES public.payment_plans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  invoice_id UUID REFERENCES public.invoices(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on payment_plan_installments
ALTER TABLE public.payment_plan_installments ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_plan_installments
CREATE POLICY "Merchants can view installments for their payment plans"
ON public.payment_plan_installments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.payment_plans pp
    JOIN public.merchants m ON pp.merchant_id = m.id
    WHERE pp.id = payment_plan_installments.payment_plan_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Tenants can view their own installments"
ON public.payment_plan_installments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.payment_plans pp
    WHERE pp.id = payment_plan_installments.payment_plan_id
    AND pp.tenant_user_id = auth.uid()
  )
);

-- Create collections_cases table
CREATE TABLE IF NOT EXISTS public.collections_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_user_id UUID NOT NULL,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  total_due NUMERIC NOT NULL,
  days_overdue INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'initiated',
  escalation_level INTEGER NOT NULL DEFAULT 1,
  last_contact_at TIMESTAMPTZ,
  next_action_date DATE,
  resolved_at TIMESTAMPTZ,
  resolution_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on collections_cases
ALTER TABLE public.collections_cases ENABLE ROW LEVEL SECURITY;

-- RLS policies for collections_cases
CREATE POLICY "Merchants can manage their collections cases"
ON public.collections_cases FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.merchants m
    WHERE m.id = collections_cases.merchant_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all collections cases"
ON public.collections_cases FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- Add foreign key constraint for payment_plan_id in invoices
ALTER TABLE public.invoices 
  ADD CONSTRAINT invoices_payment_plan_id_fkey 
  FOREIGN KEY (payment_plan_id) 
  REFERENCES public.payment_plans(id) 
  ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_late_fee_records_invoice_id ON public.late_fee_records(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_invoice_id ON public.payment_plans(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_merchant_id ON public.payment_plans(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_tenant_user_id ON public.payment_plans(tenant_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_status ON public.payment_plans(status);
CREATE INDEX IF NOT EXISTS idx_payment_plan_installments_plan_id ON public.payment_plan_installments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_plan_installments_due_date ON public.payment_plan_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_collections_cases_merchant_id ON public.collections_cases(merchant_id);
CREATE INDEX IF NOT EXISTS idx_collections_cases_status ON public.collections_cases(status);
CREATE INDEX IF NOT EXISTS idx_invoices_overdue_since ON public.invoices(overdue_since);
CREATE INDEX IF NOT EXISTS idx_invoices_grace_period_active ON public.invoices(grace_period_active);

-- Create triggers for updated_at
CREATE TRIGGER update_payment_plans_updated_at
BEFORE UPDATE ON public.payment_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collections_cases_updated_at
BEFORE UPDATE ON public.collections_cases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();