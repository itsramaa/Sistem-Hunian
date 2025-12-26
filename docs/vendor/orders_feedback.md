# Vendor Orders Feedback

## Bugs & Errors
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| ✅ Critical | Wrong fee percentage | `Orders.tsx:121` | Uses 10% platform fee but Jobs uses 5% | Fixed |
| Critical | vendor_job_id misuse | `Orders.tsx:126` | Uses order ID as vendor_job_id, incorrect foreign key | Open |
| Warning | Referral processing silent failure | `Orders.tsx:133-139` | Referral errors logged but not handled | Open |
| Warning | Race condition on tenant profile | `Orders.tsx:165-169` | Profile fetch happens after dialog opens | Open |
| Info | Order type missing relationships | `Orders.tsx:30-52` | Type doesn't include all possible relationships | Open |

## Validations
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| ✅ Warning | No cancel reason validation | `Orders.tsx:104-107` | Can cancel with empty reason | Fixed |
| Warning | Missing status validation | `Orders.tsx:99-113` | Any status update accepted without validation | Open |
| Info | No order amount validation | `Orders.tsx:119` | Earnings created without amount validation | Open |

## UX & Flow Pengguna
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| ✅ Critical | No status update feedback | `Orders.tsx:499-509` | Status buttons in dialog, not clearly actionable | Fixed |
| Warning | Dialog closes on success | `Orders.tsx:146` | User loses context after update | Open |
| Warning | No order search | `Orders.tsx` | Cannot search by order number or customer | Open |
| Warning | Tenant info async load | `Orders.tsx:417-434` | Customer info loads after dialog opens | Open |
| Info | No bulk actions | `Orders.tsx` | Cannot bulk confirm pending orders | Open |
| Info | Missing delivery tracking | `Orders.tsx` | No delivery status tracking | Open |

## Performance
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Warning | No pagination | `Orders.tsx:79-95` | All orders fetched without limit | Open |
| Warning | Sequential profile fetch | `Orders.tsx:156-163` | Profile fetched separately for each order view | Open |
| Warning | Client-side filtering | `Orders.tsx:189-192` | Status filtering done on client | Open |
| Info | Duplicate stats calculation | `Orders.tsx:194-201` | Stats recalculated on every render | Open |

## Security
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| ✅ Warning | Customer PII exposure | `Orders.tsx:424-430` | Full email and phone visible | Fixed |
| Warning | No rate limiting | `Orders.tsx` | Rapid order updates not prevented | Open |
| Info | Order history visible | `Orders.tsx` | All cancelled orders with reasons visible | Open |

## Consistency & Data Integrity
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| ✅ Critical | Inconsistent fee percentage | `Orders.tsx:121` | 10% here vs 5% in Jobs.tsx | Fixed |
| ✅ Warning | Status flow not enforced | `Orders.tsx:179-187` | getNextStatus exists but not strictly enforced | Fixed |
| Warning | Missing completed_at on some paths | `Orders.tsx:101-103` | Only set if status is 'completed' | Open |
| Info | Hardcoded status colors | `Orders.tsx:60-67` | Colors should match design system | Open |

## Error Handling & Observability
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Warning | Generic error toast | `Orders.tsx:150-152` | "Failed to update order" without context | Open |
| Warning | No retry mechanism | `Orders.tsx` | Failed mutations cannot be retried | Open |
| Info | Referral errors logged only | `Orders.tsx:137-138` | Referral failures not tracked | Open |

## Maintainability
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Warning | Large file size | `Orders.tsx` | 555 lines, should be split | Open |
| Warning | Inline mutation logic | `Orders.tsx:98-142` | Complex business logic in component | Open |
| Warning | Duplicated table component | `Orders.tsx:203-264` | OrdersTable could be extracted | Open |
| ✅ Info | Hardcoded status config | `Orders.tsx:60-67` | Status config should be shared | Fixed |

## Compatibility & Environment
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Warning | Direct color classes | `Orders.tsx:60-67` | Uses `bg-yellow-100` instead of design tokens | Open |
| Info | Mobile table overflow | `Orders.tsx:203-264` | Table may overflow on mobile | Open |

## Summary
| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 4 | 3 |
| Warning | 17 | 4 |
| Info | 10 | 1 |

## Recommended Actions (Completed)
1. ✅ Fix fee percentage to be consistent (5%) across all vendor modules
2. ✅ Implement proper status transition enforcement
3. ✅ Mask customer PII (show only necessary info, email/phone masked)
4. ✅ Add cancel reason validation (min 10 characters)
5. ✅ Add confirmation dialog for status changes

## Remaining Actions
1. Fix vendor_job_id to use proper reference, not order ID
2. Add pagination and server-side filtering
3. Split large file into smaller components
4. Use design system tokens for status colors
