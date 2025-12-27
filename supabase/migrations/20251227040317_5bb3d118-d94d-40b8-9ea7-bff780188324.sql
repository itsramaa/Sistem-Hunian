-- Fix Foreign Key Constraints: NO ACTION → SET NULL/CASCADE/RESTRICT

-- 1. deposit_refunds.inspection_id → SET NULL (keep historical records)
ALTER TABLE deposit_refunds DROP CONSTRAINT IF EXISTS deposit_refunds_inspection_id_fkey;
ALTER TABLE deposit_refunds ADD CONSTRAINT deposit_refunds_inspection_id_fkey 
  FOREIGN KEY (inspection_id) REFERENCES move_out_inspections(id) ON DELETE SET NULL;

-- 2. disbursements.escrow_account_id → SET NULL (keep payout history)
ALTER TABLE disbursements DROP CONSTRAINT IF EXISTS disbursements_escrow_account_id_fkey;
ALTER TABLE disbursements ADD CONSTRAINT disbursements_escrow_account_id_fkey 
  FOREIGN KEY (escrow_account_id) REFERENCES escrow_accounts(id) ON DELETE SET NULL;

-- 3. disbursements.vendor_id → SET NULL (keep payout history)
ALTER TABLE disbursements DROP CONSTRAINT IF EXISTS disbursements_vendor_id_fkey;
ALTER TABLE disbursements ADD CONSTRAINT disbursements_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;

-- 4. disputes.contract_id → SET NULL (keep dispute history)
ALTER TABLE disputes DROP CONSTRAINT IF EXISTS disputes_contract_id_fkey;
ALTER TABLE disputes ADD CONSTRAINT disputes_contract_id_fkey 
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL;

-- 5. maintenance_requests.assigned_vendor_id → SET NULL
ALTER TABLE maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_assigned_vendor_id_fkey;
ALTER TABLE maintenance_requests ADD CONSTRAINT maintenance_requests_assigned_vendor_id_fkey 
  FOREIGN KEY (assigned_vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;

-- 6. maintenance_reviews.vendor_id → SET NULL (keep review history)
ALTER TABLE maintenance_reviews DROP CONSTRAINT IF EXISTS maintenance_reviews_vendor_id_fkey;
ALTER TABLE maintenance_reviews ADD CONSTRAINT maintenance_reviews_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;

-- 7. merchant_subscriptions.tier_id → RESTRICT (prevent deleting active tiers)
ALTER TABLE merchant_subscriptions DROP CONSTRAINT IF EXISTS merchant_subscriptions_tier_id_fkey;
ALTER TABLE merchant_subscriptions ADD CONSTRAINT merchant_subscriptions_tier_id_fkey 
  FOREIGN KEY (tier_id) REFERENCES subscription_tiers(id) ON DELETE RESTRICT;

-- 8. orders.vendor_id → SET NULL (keep order history)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_vendor_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;

-- 9. orders.product_id → SET NULL (keep order history)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_product_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- 10. orders.unit_id → SET NULL
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_unit_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_unit_id_fkey 
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;

-- 11. payment_plan_installments.invoice_id → CASCADE (delete installments with invoice)
ALTER TABLE payment_plan_installments DROP CONSTRAINT IF EXISTS payment_plan_installments_invoice_id_fkey;
ALTER TABLE payment_plan_installments ADD CONSTRAINT payment_plan_installments_invoice_id_fkey 
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

-- 12. unit_listings.merchant_id → CASCADE (delete listings with merchant)
ALTER TABLE unit_listings DROP CONSTRAINT IF EXISTS unit_listings_merchant_id_fkey;
ALTER TABLE unit_listings ADD CONSTRAINT unit_listings_merchant_id_fkey 
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE;

-- 13. vendor_verifications.vendor_id → CASCADE (delete verifications with vendor)
ALTER TABLE vendor_verifications DROP CONSTRAINT IF EXISTS vendor_verifications_vendor_id_fkey;
ALTER TABLE vendor_verifications ADD CONSTRAINT vendor_verifications_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;

-- 14. tenants.current_unit_id → SET NULL
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_current_unit_id_fkey;
ALTER TABLE tenants ADD CONSTRAINT tenants_current_unit_id_fkey 
  FOREIGN KEY (current_unit_id) REFERENCES units(id) ON DELETE SET NULL;

-- 15. tenants.linked_merchant_id → SET NULL
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_linked_merchant_id_fkey;
ALTER TABLE tenants ADD CONSTRAINT tenants_linked_merchant_id_fkey 
  FOREIGN KEY (linked_merchant_id) REFERENCES merchants(id) ON DELETE SET NULL;

-- 16. referral_commissions.referral_id → SET NULL
ALTER TABLE referral_commissions DROP CONSTRAINT IF EXISTS referral_commissions_referral_id_fkey;
ALTER TABLE referral_commissions ADD CONSTRAINT referral_commissions_referral_id_fkey 
  FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE SET NULL;

-- 17. referral_rewards.referral_id → SET NULL
ALTER TABLE referral_rewards DROP CONSTRAINT IF EXISTS referral_rewards_referral_id_fkey;
ALTER TABLE referral_rewards ADD CONSTRAINT referral_rewards_referral_id_fkey 
  FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE SET NULL;

-- 18. vouchers.referral_id → SET NULL
ALTER TABLE vouchers DROP CONSTRAINT IF EXISTS vouchers_referral_id_fkey;
ALTER TABLE vouchers ADD CONSTRAINT vouchers_referral_id_fkey 
  FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE SET NULL;

-- 19. xendit_transactions.invoice_id → SET NULL
ALTER TABLE xendit_transactions DROP CONSTRAINT IF EXISTS xendit_transactions_invoice_id_fkey;
ALTER TABLE xendit_transactions ADD CONSTRAINT xendit_transactions_invoice_id_fkey 
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

-- 20. xendit_transactions.order_id → SET NULL
ALTER TABLE xendit_transactions DROP CONSTRAINT IF EXISTS xendit_transactions_order_id_fkey;
ALTER TABLE xendit_transactions ADD CONSTRAINT xendit_transactions_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- 21. order_reviews.vendor_id → SET NULL
ALTER TABLE order_reviews DROP CONSTRAINT IF EXISTS order_reviews_vendor_id_fkey;
ALTER TABLE order_reviews ADD CONSTRAINT order_reviews_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;

-- 22. tenant_invitations.accepted_by_user_id → SET NULL
ALTER TABLE tenant_invitations DROP CONSTRAINT IF EXISTS tenant_invitations_accepted_by_user_id_fkey;
ALTER TABLE tenant_invitations ADD CONSTRAINT tenant_invitations_accepted_by_user_id_fkey 
  FOREIGN KEY (accepted_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 23. tenant_merchant_history.merchant_id → SET NULL
ALTER TABLE tenant_merchant_history DROP CONSTRAINT IF EXISTS tenant_merchant_history_merchant_id_fkey;
ALTER TABLE tenant_merchant_history ADD CONSTRAINT tenant_merchant_history_merchant_id_fkey 
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL;

-- 24. pending_subscription_changes tier references → CASCADE
ALTER TABLE pending_subscription_changes DROP CONSTRAINT IF EXISTS pending_subscription_changes_pending_tier_id_fkey;
ALTER TABLE pending_subscription_changes ADD CONSTRAINT pending_subscription_changes_pending_tier_id_fkey 
  FOREIGN KEY (pending_tier_id) REFERENCES subscription_tiers(id) ON DELETE CASCADE;

ALTER TABLE pending_subscription_changes DROP CONSTRAINT IF EXISTS pending_subscription_changes_current_tier_id_fkey;
ALTER TABLE pending_subscription_changes ADD CONSTRAINT pending_subscription_changes_current_tier_id_fkey 
  FOREIGN KEY (current_tier_id) REFERENCES subscription_tiers(id) ON DELETE CASCADE;

-- 25. subscription_invoices.tier_id → SET NULL
ALTER TABLE subscription_invoices DROP CONSTRAINT IF EXISTS subscription_invoices_tier_id_fkey;
ALTER TABLE subscription_invoices ADD CONSTRAINT subscription_invoices_tier_id_fkey 
  FOREIGN KEY (tier_id) REFERENCES subscription_tiers(id) ON DELETE SET NULL;