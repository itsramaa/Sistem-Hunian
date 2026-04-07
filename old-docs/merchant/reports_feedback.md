# Merchant Reports Feedback

## Overview
Comprehensive review of Merchant Reports & Analytics feature implementation.

## Files Reviewed
- `src/pages/merchant/Reports.tsx`
- `src/components/merchant/RevenueForecast.tsx`
- `src/components/merchant/TenantChurnAnalytics.tsx`
- `src/components/merchant/OnTimePaymentRate.tsx`
- `src/components/merchant/VacancyDashboard.tsx`
- `src/lib/exportUtils.ts`

## Issues & Findings

### Bugs & Errors
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| RPT-B01 | High | "+12% from last period" is hardcoded, not calculated | Total Revenue card | Calculate actual comparison | ✅ Implemented |
| RPT-B02 | High | Revenue trend may show $0 for months with no payments | getMonthlyRevenueData | Handle empty months gracefully | ✅ Implemented |
| RPT-B03 | Medium | Y-axis formatter shows "R" prefix instead of "Rp" | AreaChart YAxis | Fix currency prefix | ✅ Implemented |
| RPT-B04 | Medium | Time range affects only some charts, not stats cards | Stats section | Apply time filter consistently | ✅ Implemented |
| RPT-B05 | Low | Maintenance data may be empty when properties have no units | maintenanceRequests query | Handle edge case | |

### Validations
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| RPT-V01 | Medium | No validation that date range makes sense | Time range selector | Prevent future dates if needed | |
| RPT-V02 | Low | Export functions don't validate data completeness | exportUtils | Add data validation | |

### UX & Flow Pengguna
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| RPT-U01 | High | Charts not interactive (no drill-down capability) | All charts | Add click handlers for details | |
| RPT-U02 | Medium | No custom date range selector (only presets) | Time filter | Add custom date range option | ✅ Implemented |
| RPT-U03 | Medium | Export dropdown lacks visual feedback on action | Export menu | Add loading states | ✅ Implemented |
| RPT-U04 | Low | Tab navigation doesn't show loading for tab content | Tabs | Add loading indicators per tab | ✅ Implemented |

### Performance
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| RPT-P01 | Medium | All payment data fetched, then filtered client-side | payments query | Filter in database query | ✅ Implemented |
| RPT-P02 | Medium | Multiple chart data calculations on every render | Data processing | Memoize calculated data | ✅ Implemented |
| RPT-P03 | Medium | Properties with units joined every query | properties query | Optimize join strategy | |
| RPT-P04 | Low | Chart re-renders on any state change | Recharts | Add proper memoization | ✅ Implemented |

### Security
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| RPT-S01 | Medium | Export includes all payment data without redaction | exportUtils | Consider PII in exports | |
| RPT-S02 | Low | Chart data could expose sensitive tenant patterns | Charts | Consider aggregation level | |

### Consistency & Data Integrity
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| RPT-C01 | High | Stats may not match chart data due to different filters | Multiple | Ensure consistent data source | ✅ Implemented |
| RPT-C02 | Medium | Occupancy calculation differs from dashboard | getOccupancyByType | Use shared calculation | |
| RPT-C03 | Medium | Revenue data from payments, not invoices (may differ) | getMonthlyRevenueData | Clarify data source | |

### Error Handling & Observability
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| RPT-E01 | High | Export failures show only toast, no retry option | Export functions | Add retry/download option | ✅ Implemented |
| RPT-E02 | Medium | No fallback when chart data is empty | Charts | Show empty state message | |
| RPT-E03 | Low | PDF export opens print dialog, may fail silently | exportToPDF | Add error handling | ✅ Implemented |

### Maintainability
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| RPT-M01 | High | Large file (527 lines) with inline chart configurations | Reports.tsx | Extract chart components | |
| RPT-M02 | Medium | Chart colors use CSS variables with hsl() inline | COLORS array | Use consistent theming | |
| RPT-M03 | Medium | Data processing functions inline | Reports.tsx | Extract to utilities | ✅ Implemented |
| RPT-M04 | Low | Tooltip styling duplicated across charts | Chart components | Create shared tooltip component | |

### Compatibility & Environment
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| RPT-X01 | Medium | PDF export uses print dialog which varies by browser | exportToPDF | Use proper PDF generation | |
| RPT-X02 | Low | Charts may not render correctly on small screens | ResponsiveContainer | Test mobile responsiveness | |

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 0 | 0 |
| High | 6 | 4 |
| Medium | 14 | 7 |
| Low | 8 | 2 |

## Recommended Actions
1. ✅ Remove hardcoded statistics and calculate actual values
2. ✅ Ensure consistent data filtering across stats and charts
3. ✅ Memoize expensive data calculations
4. ✅ Add custom date range option
5. ✅ Add loading states for exports and tabs
6. ✅ Add audit logging for exports
7. Extract chart components for reusability
8. Implement proper PDF generation instead of print dialog
9. Add drill-down capability to charts
