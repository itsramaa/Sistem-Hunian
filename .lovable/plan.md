
# FASE 1 — FOUNDATION (Final Round): Remaining Gaps

## Audit Summary

After thorough review, **most services are now aligned**. Three services still have gaps:

| # | Service | Gap |
|---|---------|-----|
| 1 | `merchantService.ts` | Uses **inline** `supabase.from('audit_logs').insert()` instead of `createAuditLog()`. Action values like `'verification_approved'`, `'merchant_suspended'` don't match `AuditAction` type. No `isValidTransition` for `VERIFICATION_STATUS_TRANSITIONS`. |
| 2 | `vendorVerificationService.ts` | Updates `verification_status` to `'verified'` with **no validation** against `VERIFICATION_STATUS_TRANSITIONS` and **no audit log**. |
| 3 | `merchantTenantService.ts` | `terminateContract()` updates unit status to `'available'` **without validating** against `UNIT_STATUS_TRANSITIONS`. |

Everything else (contract, invoice, payment plan, maintenance, dispute services + all UI components) is fully aligned.

---

## Implementation Plan (3 Edits)

### Edit 1: `merchantService.ts` — Migrate to `createAuditLog` + Add Validation

- Import `VERIFICATION_STATUS_TRANSITIONS`, `isValidTransition` from centralized constants
- Import `createAuditLog`, `logStatusChange` from auditLog
- **`updateMerchantStatus()`** (line ~138): Add `isValidTransition` check before updating `verification_status`. Replace inline `supabase.from('audit_logs').insert()` with `createAuditLog()` using proper `AuditAction` values (`'approve'`/`'reject'`)
- **`suspendMerchant()`** (line ~202): Add `isValidTransition` check. Replace inline audit insert with `logStatusChange()` using `'suspend'`/`'reactivate'` actions
- **`bulkApprove()`** (line ~237): Replace inline audit insert with loop of `createAuditLog()` calls using `'bulk_approve'` action

### Edit 2: `vendorVerificationService.ts` — Add Validation + Audit

- Import `VERIFICATION_STATUS_TRANSITIONS`, `isValidTransition` from centralized constants
- Import `logStatusChange` from auditLog
- **`updateVerification()`**: Add `logStatusChange` after status update
- **`updateVendorStatusIfVerified()`**: Add `isValidTransition` check before updating vendor status. Add `logStatusChange` after update

### Edit 3: `merchantTenantService.ts` — Add Unit Status Validation

- Import `UNIT_STATUS_TRANSITIONS` from centralized constants
- **`terminateContract()`** (line ~184): Add `isValidTransition(UNIT_STATUS_TRANSITIONS, currentUnitStatus, 'available')` check before updating unit. Fetch current unit status first.

---

## Post-Implementation: Full Alignment Matrix

| Domain | Centralized Constants | Transition Validation | Audit via `createAuditLog`/`logStatusChange` |
|--------|----------------------|----------------------|---------------------------------------------|
| Contract | Done | Done | Done |
| Invoice | Done | Done | Done |
| Payment Plan | Done | Done | Done |
| Maintenance | Done | Done | Done |
| Dispute | Done | Done | Done |
| Merchant Verification | Done | **Edit 1** | **Edit 1** |
| Vendor Verification | Done | **Edit 2** | **Edit 2** |
| Unit Status (on terminate) | Done | **Edit 3** | N/A (side-effect) |
| Subscription | Done | N/A | Done |
| Escrow/Disbursement | Done | N/A (edge function) | Done |

After these 3 edits, **FASE 1 FOUNDATION is complete** — every status change in the codebase validates against centralized state machines and logs via the audit utility.
