# Database Schema

## Overview
Schema database lengkap untuk platform SiHuni.

## Core Tables

### Users & Authentication
- `auth.users` - Supabase Auth users (managed by Supabase)
- `profiles` - User profiles
- `user_roles` - User role assignments

### Merchants
- `merchants` - Merchant data
- `merchant_verifications` - Verification documents
- `merchant_verification_history` - Verification history
- `merchant_subscriptions` - Subscriptions
- `bank_accounts` - Bank accounts
- `escrow_accounts` - Escrow accounts
- `escrow_transactions` - Escrow transactions
- `disbursements` - Disbursements

### Properties & Units
- `properties` - Properties
- `units` - Units in properties

### Tenants & Contracts
- `tenants` - Tenant data
- `tenant_merchant_history` - Transfer history
- `contracts` - Rental contracts
- `move_out_notices` - Move-out notices
- `move_out_inspections` - Inspections
- `move_out_tasks` - Checklist tasks
- `deposit_refunds` - Deposit refunds
- `deposit_disputes` - Deposit disputes
- `early_termination_requests` - Early termination

### Billing & Payments
- `invoices` - Invoices
- `payments` - Payments
- `xendit_transactions` - Xendit transactions
- `payment_plans` - Payment plans
- `late_fee_records` - Late fees
- `collections_cases` - Collections

### Subscriptions
- `subscription_tiers` - Subscription tiers
- `subscription_invoices` - Subscription invoices
- `cancellation_feedback` - Cancellation feedback

### Maintenance
- `maintenance_requests` - Requests
- `maintenance_updates` - Updates
- `maintenance_timeline` - Timeline
- `maintenance_reviews` - Reviews

### Vendors & Products
- `vendors` - Vendor data
- `vendor_verifications` - Verification
- `vendor_bank_accounts` - Bank accounts
- `products` - Products
- `orders` - Orders
- `order_items` - Order items

### Forum
- `forum_posts` - Posts
- `forum_comments` - Comments
- `forum_likes` - Likes
- `forum_reports` - Reports

### Chatbot
- `chat_conversations` - Conversations
- `chat_messages` - Messages
- `chatbot_knowledge` - Knowledge base
- `chatbot_analytics` - Analytics

### Referrals
- `referral_codes` - Codes
- `referral_rewards` - Rewards

### System
- `analytics_events` - Analytics
- `audit_logs` - Audit logs
- `notifications` - Notifications
- `provinces` - Provinces (Indonesia)
- `cities` - Cities (Indonesia)
- `disputes` - General disputes

## RLS Policies
All tables have Row Level Security (RLS) enabled with appropriate policies for:
- Admin access
- Merchant access (own data)
- Tenant access (own data)
- Vendor access (own data)

## Key Relationships
- `merchants.user_id` → `auth.users.id`
- `tenants.user_id` → `auth.users.id`
- `vendors.user_id` → `auth.users.id`
- `contracts.tenant_user_id` → `auth.users.id`
- `contracts.merchant_id` → `merchants.id`
- `contracts.unit_id` → `units.id`
- `units.property_id` → `properties.id`
- `properties.merchant_id` → `merchants.id`
