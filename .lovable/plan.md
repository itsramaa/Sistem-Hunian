
# Frontend Audit & Refactor: Contracts, Invoices, Payments

## Audit Findings

### A. Design System Violations (HIGH)

**1. Hardcoded Colors (Forbidden per development-standards Section 4.5)**

| File | Line | Violation | Fix |
|------|------|-----------|-----|
| `InvoicesStats.tsx` | 32 | `text-green-600` | `text-success` |
| `InvoicesStats.tsx` | 40 | `text-yellow-600` | `text-warning` |
| `PaymentsStats.tsx` | 36 | `text-green-600` | `text-success` |
| `PaymentsStats.tsx` | 44 | `text-yellow-600` | `text-warning` |
| `PaymentsStats.tsx` | 52 | `text-red-600` | `text-destructive` |
| `InvoiceDetailsDialog.tsx` | 93 | `text-red-500` | `text-destructive` |
| `OverdueInvoicesTable.tsx` | 34 | `text-green-500` | `text-success` |

**2. Forbidden `transition-all`**

| File | Line | Fix |
|------|------|-----|
| `DocumentLightbox.tsx` | 136 | `transition-[border-color,box-shadow]` |

### B. Stats Components Not Using Shared StatCard (HIGH)

Both `InvoicesStats.tsx` and `PaymentsStats.tsx` use raw `Card/CardHeader/CardContent` with inconsistent styling (no icons, no border-left accent, no hover effects, no count-up animation). The project already has a polished `StatCard` component with all these features. These stats should be refactored to use `StatCard`.

**Current InvoicesStats:** Plain cards, no icons, no accents, no hover
**Current PaymentsStats:** Same issues
**Current ContractStats:** Has icons but still uses raw Card (not StatCard), missing border-left accent and hover

### C. Structural Issues (MEDIUM)

**3. Inconsistent Empty States**

- `ContractsTable.tsx` line 64-69: Basic `<div>` with plain text -- should use shared `EmptyState`
- `InvoicesTable.tsx` line 68-79: Custom empty state (close but not using shared component)
- `PaymentsTable.tsx` line 81-86: Inline empty row in table body
- `OverdueInvoicesTable.tsx` line 30-38: Custom card empty state

All should use the shared `EmptyState` component for consistency.

**4. Inconsistent Loading States**

- `ContractsTable.tsx` line 56-61: `Loader2` spinner (bad)
- `InvoicesTable.tsx` line 58-65: Animated pulse rows (ok but custom)
- `PaymentsTable.tsx` line 53-61: `Loader2` in card with "Loading payments..." text (bad)

All should use skeleton rows consistent with `PageSkeleton` patterns.

**5. Duplicated Pagination Pattern**

All 4 tables (`ContractsTable`, `InvoicesTable`, `PaymentsTable`, `OverdueInvoicesTable`) have identical pagination markup (30+ lines each). This should be extracted to a shared `TablePagination` component.

### D. SRP Violations (MEDIUM)

**6. Invoices.tsx: Inline Handler Logic**

The page has 5 handler functions (`handleCreateInvoice`, `handleSendInvoice`, `handleMarkAsPaid`, `handleSendReminder`, `downloadInvoicePdf`) with try/catch/toast patterns that should be encapsulated. Unlike Contracts.tsx which properly delegates to `useContractActions()`, Invoices.tsx puts all action logic inline.

**7. Duplicated `getStatusColor` function**

`InvoicesTable.tsx` and `InvoiceDetailsDialog.tsx` both define identical `getStatusColor` functions. Should be extracted to a shared utility.

### E. Accessibility Issues (MEDIUM)

**8. Missing aria-labels**

- `ContractsTable.tsx` line 122: icon-only MoreHorizontal button -- has `sr-only` text (good)
- `PaymentsTable.tsx` line 119-128: Bell icon button has `title` but no `aria-label`
- `InvoicesTable.tsx` line 112: icon-only button -- has `sr-only` text (good)

**9. InvoicesFilters.tsx line 33**

SelectTrigger missing `w-full sm:w-[180px]` responsive class (inconsistent with ContractsFilters and PaymentsFilters which have it).

### F. Mixed Language (LOW)

`PaymentPlanDialog.tsx` uses Indonesian for UI text ("Buat Rencana Cicilan", "Hapus Denda Keterlambatan") while all other components use English. Should be consistent.

---

## Refactoring Plan

### Phase 1: Create Shared Utilities

**1.1 Create `src/shared/components/ui/TablePagination.tsx`**

Extract the duplicated pagination block from all 4 tables into a reusable component:
- Props: `page`, `totalPages`, `totalItems`, `itemsPerPage`, `onPageChange`, `itemLabel` (e.g., "contracts", "invoices")
- Includes Previous/Next buttons with ChevronLeft/ChevronRight icons
- Shows "Showing X to Y of Z {itemLabel}" text

**1.2 Create `src/features/payments/utils/statusColors.ts`**

Extract shared status color logic:
- `getInvoiceStatusVariant(status)` -- returns Badge variant
- `getPaymentStatusVariant(status)` -- returns Badge variant
- `getPaymentStatusIcon(status)` -- returns icon component

### Phase 2: Refactor Stats Components to Use StatCard

**2.1 Rewrite `InvoicesStats.tsx`**

Replace raw Card grid with `StatCard` components:
- Total Invoiced: FileText icon, primary accent
- Paid: CheckCircle icon, success accent (`hsl(var(--success))`)
- Pending: Clock icon, warning accent
- Drafts: FileText icon, muted accent

**2.2 Rewrite `PaymentsStats.tsx`**

Replace raw Card grid with `StatCard` components:
- Total Collected: DollarSign icon, success accent
- Pending: Clock icon, warning accent
- Overdue: AlertTriangle icon, destructive accent
- This Month: Calendar icon, primary accent

**2.3 Rewrite `ContractStats.tsx`**

Replace raw Card implementation with `StatCard` components (it already has icons but doesn't use the shared component, missing hover effects and border-left accents):
- Total Contracts: FileText icon, primary accent
- Active: CheckCircle icon, success accent
- Awaiting Signature: PenLine icon, warning accent
- Past Contracts: Users icon, muted accent

### Phase 3: Fix Table Components

**3.1 Update `ContractsTable.tsx`**

- Replace Loader2 spinner with skeleton rows (Skeleton cells matching column layout)
- Replace plain text empty state with shared `EmptyState` component
- Replace inline pagination with `TablePagination`
- Add `aria-label` where missing

**3.2 Update `InvoicesTable.tsx`**

- Replace custom empty state with shared `EmptyState` (with action CTA)
- Replace inline pagination with `TablePagination`
- Remove inline `getStatusColor`, import from shared utility

**3.3 Update `PaymentsTable.tsx`**

- Replace Loader2+text loading with skeleton rows
- Replace inline empty state with shared `EmptyState`
- Replace inline pagination with `TablePagination`
- Add `aria-label="Send payment reminder"` to Bell icon button
- Remove inline `getStatusColor` and `getStatusIcon`, import from shared utility

**3.4 Update `OverdueInvoicesTable.tsx`**

- Replace `text-green-500` with `text-success` in empty state
- Replace inline pagination with `TablePagination`

### Phase 4: Fix Design System Violations

**4.1 Fix hardcoded colors**

All changes listed in Audit Finding A.1 above.

**4.2 Fix `InvoiceDetailsDialog.tsx`**

- Replace `text-red-500` on late fee with `text-destructive`
- Remove duplicate `getStatusColor`, import from shared utility

**4.3 Fix `DocumentLightbox.tsx`**

- Replace `transition-all` with `transition-[border-color,box-shadow]`

### Phase 5: Extract Invoice Actions Hook

**5.1 Create `src/features/payments/hooks/useInvoiceActions.ts`**

Extract from `Invoices.tsx`:
- `handleCreateInvoice` (with toast)
- `handleSendInvoice` (with toast)
- `handleMarkAsPaid` (with toast + close dialog)
- `handleSendReminder` (with toast)
- `downloadInvoicePdf` (with toast + print window)
- All dialog state management (`isCreateOpen`, `viewInvoice`)

This follows the same pattern as `useContractActions.ts` for consistency.

**5.2 Simplify `Invoices.tsx`**

Page becomes a thin UI shell importing from `useInvoiceActions()`, similar to how `Contracts.tsx` imports from `useContractActions()`.

### Phase 6: Minor Fixes

**6.1 Fix `InvoicesFilters.tsx`**

Add `w-full sm:w-[180px]` to SelectTrigger for responsive consistency with other filter components.

**6.2 Normalize `PaymentPlanDialog.tsx` language**

Translate Indonesian UI text to English for consistency with the rest of the codebase (or keep as-is if bilingual is intended -- will check with existing patterns).

---

## Files Summary

### New Files (3)
| File | Description |
|------|-------------|
| `src/shared/components/ui/TablePagination.tsx` | Reusable pagination for all tables |
| `src/features/payments/utils/statusColors.ts` | Shared invoice/payment status utilities |
| `src/features/payments/hooks/useInvoiceActions.ts` | Extracted invoice action handlers + dialog state |

### Updated Files (12)
| File | Changes |
|------|---------|
| `ContractStats.tsx` | Use shared `StatCard` component |
| `InvoicesStats.tsx` | Use shared `StatCard`, fix hardcoded colors |
| `PaymentsStats.tsx` | Use shared `StatCard`, fix hardcoded colors |
| `ContractsTable.tsx` | Skeleton loading, `EmptyState`, `TablePagination` |
| `InvoicesTable.tsx` | `EmptyState`, `TablePagination`, remove duplicate util |
| `PaymentsTable.tsx` | Skeleton loading, `EmptyState`, `TablePagination`, aria-label, remove duplicate util |
| `OverdueInvoicesTable.tsx` | Fix `text-green-500`, `TablePagination` |
| `InvoiceDetailsDialog.tsx` | Fix `text-red-500`, remove duplicate `getStatusColor` |
| `InvoicesFilters.tsx` | Fix responsive SelectTrigger width |
| `DocumentLightbox.tsx` | Fix `transition-all` |
| `Invoices.tsx` | Slim down, use `useInvoiceActions` hook |
| `PaymentPlanDialog.tsx` | Normalize to English language |

## Implementation Order

1. Create `TablePagination` + `statusColors` utility (foundational)
2. Create `useInvoiceActions` hook
3. Rewrite 3 Stats components to use `StatCard`
4. Update 4 table components (loading, empty, pagination, a11y)
5. Fix remaining design system violations (colors, transition, language)
6. Slim down `Invoices.tsx`
