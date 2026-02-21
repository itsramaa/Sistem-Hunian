# SIHUNI - Tenant Features Cross-Check & TODO List

> Cross-check antara dokumentasi (PRD, API Contract, ERD, User Flow, NFR, Testing) dengan implementasi sistem saat ini untuk fitur Tenant.

---

## STATUS OVERVIEW

| Feature Area | Status | Priority |
|-------------|--------|----------|
| Authentication & Registration | ✅ Implemented | - |
| Dashboard | ✅ Implemented (currency fixed) | - |
| Contracts | ✅ Implemented | - |
| Invoices | ✅ Implemented (currency fixed) | - |
| Payments | ✅ Implemented (currency fixed) | - |
| Maintenance Requests | ✅ Implemented | - |
| Forum | ✅ Implemented (photos, reports) | - |
| Marketplace | ✅ Implemented (vouchers) | - |
| Orders | ✅ Implemented (payment flow) | - |
| Referrals | ✅ Implemented | - |
| Settings | ✅ Implemented (saved payments) | - |
| Chatbot | ✅ Implemented (vendor recs) | - |

---

## ALL SPRINTS COMPLETED ✅

### Sprint 1 (P0 - Critical) ✅ COMPLETED
1. ✅ Fix currency format ZAR → IDR across all tenant pages
2. ✅ Implement order payment flow with Xendit
3. ✅ Add property-specific forum filtering

### Sprint 2 (P1 - Important) ✅ COMPLETED
1. ✅ Order escrow integration
2. ✅ Vendor location filter in marketplace
3. ✅ Complete tenant profile edit (KTP, emergency contact)

### Sprint 3 (P1 Continued) ✅ COMPLETED
1. ✅ Fix notification settings persistence
2. ✅ Auto-pay setup UI
3. ✅ Invoice PDF download verification
4. ✅ Service fee display in order summary

### Sprint 4 (P2 - Enhancements) ✅ COMPLETED
1. ✅ Saved payment methods - Added Payments tab in Settings showing used payment methods from xendit_transactions
2. ✅ Voucher redemption for orders - Added voucher code input in order dialog with discount calculation
3. ✅ Forum photo upload - Added photo upload to create post dialog (up to 4 images)
4. ✅ Forum report functionality - Added Flag button to report posts with quick submission
5. ✅ Chatbot vendor recommendations - Verified ai-chatbot already queries vendors table

---

## IMPLEMENTED FEATURES ✅

### Fully Working Features:
- [x] Tenant authentication (login/register)
- [x] Tenant invitation acceptance flow
- [x] Dashboard with payment summary
- [x] View active contracts
- [x] Sign contracts with digital signature
- [x] View and pay invoices
- [x] Create maintenance requests with images
- [x] View maintenance request updates/timeline
- [x] Reply to maintenance requests
- [x] Browse vendor marketplace with location filter
- [x] View vendor details and products
- [x] Create orders from vendors with voucher support
- [x] View order history
- [x] Forum - view and create posts with photos
- [x] Forum - like posts
- [x] Forum - comment on posts
- [x] Forum - report posts
- [x] Referral dashboard with code sharing
- [x] Profile settings (name, email, phone)
- [x] Identity settings (KTP, emergency contact)
- [x] Saved payment methods display
- [x] Notification preferences persistence
- [x] Auto-pay settings
- [x] AI Chatbot with vendor recommendations

---

## BUGS 🐛 - ALL FIXED

### Bug-1: Currency Display ZAR Instead of IDR ✅ FIXED
### Bug-2: Notification Settings Not Saved ✅ FIXED
### Bug-3: Order Total Missing Service Fee Display ✅ FIXED
### Bug-4: Dashboard Payment Stats Currency Format ✅ FIXED

---

## TESTING REQUIREMENTS

Based on `docs/sihuni_testing.md`:

### Critical Test Cases to Verify:
- [x] TC-PAY-001: Manual payment via Xendit
- [x] TC-PAY-002: Auto-debit setup
- [x] TC-PAY-003: Download receipt
- [x] TC-MKT-001: Search vendor by category
- [x] TC-MKT-002: Order product/service
- [x] TC-MKT-003: Track order status
- [x] TC-MNT-001: Create maintenance request
- [x] TC-MNT-002: Track request status
- [x] TC-REF-001: Generate referral link
- [x] TC-REF-002: Use referral voucher

---

*Last Updated: 2025-12-22*
*Version: 2.0 - All Sprints Completed*
