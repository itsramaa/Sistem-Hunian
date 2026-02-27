

# Complete Rewrite: UX Assessment & User Journey (Current System Only)

## Problem

The current `UX_ASSESSMENT_AND_USER_JOURNEY.md` has **174 references** to `merchant_activity_diagram.md`, which is outdated and no longer aligned with the actual system. The PRD (`sihuni_prd.md`) also references escrow for merchants, contradicting the production codebase. A full rewrite is required using only current code-level evidence.

## Authoritative Sources (Code-Level Only)

These are the ONLY sources used for the rewrite:

| Source | Path | What It Provides |
|--------|------|------------------|
| Navigation Config | `src/shared/components/layouts/navigation-config.ts` | 24 merchant sidebar items, 4 groups |
| State Machines | `src/shared/constants/state-machines.ts` | 31 state machines (all transitions) |
| Merchant Pages | `src/pages/merchant/*.tsx` (57 files) | Actual merchant UI pages |
| Dashboard Service | `src/features/dashboard/services/merchantDashboardService.ts` | Dashboard queries, direct payment model |
| Financial Control | `src/features/finance/services/financialControlService.ts` | Approval workflows |
| Staff Permissions | `src/features/staff/constants/permissions.ts` | 16 permissions, 3 roles, 4 groups |
| Edge Functions | `supabase/functions/` (65 functions) | Backend automation |
| Database Functions | Supabase config | Triggers, generators, validation |
| Database Schema | `handle_new_user()` trigger | Bootstrap logic (no escrow) |

**Excluded**: `merchant_activity_diagram.md`, `sihuni_prd.md` escrow sections, any outdated diagram.

## Document Structure

### Section 0: Merchant System Scope (Current Version)

Define clearly:
- **CAN DO**: 32 features across 57 pages (property, unit, contract, invoice, payment, maintenance, expense, reports, AI/ML, staff, inventory, etc.)
- **CANNOT DO**: Escrow management, direct bank disbursement scheduling, vendor product management, tenant registration (merchant can only invite)
- **Vendor-Only**: Escrow (`DISBURSEMENT_STATUS_TRANSITIONS`), Product/order management, Job acceptance
- **Admin-Only**: Merchant verification approval, payment transfer monitoring, dispute mediation, subscription tier management, platform config, forum moderation
- **Escrow Confirmation**: "Escrow is NOT part of the merchant system. Migration `20260227084712` removed `create_merchant_escrow` trigger. `merchantDashboardService.ts` hardcodes `balance: 0`. Disbursement is vendor-only."

### Section 1: Merchant Feature Ground Truth (32 Features)

Re-extracted from `navigation-config.ts` + `state-machines.ts` + page files. NO diagram references. Each feature maps to:
- Navigation path (from `navigation-config.ts`)
- Page file (from `src/pages/merchant/`)
- State machine (from `state-machines.ts`, or "None")
- Edge functions (from `supabase/functions/`)

### Section 2: Full UX Assessment (32 Features)

Each feature follows this format:
```
### Feature N: {Name}

#### Documentation Source
- Navigation: navigation-config.ts line X
- Page: src/pages/merchant/{Page}.tsx
- State Machine: {name} in state-machines.ts lines X-Y (or "None")
- Edge Functions: {list} (or "None")

#### Actual Flow (Current Only)
| Role | Action | Page / Endpoint |

#### State Machine (if defined)
{transition diagram from code}

#### UX Friction (Evidence-Based)
#### Business Impact
#### Simplification Opportunities
```

Key changes from previous version:
- **Feature 8**: "Direct Payment (Payment Transfers)" — NO escrow references. Sources: `PAYMENT_TRANSFER_TRANSITIONS`, `merchantDashboardService.ts` (balance: 0, queries `payment_transfers`)
- **Feature 1**: Bootstrap creates profiles, user_roles, merchants, merchant_subscriptions. NO `escrow_accounts`
- **All 32 features**: Source references point to code files only, never to `merchant_activity_diagram.md`

### Section 3: End-to-End Merchant Journeys

#### A. Onboarding Journey
- Register -> Profile -> Verification -> Subscription -> Property -> Unit -> Invite Tenant -> Contract -> Invoice -> Payment
- 4 blocking steps (admin verification, tenant acceptance, signature, tenant payment)
- No escrow account creation step

#### B. Daily Operations
- Dashboard KPIs -> Invoice management -> Payment tracking -> Maintenance -> Expenses
- All sourced from actual page implementations

#### C. Critical Scenarios
- Late payment -> Collections (7-state machine)
- Move-out -> 4 sub-machines (notice, inspection, early termination, deposit refund)
- Vacancy -> Waiting list (6-state machine)

### Section 4: UX Risk Map
Severity matrix for all 32 features based on complexity vs. target user sophistication.

### Section 5: Scalability UX Check
24 sidebar items analysis, collapsible "Lainnya" group (12 items), mobile bottom nav (5 items).

### Section 6: System Alignment Verification

```
- Escrow references found: 0
- merchant_activity_diagram.md references found: 0
- Outdated diagram references found: 0
- Total merchant features analyzed: 32
- All features verified against: navigation-config.ts, state-machines.ts, page files
- PRD conflicts noted: PRD Section 2.2/5.2 still references escrow for merchant (outdated)
- API Contract conflicts noted: API Section 6 references escrow_balance (outdated)
```

### Section 7: Final UX Verdict

Same analytical framework but all evidence from current code only.

## Key Differences From Previous Version

| Aspect | Previous | New |
|--------|----------|-----|
| Primary source | `merchant_activity_diagram.md` (174 refs) | Code files only (0 diagram refs) |
| Escrow references | 30 occurrences | 0 (explicitly excluded) |
| Feature 8 name | "Direct Payment (Escrow & Disbursement)" then patched | "Direct Payment (Payment Transfers)" from scratch |
| Feature 1 bootstrap | Mentioned escrow_accounts creation | No escrow_accounts |
| Outdated PRD claims | Treated as authoritative | Flagged as "PRD Section X is outdated vs production code" |
| API Contract claims | Treated as authoritative | Flagged where conflicts exist (e.g., escrow_balance in API 2.1) |

## File Modified

| Action | File |
|--------|------|
| FULL REWRITE | `old-docs/UX_ASSESSMENT_AND_USER_JOURNEY.md` |

## Estimated Size

~2000 lines (similar to current), but entirely code-sourced. No incremental patches. No legacy remnants.

