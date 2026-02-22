
# FASE 1 — FOUNDATION (Final Alignment): 3 Remaining Gaps

## Audit Result

Cross-referencing `business-process.md`, `domain-state-machines.md`, and all service files, **almost everything is aligned**. Three small gaps remain:

| # | Service / File | Gap | Fix |
|---|---------------|-----|-----|
| 1 | `vendorService.ts` | `updateVendorStatus()` has `logStatusChange` but **no `isValidTransition`** check against `MERCHANT_VERIFICATION_TRANSITIONS` | Add validation |
| 2 | `escrowService.ts` | `approveDisbursement()` and `rejectDisbursement()` have audit logging but **no `isValidTransition`** against `DISBURSEMENT_STATUS_TRANSITIONS` | Add validation |
| 3 | `state-machines.ts` + `forumModerationService.ts` | Forum Report Moderation state machine (from `business-process.md` Section 3.18.2: `pending -> reviewed -> resolved/action_taken/dismissed`) is **not in centralized constants** and service has **no `isValidTransition`** | Add constant + validation |

Everything else (contract, invoice, payment plan, maintenance, dispute, merchant verification, vendor verification, unit status, referral) is fully aligned.

---

## Implementation Plan (4 Edits)

### Edit 1: `src/shared/constants/state-machines.ts` — Add Forum Report Transitions

Add new constant per `business-process.md` Section 3.18.2:

```typescript
export const FORUM_REPORT_TRANSITIONS: Record<string, string[]> = {
  pending: ['reviewed'],
  reviewed: ['resolved', 'action_taken', 'dismissed'],
  resolved: [],
  action_taken: [],
  dismissed: [],
};
```

### Edit 2: `src/features/users/services/vendorService.ts` — Add `isValidTransition`

- Import `MERCHANT_VERIFICATION_TRANSITIONS`, `isValidTransition` from centralized constants
- In `updateVendorStatus()`: Add `isValidTransition` check before the database update
- Existing `logStatusChange` already handles audit -- no change needed there

### Edit 3: `src/features/escrow/services/escrowService.ts` — Add `isValidTransition`

- Import `DISBURSEMENT_STATUS_TRANSITIONS`, `isValidTransition` from centralized constants
- In `approveDisbursement()`: Fetch current disbursement status, validate transition `pending_review -> approved`
- In `rejectDisbursement()`: Fetch current disbursement status, validate transition `pending_review -> rejected`
- Note: `pending_review` is used in the code (line 104) but not in `DISBURSEMENT_STATUS_TRANSITIONS`. Need to add `pending_review` as alias for `pending` in the transition map, or map it at validation time.

### Edit 4: `src/features/forum/services/forumModerationService.ts` — Add `isValidTransition`

- Import `FORUM_REPORT_TRANSITIONS`, `isValidTransition` from centralized constants
- In `updateReportStatus()`: Fetch current report status, validate transition before update
- Audit logging already handled in the hook (`useForumModeration.ts` line 59) -- no duplication needed

---

## Post-Implementation: Complete Alignment Matrix

| Domain | Constants | Validation | Audit |
|--------|----------|------------|-------|
| Contract | Done | Done | Done |
| Invoice | Done | Done | Done |
| Payment Plan | Done | Done | Done |
| Maintenance | Done | Done | Done |
| Dispute | Done | Done | Done |
| Merchant Verification | Done | Done | Done |
| Vendor Verification | Done | Done | Done |
| Vendor Status (admin) | Done | **Edit 2** | Done |
| Disbursement | Done | **Edit 3** | Done |
| Unit Status | Done | Done | N/A |
| Subscription | Done | N/A (cron) | Done |
| Forum Report | **Edit 1** | **Edit 4** | Done (hook) |

After these 4 edits, **FASE 1 FOUNDATION is 100% complete**.

## Technical Notes

- `DISBURSEMENT_STATUS_TRANSITIONS` currently has `pending` but the code uses `pending_review` as a status. The edit will handle this mapping gracefully (check both `pending` and `pending_review`).
- No database migration needed -- all changes are application-layer only
- All edits are backward compatible
