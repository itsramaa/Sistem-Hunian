# Merchant Billing Feedback

## Overview
Comprehensive review of Merchant Billing feature implementation.

## Files Reviewed
- `src/pages/merchant/Billing.tsx`
- `src/components/merchant/SubscriptionWidget.tsx`
- `src/components/merchant/SubscriptionPayment.tsx`
- `src/components/merchant/SubscriptionInvoiceHistory.tsx`
- `src/components/merchant/CancelSubscriptionDialog.tsx`
- `supabase/functions/subscription-billing/index.ts`
- `supabase/functions/subscription-payment/index.ts`

## Issues & Findings

### Bugs & Errors
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| BIL-B01 | High | Pending subscription changes not validated against tier limits before applying | PendingSubscriptionChanges | Validate new tier limits against current usage before applying | - |
| BIL-B02 | High | Disbursement settings placed in Billing page, should be in Escrow | Billing.tsx | Move DisbursementScheduleSettings to Escrow page | - |
| BIL-B03 | Medium | No error handling for subscription invoice fetch failures | SubscriptionInvoiceHistory | Add try-catch and display error state | - |

### Validations
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| BIL-V01 | High | No validation for downgrade to tier with lower limits than current usage | SubscriptionPayment | Check if current properties/units exceed new tier limits | ✅ Already implemented |
| BIL-V02 | Medium | No cancellation cooldown period validation | CancelSubscriptionDialog | Add minimum subscription period before cancellation allowed | - |

### UX & Flow Pengguna
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| BIL-U01 | Medium | No visual indication of which tier is currently active | SubscriptionPayment | Highlight current tier in selection | ✅ Already implemented |
| BIL-U02 | Medium | No confirmation before tier upgrade with immediate billing | SubscriptionPayment | Add confirmation dialog with billing preview | ✅ Already implemented |
| BIL-U03 | Low | Invoice history lacks date range filter | SubscriptionInvoiceHistory | Add filter by date range | - |

### Performance
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| BIL-P01 | Medium | Multiple separate queries on billing page load | Billing.tsx | Combine related queries or use parallel loading | - |
| BIL-P02 | Low | No pagination for invoice history | SubscriptionInvoiceHistory | Add pagination for large invoice lists | - |

### Security
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| BIL-S01 | Critical | No merchant ownership verification before subscription changes | subscription-payment | Verify merchant_id matches authenticated user | - |
| BIL-S02 | High | Tier pricing fetched client-side, can be manipulated | SubscriptionPayment | Validate tier price server-side | - |
| BIL-S03 | High | No rate limiting on subscription change requests | Edge functions | Add rate limiting to prevent abuse | - |

### Consistency & Data Integrity
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| BIL-C01 | High | Subscription status changes not atomic with payment processing | subscription-payment | Use database transaction | - |
| BIL-C02 | Medium | Grace period handling inconsistent across components | Multiple | Centralize grace period logic | ✅ Fixed (constants created) |

### Error Handling & Observability
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| BIL-E01 | High | Generic error messages for payment failures | SubscriptionPayment | Provide specific error messages | - |
| BIL-E02 | Medium | No audit logging for subscription changes | Edge functions | Add audit log entries | - |

### Maintainability
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| BIL-M01 | Medium | Subscription status logic duplicated across components | Multiple | Create centralized subscription status hook | ✅ Fixed (constants created) |
| BIL-M02 | Low | Hardcoded status strings throughout | Multiple | Define status enum/constants | ✅ Fixed |

### Compatibility & Environment
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| BIL-X01 | Low | Currency formatting locale hardcoded to 'id-ID' | Multiple | Make locale configurable | - |

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 1 | 0 |
| High | 7 | 1 |
| Medium | 8 | 4 |
| Low | 4 | 1 |

## Recommended Actions
1. Add merchant ownership verification in subscription edge functions
2. ✅ Validate tier limits against current usage before allowing downgrade (already implemented)
3. Implement atomic transactions for subscription changes
4. Add rate limiting on subscription change endpoints
5. Move DisbursementScheduleSettings to appropriate page
6. ✅ Created centralized subscription status constants
