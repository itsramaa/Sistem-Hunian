
-- Migration 2: Additional CHECK Constraints (retry - allow -1 for unlimited)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_max_properties_valid') THEN
    ALTER TABLE public.subscription_tiers ADD CONSTRAINT check_max_properties_valid CHECK (max_properties >= -1);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_resubmission_count_nonneg') THEN
    ALTER TABLE public.merchants ADD CONSTRAINT check_resubmission_count_nonneg CHECK (resubmission_count >= 0);
  END IF;
END $$;
