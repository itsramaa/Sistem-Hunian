-- Add missing columns to merchants table for disbursement tracking
ALTER TABLE public.merchants 
ADD COLUMN IF NOT EXISTS min_disbursement_amount NUMERIC DEFAULT 100000,
ADD COLUMN IF NOT EXISTS last_disbursement_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_disbursed NUMERIC DEFAULT 0;

-- Add missing columns to disbursements table for manual review workflow
ALTER TABLE public.disbursements 
ADD COLUMN IF NOT EXISTS requires_manual_review BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reviewed_by UUID,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS review_notes TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add index for pending review disbursements query
CREATE INDEX IF NOT EXISTS idx_disbursements_pending_review 
ON public.disbursements (requires_manual_review, status) 
WHERE requires_manual_review = true;