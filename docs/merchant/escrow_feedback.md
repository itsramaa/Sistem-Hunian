# Merchant Escrow Feedback

## Overview
Comprehensive review of Merchant Escrow Account feature implementation.

## Files Reviewed
- `src/pages/merchant/Escrow.tsx`
- `src/components/merchant/BankAccountManager.tsx`
- `src/components/merchant/DisbursementScheduleSettings.tsx`
- `supabase/functions/xendit-disbursement/index.ts`
- `supabase/functions/scheduled-disbursement/index.ts`

## Issues & Findings

### Bugs & Errors
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| ESC-B01 | Critical | Balance cleared before Xendit confirmation | requestDisbursement | Wait for Xendit success before balance update |
| ESC-B02 | Critical | Non-verified merchant disbursement creates notification with user_id but admin should receive | requestDisbursement | Use admin notification channel |
| ESC-B03 | High | ON_DEMAND_FEE_RATE hardcoded (0.5%) may not match actual Xendit fees | Constants | Fetch from config |
| ESC-B04 | High | Disbursement options show different fees than what may be charged | DISBURSEMENT_OPTIONS | Sync with actual fee structure |
| ESC-B05 | Medium | Single() query for escrow_account may throw if not exists | escrowAccount query | Use maybeSingle() |

### Validations
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| ESC-V01 | High | Minimum disbursement amount from database but not always available | requestDisbursement | Handle missing min_disbursement_amount |
| ESC-V02 | High | No validation that balance hasn't changed during request | requestDisbursement | Add optimistic locking |
| ESC-V03 | Medium | Bank account existence checked but not validated | requestDisbursement | Verify account details |

### UX & Flow Pengguna
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| ESC-U01 | High | No bank account management visible on this page | Escrow.tsx | Add link to add bank account |
| ESC-U02 | Medium | Transaction history limited to 50 without pagination | transactions query | Add pagination/load more |
| ESC-U03 | Medium | No disbursement history separate from transactions | Escrow.tsx | Add disbursement-specific view |
| ESC-U04 | Low | Pending balance explanation brief | Pending Balance card | Add more context |

### Performance
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| ESC-P01 | Medium | Multiple separate queries on page load | Escrow.tsx | Combine or parallelize |
| ESC-P02 | Low | Transaction history re-fetched on each tab view | transactions query | Add proper caching |

### Security
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| ESC-S01 | Critical | Disbursement can be requested without proper bank verification | requestDisbursement | Verify bank account before disbursement |
| ESC-S02 | High | No rate limiting on disbursement requests | requestDisbursement | Add rate limit |
| ESC-S03 | High | Manual review disbursement bypasses Xendit verification | requestDisbursement | Add additional checks |
| ESC-S04 | Medium | Edge function invocation doesn't verify merchant ownership | xendit-disbursement | Add ownership check in function |

### Consistency & Data Integrity
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| ESC-C01 | Critical | Balance updated client-side expectation vs. server reality | requestDisbursement | Use server-only balance updates |
| ESC-C02 | High | Disbursement record created locally but Xendit call separate | requestDisbursement | Atomic transaction |
| ESC-C03 | High | total_disbursed and last_disbursement_date may not sync | merchantData | Update atomically |
| ESC-C04 | Medium | Schedule changes not reflected immediately | updateSchedule | Clarify when new schedule applies |

### Error Handling & Observability
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| ESC-E01 | High | Generic error messages for disbursement failures | requestDisbursement | Provide specific error context |
| ESC-E02 | High | Edge function failure doesn't rollback local state | requestDisbursement | Handle partial failures |
| ESC-E03 | Medium | No transaction status tracking in UI | Transaction table | Add status column |

### Maintainability
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| ESC-M01 | High | Large file (558 lines) with complex logic | Escrow.tsx | Split into components |
| ESC-M02 | Medium | Fee calculation duplicated | Multiple places | Centralize fee logic |
| ESC-M03 | Medium | Disbursement options hardcoded | DISBURSEMENT_OPTIONS | Move to config/database |
| ESC-M04 | Low | Status badge styling inline | getStatusBadge | Use shared component |

### Compatibility & Environment
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| ESC-X01 | Low | Currency formatting locale hardcoded | formatCurrency | Make configurable |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 4 |
| High | 11 |
| Medium | 9 |
| Low | 4 |

## Recommended Actions
1. Implement atomic transactions for disbursement (don't clear balance before confirmation)
2. Add proper bank account verification before allowing disbursement
3. Add rate limiting on disbursement requests
4. Fix notification recipient for manual review disbursements
5. Add optimistic locking for balance updates
6. Centralize fee calculation logic
7. Refactor large component into smaller files
8. Add pagination for transaction history
9. Sync disbursement options with actual fee structure
