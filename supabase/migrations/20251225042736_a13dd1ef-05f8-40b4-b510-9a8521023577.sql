-- =====================================================
-- MOVE-OUT / CONTRACT TERMINATION FLOW - COMPLETE SCHEMA
-- =====================================================

-- Add columns to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS move_out_notice_given BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS move_out_notice_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expected_move_out_date DATE,
ADD COLUMN IF NOT EXISTS actual_end_date DATE,
ADD COLUMN IF NOT EXISTS termination_penalty NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS notice_period_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS early_termination_penalty_rate NUMERIC DEFAULT 2;

-- Add columns to units table
ALTER TABLE units 
ADD COLUMN IF NOT EXISTS vacant_since TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS available_from DATE,
ADD COLUMN IF NOT EXISTS is_listed BOOLEAN DEFAULT false;

-- =====================================================
-- 1. move_out_notices: Formal notice from tenant
-- =====================================================
CREATE TABLE IF NOT EXISTS public.move_out_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_user_id UUID NOT NULL,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  notice_date TIMESTAMPTZ DEFAULT NOW(),
  intended_move_out_date DATE NOT NULL,
  is_early_termination BOOLEAN DEFAULT false,
  reason TEXT,
  notes TEXT,
  status TEXT DEFAULT 'submitted',
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.move_out_notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can manage their move-out notices"
ON public.move_out_notices FOR ALL
USING (tenant_user_id = auth.uid());

CREATE POLICY "Merchants can view move-out notices for their contracts"
ON public.move_out_notices FOR SELECT
USING (EXISTS (
  SELECT 1 FROM contracts c
  JOIN merchants m ON m.id = c.merchant_id
  WHERE c.id = move_out_notices.contract_id AND m.user_id = auth.uid()
));

CREATE POLICY "Merchants can update move-out notices"
ON public.move_out_notices FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM contracts c
  JOIN merchants m ON m.id = c.merchant_id
  WHERE c.id = move_out_notices.contract_id AND m.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all move-out notices"
ON public.move_out_notices FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 2. move_out_timeline: Track steps in move-out process
-- =====================================================
CREATE TABLE IF NOT EXISTS public.move_out_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  move_out_notice_id UUID NOT NULL REFERENCES move_out_notices(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.move_out_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view timeline for their move-outs"
ON public.move_out_timeline FOR SELECT
USING (EXISTS (
  SELECT 1 FROM move_out_notices mon
  WHERE mon.id = move_out_timeline.move_out_notice_id
  AND (mon.tenant_user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM contracts c
    JOIN merchants m ON m.id = c.merchant_id
    WHERE c.id = mon.contract_id AND m.user_id = auth.uid()
  ))
));

CREATE POLICY "System can insert timeline entries"
ON public.move_out_timeline FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage all timeline"
ON public.move_out_timeline FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 3. move_out_tasks: Checklist for tenant
-- =====================================================
CREATE TABLE IF NOT EXISTS public.move_out_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  move_out_notice_id UUID NOT NULL REFERENCES move_out_notices(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.move_out_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can manage their move-out tasks"
ON public.move_out_tasks FOR ALL
USING (EXISTS (
  SELECT 1 FROM move_out_notices mon
  WHERE mon.id = move_out_tasks.move_out_notice_id
  AND mon.tenant_user_id = auth.uid()
));

CREATE POLICY "Merchants can view move-out tasks"
ON public.move_out_tasks FOR SELECT
USING (EXISTS (
  SELECT 1 FROM move_out_notices mon
  JOIN contracts c ON c.id = mon.contract_id
  JOIN merchants m ON m.id = c.merchant_id
  WHERE mon.id = move_out_tasks.move_out_notice_id AND m.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all tasks"
ON public.move_out_tasks FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 4. early_termination_requests
-- =====================================================
CREATE TABLE IF NOT EXISTS public.early_termination_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_user_id UUID NOT NULL,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  requested_date DATE NOT NULL,
  reason TEXT,
  supporting_docs TEXT[],
  penalty_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending_approval',
  merchant_response TEXT,
  counter_offer_amount NUMERIC,
  approved_at TIMESTAMPTZ,
  denied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.early_termination_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can manage their early termination requests"
ON public.early_termination_requests FOR ALL
USING (tenant_user_id = auth.uid());

CREATE POLICY "Merchants can view and update early termination requests"
ON public.early_termination_requests FOR ALL
USING (EXISTS (
  SELECT 1 FROM contracts c
  JOIN merchants m ON m.id = c.merchant_id
  WHERE c.id = early_termination_requests.contract_id AND m.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all early termination requests"
ON public.early_termination_requests FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 5. move_out_inspections
-- =====================================================
CREATE TABLE IF NOT EXISTS public.move_out_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  move_out_notice_id UUID NOT NULL REFERENCES move_out_notices(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMPTZ,
  inspector_id UUID,
  status TEXT DEFAULT 'scheduled',
  tenant_confirmed BOOLEAN DEFAULT false,
  inspection_report JSONB DEFAULT '{}',
  total_deductions NUMERIC DEFAULT 0,
  deposit_refund_amount NUMERIC,
  deduction_details JSONB DEFAULT '[]',
  tenant_signature TEXT,
  inspector_signature TEXT,
  photos TEXT[],
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.move_out_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their inspections"
ON public.move_out_inspections FOR SELECT
USING (EXISTS (
  SELECT 1 FROM move_out_notices mon
  WHERE mon.id = move_out_inspections.move_out_notice_id
  AND (mon.tenant_user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM contracts c
    JOIN merchants m ON m.id = c.merchant_id
    WHERE c.id = mon.contract_id AND m.user_id = auth.uid()
  ))
));

CREATE POLICY "Merchants can manage inspections"
ON public.move_out_inspections FOR ALL
USING (EXISTS (
  SELECT 1 FROM move_out_notices mon
  JOIN contracts c ON c.id = mon.contract_id
  JOIN merchants m ON m.id = c.merchant_id
  WHERE mon.id = move_out_inspections.move_out_notice_id AND m.user_id = auth.uid()
));

CREATE POLICY "Tenants can update inspection confirmation"
ON public.move_out_inspections FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM move_out_notices mon
  WHERE mon.id = move_out_inspections.move_out_notice_id
  AND mon.tenant_user_id = auth.uid()
));

CREATE POLICY "Admins can manage all inspections"
ON public.move_out_inspections FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 6. deposit_refunds
-- =====================================================
CREATE TABLE IF NOT EXISTS public.deposit_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_user_id UUID NOT NULL,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  inspection_id UUID REFERENCES move_out_inspections(id),
  original_deposit NUMERIC NOT NULL,
  deductions NUMERIC DEFAULT 0,
  deduction_details JSONB DEFAULT '[]',
  refund_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending_processing',
  due_date DATE,
  refunded_at TIMESTAMPTZ,
  xendit_disbursement_id TEXT,
  bank_account_number TEXT,
  bank_name TEXT,
  account_holder_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.deposit_refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their deposit refunds"
ON public.deposit_refunds FOR SELECT
USING (tenant_user_id = auth.uid());

CREATE POLICY "Tenants can update bank details"
ON public.deposit_refunds FOR UPDATE
USING (tenant_user_id = auth.uid());

CREATE POLICY "Merchants can manage deposit refunds"
ON public.deposit_refunds FOR ALL
USING (EXISTS (
  SELECT 1 FROM contracts c
  JOIN merchants m ON m.id = c.merchant_id
  WHERE c.id = deposit_refunds.contract_id AND m.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all deposit refunds"
ON public.deposit_refunds FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 7. deposit_disputes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.deposit_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deposit_refund_id UUID NOT NULL REFERENCES deposit_refunds(id) ON DELETE CASCADE,
  tenant_user_id UUID NOT NULL,
  disputed_amount NUMERIC NOT NULL,
  dispute_reason TEXT NOT NULL,
  evidence_photos TEXT[],
  status TEXT DEFAULT 'pending',
  merchant_response TEXT,
  admin_notes TEXT,
  resolution TEXT,
  resolved_amount NUMERIC,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.deposit_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can manage their deposit disputes"
ON public.deposit_disputes FOR ALL
USING (tenant_user_id = auth.uid());

CREATE POLICY "Merchants can view and respond to disputes"
ON public.deposit_disputes FOR ALL
USING (EXISTS (
  SELECT 1 FROM deposit_refunds dr
  JOIN contracts c ON c.id = dr.contract_id
  JOIN merchants m ON m.id = c.merchant_id
  WHERE dr.id = deposit_disputes.deposit_refund_id AND m.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all deposit disputes"
ON public.deposit_disputes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 8. unit_listings (for re-listing vacant units)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.unit_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  monthly_rent NUMERIC NOT NULL,
  description TEXT,
  photos TEXT[],
  status TEXT DEFAULT 'active',
  listed_at TIMESTAMPTZ DEFAULT NOW(),
  promoted BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  inquiries INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.unit_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active listings"
ON public.unit_listings FOR SELECT
USING (status = 'active');

CREATE POLICY "Merchants can manage their listings"
ON public.unit_listings FOR ALL
USING (EXISTS (
  SELECT 1 FROM merchants m
  WHERE m.id = unit_listings.merchant_id AND m.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all listings"
ON public.unit_listings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_move_out_notices_contract ON move_out_notices(contract_id);
CREATE INDEX IF NOT EXISTS idx_move_out_notices_tenant ON move_out_notices(tenant_user_id);
CREATE INDEX IF NOT EXISTS idx_move_out_notices_status ON move_out_notices(status);
CREATE INDEX IF NOT EXISTS idx_move_out_timeline_notice ON move_out_timeline(move_out_notice_id);
CREATE INDEX IF NOT EXISTS idx_move_out_tasks_notice ON move_out_tasks(move_out_notice_id);
CREATE INDEX IF NOT EXISTS idx_early_term_contract ON early_termination_requests(contract_id);
CREATE INDEX IF NOT EXISTS idx_inspections_notice ON move_out_inspections(move_out_notice_id);
CREATE INDEX IF NOT EXISTS idx_deposit_refunds_contract ON deposit_refunds(contract_id);
CREATE INDEX IF NOT EXISTS idx_deposit_refunds_status ON deposit_refunds(status);
CREATE INDEX IF NOT EXISTS idx_unit_listings_unit ON unit_listings(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_listings_status ON unit_listings(status);
CREATE INDEX IF NOT EXISTS idx_contracts_move_out ON contracts(move_out_notice_given) WHERE move_out_notice_given = true;
CREATE INDEX IF NOT EXISTS idx_units_vacant ON units(vacant_since) WHERE vacant_since IS NOT NULL;