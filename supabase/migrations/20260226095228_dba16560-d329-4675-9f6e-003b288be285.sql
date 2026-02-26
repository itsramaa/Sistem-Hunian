
-- Step 1: Migrate referred_by data to referrals if not already tracked
INSERT INTO referrals (referrer_user_id, referee_user_id, referrer_role, status, created_at)
SELECT m.referred_by, m.user_id, 'merchant', 'completed', m.created_at
FROM merchants m
WHERE m.referred_by IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM referrals r WHERE r.referee_user_id = m.user_id
);

-- Step 2: Drop and recreate view without referral columns
DROP VIEW IF EXISTS v_merchants_with_addresses;

-- Step 3: Drop 3 referral columns
ALTER TABLE merchants DROP COLUMN IF EXISTS referred_by;
ALTER TABLE merchants DROP COLUMN IF EXISTS referral_discount;
ALTER TABLE merchants DROP COLUMN IF EXISTS referral_discount_months;

-- Step 4: Recreate view without referral columns
CREATE VIEW v_merchants_with_addresses AS
SELECT m.id, m.user_id, m.business_name, m.business_type,
  m.address, m.city, m.province, m.postal_code,
  m.verification_status, m.created_at, m.updated_at,
  m.merchant_code, m.penalty_rate, m.verified_at, m.verified_by,
  m.rejected_at, m.rejected_by, m.rejection_details,
  m.resubmission_instructions, m.resubmission_count,
  m.verification_submitted_at, m.min_disbursement_amount,
  m.last_disbursement_date, m.total_disbursed, m.address_id,
  COALESCE(a.street_address, m.address) AS resolved_address,
  COALESCE(a.city, m.city::varchar) AS resolved_city,
  COALESCE(a.province, m.province::varchar) AS resolved_province,
  COALESCE(a.postal_code, m.postal_code::varchar) AS resolved_postal_code
FROM merchants m
LEFT JOIN addresses a ON m.address_id = a.id;

-- Step 5: Create referral summary view
CREATE VIEW merchant_referral_summary AS
SELECT
  m.id AS merchant_id,
  r.referrer_user_id,
  r.referral_code,
  r.status AS referral_status,
  r.reward_amount,
  r.converted_at,
  COALESCE(SUM(rc.commission_amount), 0) AS total_commissions
FROM merchants m
LEFT JOIN referrals r ON m.user_id = r.referee_user_id
LEFT JOIN referral_commissions rc ON r.id = rc.referral_id
GROUP BY m.id, r.referrer_user_id, r.referral_code, r.status, r.reward_amount, r.converted_at;
