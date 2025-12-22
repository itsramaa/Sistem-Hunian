# TODO Merchant - Feature Implementation Checklist

> **Last Updated:** 2025-01-22  
> **Status:** Cross-checked against PRD, Tasks, and current implementation

---

## 📊 Summary

| Category | Total | Status |
|----------|-------|--------|
| Critical (P0) | 3 | 🔴 Needs immediate attention |
| Important (P1) | 4 | 🟡 Should be addressed soon |
| Enhancement (P2) | 5 | 🟢 Nice to have |
| Bugs | 3 | 🐛 Fix required |

---

## 🔴 CRITICAL (P0) - Harus Segera Diperbaiki

### 1. Auto Invoice Generation (CRON Job)
- **Status:** ⚠️ Edge function exists but CRON not verified running
- **Location:** `supabase/functions/auto-generate-invoices/index.ts`
- **Issue:** 
  - pg_cron job sudah di-insert via migration
  - Tidak ada bukti CRON berjalan (perlu logging)
  - Invoice tidak ter-generate otomatis tiap bulan
- **Docs Reference:** PRD Section 5.2 "Auto Invoice Generation: Monthly recurring invoice (tanggal customizable)"
- **Solution:**
  - [ ] Verify pg_cron extension installed dan aktif
  - [ ] Add logging di edge function untuk track execution
  - [ ] Test manual invoke function
  - [ ] Monitor logs di Supabase dashboard

### 2. Payment Reminder Integration (WhatsApp/Email)
- **Status:** ⚠️ Edge functions exist but not integrated with UI
- **Location:** 
  - `supabase/functions/send-payment-reminder/index.ts`
  - `supabase/functions/whatsapp-notification/index.ts`
  - `src/components/merchant/NotificationSettings.tsx`
- **Issue:**
  - NotificationSettings UI sudah ada untuk config preferences
  - Tidak ada tombol "Send Reminder" langsung dari invoice/payment table
  - CRON job untuk scheduled reminder tidak terverifikasi
- **Docs Reference:** PRD Section 5.2 "Payment Reminder: Auto WhatsApp/Email reminder (H-3, H-1, overdue)"
- **Solution:**
  - [ ] Add "Send Reminder" button di Invoices page
  - [ ] Add "Send Reminder" button di Payments page
  - [ ] Connect NotificationSettings preferences dengan send-payment-reminder function
  - [ ] Verify scheduled CRON for H-3, H-1 reminders

### 3. Subscription Payment with Xendit
- **Status:** ⚠️ Incomplete payment flow
- **Location:**
  - `src/components/merchant/SubscriptionPayment.tsx`
  - `supabase/functions/subscription-payment/index.ts`
  - `supabase/functions/xendit-webhook/index.ts`
- **Issue:**
  - SubscriptionPayment component exists
  - Edge function skeleton exists
  - Full Xendit invoice creation → payment → webhook → status update flow belum complete
- **Docs Reference:** PRD Section 3.2 "Subscription purchase API"
- **Solution:**
  - [ ] Complete xendit invoice creation di subscription-payment function
  - [ ] Handle subscription payment in xendit-webhook
  - [ ] Update merchant_subscriptions status after payment
  - [ ] Add payment history view untuk merchant

---

## 🟡 IMPORTANT (P1) - Perlu Diperbaiki

### 4. Tenant Status (Active/Notice/Expired)
- **Status:** ⚠️ Partial implementation
- **Location:**
  - `src/pages/merchant/Contracts.tsx`
  - `src/components/merchant/ContractNoticePeriod.tsx`
- **Issue:**
  - Database sudah ada field `status` di contracts
  - ContractNoticePeriod component shows expiring contracts
  - Tidak ada cara untuk merchant mark contract as "notice period"
  - Status options: active, expired, terminated (tidak ada "notice")
- **Docs Reference:** PRD Section 5.2 "Tenant Status: Active, Notice period, Expired"
- **Solution:**
  - [ ] Add "notice" status option di database atau use existing fields
  - [ ] Add button "Mark as Notice Period" di contract list/detail
  - [ ] Show notice period badge di tenant list
  - [ ] Auto-calculate notice period based on contract end date

### 5. Contract Terms & Document Upload
- **Status:** ⚠️ Fields exist but no UI
- **Location:** 
  - `src/pages/merchant/Contracts.tsx`
  - Database: `contracts.terms`, `contracts.contract_document_url`
- **Issue:**
  - Database columns exist
  - Tidak ada form input untuk `terms` (text/template)
  - Tidak ada upload untuk contract document
- **Docs Reference:** PRD Section 5.2 "Contract Management: Digital contract"
- **Solution:**
  - [ ] Add textarea for contract terms in create/edit contract form
  - [ ] Add file upload for contract document (PDF)
  - [ ] Show terms preview in contract detail
  - [ ] Download link for contract document

### 6. Tenants Page - Complete Review
- **Status:** 🔍 Needs verification
- **Location:** `src/pages/merchant/Tenants.tsx`
- **Issue:**
  - Page exists but full functionality review needed
  - Perlu verify: view tenant profile, payment history, contract info
- **Docs Reference:** PRD Section 5.2 "Tenant Management"
- **Solution:**
  - [ ] Review all tenant management features
  - [ ] Verify tenant profile view
  - [ ] Verify payment history per tenant
  - [ ] Add tenant notes/comments if not exist

### 7. Scheduled Disbursement Processing
- **Status:** ⚠️ CRON not verified
- **Location:** `supabase/functions/scheduled-disbursement/index.ts`
- **Issue:**
  - Edge function exists
  - CRON job di-insert via migration
  - No verification of actual execution
  - Merchant can set schedule (daily/weekly/monthly) but processing unknown
- **Docs Reference:** PRD Section 5.2 "Disbursement Schedule"
- **Solution:**
  - [ ] Verify pg_cron job for scheduled-disbursement
  - [ ] Add execution logs
  - [ ] Test end-to-end disbursement flow
  - [ ] Add disbursement history with status tracking

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
- **Status:** 📝 Basic stats only
- **Location:** `src/pages/merchant/Dashboard.tsx`
- **Issue:**
  - Shows current stats (total revenue, active tenants, etc.)
  - No comparison with previous period
  - No "+12% from last month" indicators
- **Docs Reference:** PRD Section 5.2 "Analytics & Reports"
- **Solution:**
  - [ ] Calculate previous period values
  - [ ] Show percentage change
  - [ ] Add trend arrows (up/down)

### 12. Maintenance Vendor Payment Integration
- **Status:** 📝 Assignment only
- **Location:** `src/pages/merchant/MaintenanceDetail.tsx`
- **Issue:**
  - Can assign maintenance to vendor
  - No payment flow after job completion
  - No integration with vendor_jobs/vendor_earnings
- **Docs Reference:** PRD Section 5.2 "Assign Technician: Assign request ke staff/vendor"
- **Solution:**
  - [ ] Create vendor_job when assigning vendor
  - [ ] Track job completion
  - [ ] Create vendor payment/earning after completion

---

## 🐛 BUGS - Issues to Fix

### 13. Currency Format Inconsistency
- **Status:** 🐛 Wrong currency used
- **Location:** `src/pages/merchant/Invoices.tsx` line ~251
- **Issue:**
  ```typescript
  // Found: 'ZAR' (South African Rand)
  // Should be: 'IDR' (Indonesian Rupiah)
  ```
- **Solution:**
  - [ ] Change 'ZAR' to 'IDR' in Invoices.tsx
  - [ ] Audit all files for currency consistency
  - [ ] Consider creating a currency formatting utility

### 14. Subscription Limits on Units Not Enforced
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

### Sprint 1 (Quick Wins) - Est: 4 hours
1. [ ] Fix currency ZAR → IDR (Bug #13) - 15 min
2. [ ] Add unit subscription limits (Bug #14) - 1 hr
3. [ ] Add contract terms input field (P1 #5) - 1 hr
4. [ ] Add "Send Reminder" button (P0 #2) - 1.5 hr

### Sprint 2 (Core Fixes) - Est: 8 hours
5. [ ] Verify/fix auto-generate-invoices CRON (P0 #1) - 2 hr
6. [ ] Verify/fix scheduled-disbursement CRON (P1 #7) - 2 hr
7. [ ] Add notice period marking (P1 #4) - 2 hr
8. [ ] Complete subscription payment flow (P0 #3) - 2 hr

### Sprint 3 (Enhancements) - Est: 6 hours
9. [ ] Dashboard trend comparison (P2 #11) - 2 hr
10. [ ] Review Tenants page (P1 #6) - 2 hr
11. [ ] Maintenance vendor payment (P2 #12) - 2 hr

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
