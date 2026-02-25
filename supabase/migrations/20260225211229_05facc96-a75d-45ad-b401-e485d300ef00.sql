
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_trial_days_nonneg') THEN
    ALTER TABLE subscription_tiers ADD CONSTRAINT check_trial_days_nonneg CHECK (trial_days >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_business_name_not_empty') THEN
    ALTER TABLE merchants ADD CONSTRAINT check_business_name_not_empty 
      CHECK (business_name IS NOT NULL AND LENGTH(TRIM(business_name)) > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_status_check') THEN
    ALTER TABLE invoices ADD CONSTRAINT invoices_status_check 
      CHECK (status IN ('draft','sent','issued','paid','overdue','cancelled','partial'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_due_date_after_created') THEN
    ALTER TABLE invoices ADD CONSTRAINT check_due_date_after_created 
      CHECK (due_date >= created_at::date);
  END IF;
END $$;
