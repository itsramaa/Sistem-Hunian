# TODO Admin (Platform Provider) - SiHuni

**Last Updated:** 2024-12-22  
**Cross-checked against:** PRD, Tasks, Architecture, ERD, NFR, API Contract, User Flow

---

## 📊 STATUS OVERVIEW

| Category | Implemented | Needs Fix | Not Implemented |
|----------|-------------|-----------|-----------------|
| Dashboard & Analytics | ✅ Partial | 3 | 2 |
| Merchant Management | ✅ Yes | 1 | 0 |
| Vendor Management | ✅ Yes | 0 | 1 |
| Subscription Management | ✅ Yes | 2 | 0 |
| Platform Configuration | ❌ No | 0 | 3 |
| Content Management | ❌ No | 0 | 2 |
| Security & Audit | ❌ No | 1 | 2 |

---

## 🔴 CRITICAL (P0) - Harus Segera Diperbaiki

### P0-1: Dashboard Statistics Hardcoded
**Status:** ❌ Data dummy, bukan dari database  
**File:** `src/pages/admin/Dashboard.tsx` (lines 18-51)  
**Problem:**
```typescript
// Current: Hardcoded values
const stats = {
  totalMerchants: 156,
  totalTenants: 2847,
  totalRevenue: 45280000,
  // ...
};
```
**Expected:** Query real data dari database  
**Docs Reference:** PRD Section 5.1 "Dashboard: Platform overview, active users, revenue stats"  
**Solution:**
1. Query `merchants` table untuk total merchants
2. Query `contracts` atau `profiles` dengan role tenant untuk total tenants
3. Query `payments` dengan status paid untuk revenue
4. Query `merchant_subscriptions` untuk subscription stats

**Estimated Time:** 2-3 hours

---

### P0-2: Platform Fee Configuration Missing
**Status:** ❌ Tidak ada UI untuk mengatur platform fees  
**File:** Tidak ada  
**Problem:** Admin tidak bisa mengatur:
- Transaction fee percentage
- Escrow service fee
- Subscription pricing
- Disbursement fees

**Docs Reference:** 
- PRD Section 5.1 "Platform Configuration: Fee structure, payment gateway settings"
- API Contract "POST /config/fees"

**Solution:**
1. Buat tabel `platform_config` untuk menyimpan konfigurasi
2. Buat halaman `/admin/platform-config`
3. Form untuk edit fee percentages

**Estimated Time:** 4-5 hours

---

### P0-3: Currency Format Inconsistency (ZAR instead of IDR)
**Status:** 🐛 Bug - Beberapa file menggunakan ZAR  
**Files:**
- `src/pages/admin/Settings.tsx` (line 18) - Uses 'ZAR'
- `src/pages/merchant/Invoices.tsx` (line 251) - Uses 'ZAR'

**Problem:** Platform Indonesia seharusnya menggunakan IDR  
**Solution:** Find and replace semua 'ZAR' dengan 'IDR'

**Estimated Time:** 15 minutes

---

## 🟡 IMPORTANT (P1) - Perlu Diperbaiki

### P1-1: Admin Settings Not Persisted
**Status:** ❌ Settings hanya state lokal, tidak disimpan ke database  
**File:** `src/pages/admin/Settings.tsx`  
**Problem:**
```typescript
// Current: Local state only
const [settings, setSettings] = useState({
  platformName: 'SiHuni',
  // ...
});

const handleSave = () => {
  toast.success("Settings saved successfully"); // Fake save!
};
```
**Solution:**
1. Buat tabel `platform_settings` 
2. Load settings dari database saat mount
3. Save ke database saat handleSave

**Estimated Time:** 2 hours

---

### P1-2: Referral Program Management Missing
**Status:** ❌ Tidak ada UI untuk manage referral program  
**File:** Tidak ada halaman admin untuk referrals  
**Tables:** `referrals`, `referral_rewards` sudah ada  
**Problem:** Admin tidak bisa:
- Lihat semua referrals
- Approve/reject rewards
- Set reward amounts
- View referral analytics

**Docs Reference:** PRD Section 5.6 "Referral Program"  
**Solution:**
1. Buat halaman `/admin/referrals`
2. List semua referrals dengan status
3. Approve/payout rewards
4. Analytics dashboard

**Estimated Time:** 4-5 hours

---

### P1-3: Chatbot Knowledge Base Management Missing
**Status:** ❌ Tidak ada UI untuk manage FAQ/knowledge  
**File:** Tidak ada  
**Table:** `chatbot_knowledge` sudah ada dengan RLS  
**Problem:** Admin tidak bisa:
- Add/edit/delete FAQ entries
- Manage categories
- View chat analytics

**Docs Reference:** PRD Section 5.5 "AI Chatbot Integration"  
**Solution:**
1. Buat halaman `/admin/chatbot`
2. CRUD untuk chatbot_knowledge
3. Category management

**Estimated Time:** 3-4 hours

---

### P1-4: Tenant Analytics Dashboard Missing
**Status:** ❌ Tidak ada analytics khusus tenant  
**File:** `src/pages/admin/Analytics.tsx` - Hanya ada basic stats  
**Problem:** Tidak ada:
- Tenant growth chart
- Tenant by property type
- Tenant payment behavior analytics
- Churn analytics

**Docs Reference:** PRD Section 5.1 "Analytics: Platform-wide metrics"  
**Solution:**
1. Add tenant tab di Analytics page
2. Query contracts untuk tenant data
3. Payment behavior dari payments table

**Estimated Time:** 3-4 hours

---

### P1-5: MRR/Churn Analytics Missing
**Status:** ❌ Tidak ada subscription revenue analytics  
**File:** `src/pages/admin/Analytics.tsx`  
**Problem:** Tidak ada:
- Monthly Recurring Revenue (MRR) tracking
- Churn rate calculation
- Subscription tier distribution
- Revenue forecasting

**Docs Reference:** NFR "Business Metrics: Revenue tracking, subscription analytics"  
**Solution:**
1. Query merchant_subscriptions untuk MRR
2. Track canceled_at untuk churn
3. Revenue projection berdasarkan active subscriptions

**Estimated Time:** 4-5 hours

---

## 🟢 ENHANCEMENT (P2) - Nice to Have

### P2-1: Audit Log Viewer
**Status:** ❌ Tidak ada audit logging system  
**Problem:** Admin tidak bisa melihat:
- User actions history
- Security events
- Data changes
- Login/logout history

**Docs Reference:** NFR "Security: Audit logging"  
**Solution:**
1. Buat tabel `audit_logs`
2. Trigger untuk log critical actions
3. UI untuk view dan filter logs

**Estimated Time:** 6-8 hours

---

### P2-2: Forum Moderation Panel
**Status:** ❌ Tidak ada dedicated forum moderation  
**Tables:** `forum_posts`, `forum_comments`, `forum_reports` sudah ada  
**Problem:** Admin tidak punya centralized view untuk:
- Pending reports
- Flagged content
- User bans
- Content moderation queue

**Docs Reference:** PRD Section 5.4 "Community Forum"  
**Solution:**
1. Buat halaman `/admin/forum-moderation`
2. List pending reports
3. Quick actions: hide, delete, ban

**Estimated Time:** 4-5 hours

---

### P2-3: Vendor Order Monitoring
**Status:** ❌ Tidak ada monitoring vendor orders  
**Tables:** `orders`, `order_reviews` sudah ada  
**Problem:** Admin tidak bisa monitor:
- Order volume
- Order disputes
- Vendor performance
- Revenue from orders

**Docs Reference:** PRD Section 5.3 "Marketplace"  
**Solution:**
1. Add Orders tab di Vendors page atau buat page terpisah
2. Order analytics dashboard
3. Dispute handling

**Estimated Time:** 3-4 hours

---

### P2-4: Admin MFA/2FA
**Status:** ❌ Tidak ada two-factor authentication untuk admin  
**Problem:** Security risk - admin accounts tanpa extra protection  
**Docs Reference:** NFR "Security: Multi-factor authentication"  
**Solution:**
1. Implement TOTP-based 2FA
2. Require 2FA untuk admin role
3. Recovery codes

**Estimated Time:** 8-10 hours

---

## 🐛 BUGS

### Bug-1: Currency ZAR Instead of IDR
**Severity:** Medium  
**Files:**
- `src/pages/admin/Settings.tsx:18`
- `src/pages/merchant/Invoices.tsx:251`

**Fix:** Replace 'ZAR' with 'IDR'

---

### Bug-2: Settings Not Persisted to Database
**Severity:** High  
**File:** `src/pages/admin/Settings.tsx`  
**Problem:** handleSave() shows success toast but doesn't actually save to database

**Fix:** Create platform_settings table and implement actual save

---

### Bug-3: Dashboard Stats Hardcoded
**Severity:** High  
**File:** `src/pages/admin/Dashboard.tsx:18-51`  
**Problem:** All stats are dummy data, not real

**Fix:** Replace with real database queries

---

### Bug-4: Admin Secret Key Exposed
**Severity:** Critical  
**File:** `src/pages/AdminSetup.tsx:24`  
```typescript
const ADMIN_SECRET_KEY = 'SIHUNI_ADMIN_2024';
```
**Problem:** Hardcoded secret key in client-side code  
**Fix:** Move validation to edge function with proper secret management

---

### Bug-5: Subscription Tier Name Mismatch
**Severity:** Low  
**File:** `src/pages/admin/Subscriptions.tsx`  
**Problem:** UI shows tier names yang mungkin tidak match dengan database  
**Fix:** Ensure tier names consistent antara UI dan subscription_tiers table

---

## 📁 FILE REFERENCE

### Files yang Perlu Diperbaiki:
| File | Issue | Priority |
|------|-------|----------|
| `src/pages/admin/Dashboard.tsx` | Hardcoded stats | P0 |
| `src/pages/admin/Settings.tsx` | Not persisted, ZAR currency | P0/P1 |
| `src/pages/AdminSetup.tsx` | Exposed secret key | P0 |
| `src/pages/admin/Analytics.tsx` | Missing tenant/MRR analytics | P1 |
| `src/pages/admin/Subscriptions.tsx` | Tier name mismatch | Bug |

### Files yang Perlu Dibuat:
| File | Feature | Priority |
|------|---------|----------|
| `src/pages/admin/PlatformConfig.tsx` | Fee configuration | P0 |
| `src/pages/admin/Referrals.tsx` | Referral management | P1 |
| `src/pages/admin/Chatbot.tsx` | Knowledge base management | P1 |
| `src/pages/admin/ForumModeration.tsx` | Forum moderation | P2 |
| `src/pages/admin/AuditLogs.tsx` | Audit log viewer | P2 |

### Database Tables yang Perlu Dibuat:
| Table | Purpose | Priority |
|-------|---------|----------|
| `platform_settings` | Store platform configuration | P1 |
| `platform_fees` | Fee structure configuration | P0 |
| `audit_logs` | Security and action logging | P2 |

---

## 📋 IMPLEMENTATION PRIORITY

### Sprint 1 (Immediate - 1 week) ✅ COMPLETED
1. ✅ Fix Bug-1: Currency ZAR → IDR - DONE
2. ✅ Fix Bug-4: Move admin secret to edge function - DONE (validate-admin-secret edge function)
3. ✅ P0-3: Currency consistency - DONE
4. ✅ P0-1: Dashboard real stats - DONE (queries merchants, payments, escrow_accounts, vendor_verifications)
5. ✅ Bug-2: Settings persistence - DONE (platform_settings table created)

### Sprint 2 (1-2 weeks) ✅ COMPLETED
1. ✅ P0-2: Platform fee configuration - DONE (/admin/platform-config)
2. ✅ P1-2: Referral program management - DONE (/admin/referrals)
3. ✅ P1-4: Tenant analytics - DONE (added Tenants tab to Analytics page)

### Sprint 3 (2-3 weeks) ✅ COMPLETED
1. ✅ P1-3: Chatbot knowledge base UI - DONE (/admin/chatbot)
2. ✅ P1-5: MRR/Churn analytics - DONE (added Subscriptions tab to Analytics page)
3. ✅ P2-3: Vendor order monitoring - DONE (/admin/orders)

### Sprint 4 (Nice to have) ✅ COMPLETED
1. ✅ P2-1: Audit log system - DONE (/admin/audit-logs, audit_logs table)
2. ✅ P2-2: Forum moderation panel - DONE (/admin/forum-moderation)
3. ✅ P2-4: Admin MFA/2FA - DONE (/admin/2fa, TOTP-based with recovery codes)

---

## ✅ ALREADY IMPLEMENTED (Working)

| Feature | File | Status |
|---------|------|--------|
| Admin Dashboard Layout | `src/components/layouts/AdminLayout.tsx` | ✅ |
| Merchant Management | `src/pages/admin/Merchants.tsx` | ✅ |
| Vendor Management | `src/pages/admin/Vendors.tsx` | ✅ |
| Vendor Verifications | `src/pages/admin/VendorVerifications.tsx` | ✅ |
| Dispute Management | `src/pages/admin/Disputes.tsx` | ✅ |
| Escrow Monitoring | `src/pages/admin/Escrow.tsx` | ✅ |
| Subscription Tiers | `src/pages/admin/SubscriptionTiers.tsx` | ✅ |
| Subscriptions List | `src/pages/admin/Subscriptions.tsx` | ✅ |
| Basic Analytics | `src/pages/admin/Analytics.tsx` | ✅ Partial |
| Real-time Analytics | `src/components/admin/RealTimeAnalytics.tsx` | ✅ |
| Admin Setup | `src/pages/AdminSetup.tsx` | ⚠️ Security issue |
| Protected Routes | `src/components/auth/ProtectedRoute.tsx` | ✅ |
| Role-based Access | Database functions `has_role`, `get_user_role` | ✅ |

---

## 🔗 DOCS REFERENCE

- **PRD Section 5.1:** Admin Features
- **Tasks Sprint 2:** Admin dashboard and management
- **NFR:** Security, performance, audit requirements
- **API Contract:** Admin endpoints
- **Architecture:** Admin service layer
