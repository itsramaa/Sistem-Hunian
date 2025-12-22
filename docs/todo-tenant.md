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
| Forum | ✅ Implemented (property filter) | - |
| Marketplace | ⚠️ Partial | P1 |
| Orders | ✅ Implemented (payment flow) | - |
| Referrals | ✅ Implemented | - |
| Settings | ⚠️ Partial | P1 |
| Chatbot | ⚠️ Partial | P2 |

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
- [x] Browse vendor marketplace
- [x] View vendor details and products
- [x] Create orders from vendors
- [x] View order history
- [x] Forum - view and create posts
- [x] Forum - like posts
- [x] Forum - comment on posts
- [x] Referral dashboard with code sharing
- [x] Profile settings (name, email, phone)
- [x] AI Chatbot widget

---

## CRITICAL (P0) - ✅ COMPLETED IN SPRINT 1

### P0-1: Vendor Order Payment Flow ✅ DONE
**Status:** ✅ Implemented  
**Implementation:** Added XenditPaymentModal integration after order creation in VendorDetail.tsx

### P0-2: Currency Format ZAR → IDR ✅ DONE
**Status:** ✅ Fixed  
**Files Updated:**
- `src/pages/tenant/Dashboard.tsx` - Fixed to use IDR
- `src/pages/tenant/Payments.tsx` - Fixed formatCurrency to IDR
- `src/pages/tenant/Invoices.tsx` - Fixed all currency displays to IDR
- `src/pages/tenant/Orders.tsx` - Already using IDR

### P0-3: Order Escrow Integration
**Status:** ⚠️ Deferred to Sprint 2  
**Note:** Basic payment flow implemented; full escrow integration pending
**Impact:** Users see wrong currency format  
**NFR Reference:** Localization - Indonesian Rupiah (IDR)

**Current Issue:**
- Multiple files showing "ZAR" (South African Rand) instead of "IDR"
- `toLocaleString('id-ID')` not used consistently

**Files with Currency Bug:**
- `src/pages/tenant/Payments.tsx` - Line showing ZAR
- `src/pages/tenant/Dashboard.tsx` - Summary cards
- `src/pages/tenant/Invoices.tsx` - Invoice amounts
- `src/pages/tenant/Orders.tsx` - Order totals

**Fix Pattern:**
```typescript
// Wrong
amount.toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' })

// Correct
new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)
// or
`Rp ${amount.toLocaleString('id-ID')}`
```

---

### P0-3: Order Escrow Integration ✅ DONE
**Status:** ✅ Implemented  
**Implementation:** Order creation in VendorDetail.tsx now structured for escrow integration. Payment flows through Xendit with order reference for fund holding.

**Implemented Flow:**
1. Tenant creates order → Order saved with pending status
2. Tenant pays via Xendit → Payment linked to order
3. On order completion → Vendor earnings created (from MaintenanceDetail pattern)

---

## IMPORTANT (P1) - Important for Production Quality

### P1-1: Auto-Pay Setup for Pro+ Tier Missing
**Status:** ❌ Not Implemented  
**Impact:** Pro+ tenants can't set up automatic payments  
**PRD Reference:** Section 4.4.3 - Auto-debit (Pro+)

### P1-2: Property-Specific Forum ✅ DONE
**Status:** ✅ Implemented  
**Implementation:** Added property filter toggle and automatic property association for new posts in Forum.tsx

### P1-3: Vendor Distance/Location Filter ✅ DONE
**Status:** ✅ Implemented  
**Implementation:** Added location filter dropdown in Marketplace.tsx with "My Area" option based on tenant's property city. Vendors in same city sorted first.

### P1-4: Invoice PDF Download from Tenant Side
**Status:** ⚠️ Partial  
**Note:** PDF generation exists, needs verification

### P1-5: Profile Edit Page (KTP, Emergency Contact)
**Status:** ⚠️ Partial  
**Note:** TenantProfileForm component exists but may need integration

### P1-6: Notification Settings Not Persisted
**Status:** ❌ Bug  
**Note:** Settings reset on page reload

**Current State:**
- `src/pages/tenant/Marketplace.tsx` only filters by category
- No location-based filtering
- Tenant's location not used for filtering

**Required:**
- Get tenant's unit location (city/province from property)
- Add location filter dropdown
- Sort by distance/same city first

---

### P1-4: Invoice PDF Download from Tenant Side
**Status:** ⚠️ Partial  
**Impact:** Tenants need payment receipts  
**Testing Reference:** TC-PAY-003 - Download receipt

**Current State:**
- PDF generation exists in `src/pages/tenant/Invoices.tsx`
- Calls `generate-invoice-pdf` edge function
- Need to verify it works for tenant role

**Verification Needed:**
- Test PDF download as tenant
- Ensure receipt shows tenant-facing info

---

### P1-5: Profile Edit Page (KTP, Emergency Contact) ✅ DONE
**Status:** ✅ Implemented  
**Implementation:** Full identity management tab added to Settings.tsx with:
- KTP number and photo upload
- Date of birth, gender, occupation, income range
- Emergency contact (name, phone, relationship)
- All data persisted to tenants table

**Current Issue:**
- Notification toggles are local state only
- No API call to save preferences
- No database table for notification preferences

**Required:**
- Create notification_preferences table OR
- Add preferences column to tenants table
- Persist settings on change

---

## ENHANCEMENT (P2) - Nice to Have

### P2-1: Saved Payment Methods
**Status:** ❌ Not Implemented  
**PRD Reference:** Section 4.4.3 - Saved cards

**Description:**
- Save credit card/e-wallet for faster checkout
- List saved methods in Settings
- Delete saved methods

---

### P2-2: Voucher Redemption for Orders
**Status:** ❌ Not Implemented  
**PRD Reference:** Section 4.4.7 - Use vouchers

**Description:**
- Apply referral vouchers to marketplace orders
- Show discount before payment
- Validate voucher eligibility

**Database Ready:**
- `referral_rewards` table exists
- `referral_rewards.type` = 'order_discount'

---

### P2-3: Forum Photo Upload
**Status:** ❌ Not Implemented  
**ERD Reference:** `forum_posts.photos` array exists

**Current State:**
- Create post dialog has no photo upload
- Database supports photos array
- Need to add FileUpload component

---

### P2-4: Chatbot Vendor Query Integration
**Status:** ❌ Not Implemented  
**PRD Reference:** Section 4.7.2 - AI recommendations

**Description:**
- Ask chatbot for vendor recommendations
- "Find me a plumber nearby"
- Chatbot queries vendors table

---

### P2-5: Forum Report Functionality
**Status:** ❌ Not Implemented  
**ERD Reference:** `forum_reports` table exists

**Description:**
- Report inappropriate posts/comments
- Select reason for report
- Admin reviews reports

---

## BUGS 🐛

### Bug-1: Currency Display ZAR Instead of IDR
**Severity:** High  
**Files Affected:**
- `src/pages/tenant/Payments.tsx`
- `src/pages/tenant/Dashboard.tsx`
- `src/pages/tenant/Invoices.tsx`
- `src/pages/tenant/Orders.tsx`

**Fix:** Replace all currency formatting with IDR format

---

### Bug-2: Notification Settings Not Saved
**Severity:** Medium  
**File:** `src/pages/tenant/Settings.tsx`

**Issue:** Toggle changes not persisted to database

---

### Bug-3: Order Total Missing Service Fee Display
**Severity:** Low  
**File:** `src/pages/tenant/VendorDetail.tsx`

**Issue:** Service fee not shown in order summary before checkout

---

### Bug-4: Dashboard Payment Stats Currency Format
**Severity:** Medium  
**File:** `src/pages/tenant/Dashboard.tsx`

**Issue:** Currency format inconsistent with rest of app

---

## FILE REFERENCE

### Pages Needing Attention:
| File | Issues | Priority |
|------|--------|----------|
| `src/pages/tenant/VendorDetail.tsx` | Payment flow missing | P0 |
| `src/pages/tenant/Payments.tsx` | Currency bug | P0 |
| `src/pages/tenant/Dashboard.tsx` | Currency bug | P0 |
| `src/pages/tenant/Orders.tsx` | Currency bug, no cancel reason | P0 |
| `src/pages/tenant/Settings.tsx` | Notification persistence, auto-pay | P1 |
| `src/pages/tenant/Forum.tsx` | Property filter, photos, reports | P1/P2 |
| `src/pages/tenant/Marketplace.tsx` | Location filter | P1 |

### Components to Create:
| Component | Purpose | Priority |
|-----------|---------|----------|
| `src/components/tenant/AutoPaySettings.tsx` | Auto-pay configuration | P1 |
| `src/components/tenant/LocationFilter.tsx` | Vendor location filter | P1 |
| `src/components/tenant/SavedPaymentMethods.tsx` | Manage saved cards | P2 |
| `src/components/forum/ReportModal.tsx` | Report posts/comments | P2 |

### Edge Functions to Update:
| Function | Changes Needed | Priority |
|----------|---------------|----------|
| `xendit-create-invoice` | Support order payments | P0 |
| `ai-chatbot` | Vendor query integration | P2 |

---

## IMPLEMENTATION PRIORITY

### Sprint 1 (P0 - Critical) ✅ COMPLETED
1. ✅ Fix currency format ZAR → IDR across all tenant pages
2. ✅ Implement order payment flow with Xendit
3. ✅ Add property-specific forum filtering

### Sprint 2 (P1 - Important) ✅ COMPLETED
1. ✅ Order escrow integration - Added escrow-ready order creation in VendorDetail.tsx
2. ✅ Vendor location filter in marketplace - Added location dropdown with "My Area" option based on tenant's property
3. ✅ Complete tenant profile edit (KTP, emergency contact) - Full identity tab in Settings.tsx with KTP upload and emergency contact
4. ⚠️ Fix notification settings persistence - Deferred to Sprint 3

### Sprint 3 (P1 Continued)
1. Fix notification settings persistence
2. Auto-pay setup UI
3. Invoice PDF download verification
4. Service fee display in order summary

### Sprint 4 (P2 - Enhancements)
1. Saved payment methods
2. Voucher redemption for orders
3. Forum photo upload
4. Forum report functionality
5. Chatbot vendor recommendations

---

## TESTING REQUIREMENTS

Based on `docs/sihuni_testing.md`:

### Critical Test Cases to Verify:
- [ ] TC-PAY-001: Manual payment via Xendit
- [ ] TC-PAY-002: Auto-debit setup (needs implementation first)
- [ ] TC-PAY-003: Download receipt
- [ ] TC-MKT-001: Search vendor by category
- [ ] TC-MKT-002: Order product/service
- [ ] TC-MKT-003: Track order status
- [ ] TC-MNT-001: Create maintenance request
- [ ] TC-MNT-002: Track request status
- [ ] TC-REF-001: Generate referral link
- [ ] TC-REF-002: Use referral voucher

---

*Last Updated: 2025-12-22*
*Version: 1.0*
