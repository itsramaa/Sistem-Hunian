# SIHUNI - Tenant Features Cross-Check & TODO List

> Cross-check antara dokumentasi (PRD, API Contract, ERD, User Flow, NFR, Testing) dengan implementasi sistem saat ini untuk fitur Tenant.

---

## STATUS OVERVIEW

| Feature Area | Status | Priority |
|-------------|--------|----------|
| Authentication & Registration | ✅ Implemented | - |
| Dashboard | ⚠️ Partial (currency bug) | P0 |
| Contracts | ✅ Implemented | - |
| Invoices | ✅ Implemented | - |
| Payments | ⚠️ Partial (currency bug) | P0 |
| Maintenance Requests | ✅ Implemented | - |
| Forum | ⚠️ Partial | P1/P2 |
| Marketplace | ⚠️ Partial | P1 |
| Orders | ⚠️ Partial (payment missing) | P0 |
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

## CRITICAL (P0) - Must Fix Before Production

### P0-1: Vendor Order Payment Flow Not Integrated
**Status:** ❌ Not Implemented  
**Impact:** Orders created without payment - potential revenue loss  
**PRD Reference:** Section 4.4.4 - "Pembayaran produk/jasa via Xendit"  
**API Contract:** `POST /api/payments/order` - not implemented

**Current Issue:**
- `src/pages/tenant/VendorDetail.tsx` creates order in database
- No Xendit payment integration after order creation
- Orders go directly to "pending" without payment

**Required Changes:**
```typescript
// After order creation, redirect to payment
const { data: xenditInvoice } = await supabase.functions.invoke('xendit-create-invoice', {
  body: { 
    order_id: order.id,
    amount: totalPrice,
    type: 'order'
  }
});
window.open(xenditInvoice.payment_url, '_blank');
```

**Files to Modify:**
- `src/pages/tenant/VendorDetail.tsx` - Add payment flow after order creation
- `supabase/functions/xendit-create-invoice/index.ts` - Support order payments

---

### P0-2: Currency Format ZAR → IDR
**Status:** ❌ Bug  
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

### P0-3: Order Escrow Integration Missing
**Status:** ❌ Not Implemented  
**Impact:** No fund protection for tenant orders  
**PRD Reference:** Section 4.8 - Escrow System  
**ERD Reference:** `escrow_transactions` table

**Current Issue:**
- When tenant pays for order, money should go to escrow
- Release to vendor only after order completed
- Currently no escrow flow for marketplace orders

**Required Flow:**
1. Tenant pays order → Amount held in escrow
2. Vendor completes order → Order status "completed"
3. Admin/System releases funds to vendor

**Database Already Supports:**
- `escrow_transactions.type` can store 'order_payment'
- `escrow_transactions.reference` can link to order_id

---

## IMPORTANT (P1) - Important for Production Quality

### P1-1: Auto-Pay Setup for Pro+ Tier Missing
**Status:** ❌ Not Implemented  
**Impact:** Pro+ tenants can't set up automatic payments  
**PRD Reference:** Section 4.4.3 - Auto-debit (Pro+)

**Current State:**
- No UI for setting up auto-pay
- No saved payment methods
- Database schema exists (`payments.payment_method`)

**Required:**
- Add auto-pay toggle in Settings
- Store payment method preference
- Create recurring payment trigger

**Files to Create/Modify:**
- `src/pages/tenant/Settings.tsx` - Add auto-pay section
- `src/components/tenant/AutoPaySettings.tsx` - New component
- Edge function for recurring payments

---

### P1-2: Property-Specific Forum Not Implemented
**Status:** ❌ Not Implemented  
**Impact:** All tenants see all posts, no community feel  
**PRD Reference:** Section 4.5.1 - Forum by property  
**ERD Reference:** `forum_posts.property_id` exists but unused

**Current State:**
- `src/pages/tenant/Forum.tsx` shows ALL posts
- No filtering by property_id
- Need to get tenant's property from contract

**Required Changes:**
```typescript
// Get tenant's property from active contract
const { data: contract } = await supabase
  .from('contracts')
  .select('unit_id, units!inner(property_id)')
  .eq('tenant_user_id', user.id)
  .eq('status', 'active')
  .single();

// Filter posts by property
.eq('property_id', contract.units.property_id)
```

---

### P1-3: Vendor Distance/Location Filter Missing
**Status:** ❌ Not Implemented  
**Impact:** Tenants can't find nearby vendors  
**PRD Reference:** Section 4.4 - Marketplace with location filter  
**ERD Reference:** `vendors.city`, `vendors.province`

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

### P1-5: Profile Edit Page (KTP, Emergency Contact)
**Status:** ⚠️ Partial  
**Impact:** Tenant profile incomplete after registration  
**ERD Reference:** `tenants` table has many fields

**Current State:**
- `src/pages/tenant/Settings.tsx` only updates `profiles` table
- `TenantProfileForm` component exists but may not be used
- Fields in `tenants` table:
  - `ktp_number`, `ktp_photo_url`
  - `emergency_contact_name`, `emergency_contact_phone`, `emergency_contact_relation`
  - `date_of_birth`, `gender`, `occupation`, `income_range`

**Required:**
- Integrate full tenant profile edit in Settings
- Add KTP photo upload functionality

---

### P1-6: Notification Settings Not Persisted
**Status:** ❌ Bug  
**Impact:** Settings reset on page reload  
**File:** `src/pages/tenant/Settings.tsx`

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

### Sprint 1 (P0 - Critical)
1. Fix currency format ZAR → IDR across all tenant pages
2. Implement order payment flow with Xendit
3. Add order escrow integration

### Sprint 2 (P1 - Important)
1. Property-specific forum filtering
2. Vendor location filter in marketplace
3. Complete tenant profile edit (KTP, emergency contact)
4. Fix notification settings persistence

### Sprint 3 (P1 Continued)
1. Auto-pay setup UI
2. Invoice PDF download verification
3. Service fee display in order summary

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
