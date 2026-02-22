
# Comprehensive Frontend Audit & Refactor - Merchant Pages

## Audit Summary

After reviewing all 21 merchant pages, shared components, design documentation (UIUX_Design_Documentation_SiHuni.md, development-standards.md), and relevant skills (ui-ux-designer, frontend-design, interaction-design, accessibility-compliance, responsive-design, tailwind-css-patterns, shadcn-ui), here are the findings and fixes.

---

## Audit Findings

### A. Design System Violations (HIGH)

**1. Hardcoded Colors (Forbidden per dev-standards Section 4.5)**

Multiple pages use raw Tailwind color classes instead of semantic tokens:

- `Escrow.tsx` line 327: `text-green-600` (should be `text-success`)
- `Reports.tsx` lines 464-501: `bg-green-500/10`, `text-green-600`, `bg-blue-500/10`, `text-blue-600`, `bg-yellow-500/10`, `text-yellow-600`, `text-red-600`
- `DssAdvisor.tsx` lines 16-21: `bg-yellow-100 text-yellow-800`, `bg-green-100 text-green-800`, `bg-red-100 text-red-800`
- `MlAnalytics.tsx` lines 87-92: Same pattern as DssAdvisor
- `Settings.tsx` lines 166-167: `bg-zinc-900`, `border-zinc-800`, `bg-zinc-800` (acceptable as dark mode preview thumbnails, but should use token equivalents)

**2. Forbidden Animation Property**

- `Dashboard.tsx` lines 84, 98, 121, 158: Uses `transition-all` (forbidden per dev-standards Section 4.5 -- must use specific properties like `transition-transform`, `transition-shadow`)
- `OcrTutorial.tsx` line 138: Same `transition-all` violation
- `PropertyDetail.tsx` line 161: `transition-all`
- `StatCard.tsx` line 66: `transition-all`

### B. Structural Issues (MEDIUM)

**3. Redundant Wrapper Divs**

Several pages have double-nested `space-y-6` wrappers that serve no purpose:
- `Contracts.tsx`: `<div className="space-y-6"><div className="space-y-6">...`
- `Invoices.tsx`: Same pattern
- `Payments.tsx`: Same pattern
- `Escrow.tsx`: Same pattern
- `Billing.tsx`: Same pattern
- `Referrals.tsx`: Same pattern

**4. Inconsistent Root Element Pattern**

- `Dashboard.tsx`: Uses `<>` (Fragment) as root
- `Maintenance.tsx`: Uses `<>` as root
- `MoveOuts.tsx`: Uses `<>` as root with content OUTSIDE the `space-y-6` wrapper
- Others: Uses `<div className="space-y-6">`

This inconsistency means some pages have content gaps because the outer Fragment doesn't apply spacing consistently. MoveOuts specifically has filters rendered in a separate `<div className="mt-6 mb-6">` outside the main flow.

### C. Component Bloat / SRP Violations (MEDIUM)

**5. Escrow.tsx (468 lines) -- Too much inline logic**

This page has:
- 4 separate `useQuery` calls directly in the page component
- 1 `useMutation` for `updateSchedule`
- 1 `useMutation` for `requestDisbursement` (~100 lines of logic)
- Interface definition (`BankAccount`) in the page file
- Complex business logic (fee calculations, verification checks) mixed with UI

Should be extracted to a custom hook like `useMerchantEscrow()`.

**6. Profile.tsx (500 lines) -- Logic-heavy page**

Contains:
- 3 `useQuery` calls directly in page
- 2 `useMutation` calls directly in page
- Form state management with `useState` + `useEffect` sync
- File upload handlers
- Verification logic

Should use React Hook Form + Zod and extract queries to a hook.

**7. DssAdvisor.tsx -- Inline TierGate component**

Defines a `TierGate` component inside the page function, causing it to re-create on every render. Should be extracted to a separate component or use `useMemo`.

**8. MlAnalytics.tsx -- Same TierGate pattern as DssAdvisor**

Duplicate `TierGate` implementation. Should be a shared component.

### D. Accessibility Issues (MEDIUM)

**9. Missing ARIA Labels**

- `Dashboard.tsx`: Icon-only refresh button lacks descriptive aria-label
- `MoveOuts.tsx` line 114: `StatCard` items are not semantically grouped with a heading
- Multiple pages with icon-only buttons in headers need `aria-label`

**10. Heading Hierarchy**

- `Billing.tsx` line 23: Uses `<h2>` for "Payout Settings" without a visible `<h1>` (PageHeader renders h1 but BillingDashboard also renders its own h1)
- `MoveOuts.tsx`: Stats cards and tabs are not wrapped under a section with proper heading

### E. Performance Concerns (LOW)

**11. StatsRowSkeleton dynamic grid class**

`PageSkeleton.tsx` line 6: `` grid-cols-${count} `` -- Tailwind cannot detect dynamic classes. This will fail for `count` values that aren't pre-generated. Should use a lookup map.

**12. No memoization on expensive filter computations**

Most pages correctly use `useMemo` for filtered data. However, `MoveOuts.tsx` has well-structured memoization already.

---

## Refactoring Plan

### Phase 1: Fix Design System Violations

**1.1 Replace all hardcoded colors with semantic tokens**

Files affected:
- `Escrow.tsx`: `text-green-600` -> `text-success`
- `Reports.tsx`: Replace `bg-green-500/10 text-green-600` with `bg-success/10 text-success`, `bg-blue-500/10 text-blue-600` with `bg-info/10 text-info`, `bg-yellow-500/10 text-yellow-600` with `bg-warning/10 text-warning`, `text-red-600` with `text-destructive`
- `DssAdvisor.tsx`: Replace STATUS_COLORS map with semantic tokens:
  - pending: `bg-warning/10 text-warning`
  - accepted: `bg-success/10 text-success`
  - expired: `bg-destructive/10 text-destructive`
- `MlAnalytics.tsx`: Replace riskLevelColor function similarly

**1.2 Replace `transition-all` with specific properties**

Files affected:
- `Dashboard.tsx` (4 occurrences): `transition-all` -> `transition-[transform,box-shadow]`
- `OcrTutorial.tsx`: Same fix
- `PropertyDetail.tsx`: Same fix
- `StatCard.tsx`: Same fix (affects ALL stat cards globally)

### Phase 2: Fix Structural Issues

**2.1 Remove redundant wrapper divs**

In these files, remove the unnecessary inner `<div className="space-y-6">`:
- `Contracts.tsx`
- `Invoices.tsx`
- `Payments.tsx`
- `Escrow.tsx`
- `Billing.tsx`
- `Referrals.tsx`

**2.2 Normalize root elements**

Convert Fragment roots to consistent `<div className="space-y-6">`:
- `Dashboard.tsx`: Replace `<>...</>` with `<div className="space-y-6">`
- `Maintenance.tsx`: Replace `<>` with single wrapper, move dialog inside
- `MoveOuts.tsx`: Consolidate scattered sections into single `<div className="space-y-6">`, remove the orphaned `<div className="mt-6 mb-6">` for filters

### Phase 3: Extract Shared Components & Hooks

**3.1 Create `src/features/dss/components/TierGate.tsx`**

Extract the duplicated `TierGate` component from DssAdvisor.tsx and MlAnalytics.tsx into a shared feature component:
```
interface TierGateProps {
  feature?: string;
  children: React.ReactNode;
}
```
- Uses `useMerchantTier()` internally
- Renders lock card when access denied
- Renders children when granted

Update DssAdvisor.tsx and MlAnalytics.tsx to import from shared location.

**3.2 Create `src/features/escrow/hooks/useMerchantEscrow.ts`**

Extract from Escrow.tsx:
- All 4 useQuery calls (escrowAccount, allTransactions, merchantData, bankAccount)
- updateSchedule mutation
- requestDisbursement mutation
- Client-side filtering logic
- BankAccount interface

Escrow.tsx becomes a thin UI shell (~150 lines instead of 468).

**3.3 Fix `PageSkeleton.tsx` dynamic grid class**

Replace dynamic Tailwind class with a lookup:
```typescript
const gridCols: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
};
```

### Phase 4: Accessibility Fixes

**4.1 Add aria-labels to icon-only buttons**

- `Dashboard.tsx` refresh button: add `aria-label="Refresh dashboard data"`
- Ensure all pages with icon-only action buttons have descriptive labels

**4.2 Fix heading hierarchy**

- `Billing.tsx`: Change inner `<h2>` to use CardTitle or consistent heading level

### Phase 5: Minor Polish

**5.1 MoveOuts.tsx layout consolidation**

Move all content into a single `<div className="space-y-6">` flow, including stats, filters, tabs, and dialogs.

---

## Files Changed

| File | Action | Changes |
|------|--------|---------|
| `src/shared/components/ui/StatCard.tsx` | Edit | `transition-all` -> `transition-[transform,box-shadow]` |
| `src/shared/components/ui/PageSkeleton.tsx` | Edit | Fix dynamic grid class with lookup map |
| `src/features/dss/components/TierGate.tsx` | New | Shared tier gate component |
| `src/features/escrow/hooks/useMerchantEscrow.ts` | New | Extracted escrow logic hook |
| `src/pages/merchant/Dashboard.tsx` | Edit | Fix Fragment root, `transition-all`, aria-label |
| `src/pages/merchant/Contracts.tsx` | Edit | Remove redundant wrapper div |
| `src/pages/merchant/Invoices.tsx` | Edit | Remove redundant wrapper div |
| `src/pages/merchant/Payments.tsx` | Edit | Remove redundant wrapper div |
| `src/pages/merchant/Escrow.tsx` | Edit | Remove redundant wrapper, fix hardcoded colors, use new hook |
| `src/pages/merchant/Billing.tsx` | Edit | Remove redundant wrapper, fix heading hierarchy |
| `src/pages/merchant/Referrals.tsx` | Edit | Remove redundant wrapper div |
| `src/pages/merchant/Maintenance.tsx` | Edit | Normalize root element |
| `src/pages/merchant/MoveOuts.tsx` | Edit | Consolidate layout into single flow |
| `src/pages/merchant/Reports.tsx` | Edit | Replace hardcoded colors with semantic tokens |
| `src/pages/merchant/DssAdvisor.tsx` | Edit | Replace hardcoded colors, use shared TierGate |
| `src/pages/merchant/MlAnalytics.tsx` | Edit | Replace hardcoded colors, use shared TierGate |
| `src/pages/merchant/OcrTutorial.tsx` | Edit | Fix `transition-all` |
| `src/pages/merchant/PropertyDetail.tsx` | Edit | Fix `transition-all` |

## Implementation Order

1. Shared fixes: StatCard, PageSkeleton, create TierGate
2. Create useMerchantEscrow hook
3. Batch fix: Remove redundant wrappers (Contracts, Invoices, Payments, Billing, Referrals)
4. Batch fix: Normalize roots (Dashboard, Maintenance, MoveOuts)
5. Batch fix: Hardcoded colors (Escrow, Reports, DssAdvisor, MlAnalytics)
6. Batch fix: transition-all violations (Dashboard, OcrTutorial, PropertyDetail)
7. Accessibility pass (aria-labels, heading hierarchy)
