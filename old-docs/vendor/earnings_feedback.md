# Vendor Earnings Feedback

## Bugs & Errors
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Critical | Table mismatch | `VendorEscrowWidget.tsx:21-34` | Queries `vendor_earnings` table but doc mentions `vendor_escrow_accounts` | Open |
| ✅ Warning | Balance calculation issue | `VendorEscrowWidget.tsx:46` | `availableBalance = totalEarned - totalDisbursed` doesn't account for pending | Fixed |
| Warning | No refetch on mutations | `Earnings.tsx` | After status changes, data may be stale | Open |
| Info | Missing pagination | `Earnings.tsx:56-73` | All earnings fetched without limit | Open |

## Validations
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Warning | No bank details validation | `DisbursementSettings.tsx` | Bank account number format not validated | Open |
| Warning | No minimum threshold validation | `DisbursementSettings.tsx` | Min disbursement amount could be set to invalid values | Open |
| Info | Missing vendor_id validation | `Earnings.tsx:52-54` | Queries run before vendor is confirmed | Open |

## UX & Flow Pengguna
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| ✅ Critical | Export button non-functional | `Earnings.tsx:181-184` | "Export Statement" button does nothing | Fixed |
| Warning | No disbursement request UI | `Earnings.tsx` | Cannot request early disbursement | Open |
| Warning | Missing earning details | `Earnings.tsx:247` | No link to view job details from earning | Open |
| Info | No search/filter for transactions | `Earnings.tsx` | Cannot search by description or amount | Open |
| ✅ Info | Hardcoded fee percentage display | `Earnings.tsx:235` | Shows "5%" but actual fee may vary | Fixed |

## Performance
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Warning | N+1 query potential | `VendorEscrowWidget.tsx` | Separate queries for earnings and disbursements | Open |
| Warning | Client-side filtering | `Earnings.tsx:114-125` | Period filtering done on client, should be database | Open |
| Info | No query caching | `Earnings.tsx` | Same data refetched on filter changes | Open |

## Security
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Critical | Bank details exposed | `DisbursementSettings.tsx` | Full bank account numbers visible in UI | Open |
| Warning | No rate limiting | `DisbursementSettings.tsx` | Disbursement requests not rate limited | Open |
| Info | Disbursement history visible | `DisbursementSettings.tsx` | All transaction amounts exposed | Open |

## Consistency & Data Integrity
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Critical | Non-atomic balance updates | `VendorEscrowWidget.tsx` | Balance calculations not transactional | Open |
| ✅ Warning | Inconsistent fee calculation | Multiple files | 5% in Jobs.tsx, different in Orders.tsx | Fixed |
| Warning | Status inconsistency | `Earnings.tsx:158-170` | Status values not matching database constraints | Open |
| ✅ Info | Currency format duplication | Multiple files | Each component has own formatCurrency | Fixed |

## Error Handling & Observability
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| ✅ Warning | Generic loading state | `Earnings.tsx:224-226` | Just shows "Loading..." text | Fixed |
| Warning | Silent mutation failures | `DisbursementSettings.tsx` | Settings save errors may not be visible | Open |
| Info | No audit logging | Both files | Financial changes not logged | Open |

## Maintainability
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Warning | Hardcoded payout schedule | `Earnings.tsx:282-283` | "Weekly on Fridays" and "Rp 50,000" hardcoded | Open |
| Warning | Duplicated stats logic | Multiple files | Stats calculation repeated in Dashboard and Earnings | Open |
| Info | No shared types | Both files | Earning interface defined locally | Open |

## Compatibility & Environment
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Info | Mobile table layout | `Earnings.tsx` | Table may overflow on mobile | Open |
| Info | No PDF/print support | `Earnings.tsx` | Cannot print statement | Open |

## Summary
| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 4 | 1 |
| Warning | 12 | 3 |
| Info | 11 | 3 |

## Recommended Actions (Completed)
1. ✅ Fix balance calculation to properly account for pending amounts
2. ✅ Implement Export Statement functionality (CSV export)
3. ✅ Standardize fee percentage as a configurable constant
4. ✅ Add proper loading skeletons and error states

## Remaining Actions
1. Mask bank account numbers in display (show last 4 digits only)
2. Add database-level filtering for date ranges
