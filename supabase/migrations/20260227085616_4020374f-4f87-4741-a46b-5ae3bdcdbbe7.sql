-- Drop referral-related objects
DROP VIEW IF EXISTS merchant_referral_summary CASCADE;
DROP TABLE IF EXISTS referral_commissions CASCADE;
DROP TABLE IF EXISTS referral_rewards CASCADE;

-- Drop trigger before table (trigger is ON referrals)
DROP TRIGGER IF EXISTS generate_referral_code_trigger ON referrals;
DROP TABLE IF EXISTS referrals CASCADE;

-- Drop the function
DROP FUNCTION IF EXISTS generate_referral_code();