

# Priority 1 & 2: Reduce Core Workflows + Simplify Financial Control

## Overview

Two simplification efforts:
1. **Reduce Core Workflows** -- Consolidate 56 merchant pages into a clear 7-8 core workflow structure with guided navigation
2. **Simplify Financial Control** -- Build a unified Financial Control Dashboard showing cash balance, receivables, payables, pending approvals, and latest transactions with clear approval status

## Current State Assessment

### Navigation Complexity
The merchant sidebar has **4 groups** with **28 nav items** across 56 pages. A pemilik kosan with 20 units doesn't need to navigate 28 different menu items daily. The goal is NOT to delete pages, but to restructure navigation so daily workflows are obvious and advanced features are discoverable but not overwhelming.

### Financial Control Gap
Currently:
- Financial Reports page shows P&L, revenue by property, expense by category -- but NO cash balance, receivables, or payables summary
- Expenses have approval workflow (>=500K needs approval) but there's no unified "pending approvals" view
- Deposit refunds, move-out notices also have `pending_approval` status but are in separate pages
- No single place to see "what needs my approval today" across all transaction types

---

## Implementation Plan

### 1A: Simplified Navigation Structure

Restructure merchant nav from 4 groups / 28 items to a focused layout:

**NEW NAVIGATION (3 groups, 13 primary items):**

| Group | Items | Covers |
|-------|-------|--------|
| **Utama** | Dashboard, Properti, Papan Okupansi | Same as now |
| **Operasional** | Penyewa, Kontrak, Maintenance, Daftar Tunggu | Consolidate: tenants + screening + analytics into "Penyewa"; contracts + renewals into "Kontrak"; maintenance + preventive into "Maintenance" |
| **Keuangan** | Kontrol Keuangan (NEW), Tagihan, Pembayaran, Pengeluaran, Lap. Keuangan | New unified financial control; remove separate collections/reconciliation/utility/dynamic-pricing from top nav |

**Secondary items (moved to "Lainnya" collapsible group):**
- Inventori, Penjaga, Performa Vendor, Utilitas, Penagihan, Resolusi & Rekonsiliasi, Harga Dinamis, Laporan, Template Dokumen, Alat, API & Integrasi, Manajemen Staff

This reduces visible nav from 28 to ~13 primary + collapsible advanced section.

### 1B: Navigation Config Changes

Modify `src/shared/components/layouts/navigation-config.ts`:
- Restructure merchant `mainNav` groups
- Add a "Lainnya" group for advanced/secondary features
- Keep all routes functional -- just reorganize navigation hierarchy

### 2A: Financial Control Dashboard (NEW Page)

Create `src/pages/merchant/FinancialControl.tsx` -- the single "command center" for all financial approvals and status:

**Layout:**
```text
+------------------+------------------+------------------+------------------+
| Saldo Kas        | Piutang          | Hutang           | Menunggu Approve |
| Rp X.XXX.XXX     | Rp X.XXX.XXX     | Rp X.XXX.XXX     | X item           |
| (paid invoices    | (unpaid invoices | (pending expenses| (across all      |
|  - expenses)      |  outstanding)    |  + refunds)      |  types)          |
+------------------+------------------+------------------+------------------+

+------------------------------------------------------------------+
| Perlu Persetujuan Anda                                            |
| [Expense] Rp 750.000 - AC Repair - 27 Feb     [Approve] [Reject] |
| [Deposit] Rp 2.000.000 - Unit B3 Move-Out     [Approve] [Reject] |
| [Move-Out] Unit A5 - Notice by Tenant          [Approve] [Reject] |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
| 10 Transaksi Terakhir                                             |
| 27 Feb | Payment  | Rp 1.500.000 | Unit A1 | Approved  | green   |
| 26 Feb | Expense  | Rp 350.000   | Plumber | Auto-OK   | green   |
| 25 Feb | Refund   | Rp 1.000.000 | Unit B3 | Pending   | yellow  |
+------------------------------------------------------------------+
```

**Data sources:**
- **Cash Balance**: Sum of paid invoices (revenue) minus sum of approved expenses = net cash (from `financialReportService` pattern)
- **Receivables**: Sum of unpaid invoices (`status IN ('pending', 'overdue')`)
- **Payables**: Sum of pending expenses + pending deposit refunds
- **Pending Approvals**: Aggregate from 3 sources:
  1. `expenses` where `approval_status = 'pending_approval'`
  2. `deposit_refunds` where `status = 'pending_processing'`
  3. `move_out_notices` where `status = 'pending_approval'`
- **Latest Transactions**: Union of recent payments, expenses, deposit refunds with approval status badge
- **Inline Actions**: Approve/Reject buttons for each pending item, calling existing service methods

### 2B: Financial Control Service

Create `src/features/finance/services/financialControlService.ts`:
- `fetchFinancialControlData(merchantId)` -- single function returning:
  - `cashBalance`: revenue (paid invoices) minus expenses (approved)
  - `receivables`: sum of unpaid invoices
  - `payables`: sum of pending expenses + pending refunds
  - `pendingApprovals`: array of items needing approval (type, id, amount, description, date)
  - `recentTransactions`: latest 10 transactions across types with approval status

### 2C: Financial Control Hook

Create `src/features/finance/hooks/useFinancialControl.ts`:
- TanStack Query hook for `fetchFinancialControlData`
- Mutation hooks for approve/reject actions (reuse existing `expenseService.approveExpense`, deposit refund approve, move-out approve)

### 2D: Approval Rules Documentation

Codify and display the approval rules clearly on the Financial Control page:
- **Auto-approved**: Payments from Xendit gateway, expenses below Rp 500.000, scheduled recurring invoices
- **Mandatory owner approval**: Expenses >= Rp 500.000, deposit refunds, move-out notices, damage claims
- Display these rules as an info tooltip or collapsible section so the owner understands the system

### 2E: Route & Navigation Registration

- Add `/merchant/financial-control` route in `App.tsx`
- Add "Kontrol Keuangan" as the first item in the Keuangan nav group with `Shield` icon
- Register in navigation config

### 2F: Update Audit Report

Update `old-docs/PMS_Audit_Report_FULL.md`:
- Mark Priority 1 (Reduce Core Workflows) with status per sub-item
- Mark Priority 2 (Simplify Financial Control) with status per sub-item:
  - Mandatory owner approval: COMPLETE (already exists for expenses, deposit refunds, move-outs)
  - Auto-approve: COMPLETE (expenses < 500K, Xendit gateway payments)
  - Dashboard showing cash balance, receivables, payables, latest 10 transactions: COMPLETE

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| CREATE | `src/features/finance/services/financialControlService.ts` | Unified financial control data fetcher |
| CREATE | `src/features/finance/hooks/useFinancialControl.ts` | TanStack Query hooks for financial control |
| CREATE | `src/pages/merchant/FinancialControl.tsx` | Financial Control Dashboard page |
| MODIFY | `src/shared/components/layouts/navigation-config.ts` | Restructure merchant nav to 3 groups + Lainnya |
| MODIFY | `src/App.tsx` | Add /merchant/financial-control route |
| MODIFY | `old-docs/PMS_Audit_Report_FULL.md` | Mark Priority 1 + 2 status |

## Technical Notes

- No new database tables needed -- all data comes from existing `invoices`, `expenses`, `deposit_refunds`, `move_out_notices` tables
- Approval actions reuse existing service methods (`expenseService.approveExpense`, etc.)
- Cash balance is a derived metric (revenue minus expenses), not stored separately
- Navigation restructuring preserves ALL existing routes -- just reorganizes the sidebar hierarchy
- "Lainnya" group uses existing `Collapsible` pattern for show/hide
- Financial Control page queries are scoped by `merchant_id` via existing RLS policies

