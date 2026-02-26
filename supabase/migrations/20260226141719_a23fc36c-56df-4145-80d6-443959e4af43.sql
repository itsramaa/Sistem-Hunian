ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS verification_tier text NOT NULL DEFAULT 'quick';

COMMENT ON COLUMN public.merchants.verification_tier
  IS 'Verification tier: quick (email+phone), standard (+KTP+SIUP), premium (+site visit)';