
-- 1. Create new table
CREATE TABLE subscription_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    change_type TEXT NOT NULL DEFAULT 'downgrade',
    from_tier_id UUID REFERENCES subscription_tiers(id) ON DELETE CASCADE,
    to_tier_id UUID NOT NULL REFERENCES subscription_tiers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    effective_date DATE NOT NULL,
    applied_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    reason TEXT,
    requested_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Migrate existing data
INSERT INTO subscription_changes (id, merchant_id, change_type, from_tier_id, to_tier_id, status, effective_date, applied_at, cancelled_at, reason, created_at, updated_at)
SELECT id, merchant_id, change_type, current_tier_id, pending_tier_id, status, effective_date, applied_at, cancelled_at, reason, created_at, updated_at
FROM pending_subscription_changes;

-- 3. Indexes
CREATE INDEX idx_subscription_changes_merchant_status ON subscription_changes (merchant_id, status);
CREATE INDEX idx_subscription_changes_effective_date ON subscription_changes (effective_date);

-- 4. Updated_at trigger
CREATE TRIGGER update_subscription_changes_updated_at
BEFORE UPDATE ON subscription_changes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. RLS
ALTER TABLE subscription_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all subscription changes" ON subscription_changes
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Merchants can view their subscription changes" ON subscription_changes
FOR SELECT USING (EXISTS (
  SELECT 1 FROM merchants m WHERE m.id = subscription_changes.merchant_id AND m.user_id = auth.uid()
));

CREATE POLICY "Merchants can insert their subscription changes" ON subscription_changes
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM merchants m WHERE m.id = subscription_changes.merchant_id AND m.user_id = auth.uid()
));

CREATE POLICY "Merchants can cancel their subscription changes" ON subscription_changes
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM merchants m WHERE m.id = subscription_changes.merchant_id AND m.user_id = auth.uid()
));

-- 6. Drop old table
DROP TABLE pending_subscription_changes;
