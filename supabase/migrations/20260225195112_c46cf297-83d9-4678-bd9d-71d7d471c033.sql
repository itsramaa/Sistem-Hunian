
-- PHASE 1: DATABASE UPGRADE (v5 - fix data before constraints)

-- ========== STEP 1: Fix NO ACTION FKs ==========
ALTER TABLE public.dss_recommendations DROP CONSTRAINT IF EXISTS dss_recommendations_ml_model_run_id_fkey;
ALTER TABLE public.dss_recommendations ADD CONSTRAINT dss_recommendations_ml_model_run_id_fkey FOREIGN KEY (ml_model_run_id) REFERENCES public.ml_model_runs(id) ON DELETE SET NULL;

ALTER TABLE public.live_chat_conversations DROP CONSTRAINT IF EXISTS live_chat_conversations_merchant_id_fkey;
ALTER TABLE public.live_chat_conversations ADD CONSTRAINT live_chat_conversations_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;

ALTER TABLE public.maintenance_expenses DROP CONSTRAINT IF EXISTS maintenance_expenses_ocr_result_id_fkey;
ALTER TABLE public.maintenance_expenses ADD CONSTRAINT maintenance_expenses_ocr_result_id_fkey FOREIGN KEY (ocr_result_id) REFERENCES public.ocr_results(id) ON DELETE SET NULL;

ALTER TABLE public.maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_tenant_user_id_fkey;
ALTER TABLE public.maintenance_requests ADD CONSTRAINT maintenance_requests_tenant_user_id_fkey FOREIGN KEY (tenant_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.occupancy_snapshots DROP CONSTRAINT IF EXISTS occupancy_snapshots_property_id_fkey;
ALTER TABLE public.occupancy_snapshots ADD CONSTRAINT occupancy_snapshots_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.occupancy_snapshots DROP CONSTRAINT IF EXISTS occupancy_snapshots_merchant_id_fkey;
ALTER TABLE public.occupancy_snapshots ADD CONSTRAINT occupancy_snapshots_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;

ALTER TABLE public.ocr_results DROP CONSTRAINT IF EXISTS ocr_results_ml_model_run_id_fkey;
ALTER TABLE public.ocr_results ADD CONSTRAINT ocr_results_ml_model_run_id_fkey FOREIGN KEY (ml_model_run_id) REFERENCES public.ml_model_runs(id) ON DELETE SET NULL;

ALTER TABLE public.property_renovations DROP CONSTRAINT IF EXISTS property_renovations_merchant_id_fkey;
ALTER TABLE public.property_renovations ADD CONSTRAINT property_renovations_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;

ALTER TABLE public.tenant_payment_metrics DROP CONSTRAINT IF EXISTS tenant_payment_metrics_merchant_id_fkey;
ALTER TABLE public.tenant_payment_metrics ADD CONSTRAINT tenant_payment_metrics_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;

ALTER TABLE public.tenant_risk_scores DROP CONSTRAINT IF EXISTS tenant_risk_scores_ml_model_run_id_fkey;
ALTER TABLE public.tenant_risk_scores ADD CONSTRAINT tenant_risk_scores_ml_model_run_id_fkey FOREIGN KEY (ml_model_run_id) REFERENCES public.ml_model_runs(id) ON DELETE SET NULL;

ALTER TABLE public.unit_assets DROP CONSTRAINT IF EXISTS unit_assets_merchant_id_fkey;
ALTER TABLE public.unit_assets ADD CONSTRAINT unit_assets_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;

-- ========== STEP 2: Indexes ==========
CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON public.merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_verifications_merchant_id ON public.merchant_verifications(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_subscriptions_merchant_id ON public.merchant_subscriptions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_subscriptions_tier_id ON public.merchant_subscriptions(tier_id);
CREATE INDEX IF NOT EXISTS idx_properties_merchant_id ON public.properties(merchant_id);
CREATE INDEX IF NOT EXISTS idx_units_property_id ON public.units(property_id);
CREATE INDEX IF NOT EXISTS idx_contracts_merchant_id ON public.contracts(merchant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_unit_id ON public.contracts(unit_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_user_id ON public.contracts(tenant_user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_contract_id ON public.invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_merchant_id ON public.invoices(merchant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_user_id ON public.invoices(tenant_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON public.payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_merchant_id ON public.payments(merchant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_merchant_id ON public.maintenance_requests(merchant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_unit_id ON public.maintenance_requests(unit_id);
CREATE INDEX IF NOT EXISTS idx_occupancy_snapshots_merchant_id ON public.occupancy_snapshots(merchant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_payment_metrics_merchant_id ON public.tenant_payment_metrics(merchant_id);

CREATE INDEX IF NOT EXISTS idx_merchants_user_id_status ON public.merchants(user_id, verification_status);
CREATE INDEX IF NOT EXISTS idx_merchants_created_at_status ON public.merchants(created_at DESC, verification_status);
CREATE INDEX IF NOT EXISTS idx_properties_merchant_id_status ON public.properties(merchant_id, status);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_units_property_id_status ON public.units(property_id, status);
CREATE INDEX IF NOT EXISTS idx_units_rent_range ON public.units(rent_amount, size_sqm) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_contracts_merchant_id_status ON public.contracts(merchant_id, status);
CREATE INDEX IF NOT EXISTS idx_contracts_unit_id_status ON public.contracts(unit_id, status, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_date_range ON public.contracts(start_date, end_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_invoices_contract_id_status ON public.invoices(contract_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_merchant_id_created ON public.invoices(merchant_id, created_at DESC, status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date_unpaid ON public.invoices(due_date, status) WHERE status IN ('unpaid', 'pending');
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_user_id_created ON public.invoices(tenant_user_id, created_at DESC) WHERE status != 'paid';
CREATE INDEX IF NOT EXISTS idx_payments_contract_status ON public.payments(contract_id, status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_merchant_unit ON public.maintenance_requests(merchant_id, unit_id, status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status_priority ON public.maintenance_requests(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_date_range ON public.maintenance_requests(created_at DESC) WHERE status IN ('pending', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_unit_status ON public.tenant_invitations(unit_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_email_status ON public.tenant_invitations(email, status);
CREATE INDEX IF NOT EXISTS idx_move_out_notices_contract_id ON public.move_out_notices(contract_id, status);
CREATE INDEX IF NOT EXISTS idx_merchant_subscriptions_status ON public.merchant_subscriptions(merchant_id, status, current_period_end);
CREATE INDEX IF NOT EXISTS idx_occupancy_snapshots_merchant_month ON public.occupancy_snapshots(merchant_id, snapshot_month DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_payment_metrics_merchant_calc ON public.tenant_payment_metrics(merchant_id, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ocr_results_created_at ON public.ocr_results(created_at DESC, status);

-- ========== STEP 3: Fix data then add CHECK Constraints ==========

-- Fix penalty rates stored as percentage (>1) to decimal (0-1)
UPDATE public.contracts SET early_termination_penalty_rate = early_termination_penalty_rate / 100.0 WHERE early_termination_penalty_rate > 1;
UPDATE public.contracts SET late_payment_penalty_rate = late_payment_penalty_rate / 100.0 WHERE late_payment_penalty_rate > 1;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_rent_positive') THEN
    ALTER TABLE public.contracts ADD CONSTRAINT check_rent_positive CHECK (rent_amount >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_deposit_nonnegative') THEN
    ALTER TABLE public.contracts ADD CONSTRAINT check_deposit_nonnegative CHECK (deposit_amount >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_units_rent_positive') THEN
    ALTER TABLE public.units ADD CONSTRAINT check_units_rent_positive CHECK (rent_amount >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_units_size_positive') THEN
    ALTER TABLE public.units ADD CONSTRAINT check_units_size_positive CHECK (size_sqm > 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_properties_total_units') THEN
    ALTER TABLE public.properties ADD CONSTRAINT check_properties_total_units CHECK (total_units >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_invoice_amount_nonnegative') THEN
    ALTER TABLE public.invoices ADD CONSTRAINT check_invoice_amount_nonnegative CHECK (amount >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_subscription_tiers_price_monthly') THEN
    ALTER TABLE public.subscription_tiers ADD CONSTRAINT check_subscription_tiers_price_monthly CHECK (price_monthly >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_subscription_tiers_price_yearly') THEN
    ALTER TABLE public.subscription_tiers ADD CONSTRAINT check_subscription_tiers_price_yearly CHECK (price_yearly >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_early_termination_penalty_rate') THEN
    ALTER TABLE public.contracts ADD CONSTRAINT check_early_termination_penalty_rate CHECK (early_termination_penalty_rate BETWEEN 0 AND 1);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_late_payment_penalty_rate') THEN
    ALTER TABLE public.contracts ADD CONSTRAINT check_late_payment_penalty_rate CHECK (late_payment_penalty_rate BETWEEN 0 AND 1);
  END IF;
END $$;

-- ========== STEP 4: Fix Coordinate Data Types ==========
ALTER TABLE public.properties
  ALTER COLUMN latitude TYPE numeric(10,8) USING latitude::numeric(10,8),
  ALTER COLUMN longitude TYPE numeric(11,8) USING longitude::numeric(11,8);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_latitude_range') THEN
    ALTER TABLE public.properties ADD CONSTRAINT check_latitude_range CHECK (latitude BETWEEN -90 AND 90);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_longitude_range') THEN
    ALTER TABLE public.properties ADD CONSTRAINT check_longitude_range CHECK (longitude BETWEEN -180 AND 180);
  END IF;
END $$;

ANALYZE public.merchants;
ANALYZE public.properties;
ANALYZE public.units;
ANALYZE public.contracts;
ANALYZE public.invoices;
ANALYZE public.payments;
ANALYZE public.maintenance_requests;
ANALYZE public.merchant_subscriptions;
