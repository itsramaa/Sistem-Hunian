# Merchant Dashboard Feedback

## Overview
Comprehensive review of Merchant Dashboard feature implementation.

## Files Reviewed
- `src/pages/merchant/Dashboard.tsx`
- `src/components/merchant/SubscriptionWidget.tsx`
- `src/components/merchant/TrialCountdownWidget.tsx`
- `src/components/merchant/VacancyDashboard.tsx`
- `src/components/layouts/MerchantLayout.tsx`

## Issues & Findings

### Bugs & Errors
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| DSH-B01 | High | escrowAccount query uses .single() which may throw if no account | escrowAccount query | Use .maybeSingle() |
| DSH-B02 | Medium | lastMonthTenants query uses lte() for comparison but may not accurately reflect "last month" | Query logic | Clarify date range logic |
| DSH-B03 | Medium | Tenant profile lookup may miss profiles if query returns error | profileMap | Handle missing profiles gracefully |
| DSH-B04 | Low | Revenue change calculation shows 100% for first month | revenueChange calc | Handle edge case messaging |

### Validations
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| DSH-V01 | Low | No validation of returned payment data structure | Multiple queries | Add type guards |

### UX & Flow Pengguna
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| DSH-U01 | High | Verification banner shown but action leads to Profile, not verification flow | Verification Banner | Clarify verification steps |
| DSH-U02 | Medium | Stats show "vs last month" but comparison period not clear | Stats cards | Add tooltip with date range |
| DSH-U03 | Medium | No refresh/reload option for dashboard data | Dashboard | Add refresh button |
| DSH-U04 | Low | Empty states lack actionable guidance | Empty sections | Add "Get started" links |

### Performance
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| DSH-P01 | High | 7+ separate database queries on dashboard load | dashboardData query | Combine into fewer queries |
| DSH-P02 | Medium | Tenant profiles fetched in two separate queries | Upcoming/Recent payments | Combine profile fetches |
| DSH-P03 | Medium | No caching strategy for dashboard data | useQuery | Consider stale time optimization |
| DSH-P04 | Low | Stats calculated client-side after fetch | dashboardData | Pre-calculate on server |

### Security
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| DSH-S01 | Medium | All merchant data accessible if merchant?.id is spoofed | Queries | Rely on RLS policies |
| DSH-S02 | Low | Payment amounts visible on dashboard | Upcoming/Recent payments | Consider amount masking option |

### Consistency & Data Integrity
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| DSH-C01 | High | Occupancy rate calculated differently than in other pages | Stats calculation | Use shared calculation |
| DSH-C02 | Medium | Revenue from payments may differ from invoice totals | Revenue calculation | Clarify data source |
| DSH-C03 | Medium | Tenant change shows delta, not percentage | tenantChange | Standardize change format |

### Error Handling & Observability
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| DSH-E01 | High | Query failures silently fail (no error display) | useQuery | Add error handling UI |
| DSH-E02 | Medium | Loading state shows skeleton but no error recovery | MerchantDashboardSkeleton | Add error boundary |
| DSH-E03 | Low | No analytics tracking for dashboard views | Dashboard | Add page view tracking |

### Maintainability
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| DSH-M01 | High | Single query function is 200+ lines with complex logic | dashboardData queryFn | Split into smaller functions |
| DSH-M02 | Medium | Stats array defined inline with complex logic | stats array | Extract to separate calculation |
| DSH-M03 | Medium | Multiple date calculations inline | Date logic | Extract to date utilities |
| DSH-M04 | Low | formatCurrency duplicated across merchant pages | formatCurrency | Move to shared utility |

### Compatibility & Environment
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| DSH-X01 | Low | Date formatting assumes consistent timezone | Date operations | Consider timezone handling |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 6 |
| Medium | 12 |
| Low | 8 |

## Recommended Actions
1. Combine multiple queries into fewer database calls
2. Use .maybeSingle() for escrow account query
3. Add error handling UI for failed queries
4. Split large query function into smaller, focused functions
5. Standardize occupancy and revenue calculations across pages
6. Add refresh capability for dashboard data
7. Extract shared utilities (formatCurrency, date calculations)
8. Add proper error boundaries
