-- Task 1.1: Add missing columns to merchants table
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS verified_by UUID;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS rejected_by UUID;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS rejection_details TEXT;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS resubmission_instructions TEXT;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS resubmission_count INTEGER DEFAULT 0;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMP WITH TIME ZONE;

-- Task 1.2: Create merchant_verification_history table
CREATE TABLE IF NOT EXISTS public.merchant_verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL, -- 'submitted', 'approved', 'rejected', 'resubmitted', 'suspended', 'reactivated'
  performed_by UUID,
  approval_notes TEXT,
  rejection_reason TEXT,
  rejection_details TEXT,
  resubmission_instructions TEXT,
  old_status TEXT,
  new_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.merchant_verification_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all verification history"
  ON public.merchant_verification_history FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Merchants can view their own history"
  ON public.merchant_verification_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.merchants m 
    WHERE m.id = merchant_verification_history.merchant_id 
    AND m.user_id = auth.uid()
  ));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_merchant_verification_history_merchant_id 
  ON public.merchant_verification_history(merchant_id);

CREATE INDEX IF NOT EXISTS idx_merchant_verification_history_created_at 
  ON public.merchant_verification_history(created_at DESC);