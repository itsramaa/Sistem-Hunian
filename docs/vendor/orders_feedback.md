# Vendor Orders Feedback

## Bugs & Errors
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Critical | Wrong fee percentage | `Orders.tsx:121` | Uses 10% platform fee but Jobs uses 5% |
| Critical | vendor_job_id misuse | `Orders.tsx:126` | Uses order ID as vendor_job_id, incorrect foreign key |
| Warning | Referral processing silent failure | `Orders.tsx:133-139` | Referral errors logged but not handled |
| Warning | Race condition on tenant profile | `Orders.tsx:165-169` | Profile fetch happens after dialog opens |
| Info | Order type missing relationships | `Orders.tsx:30-52` | Type doesn't include all possible relationships |

## Validations
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | No cancel reason validation | `Orders.tsx:104-107` | Can cancel with empty reason |
| Warning | Missing status validation | `Orders.tsx:99-113` | Any status update accepted without validation |
| Info | No order amount validation | `Orders.tsx:119` | Earnings created without amount validation |

## UX & Flow Pengguna
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Critical | No status update feedback | `Orders.tsx:499-509` | Status buttons in dialog, not clearly actionable |
| Warning | Dialog closes on success | `Orders.tsx:146` | User loses context after update |
| Warning | No order search | `Orders.tsx` | Cannot search by order number or customer |
| Warning | Tenant info async load | `Orders.tsx:417-434` | Customer info loads after dialog opens |
| Info | No bulk actions | `Orders.tsx` | Cannot bulk confirm pending orders |
| Info | Missing delivery tracking | `Orders.tsx` | No delivery status tracking |

## Performance
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | No pagination | `Orders.tsx:79-95` | All orders fetched without limit |
| Warning | Sequential profile fetch | `Orders.tsx:156-163` | Profile fetched separately for each order view |
| Warning | Client-side filtering | `Orders.tsx:189-192` | Status filtering done on client |
| Info | Duplicate stats calculation | `Orders.tsx:194-201` | Stats recalculated on every render |

## Security
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | Customer PII exposure | `Orders.tsx:424-430` | Full email and phone visible |
| Warning | No rate limiting | `Orders.tsx` | Rapid order updates not prevented |
| Info | Order history visible | `Orders.tsx` | All cancelled orders with reasons visible |

## Consistency & Data Integrity
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Critical | Inconsistent fee percentage | `Orders.tsx:121` | 10% here vs 5% in Jobs.tsx |
| Warning | Status flow not enforced | `Orders.tsx:179-187` | getNextStatus exists but not strictly enforced |
| Warning | Missing completed_at on some paths | `Orders.tsx:101-103` | Only set if status is 'completed' |
| Info | Hardcoded status colors | `Orders.tsx:60-67` | Colors should match design system |

## Error Handling & Observability
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | Generic error toast | `Orders.tsx:150-152` | "Failed to update order" without context |
| Warning | No retry mechanism | `Orders.tsx` | Failed mutations cannot be retried |
| Info | Referral errors logged only | `Orders.tsx:137-138` | Referral failures not tracked |

## Maintainability
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | Large file size | `Orders.tsx` | 555 lines, should be split |
| Warning | Inline mutation logic | `Orders.tsx:98-142` | Complex business logic in component |
| Warning | Duplicated table component | `Orders.tsx:203-264` | OrdersTable could be extracted |
| Info | Hardcoded status config | `Orders.tsx:60-67` | Status config should be shared |

## Compatibility & Environment
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | Direct color classes | `Orders.tsx:60-67` | Uses `bg-yellow-100` instead of design tokens |
| Info | Mobile table overflow | `Orders.tsx:203-264` | Table may overflow on mobile |

## Summary
| Severity | Count |
|----------|-------|
| Critical | 4 |
| Warning | 17 |
| Info | 10 |

## Recommended Actions
1. Fix fee percentage to be consistent (either 5% or 10%) across all vendor modules
2. Fix vendor_job_id to use proper reference, not order ID
3. Implement proper status transition enforcement
4. Add pagination and server-side filtering
5. Mask customer PII (show only necessary info)
6. Split large file into smaller components
7. Use design system tokens for status colors
