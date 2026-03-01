

# Improvement: Enhanced Onboarding Journey Checklist with Blocking Step Visibility

## Overview

Upgrade the existing `MerchantQuickStartChecklist` to show the full 10-step onboarding journey (from registration to first revenue), with clear visual indicators for **blocking steps** -- steps where the merchant is waiting on someone else (admin, tenant, system). Currently the checklist only tracks 5 binary milestones and has no concept of "waiting" states.

## Current State

- `MerchantQuickStartChecklist` tracks 5 items: profile, property, unit, tenant, invoice -- all binary (done/not done)
- No visibility into blocking steps: admin verification, tenant invitation acceptance, contract signing, first payment
- `merchant.verification_status` is available from `useAuth()` but not shown in the checklist
- `tenant_invitations` table has `status` field (pending/accepted/cancelled)
- Contracts have `signature_status` (pending_signatures/partially_signed/fully_signed)
- Invoice/payment status is queryable

## What Changes

### 1. Extend `CheckItem` interface to support blocking states

Add a `status` field: `'completed' | 'active' | 'blocking' | 'pending'`
- `completed`: Done (green check)
- `active`: Merchant can act now (blue, clickable)
- `blocking`: Waiting on external party (amber/yellow, with "Menunggu..." label)
- `pending`: Not yet reachable (gray)

### 2. Create `useOnboardingJourney` hook

New hook that queries the data needed for 10-step journey status:
- `merchant.verification_status` (from `useAuth`)
- Property count (from `useMerchantDashboardStats`)
- Unit count (from stats)
- Pending invitations count (query `tenant_invitations` where status = 'pending')
- Active tenants (from stats)
- Contracts with unsigned status (query `contracts` where signature_status != 'fully_signed')
- First invoice existence (from stats)
- First payment existence (query `payments` where status = 'paid')

Returns the 10 checklist items with computed statuses.

**File:** `src/features/launch/hooks/useOnboardingJourney.ts` (NEW)

### 3. Rewrite `MerchantQuickStartChecklist` to use journey data

Replace the hardcoded 5-item list with the 10-step journey from the hook. Visual changes:
- Blocking items show an amber clock icon + "Menunggu verifikasi admin" text
- Active items show blue circle + action prompt
- Completed items show green check (unchanged)
- Pending items show gray circle (unchanged)
- Progress bar reflects all 10 steps

**File:** `src/features/launch/components/MerchantQuickStartChecklist.tsx` (MODIFY)

### 4. Update audit report

**File:** `old-docs/SYSTEM_AUDIT_REPORT.md` (UPDATE)

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/features/launch/hooks/useOnboardingJourney.ts` | CREATE | Hook computing 10-step journey status |
| `src/features/launch/components/MerchantQuickStartChecklist.tsx` | MODIFY | Use new hook, render blocking/active/pending states |
| `old-docs/SYSTEM_AUDIT_REPORT.md` | UPDATE | Track 2B-A recommendation implementation |

## Technical Details

### 10-Step Journey Items

| # | Label | Status Logic |
|---|-------|-------------|
| 1 | Registrasi akun | Always completed (user is logged in) |
| 2 | Lengkapi profil bisnis | `merchant.business_name !== 'My Business'` |
| 3 | Verifikasi admin | `verification_status`: pending = blocking, verified = completed |
| 4 | Tambah properti pertama | `stats.properties.total > 0` |
| 5 | Buat unit di properti | `stats.properties.totalUnits > 0` |
| 6 | Undang penyewa | Has pending/accepted invitation or active tenant |
| 7 | Penyewa menerima undangan | Blocking if invitation pending, completed if tenant active |
| 8 | Buat kontrak | Has any contract |
| 9 | Tanda tangan kontrak | Blocking if contract unsigned, completed if fully_signed |
| 10 | Pembayaran pertama | `stats.financials.monthlyRevenue > 0` or any paid payment |

### Status Computation Logic

Each step is computed sequentially -- if a prior step is incomplete, all subsequent steps are `pending`. Blocking steps are identified when the step's prerequisite is met but the step itself depends on an external party.

### Visual Design

```text
[check] Registrasi akun                          -- green, completed
[check] Lengkapi profil bisnis                    -- green, completed
[clock] Verifikasi admin                          -- amber, "Menunggu verifikasi..."
[gray]  Tambah properti pertama                   -- gray, pending (blocked by step 3)
[gray]  Buat unit di properti                     -- gray, pending
...
```

Blocking items show:
- Amber/warning clock icon
- "Menunggu..." description text
- Non-clickable (merchant can't act)
- Subtle amber background

### Query Efficiency

The hook reuses `useMerchantDashboardStats` for most data. Only 2 additional lightweight queries:
1. `tenant_invitations` count (pending status, merchant_id filter)
2. `contracts` with `signature_status` check (1 row, head query)

Both use `staleTime: 5 * 60 * 1000` to avoid excessive requests.

### No Database Changes

All data is already available in existing tables. No schema modifications needed.
