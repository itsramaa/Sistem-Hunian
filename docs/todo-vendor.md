# TODO Vendor - Cross Check Analysis

## Last Updated: 2025-01-22

---

## STATUS OVERVIEW

| Category | Implemented | Needs Work | Not Implemented |
|----------|-------------|------------|-----------------|
| Dashboard & Analytics | 1 | 1 | 2 |
| Products Management | 1 | 1 | 1 |
| Orders Management | 0 | 0 | 2 |
| Jobs Management | 1 | 0 | 0 |
| Earnings & Disbursement | 1 | 1 | 1 |
| Profile & Settings | 2 | 1 | 0 |
| Verification | 1 | 0 | 0 |
| Referrals | 1 | 1 | 0 |
| **TOTAL** | **8** | **5** | **6** |

---

## IMPLEMENTED FEATURES ✅

### 1. Vendor Dashboard (`src/pages/vendor/Dashboard.tsx`)
- [x] Overview statistics cards
- [x] Recent jobs list
- [x] Earnings summary
- [x] Quick actions

### 2. Jobs Management (`src/pages/vendor/Jobs.tsx`)
- [x] Active jobs tab
- [x] Completed jobs tab
- [x] Accept/Start/Complete job actions
- [x] Job details (property, priority, category)
- [x] Automatic earnings record on job completion

### 3. Products Management (`src/pages/vendor/Products.tsx`)
- [x] View products list
- [x] Add new product
- [x] Edit product
- [x] Delete product
- [x] Category selection
- [x] Price, unit, availability settings
- [x] Min order, estimated duration

### 4. Earnings Page (`src/pages/vendor/Earnings.tsx`)
- [x] Total earnings display
- [x] Pending earnings
- [x] Available for withdrawal
- [x] Earnings history table

### 5. Profile Management (`src/pages/vendor/Profile.tsx`)
- [x] Business information form
- [x] Service categories selection
- [x] Contact information
- [x] Verification upload component

### 6. Settings (`src/pages/vendor/Settings.tsx`)
- [x] Notification preferences UI
- [x] Bank account management
- [x] Security settings (password change)

### 7. Referrals (`src/pages/vendor/Referrals.tsx`)
- [x] Referral dashboard component
- [x] Referral code generation
- [x] Referral history

### 8. Verification Upload (`src/components/vendor/VerificationUpload.tsx`)
- [x] Document upload for KTP, SIUP, etc.
- [x] Status tracking

---

## CRITICAL (P0) - Must Fix 🔴

### P0-1: Vendor Orders Page Missing
**Status:** NOT IMPLEMENTED  
**Impact:** High - Tenants can order from marketplace but vendors cannot see/manage orders  
**Files Affected:**
- `src/pages/vendor/Orders.tsx` - DOES NOT EXIST
- `src/components/layouts/VendorLayout.tsx` - No Orders menu item

**Requirements from PRD:**
- View incoming orders from tenants
- Accept/reject orders
- Update order status (processing → ready → delivered/completed)
- Order details with customer info

**Database Ready:** ✅ `orders` table exists with vendor_id

---

### P0-2: Order Payment Flow Not Integrated
**Status:** NOT IMPLEMENTED  
**Impact:** High - Orders created without payment verification  
**Files Affected:**
- `src/pages/tenant/VendorDetail.tsx` - Order created without payment
- `supabase/functions/xendit-create-invoice/index.ts` - Supports invoice but not linked to orders

**Requirements from PRD:**
- Tenant pays via Xendit when ordering
- Order only confirmed after payment success
- Payment status tracked in `xendit_transactions` table

**Database Ready:** ✅ `xendit_transactions.order_id` exists

---

### P0-3: Vendor Disbursement Settings UI Missing
**Status:** NOT IMPLEMENTED  
**Impact:** Medium - Vendors cannot configure their payout preferences  
**Files Affected:**
- `src/pages/vendor/Settings.tsx` - Has bank accounts but no disbursement schedule
- `supabase/functions/xendit-disbursement/index.ts` - Supports disbursement

**Requirements from PRD:**
- Choose disbursement frequency (daily/weekly/monthly)
- Set minimum payout threshold
- View disbursement history

**Database Needed:** Add `disbursement_schedule`, `min_payout_threshold` to `vendors` table

---

## IMPORTANT (P1) - Should Fix 🟡

### P1-1: Product Photos Upload UI
**Status:** PARTIAL  
**Impact:** Medium - Photos field exists but no upload UI  
**Files Affected:**
- `src/pages/vendor/Products.tsx` - Form has no photo upload
- `src/components/FileUpload.tsx` - Component exists but not used

**Requirements:**
- Multiple photo upload for products
- Photo preview and delete
- Store in Supabase storage

**Database Ready:** ✅ `products.photos` column exists (text[])

---

### P1-2: Vendor Escrow Balance Dashboard
**Status:** NOT IMPLEMENTED  
**Impact:** Medium - Vendors don't see their escrow balance like merchants  
**Files Affected:**
- `src/pages/vendor/Dashboard.tsx` - No escrow widget
- `src/pages/vendor/Earnings.tsx` - Shows earnings but not escrow

**Requirements from PRD:**
- Show pending balance (awaiting disbursement)
- Show available balance
- Show total earned this month

**Database Ready:** ✅ `disbursements.vendor_id` exists

---

### P1-3: Sales Analytics Dashboard
**Status:** NOT IMPLEMENTED  
**Impact:** Medium - Vendors cannot see performance trends  
**Files Affected:**
- `src/pages/vendor/Dashboard.tsx` - Basic stats only

**Requirements from PRD:**
- Daily/weekly/monthly revenue charts
- Top selling products
- Order completion rate
- Average rating trend

---

### P1-4: Order Auto-Reject System
**Status:** NOT IMPLEMENTED  
**Impact:** Medium - Orders remain pending indefinitely  
**Files Affected:**
- No CRON function exists for this

**Requirements from PRD:**
- Auto-reject orders not confirmed within 1 hour
- Notify tenant of rejection
- Refund payment if already paid

---

### P1-5: Referrals Menu in Navigation
**Status:** BUG  
**Impact:** Low - Page exists but not accessible from menu  
**Files Affected:**
- `src/components/layouts/VendorLayout.tsx:23-30` - No referrals menu item

**Fix Required:**
```typescript
{ icon: Gift, label: 'Referrals', href: '/vendor/referrals' }
```

---

## ENHANCEMENT (P2) - Nice to Have 🟢

### P2-1: Stock Management System
**Status:** NOT IMPLEMENTED  
**Files Affected:**
- `src/pages/vendor/Products.tsx` - No stock tracking UI

**Requirements:**
- Track product stock/inventory
- Low stock alerts
- Stock history

**Database Ready:** ✅ `products.stock` column exists

---

### P2-2: Promotional Pricing
**Status:** NOT IMPLEMENTED  
**Files Affected:**
- `src/pages/vendor/Products.tsx` - No promo price field

**Requirements:**
- Set promotional price with date range
- Show original vs promo price in marketplace

**Database Needed:** Add `promo_price`, `promo_start`, `promo_end` to `products` table

---

### P2-3: Customer Insights Analytics
**Status:** NOT IMPLEMENTED  
**Files Affected:**
- `src/pages/vendor/Dashboard.tsx`

**Requirements:**
- Repeat customer rate
- Average order value
- Customer location distribution
- Peak ordering times

---

### P2-4: AI Chatbot for Vendors
**Status:** NOT IMPLEMENTED  
**Files Affected:**
- `src/components/chatbot/ChatbotWidget.tsx` - Exists but not vendor-specific

**Requirements:**
- Sales tips based on performance
- Demand forecasting
- Product recommendation suggestions

---

## BUGS 🐛

### Bug-1: vendor_jobs TypeScript Issue
**Severity:** Medium  
**Location:** `src/pages/vendor/Jobs.tsx:23-52`  
**Issue:** Interface manually defined, may mismatch with actual DB schema  
**Fix:** Use generated types from `src/integrations/supabase/types.ts`

---

### Bug-2: Notification Settings Not Persisted
**Severity:** Medium  
**Location:** `src/pages/vendor/Settings.tsx`  
**Issue:** Toggle changes not saved to database  
**Fix:** Add notification_settings column to vendors table or use user_preferences table

---

### Bug-3: Referrals Menu Missing from Navigation
**Severity:** Low  
**Location:** `src/components/layouts/VendorLayout.tsx:23-30`  
**Issue:** `/vendor/referrals` route exists but no menu item  
**Fix:** Add menu item to vendorMenuItems array

---

### Bug-4: Product Photos Not Uploadable
**Severity:** Medium  
**Location:** `src/pages/vendor/Products.tsx`  
**Issue:** `photos` column exists in products table but no upload UI  
**Fix:** Add FileUpload component to product form

---

## FILE REFERENCE

### Pages
| File | Status | Notes |
|------|--------|-------|
| `src/pages/vendor/Dashboard.tsx` | ⚠️ Needs analytics | Basic stats only |
| `src/pages/vendor/Jobs.tsx` | ✅ Complete | Manual types |
| `src/pages/vendor/Products.tsx` | ⚠️ Needs photos | No photo upload |
| `src/pages/vendor/Earnings.tsx` | ✅ Complete | - |
| `src/pages/vendor/Profile.tsx` | ✅ Complete | - |
| `src/pages/vendor/Settings.tsx` | ⚠️ Not persisted | Settings not saved |
| `src/pages/vendor/Referrals.tsx` | ⚠️ No menu | Page exists, no nav |
| `src/pages/vendor/Orders.tsx` | ❌ Missing | Critical - needs creation |

### Components
| File | Status | Notes |
|------|--------|-------|
| `src/components/layouts/VendorLayout.tsx` | ⚠️ Incomplete | Missing Orders, Referrals menu |
| `src/components/vendor/VerificationUpload.tsx` | ✅ Complete | - |

### Edge Functions
| File | Status | Notes |
|------|--------|-------|
| `supabase/functions/xendit-disbursement/index.ts` | ✅ Ready | Supports vendor disbursement |
| Vendor order notification | ❌ Missing | Need to create |
| Order auto-reject CRON | ❌ Missing | Need to create |

---

## IMPLEMENTATION PRIORITY

### Sprint 1 (Critical) ✅ COMPLETED
1. ✅ **P0-1**: Create Vendor Orders Page - DONE (`src/pages/vendor/Orders.tsx`)
   - View orders by status (pending, active, completed, cancelled)
   - Accept/process/complete/cancel orders
   - View customer details and order info
   - Auto-create vendor earnings on order completion
   
2. ✅ **P0-2**: Order Payment Integration - ALREADY WORKING
   - Tenant order flow already uses Xendit payment modal
   - Order created → payment triggered → payment complete
   - xendit_transactions table links to orders
   
3. ✅ **Bug-3**: Add Referrals & Orders to vendor menu - DONE
   - Added Orders menu item
   - Added Referrals menu item

### Sprint 2 (Important) ✅ COMPLETED
1. ✅ **P1-1**: Product Photos Upload - DONE
   - Added ProductPhotoUpload component
   - Integrated with product form
   - Photos stored in product-photos bucket
   - Gallery display on product cards
   
2. ✅ **P1-2**: Vendor Escrow Balance Widget - DONE
   - VendorEscrowWidget component on dashboard
   - Shows available balance, pending payout, this month's earnings
   - Links to full earnings page
   
3. ✅ **P0-3**: Disbursement Settings UI - DONE
   - Added disbursement_schedule, min_payout_threshold columns to vendors
   - DisbursementSettings component in Settings page
   - Configure payout frequency (daily/weekly/biweekly/monthly)
   - Set minimum payout threshold
   - View disbursement history
   
4. ✅ **Bug-2**: Persist notification settings - DONE
   - Added notification_settings JSONB column to vendors
   - Settings automatically saved when toggled
   - Loads from database on page load

### Sprint 3 (Enhancement)
1. [ ] **P1-3**: Sales Analytics Dashboard
2. [ ] **P1-4**: Order Auto-Reject CRON
3. [ ] **P2-1**: Stock Management
4. [ ] **Bug-1**: Fix vendor_jobs types

### Sprint 4 (Polish)
1. [ ] **P2-2**: Promotional Pricing
2. [ ] **P2-3**: Customer Insights
3. [ ] **P2-4**: AI Chatbot for Vendors

---

## CROSS-REFERENCE TO DOCS

| PRD Section | Implementation Status |
|-------------|----------------------|
| 3.5 Vendor Portal | 60% Complete |
| 4.2.5 Vendor User Flows | 50% Complete |
| 5.3 Disbursement | 70% Complete |
| 6.3 Vendor Verification | 100% Complete |

---

## NOTES

1. **Orders vs Jobs**: Current system has two flows:
   - **Jobs**: Maintenance requests assigned by merchants (working)
   - **Orders**: Product/service orders from tenants (NOT working)
   
2. **Payment Flow Gap**: Tenants can "order" but no payment is collected

3. **Menu Discrepancy**: VendorLayout has Jobs menu but no Orders menu, even though orders table exists

4. **Verification Complete**: Vendor verification flow is fully implemented and working
