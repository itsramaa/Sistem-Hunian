# Tenant Dashboard Feedback

## File Location
- `src/pages/tenant/Dashboard.tsx`
- `src/components/layouts/TenantLayout.tsx`

## Review Summary

### 1. Bugs & Errors

| Issue | Severity | Description |
|-------|----------|-------------|
| Hardcoded Banner Data | Medium | Banner slides are hardcoded instead of fetched from database/CMS |
| No Contract Check | High | Dashboard doesn't properly handle tenants without active contracts |
| Payment Status Filter Incomplete | Medium | Only filters by `pending` status, missing `overdue`, `sent` statuses |
| No Error Boundary | Medium | Component crashes entirely if any query fails |

### 2. Validations

| Issue | Severity | Description |
|-------|----------|-------------|
| No User ID Validation | Low | Queries rely on `enabled: !!user?.id` but no explicit handling for invalid user state |

### 3. UX & Flow Pengguna

| Issue | Severity | Description |
|-------|----------|-------------|
| No Empty State Guidance | Medium | Empty payment/maintenance lists show generic messages without CTAs |
| No Refresh Capability | Low | No pull-to-refresh or manual refresh button |
| Limited Quick Actions | Low | Only 5 quick actions, missing common actions like Profile, Settings |
| No Overdue Indicator | High | No visual warning for overdue payments in summary cards |
| Missing Contract Info | Medium | Dashboard doesn't show current unit/property info prominently |

### 4. Performance

| Issue | Severity | Description |
|-------|----------|-------------|
| Multiple Sequential Queries | Medium | 3 separate queries run sequentially instead of parallel |
| No Query Caching Strategy | Low | Uses default staleTime, data refetches unnecessarily |
| Full Data Fetch | Medium | Fetches all contracts/payments even though only displaying 3-5 items |
| Carousel Re-renders | Low | Carousel callback causes unnecessary re-renders |

### 5. Security

| Issue | Severity | Description |
|-------|----------|-------------|
| No Tenant Role Verification | High | Page doesn't verify user has tenant role before showing dashboard |
| Direct Table Access | Medium | Relies on RLS but no explicit tenant ownership check in code |

### 6. Consistency & Data Integrity

| Issue | Severity | Description |
|-------|----------|-------------|
| Inconsistent Payment Filtering | Medium | Payments page shows different status logic than dashboard |
| Stale Data Display | Low | No real-time subscription for updates |

### 7. Error Handling & Observability

| Issue | Severity | Description |
|-------|----------|-------------|
| Silent Query Failures | High | Query errors are thrown but not caught/displayed to user |
| No Loading States for Cards | Medium | Individual card loading states not shown |
| No Analytics for User Actions | Low | Quick action clicks not tracked |

### 8. Maintainability

| Issue | Severity | Description |
|-------|----------|-------------|
| Large Component File | Medium | 313 lines, should be split into smaller components |
| Hardcoded Quick Actions | Low | Quick action configuration should be in separate config file |
| Magic Numbers | Low | Limit values (5, 3) hardcoded in multiple places |

### 9. Compatibility & Environment

| Issue | Severity | Description |
|-------|----------|-------------|
| No SSR Consideration | Low | Uses client-side only hooks |

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 3 |
| Medium | 11 |
| Low | 8 |

## Recommended Actions

1. **Add tenant role verification** before rendering dashboard content
2. **Implement error boundaries** and proper error states for failed queries
3. **Add overdue payment indicators** with visual warnings
4. **Split component** into smaller, focused sub-components
5. **Add real-time subscriptions** for payments and maintenance updates
6. **Optimize queries** to run in parallel and limit returned data
