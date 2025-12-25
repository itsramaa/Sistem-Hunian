# Vendor Analytics Feedback

## Bugs & Errors
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | No date range filter | `SalesAnalytics.tsx` | Only shows last 7 days revenue, no customizable range |
| Warning | Division by zero risk | `SalesAnalytics.tsx` | `orderCompletionRate` calculation may fail with zero orders |
| Warning | Missing loading states | `CustomerInsights.tsx` | No skeleton loading for charts |
| Info | Hardcoded 7-day window | `SalesAnalytics.tsx` | Daily revenue limited to 7 days with no option to extend |

## Validations
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | No vendor ID validation | `SalesAnalytics.tsx`, `CustomerInsights.tsx` | vendorId prop not validated before queries |
| Info | No data freshness indicator | Both components | Users don't know when data was last updated |

## UX & Flow Pengguna
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | No export functionality | `Analytics.tsx` | Cannot export analytics data to CSV/PDF |
| Warning | Limited chart interactivity | `SalesAnalytics.tsx` | Charts not zoomable or drillable |
| Info | No comparison period | Both components | Cannot compare with previous periods |
| Info | Missing KPI targets | Both components | No goal setting or target tracking |
| Info | No real-time updates | Both components | Data requires page refresh to update |

## Performance
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | No pagination for orders | `SalesAnalytics.tsx` | Fetches all orders without limit |
| Warning | Multiple separate queries | Both components | Could be combined into single query |
| Warning | Client-side calculations | Both components | Heavy calculations done on client instead of database |
| Info | No caching strategy | Both components | Same data refetched on tab switches |

## Security
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | No vendor ownership check | `SalesAnalytics.tsx` | Only RLS protects data, no explicit validation |
| Info | Revenue data exposed | Both components | Sensitive financial metrics accessible via network |

## Consistency & Data Integrity
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | Inconsistent currency format | Multiple files | Different currency formatting across components |
| Warning | Date timezone issues | `SalesAnalytics.tsx` | `startOfMonth` may have timezone inconsistencies |
| Info | Order status mapping | `SalesAnalytics.tsx` | Only counts 'completed' status, ignores partial completions |

## Error Handling & Observability
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Critical | Silent query failures | Both components | Errors thrown but not displayed to user |
| Warning | No error boundaries | `Analytics.tsx` | Chart errors crash entire page |
| Warning | No analytics tracking | `Analytics.tsx` | Ironic: analytics page doesn't track its own usage |

## Maintainability
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | Hardcoded metrics | Both components | KPI calculations embedded in component logic |
| Warning | Duplicated date logic | Both components | Date range calculations repeated |
| Info | No unit tests | Both components | Complex calculations untested |

## Compatibility & Environment
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Info | Mobile chart responsiveness | Both components | Charts may be hard to read on small screens |
| Info | No print styles | `Analytics.tsx` | Poor printing experience |

## Summary
| Severity | Count |
|----------|-------|
| Critical | 1 |
| Warning | 13 |
| Info | 11 |

## Recommended Actions
1. Add error boundaries and user-friendly error messages for query failures
2. Implement date range filters with comparison period options
3. Move heavy calculations to database aggregation queries
4. Add export functionality for reports
5. Implement pagination and query limits for orders data
