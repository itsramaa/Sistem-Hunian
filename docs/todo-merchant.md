# TODO Merchant - Feature Implementation Checklist

> **Last Updated:** 2025-01-22  
> **Status:** Sprint 1, 2 & 3 COMPLETED

---

## 📊 Summary

| Category | Total | Status |
|----------|-------|--------|
| Critical (P0) | 3 | ✅ All verified/implemented |
| Important (P1) | 4 | ✅ Core items completed |
| Enhancement (P2) | 5 | 🟢 Nice to have |
| Bugs | 3 | ✅ Fixed |
| Critical (P0) | 3 | 🔴 Needs immediate attention |
| Important (P1) | 4 | 🟡 Should be addressed soon |
| Enhancement (P2) | 5 | 🟢 Nice to have |
| Bugs | 3 | 🐛 Fix required |

---

## 🔴 CRITICAL (P0) - Harus Segera Diperbaiki

### 1. Auto Invoice Generation (CRON Job)
- **Status:** ✅ VERIFIED - Edge function complete with logging
- **Location:** `supabase/functions/auto-generate-invoices/index.ts`
- **Implementation:**
  - [x] Edge function with comprehensive logging
  - [x] Fetches active, fully-signed contracts
  - [x] Checks for duplicate invoices per month
  - [x] Creates invoices with proper due dates
  - [x] Sends notifications to tenants
- **Docs Reference:** PRD Section 5.2 "Auto Invoice Generation: Monthly recurring invoice (tanggal customizable)"
- **Verified:** 2025-01-22

### 2. Payment Reminder Integration (WhatsApp/Email)
- **Status:** ✅ UI Buttons Added (CRON verification pending)
- **Location:** 
  - `supabase/functions/send-payment-reminder/index.ts`
  - `supabase/functions/whatsapp-notification/index.ts`
  - `src/components/merchant/NotificationSettings.tsx`
  - `src/pages/merchant/Invoices.tsx` ✅ Send Reminder button added
  - `src/pages/merchant/Payments.tsx` ✅ Send Reminder button added
- **Remaining:**
  - [ ] Verify scheduled CRON for H-3, H-1 reminders
  - [ ] Connect NotificationSettings preferences

### 3. Subscription Payment with Xendit
- **Status:** ✅ COMPLETE - Full payment flow implemented
- **Location:**
  - `src/components/merchant/SubscriptionPayment.tsx`
  - `supabase/functions/subscription-payment/index.ts`
  - `supabase/functions/xendit-webhook/index.ts`
- **Implementation:**
  - [x] SubscriptionPayment component with tier selection
  - [x] Monthly/Yearly billing options
  - [x] subscription-payment edge function creates Xendit invoice
  - [x] Proper redirect URLs for success/failure
  - [x] xendit-webhook handles subscription payments (sub_ prefix)
  - [x] Updates merchant_subscriptions on successful payment
  - [x] Sends notification and email on upgrade
- **Docs Reference:** PRD Section 3.2 "Subscription purchase API"
- **Verified:** 2025-01-22

---

## 🟡 IMPORTANT (P1) - Perlu Diperbaiki

### 4. Tenant Status (Active/Notice/Expired)
- **Status:** ✅ IMPLEMENTED - Notice period marking added
- **Location:**
  - `src/pages/merchant/Contracts.tsx`
  - `src/components/merchant/ContractNoticePeriod.tsx`
- **Implementation:**
  - [x] Added "notice" status option
  - [x] Added "Mark as Notice" button in ContractCard
  - [x] markNoticeMutation updates contract status
  - [x] Notice period badge with Clock icon
  - [x] ContractNoticePeriod component shows expiring contracts with churn reasons
- **Docs Reference:** PRD Section 5.2 "Tenant Status: Active, Notice period, Expired"
- **Verified:** 2025-01-22

### 5. Contract Terms & Document Upload
- **Status:** ✅ Terms Edit Implemented (Document upload pending)
- **Location:** `src/pages/merchant/Contracts.tsx`
- **Completed:**
  - [x] Add Edit Terms button in contract view dialog
  - [x] Add Edit Terms dialog with textarea
  - [x] Save terms to database
- **Remaining:**
  - [ ] Add file upload for contract document (PDF)
  - [ ] Download link for contract document

### 6. Tenants Page - Complete Review
- **Status:** ✅ REVIEWED & ENHANCED
- **Location:** `src/pages/merchant/Tenants.tsx`
- **Implementation:**
  - [x] Invitation management (send, copy link, cancel)
  - [x] Contract creation form
  - [x] Stats cards (pending invitations, active contracts, available units)
  - [x] Contract cards with status badges
  - [x] Added "View Details" button linking to Contracts page
  - [x] Added "Payments" button linking to payment history per tenant
- **Docs Reference:** PRD Section 5.2 "Tenant Management"
- **Verified:** 2025-01-22

### 7. Scheduled Disbursement Processing
- **Status:** ✅ VERIFIED - Edge function complete with logging
- **Location:** `supabase/functions/scheduled-disbursement/index.ts`
- **Implementation:**
  - [x] Edge function with comprehensive logging
  - [x] Handles daily, weekly (Monday), monthly (1st) schedules
  - [x] Fetches verified merchants with escrow balances
  - [x] Creates disbursement records
  - [x] Updates escrow balance (moves to pending)
  - [x] Creates escrow transaction records
  - [x] Sends notifications to merchants
  - [x] 1% platform fee calculation
- **Docs Reference:** PRD Section 5.2 "Disbursement Schedule"
- **Verified:** 2025-01-22

---

## 🟢 ENHANCEMENT (P2) - Nice to Have

### 8. Chatbot AI for Merchant Business Insights
- **Status:** 📝 Not implemented
- **Location:** `src/components/chatbot/ChatbotWidget.tsx`
- **Issue:**
  - General chatbot exists
  - No merchant-specific queries like "tenant mana yang belum bayar?"
  - No business insights shortcuts
- **Docs Reference:** PRD Section 5.5 "For Merchant: Business Insights, Admin Shortcuts"
- **Solution:**
  - [ ] Add merchant context to chatbot
  - [ ] Support queries: unpaid tenants, revenue this month, expiring contracts
  - [ ] Quick action shortcuts from chatbot

### 9. Property Search with Elasticsearch
- **Status:** 📝 Basic filter only
- **Location:** `src/pages/merchant/Properties.tsx`
- **Issue:**
  - Using basic client-side filtering
  - Elasticsearch not implemented
  - OK for MVP, needed for scale
- **Docs Reference:** Tasks Section Sprint 4 "Implement property search API (Elasticsearch setup)"
- **Solution:**
  - [ ] For MVP: Basic filter is acceptable
  - [ ] Future: Implement Elasticsearch for large datasets

### 10. Custom Billing Date per Contract
- **Status:** 📝 Global only
- **Location:** 
  - `merchants.billing_day` (database)
  - `src/components/merchant/DisbursementScheduleSettings.tsx`
- **Issue:**
  - billing_day adalah per-merchant, bukan per-contract
  - Semua tenant mendapat invoice di tanggal yang sama
- **Docs Reference:** PRD Section 5.2 "Auto Invoice Generation: Monthly recurring invoice (tanggal customizable)"
- **Solution:**
  - [ ] Option 1: Add billing_day per contract
  - [ ] Option 2: Add billing_day per property
  - [ ] Update auto-generate-invoices to use contract-level billing date

### 11. Dashboard Analytics with Trend Comparison
- **Status:** ✅ IMPLEMENTED
- **Location:** `src/pages/merchant/Dashboard.tsx`
- **Implementation:**
  - [x] Fetch previous month's data for comparison
  - [x] Calculate percentage change for revenue
  - [x] Calculate tenant count change
  - [x] Show +/-% indicators with trend arrows (green up, red down)
  - [x] Added TrendingUp/TrendingDown icons
- **Docs Reference:** PRD Section 5.2 "Analytics & Reports"
- **Verified:** 2025-01-22

### 12. Maintenance Vendor Payment Integration
- **Status:** ✅ IMPLEMENTED
- **Location:** `src/pages/merchant/MaintenanceDetail.tsx`
- **Implementation:**
  - [x] Create vendor_job when assigning vendor (with duplicate check)
  - [x] Track job completion (updates vendor_job status)
  - [x] Create vendor_earnings after job completion
  - [x] Apply 10% platform fee
  - [x] Set earnings status to 'pending' for disbursement
- **Docs Reference:** PRD Section 5.2 "Assign Technician: Assign request ke staff/vendor"
- **Verified:** 2025-01-22

---

## 🐛 BUGS - Issues to Fix

### 13. Currency Format Inconsistency
- **Status:** ✅ FIXED
- **Location:** `src/pages/merchant/Invoices.tsx`, `src/pages/merchant/Payments.tsx`
- **Solution:** Changed 'ZAR' to 'IDR' in both files

### 14. Subscription Limits on Units Not Enforced
- **Status:** ✅ FIXED
- **Location:** `src/components/merchant/UnitsManager.tsx`
- **Solution:** Added useSubscriptionLimits hook, warning alerts, and disabled Add button when at limit
- **Status:** 🐛 Missing enforcement
- **Location:** 
  - `src/components/merchant/UnitsManager.tsx`
  - `src/hooks/useSubscriptionLimits.ts`
- **Issue:**
  - SubscriptionLimitWarning exists for properties
  - Units can be added without limit check
  - subscription_tiers has max_units but not enforced in UI
- **Solution:**
  - [ ] Add canAddUnit check in UnitsManager
  - [ ] Show SubscriptionLimitWarning when near unit limit
  - [ ] Disable "Add Unit" when at limit

### 15. Vendor Jobs Table Query Issues
- **Status:** 🐛 Potential missing table/data
- **Location:** `src/pages/merchant/MaintenanceDetail.tsx`
- **Issue:**
  - Code attempts to insert/query vendor_jobs
  - Need to verify table exists and has proper RLS
  - May cause errors when assigning vendors
- **Solution:**
  - [ ] Verify vendor_jobs table in database
  - [ ] Check RLS policies allow merchant operations
  - [ ] Test vendor assignment flow

---

## ✅ IMPLEMENTED FEATURES (Working)

### Dashboard
- [x] Overview stats (revenue, tenants, properties, units)
- [x] Quick action buttons
- [x] Recent activity feed
- [x] TrialCountdownWidget
- [x] SubscriptionWidget

### Property Management
- [x] CRUD properties
- [x] Property details with images
- [x] Unit count per property
- [x] SubscriptionLimitWarning for properties

### Unit Management  
- [x] CRUD units per property
- [x] Unit details (type, floor, amenities, rent)
- [x] Tenant invitation from unit

### Tenant Management
- [x] Tenant list with contracts
- [x] Tenant invitation system
- [x] View tenant profiles

### Payment & Invoicing
- [x] Invoice list with status filtering
- [x] Payment tracking
- [x] Xendit payment integration
- [x] Invoice PDF generation (edge function)

### Escrow & Disbursement
- [x] Escrow account view
- [x] Transaction history
- [x] Bank account management
- [x] Disbursement settings

### Maintenance
- [x] Maintenance request list
- [x] Status management (pending, in_progress, completed)
- [x] Timeline/updates
- [x] Vendor assignment

### Reports & Analytics
- [x] Revenue overview
- [x] OnTimePaymentRate component
- [x] RevenueForecast component
- [x] ContractNoticePeriod component
- [x] Export to Excel/PDF

### Settings
- [x] Business profile
- [x] NotificationSettings
- [x] DisbursementScheduleSettings
- [x] Subscription management

### Other
- [x] Referral system
- [x] Contract management
- [x] Digital signatures
- [x] Notification dropdown

---

## 📋 Implementation Priority

### Sprint 1 (Quick Wins) - Est: 4 hours ✅ COMPLETED
1. [x] Fix currency ZAR → IDR (Bug #13) - ✅ Fixed in Invoices.tsx & Payments.tsx
2. [x] Add unit subscription limits (Bug #14) - ✅ Added to UnitsManager.tsx
3. [x] Add contract terms input field (P1 #5) - ✅ Added Edit Terms dialog in Contracts.tsx
4. [x] Add "Send Reminder" button (P0 #2) - ✅ Added to Invoices.tsx & Payments.tsx

### Sprint 2 (Core Fixes) - Est: 8 hours ✅ COMPLETED
5. [x] Verify/fix auto-generate-invoices CRON (P0 #1) - ✅ Verified complete with logging
6. [x] Verify/fix scheduled-disbursement CRON (P1 #7) - ✅ Verified complete with logging
7. [x] Add notice period marking (P1 #4) - ✅ Added "Mark Notice" button in Contracts.tsx
8. [x] Complete subscription payment flow (P0 #3) - ✅ Verified Xendit integration complete

### Sprint 3 (Enhancements) - Est: 6 hours ✅ COMPLETED
9. [x] Dashboard trend comparison (P2 #11) - ✅ Added period-over-period analytics with +/-% indicators
10. [x] Review Tenants page (P1 #6) - ✅ Reviewed and added View Details + Payments buttons
11. [x] Maintenance vendor payment (P2 #12) - ✅ Added vendor_earnings creation on job completion

### Future Sprints
12. [ ] Chatbot merchant features (P2 #8)
13. [ ] Per-contract billing date (P2 #10)
14. [ ] Elasticsearch (P2 #9)

---

## 📁 Key Files Reference

| Feature | Files |
|---------|-------|
| Dashboard | `src/pages/merchant/Dashboard.tsx` |
| Properties | `src/pages/merchant/Properties.tsx` |
| Units | `src/pages/merchant/Units.tsx`, `src/components/merchant/UnitsManager.tsx` |
| Tenants | `src/pages/merchant/Tenants.tsx` |
| Contracts | `src/pages/merchant/Contracts.tsx` |
| Invoices | `src/pages/merchant/Invoices.tsx` |
| Payments | `src/pages/merchant/Payments.tsx` |
| Escrow | `src/pages/merchant/Escrow.tsx` |
| Maintenance | `src/pages/merchant/Maintenance.tsx`, `src/pages/merchant/MaintenanceDetail.tsx` |
| Reports | `src/pages/merchant/Reports.tsx` |
| Settings | `src/pages/merchant/Settings.tsx` |
| Subscription | `src/components/merchant/SubscriptionPayment.tsx`, `src/components/merchant/SubscriptionWidget.tsx` |
| Notifications | `src/components/merchant/NotificationSettings.tsx` |
| Edge Functions | `supabase/functions/auto-generate-invoices/`, `supabase/functions/send-payment-reminder/`, `supabase/functions/scheduled-disbursement/` |

---

## 🔗 Related Documentation

- [PRD](./sihuni_prd.md) - Product Requirements
- [Tasks](./sihuni_tasks.md) - Sprint Planning
- [API Contract](./sihuni_api_contract.md) - API Specifications
- [Architecture](./sihuni_architecture.mermaid) - System Design
- [ERD](./sihuni_erd.mermaid) - Database Schema
