# Merchant Payments Feedback

## Overview
Comprehensive review of Merchant Payments Management feature implementation.

## Files Reviewed
- `src/pages/merchant/Payments.tsx`
- `src/components/merchant/PaymentPlanDialog.tsx`
- `supabase/functions/send-payment-reminder/index.ts`
- `supabase/functions/check-overdue-escalation/index.ts`

## Issues & Findings

### Bugs & Errors
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| PAY-B01 | Critical | Manual payment marking doesn't create escrow transaction | markPaidMutation | Create corresponding escrow entry | - |
| PAY-B02 | High | Overdue invoices fetched but no automatic overdue marking | overdueInvoices query | Implement overdue status auto-update | - |
| PAY-B03 | High | Bulk reminder sends to check-overdue-escalation without proper scope | sendBulkReminderMutation | Use proper merchant-scoped endpoint | - |
| PAY-B04 | Medium | Payment plan creation not validated against tenant's payment history | PaymentPlanDialog | Check tenant creditworthiness | - |
| PAY-B05 | Medium | Days overdue calculation using client time | Overdue tab | Calculate server-side | - |

### Validations
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| PAY-V01 | High | Reference field has no validation/sanitization | Mark Paid dialog | Add input validation | ✅ Fixed |
| PAY-V02 | High | Payment method selection not validated | Mark Paid dialog | Ensure valid payment method selected | ✅ Fixed |
| PAY-V03 | Medium | No validation for payment amount matching invoice | markPaidMutation | Verify amount matches expected | - |

### UX & Flow Pengguna
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| PAY-U01 | High | No payment history per tenant view | Payments.tsx | Add tenant payment history | - |
| PAY-U02 | Medium | Overdue badge counter doesn't stand out enough | Tabs | Use more prominent styling | - |
| PAY-U03 | Medium | No export functionality for payment reports | Payments.tsx | Add CSV/PDF export | - |
| PAY-U04 | Low | Payment type not human-readable | Table | Add type labels | - |

### Performance
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| PAY-P01 | Medium | No pagination for payment list (551 lines file) | payments query | Add pagination | - |
| PAY-P02 | Medium | Stats calculated client-side | stats object | Use database aggregation | - |
| PAY-P03 | Medium | Multiple separate queries on page load | Payments.tsx | Combine related queries | - |

### Security
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| PAY-S01 | Critical | Edge function calls without authentication headers | sendReminderMutation | Add auth token to requests | - |
| PAY-S02 | High | No verification that merchant owns payment | markPaidMutation | Add ownership check | ✅ Fixed |
| PAY-S03 | High | SUPABASE_URL used directly for edge function calls | Payments.tsx | Consider edge function RLS | - |
| PAY-S04 | Medium | Payment method/reference visible to merchant | Table | May expose tenant PII | - |

### Consistency & Data Integrity
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| PAY-C01 | Critical | Payment marked paid without invoice status update | markPaidMutation | Update related invoice atomically | - |
| PAY-C02 | High | No payment record linked to invoice when manually marked | markPaidMutation | Create proper payment linkage | - |
| PAY-C03 | High | Escrow balance not updated on manual payment | markPaidMutation | Trigger escrow flow | - |
| PAY-C04 | Medium | Payment status can be stuck if reminder fails | sendReminderMutation | Handle partial failures | - |

### Error Handling & Observability
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| PAY-E01 | High | Bulk reminder errors show generic message | sendBulkReminderMutation | Show specific failure count | ✅ Fixed |
| PAY-E02 | Medium | Individual reminder failures not tracked | sendReminderMutation | Add failure indicator per row | - |
| PAY-E03 | Low | No retry mechanism for failed reminders | sendReminderMutation | Add retry capability | - |

### Maintainability
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| PAY-M01 | High | Large file (551 lines) with mixed concerns | Payments.tsx | Split into smaller components | - |
| PAY-M02 | Medium | Payment and OverdueInvoice types defined locally | Payments.tsx | Move to shared types | - |
| PAY-M03 | Medium | Status icon/color logic duplicated | getStatusIcon, getStatusColor | Create reusable component | - |

### Compatibility & Environment
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| PAY-X01 | Low | Date formatting locale hardcoded | format calls | Make configurable | - |

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 3 | 0 |
| High | 11 | 4 |
| Medium | 12 | 0 |
| Low | 3 | 0 |

## Recommended Actions
1. Implement atomic updates: payment → invoice → escrow
2. Add authentication headers to edge function calls
3. Create proper payment-invoice-escrow linkage on manual marking
4. Refactor large component into smaller focused files
5. Add pagination for payment list
6. Implement payment history per tenant view
7. Add export functionality for reports
8. ✅ Validate payment method and reference input
9. ✅ Show specific failure count for bulk reminders
