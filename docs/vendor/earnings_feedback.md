# Vendor Earnings Feedback

## Bugs & Errors
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Critical | Table mismatch | `VendorEscrowWidget.tsx:21-34` | Queries `vendor_earnings` table but doc mentions `vendor_escrow_accounts` |
| Warning | Balance calculation issue | `VendorEscrowWidget.tsx:46` | `availableBalance = totalEarned - totalDisbursed` doesn't account for pending |
| Warning | No refetch on mutations | `Earnings.tsx` | After status changes, data may be stale |
| Info | Missing pagination | `Earnings.tsx:56-73` | All earnings fetched without limit |

## Validations
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | No bank details validation | `DisbursementSettings.tsx` | Bank account number format not validated |
| Warning | No minimum threshold validation | `DisbursementSettings.tsx` | Min disbursement amount could be set to invalid values |
| Info | Missing vendor_id validation | `Earnings.tsx:52-54` | Queries run before vendor is confirmed |

## UX & Flow Pengguna
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Critical | Export button non-functional | `Earnings.tsx:181-184` | "Export Statement" button does nothing |
| Warning | No disbursement request UI | `Earnings.tsx` | Cannot request early disbursement |
| Warning | Missing earning details | `Earnings.tsx:247` | No link to view job details from earning |
| Info | No search/filter for transactions | `Earnings.tsx` | Cannot search by description or amount |
| Info | Hardcoded fee percentage display | `Earnings.tsx:235` | Shows "5%" but actual fee may vary |

## Performance
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | N+1 query potential | `VendorEscrowWidget.tsx` | Separate queries for earnings and disbursements |
| Warning | Client-side filtering | `Earnings.tsx:114-125` | Period filtering done on client, should be database |
| Info | No query caching | `Earnings.tsx` | Same data refetched on filter changes |

## Security
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Critical | Bank details exposed | `DisbursementSettings.tsx` | Full bank account numbers visible in UI |
| Warning | No rate limiting | `DisbursementSettings.tsx` | Disbursement requests not rate limited |
| Info | Disbursement history visible | `DisbursementSettings.tsx` | All transaction amounts exposed |

## Consistency & Data Integrity
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Critical | Non-atomic balance updates | `VendorEscrowWidget.tsx` | Balance calculations not transactional |
| Warning | Inconsistent fee calculation | Multiple files | 5% in Jobs.tsx, different in Orders.tsx |
| Warning | Status inconsistency | `Earnings.tsx:158-170` | Status values not matching database constraints |
| Info | Currency format duplication | Multiple files | Each component has own formatCurrency |

## Error Handling & Observability
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | Generic loading state | `Earnings.tsx:224-226` | Just shows "Loading..." text |
| Warning | Silent mutation failures | `DisbursementSettings.tsx` | Settings save errors may not be visible |
| Info | No audit logging | Both files | Financial changes not logged |

## Maintainability
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | Hardcoded payout schedule | `Earnings.tsx:282-283` | "Weekly on Fridays" and "Rp 50,000" hardcoded |
| Warning | Duplicated stats logic | Multiple files | Stats calculation repeated in Dashboard and Earnings |
| Info | No shared types | Both files | Earning interface defined locally |

## Compatibility & Environment
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Info | Mobile table layout | `Earnings.tsx` | Table may overflow on mobile |
| Info | No PDF/print support | `Earnings.tsx` | Cannot print statement |

## Summary
| Severity | Count |
|----------|-------|
| Critical | 4 |
| Warning | 12 |
| Info | 11 |

## Recommended Actions
1. Fix balance calculation to properly account for pending amounts
2. Implement Export Statement functionality
3. Mask bank account numbers in display (show last 4 digits only)
4. Add database-level filtering for date ranges
5. Standardize fee percentage as a configurable constant
6. Add proper loading skeletons and error states
