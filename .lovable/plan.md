
# FASE 1 — FOUNDATION (Lanjutan): Remaining State Machine & Audit Gaps

## Status Implementasi Sebelumnya

Sudah selesai (round sebelumnya):
- Centralized `state-machines.ts` dengan 20 transition maps + helpers
- `auditLog.ts` expanded (29 actions, 28 entity types)
- `contractService.ts` — transition validation + audit
- `ContractStatusBadge.tsx` — 8 states
- `merchantInvoiceService.ts` — transition validation + audit
- `merchant-validations.ts` + `vendor-validations.ts` — centralized imports
- `UpdateMaintenanceDialog.tsx` — centralized imports

## Remaining Gaps (5 Services)

| # | Service | Gap | Fix |
|---|---------|-----|-----|
| 1 | `paymentPlanService.ts` | No transition validation, no audit logging. `acceptPaymentPlan` hardcodes `'active'` (should be `pending_acceptance` -> `accepted` -> `active`). `declinePaymentPlan` hardcodes `'cancelled'`. | Add validation + audit |
| 2 | `adminTenantService.ts` | `updateTenantStatus()` updates contracts with NO validation, NO audit. `getTenantStats()` references `'evicted'` (not a valid contract state). | Add validation + audit, remove `'evicted'` |
| 3 | `merchantTenantService.ts` | `terminateContract()` — no transition validation (hardcodes `'terminated'`), no audit. `cancelInvitation()` — no audit. | Add validation + audit |
| 4 | `maintenanceService.ts` | `updateStatus()` — no centralized transition validation (accepts any status), no audit_logs (only timeline). `cancelRequest()` — no audit_logs. | Add `isValidTransition` + audit |
| 5 | `disputesService.ts` | Has `logStatusChange` but no `isValidTransition` check against `DISPUTE_STATUS_TRANSITIONS`. | Add validation |

## Implementation Plan (5 Edits)

### Edit 1: `src/features/payments/services/paymentPlanService.ts`

- Import `PAYMENT_PLAN_STATUS_TRANSITIONS`, `isValidTransition` from centralized constants
- Import `logStatusChange`, `createAuditLog` from auditLog
- `acceptPaymentPlan()`: Fetch current status, validate `pending_acceptance` -> `active` transition, add audit log
- `declinePaymentPlan()`: Fetch current status, validate transition to `cancelled`, add audit log
- `createPaymentPlan()`: Add `createAuditLog` for creation

### Edit 2: `src/features/users/services/adminTenantService.ts`

- Import `CONTRACT_STATUS_TRANSITIONS`, `isValidTransition` from centralized constants
- Import `logStatusChange` from auditLog
- `updateTenantStatus()`: Fetch current contract status, validate transition, add audit log
- `getTenantStats()`: Remove `'evicted'` from status filter (not a valid state) -- replace with `['terminated', 'expired', 'cancelled']`

### Edit 3: `src/features/users/services/merchantTenantService.ts`

- Import `CONTRACT_STATUS_TRANSITIONS`, `isValidTransition` from centralized constants
- Import `logStatusChange`, `createAuditLog` from auditLog
- `terminateContract()`: Validate current status allows transition to `'terminated'`, add audit log
- `cancelInvitation()`: Add `createAuditLog` call

### Edit 4: `src/features/maintenance/services/maintenanceService.ts`

- Import `MAINTENANCE_STATUS_TRANSITIONS`, `isValidTransition` from centralized constants
- Import `logStatusChange` from auditLog
- `updateStatus()`: Add `isValidTransition` check before updating, add `logStatusChange` after update
- `cancelRequest()`: Add `logStatusChange` after cancel

### Edit 5: `src/features/disputes/services/disputesService.ts`

- Import `DISPUTE_STATUS_TRANSITIONS`, `isValidTransition` from centralized constants
- `resolveDispute()`: Add `isValidTransition` check before updating

## Post-Implementation Verification

After these 5 edits, every service that performs a status change will:
1. Validate the transition against centralized `state-machines.ts`
2. Log the change via `createAuditLog` or `logStatusChange`

Full alignment matrix:

| Domain | Centralized Constants | Transition Validation | Audit Log |
|--------|----------------------|----------------------|-----------|
| Contract | Done | Done | Done |
| Invoice | Done | Done | Done |
| Payment Plan | Done (constants exist) | **Edit 1** | **Edit 1** |
| Maintenance | Done | **Edit 4** | **Edit 4** |
| Dispute | Done | **Edit 5** | Already done |
| Subscription | Done | N/A (tier changes, not status transitions) | Already done |
| Escrow/Disbursement | Done | N/A (edge function driven) | Already done |
| Admin Contract Updates | Done (constants exist) | **Edit 2** | **Edit 2** |
| Merchant Contract Terminate | Done (constants exist) | **Edit 3** | **Edit 3** |

## Technical Notes

- No database changes needed
- All edits are additive (backward compatible)
- `'evicted'` is not a valid contract state per `domain-state-machines.md` -- removing from `adminTenantService`
- `paymentPlanService.acceptPaymentPlan` currently goes directly to `'active'`, but per state machine it should be `pending_acceptance` -> `accepted` -> `active`. Since the UI combines accept+activate in one action, we validate against `PAYMENT_PLAN_STATUS_TRANSITIONS` allowing the current status to transition to `'active'` (via `accepted` as intermediate if needed, or we accept that the UI flow does `pending_acceptance -> active` as a shortcut and add `active` to allowed transitions from `pending_acceptance`)
