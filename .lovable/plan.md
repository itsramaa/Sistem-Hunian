
# FASE 1 — FOUNDATION: Implementasi State Machine & Audit Trail

## Masalah yang Ditemukan

Setelah audit menyeluruh terhadap codebase vs dokumentasi (PRD, business-process.md, domain-state-machines.md), ditemukan **gap signifikan** antara apa yang didokumentasikan dan apa yang diimplementasikan:

### 1. Contract State Machine — INCOMPLETE

| Aspek | Dokumentasi (domain-state-machines.md) | Implementasi Aktual |
|-------|---------------------------------------|---------------------|
| States | 8 states: draft, pending_signature, active, notice, terminated, expired, completed, cancelled | `CONTRACT_STATUS_TRANSITIONS` hanya punya 3 non-terminal states (pending, active) — MISSING draft, pending_signature, notice, completed |
| Transition validation | Wajib di service layer | `contractService.updateContractStatus()` TIDAK ada validasi — menerima status apapun |
| Audit logging | Wajib via `logStatusChange()` | TIDAK ada audit log di contract service |
| UI Badge | Harus cover semua 8 states | `ContractStatusBadge` hanya cover 4 states (active, notice, expired, terminated) — MISSING draft, pending_signature, completed, cancelled |

### 2. Invoice State Machine — INCONSISTENT

| Aspek | Dokumentasi | Implementasi |
|-------|-------------|--------------|
| Transitions dari draft | draft -> sent, cancelled | `merchant-validations.ts`: draft -> pending, cancelled (KONFLIK) |
| Transitions dari sent | sent -> paid, overdue, cancelled, partially_paid | `merchantInvoiceService.ts`: sent -> paid, overdue, cancelled (MISSING partially_paid) |
| `partially_paid` state | Didokumentasikan di state machine | Ada di type definition tapi TIDAK ada di transition maps |

### 3. Maintenance State Machine — MISSING STATES

| Aspek | Dokumentasi | Implementasi |
|-------|-------------|--------------|
| States | pending, acknowledged, in_progress, completed, cancelled | `UpdateMaintenanceDialog`: MISSING `acknowledged` state |
| `MAINTENANCE_STATUS_TRANSITIONS` | Termasuk acknowledged | Dialog component SKIP acknowledged |

### 4. Audit Trail — INCONSISTENT COVERAGE

| Service | Audit Log? | Notes |
|---------|-----------|-------|
| `contractService` | NO | Tidak ada `createAuditLog` atau `logStatusChange` |
| `merchantInvoiceService` | NO | Tidak ada audit log untuk status changes |
| `escrowService` | YES | Properly audited |
| `disputesService` | YES | Uses `logStatusChange` |
| `subscriptionService` | YES | Uses `createAuditLog` |

### 5. `AuditEntityType` — MISSING TYPES

Current `AuditEntityType` TIDAK include: `contract`, `invoice`, `payment`, `maintenance`, `property`, `unit`, `tenant`, `order` — hanya 16 types yang ada.

---

## Rencana Implementasi (7 Tasks)

### Task 1: Centralized State Machine Constants

Buat satu file `src/shared/constants/state-machines.ts` yang menjadi **single source of truth** untuk semua transition maps, aligned 100% dengan `domain-state-machines.md`.

**File baru:** `src/shared/constants/state-machines.ts`

```
- CONTRACT_STATUS_TRANSITIONS (8 states, sesuai docs)
- CONTRACT_SIGNATURE_TRANSITIONS (5 states)
- INVOICE_STATUS_TRANSITIONS (7 states, termasuk partially_paid)
- PAYMENT_STATUS_TRANSITIONS (5 states)
- PAYMENT_PLAN_STATUS_TRANSITIONS (6 states)
- MAINTENANCE_STATUS_TRANSITIONS (5 states, termasuk acknowledged)
- SUBSCRIPTION_STATUS_TRANSITIONS (5 states)
- ORDER_STATUS_TRANSITIONS (5 states)
- DISBURSEMENT_STATUS_TRANSITIONS (6 states)
- MOVE_OUT_NOTICE_TRANSITIONS (5 states)
- DISPUTE_STATUS_TRANSITIONS (4 states)
- DEPOSIT_REFUND_TRANSITIONS (5 states)
- REFERRAL_STATUS_TRANSITIONS (4 states)
- UNIT_STATUS_TRANSITIONS (3 states)
```

Plus helper function `isValidTransition(map, currentStatus, newStatus)` yang reusable.

### Task 2: Expand AuditEntityType & AuditAction

Update `src/shared/utils/auditLog.ts`:
- Add entity types: `contract`, `invoice`, `payment`, `maintenance`, `property`, `unit`, `tenant`, `order`, `payment_plan`, `move_out_notice`, `deposit_refund`, `notification`
- Add actions: `sign`, `send`, `cancel`, `complete`, `acknowledge`, `assign`, `escalate`

### Task 3: Fix Contract Service — Add Transition Validation & Audit

Update `src/features/contracts/services/contractService.ts`:
- Import centralized `CONTRACT_STATUS_TRANSITIONS`
- Add validation to `updateContractStatus()` — reject invalid transitions
- Add `logStatusChange()` calls to: `updateContractStatus`, `merchantSignContract`, `deleteContract`
- Add side-effect documentation (unit status update is handled by DB trigger, so no code change needed there)

### Task 4: Fix Contract UI — Badge & Transition Map

- Update `ContractStatusBadge.tsx` — add missing states: `draft` (gray), `pending_signature` (blue), `completed` (green variant), `cancelled` (red)
- Update `CONTRACT_STATUS_TRANSITIONS` in `merchant-validations.ts` to import from centralized constants
- Align with domain-state-machines.md states

### Task 5: Fix Invoice State Machine — Reconcile Inconsistencies

- Update `INVOICE_STATUS_TRANSITIONS` in `merchant-validations.ts` to match docs:
  - `draft` -> `['sent', 'cancelled']` (NOT `['pending', 'cancelled']`)
  - `sent` -> `['paid', 'overdue', 'cancelled', 'partially_paid']`
  - Add `partially_paid` -> `['paid', 'cancelled']`
- Update `merchantInvoiceService.ts` `markAsPaid` to use centralized transitions
- Add `logStatusChange()` to `sendInvoice`, `markAsPaid`, `createInvoice`

### Task 6: Fix Maintenance State Machine — Add Acknowledged State

- Update `MAINTENANCE_STATUS_TRANSITIONS` in `merchant-validations.ts` to import from centralized constants
- Update `UpdateMaintenanceDialog.tsx` transition map: add `acknowledged` state between `pending` and `in_progress`
- Ensure `pending` -> `['acknowledged', 'cancelled']`, `acknowledged` -> `['in_progress', 'cancelled']`

### Task 7: Remove Duplicate Transition Maps & Wire Centralized Constants

- Remove inline `VALID_STATUS_TRANSITIONS` from `merchantInvoiceService.ts` (use import)
- Remove inline `VALID_STATUS_TRANSITIONS` from `UpdateMaintenanceDialog.tsx` (use import)
- Remove duplicate maps from `merchant-validations.ts` and `vendor-validations.ts` (re-export from centralized)
- Ensure all 4 files import from `src/shared/constants/state-machines.ts`

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/shared/constants/state-machines.ts` | CREATE | Centralized state machine constants (14 transition maps + helper) |
| `src/shared/utils/auditLog.ts` | EDIT | Expand AuditEntityType (+12 types) and AuditAction (+7 actions) |
| `src/features/contracts/services/contractService.ts` | EDIT | Add transition validation + audit logging |
| `src/features/contracts/components/ContractStatusBadge.tsx` | EDIT | Add 4 missing states |
| `src/features/users/utils/merchant-validations.ts` | EDIT | Replace inline transitions with centralized imports |
| `src/features/users/utils/vendor-validations.ts` | EDIT | Replace inline transitions with centralized imports |
| `src/features/payments/services/merchantInvoiceService.ts` | EDIT | Use centralized transitions + add audit logging |
| `src/features/maintenance/components/UpdateMaintenanceDialog.tsx` | EDIT | Use centralized transitions, add acknowledged state |

## Technical Notes

- **No DB migration needed** — semua status columns sudah `text` type (bukan enum), jadi penambahan states di application layer cukup
- **DB trigger `update_unit_status_on_contract_sign()`** sudah handle side-effect unit status pada contract signing — tidak perlu diubah
- **DB trigger `generate_invoice_number()`** sudah handle auto-generation — tidak perlu diubah
- **Backward compatible** — semua perubahan additive, tidak mengubah existing valid transitions
- **`isValidTransition()` helper** akan throw descriptive error saat invalid transition terjadi, membantu debugging

## Alignment Verification

Setelah implementasi, setiap state machine di codebase akan 1:1 match dengan:
- `docs/domain-state-machines.md` Section 2-19
- `docs/business-process.md` Section 3.x state diagrams
- `docs/PRD_DSS_Manajemen_Kosan_v2_Professional.md` business process references
