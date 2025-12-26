# Tenant Marketplace Feedback

## File Location
- `src/pages/tenant/Marketplace.tsx`
- `src/pages/tenant/VendorDetail.tsx`

## Review Summary

### 1. Bugs & Errors

| Issue | Severity | Description |
|-------|----------|-------------|
| Tenant Location Query Type Casting | Medium | Uses `as any` for nested property access |
| My Area Filter Edge Case | Low | "My Area" filter doesn't work if tenant has no city in contract |
| Rating Display Issue | Low | Shows "New" for null rating, should be more descriptive |

### 2. Validations

| Issue | Severity | Description |
|-------|----------|-------------|
| No Search Input Validation | Low | Search query not sanitized |
| No Category Validation | Low | Categories hardcoded, not synced with database |

### 3. UX & Flow Pengguna

| Issue | Severity | Description |
|-------|----------|-------------|
| No Price Range Display | High | Products/services don't show pricing information |
| No Vendor Reviews | Medium | Cannot see vendor reviews before ordering |
| No Favorites/Wishlist | Low | Cannot save favorite vendors |
| No Recently Viewed | Low | No history of recently viewed vendors |
| Limited Service Categories | Medium | Hardcoded categories may not match actual vendor categories |
| No Sort Options | Medium | Cannot sort vendors by rating, jobs, or distance |
| No Vendor Comparison | Low | Cannot compare multiple vendors |

### 4. Performance

| Issue | Severity | Description |
|-------|----------|-------------|
| Full Vendor Fetch | Medium | Fetches all verified vendors at once |
| Client-Side Filtering | Medium | All filtering done client-side |
| No Lazy Loading | Low | All vendor cards rendered immediately |
| Location Query on Every Render | Low | Tenant location queried separately |

### 5. Security

| Issue | Severity | Description |
|-------|----------|-------------|
| No Tenant Role Check | High | Any authenticated user can browse marketplace |
| Vendor Data Exposure | Medium | All verified vendor data exposed including city/province |

### 6. Consistency & Data Integrity

| Issue | Severity | Description |
|-------|----------|-------------|
| Category Mismatch | High | Hardcoded SERVICE_CATEGORIES may not match vendor.service_categories |
| Rating Precision | Low | Rating shows 1 decimal but database may have more |
| Location Data Format | Medium | City/province format inconsistent across vendors |

### 7. Error Handling & Observability

| Issue | Severity | Description |
|-------|----------|-------------|
| No Query Error Display | Medium | Failed queries show nothing |
| No Vendor Not Found State | Low | If vendor query returns empty, shows generic message |

### 8. Maintainability

| Issue | Severity | Description |
|-------|----------|-------------|
| Hardcoded Categories | High | SERVICE_CATEGORIES should come from database or config |
| Inline Type Definitions | Low | Vendor interface could be in shared types file |
| Complex Filter Logic | Medium | useMemo filter logic is complex, could be extracted |

### 9. Compatibility & Environment

| Issue | Severity | Description |
|-------|----------|-------------|
| No Offline Capability | Low | No caching for offline access |

---

## VendorDetail.tsx Specific Issues (needs review)

| Issue | Severity | Description |
|-------|----------|-------------|
| File Not Reviewed | Info | VendorDetail.tsx content not provided in context |

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 3 |
| Medium | 9 |
| Low | 10 |

## Recommended Actions

1. **Sync categories with database** - fetch from vendors table or config table
2. **Add product/service pricing display** on marketplace cards
3. **Implement vendor reviews section** before ordering
4. **Add sort options** (rating, jobs completed, distance)
5. **Implement server-side filtering** with pagination
6. **Add tenant role verification** before showing marketplace
7. **Cache vendor data** for better performance
