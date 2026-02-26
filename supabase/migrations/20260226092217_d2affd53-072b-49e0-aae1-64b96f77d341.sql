
-- Drop dependent views first
DROP VIEW IF EXISTS v_merchants_with_addresses;
DROP VIEW IF EXISTS merchant_property_summary;

-- Drop redundant columns from merchants
ALTER TABLE merchants DROP COLUMN IF EXISTS subscription_tier;
ALTER TABLE merchants DROP COLUMN IF EXISTS disbursement_schedule;
ALTER TABLE merchants DROP COLUMN IF EXISTS billing_day;

-- Recreate v_merchants_with_addresses without dropped columns
CREATE VIEW v_merchants_with_addresses AS
SELECT m.id,
    m.user_id,
    m.business_name,
    m.business_type,
    m.address,
    m.city,
    m.province,
    m.postal_code,
    m.verification_status,
    m.created_at,
    m.updated_at,
    m.merchant_code,
    m.penalty_rate,
    m.verified_at,
    m.verified_by,
    m.rejected_at,
    m.rejected_by,
    m.rejection_details,
    m.resubmission_instructions,
    m.resubmission_count,
    m.verification_submitted_at,
    m.min_disbursement_amount,
    m.last_disbursement_date,
    m.total_disbursed,
    m.referral_discount,
    m.referral_discount_months,
    m.referred_by,
    m.address_id,
    COALESCE(a.street_address, m.address) AS resolved_address,
    COALESCE(a.city, m.city::character varying) AS resolved_city,
    COALESCE(a.province, m.province::character varying) AS resolved_province,
    COALESCE(a.postal_code, m.postal_code::character varying) AS resolved_postal_code
FROM merchants m
LEFT JOIN addresses a ON m.address_id = a.id;

-- Recreate merchant_property_summary using subscription from merchant_subscriptions
CREATE VIEW merchant_property_summary AS
SELECT m.id AS merchant_id,
    m.business_name,
    m.verification_status,
    st.name AS subscription_tier,
    count(DISTINCT p.id) AS property_count,
    count(DISTINCT u.id) AS unit_count,
    count(DISTINCT CASE WHEN u.status = 'occupied' THEN u.id ELSE NULL END) AS occupied_units,
    count(DISTINCT c.id) FILTER (WHERE c.status = 'active') AS active_contracts,
    COALESCE(sum(i.amount) FILTER (WHERE i.status = 'paid'), 0::numeric) AS total_revenue
FROM merchants m
LEFT JOIN merchant_subscriptions ms ON ms.merchant_id = m.id AND ms.status = 'active'
LEFT JOIN subscription_tiers st ON st.id = ms.tier_id
LEFT JOIN properties p ON p.merchant_id = m.id
LEFT JOIN units u ON u.property_id = p.id
LEFT JOIN contracts c ON c.merchant_id = m.id
LEFT JOIN invoices i ON i.merchant_id = m.id
GROUP BY m.id, m.business_name, m.verification_status, st.name;
