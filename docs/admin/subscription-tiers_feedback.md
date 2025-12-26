# Admin Subscription Tiers Feedback

## Overview
Feedback untuk fitur subscription tier management di admin panel.

## File Reviewed
- `src/pages/admin/SubscriptionTiers.tsx`
- `docs/admin/subscription-tiers.md`

---

## Bugs & Errors

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| BUG-01 | **Delete tier with active subscribers** - Bisa delete tier yang masih punya active subscribers | Critical | ✅ Fixed |
| BUG-02 | **Sort order conflict** - New tier gets `tiers.length + 1`, bisa conflict jika tier deleted | Medium | ✅ Fixed |
| BUG-03 | **Yearly price 0 treated as null** - Input 0 converted to null, beda dengan free tier | Low | - |
| BUG-04 | **Features array handling** - Empty string items after split not properly filtered | Low | ✅ Fixed |

---

## Validations

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| VAL-01 | **No duplicate name check** - Bisa create tier dengan nama sama | High | ✅ Fixed |
| VAL-02 | **Negative values possible** - min="0" dan min="1" tapi no server validation | Medium | - |
| VAL-03 | **No features validation** - Features bisa berisi any text tanpa format check | Low | - |
| VAL-04 | **Name format not validated** - Internal name bisa punya spaces dan special chars | Medium | - |

---

## UX & Flow Pengguna

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| UX-01 | **No confirmation for delete** - Delete langsung execute tanpa confirmation | High | ✅ Fixed |
| UX-02 | **No drag-and-drop reorder** - sort_order harus di-edit manually | Medium | - |
| UX-03 | **Features as textarea** - Sulit manage banyak features dengan textarea | Medium | - |
| UX-04 | **No preview of tier changes impact** - Tidak tau berapa merchants affected | Medium | - |
| UX-05 | **Limited to 5 features display** - More than 5 features hidden di card view | Low | - |

---

## Performance

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| PERF-01 | **Re-render on dialog open** - Form state reset setiap dialog open/close | Low | - |

---

## Security

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| SEC-01 | **No admin role verification** - Page accessible tanpa admin check | Critical | ✅ Fixed |
| SEC-02 | **No audit logging** - Tier changes tidak di-log | High | ✅ Fixed |
| SEC-03 | **Delete without checking dependencies** - Tier deleted tanpa check subscriptions | Critical | ✅ Fixed |

---

## Consistency & Data Integrity

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| DATA-01 | **is_active inconsistency** - Tier bisa inactive tapi merchants masih subscribed | High | - |
| DATA-02 | **sort_order gaps** - Deleting tier bisa create gaps di sort_order | Medium | ✅ Fixed |
| DATA-03 | **Price changes not prorated** - Mengubah price tidak affect existing subscriptions | Medium | - |

---

## Error Handling & Observability

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| ERR-01 | **Generic error messages** - Error message tidak specific | Medium | ✅ Fixed |
| ERR-02 | **No constraint violation handling** - Database constraint errors shown as generic | Medium | ✅ Fixed |
| ERR-03 | **Delete mutation error unclear** - "Failed to delete tier" tanpa reason | Medium | ✅ Fixed |

---

## Maintainability

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| MAINT-01 | **defaultFormData inline** - Form default values hardcoded | Low | - |
| MAINT-02 | **getTierIcon hardcoded** - Icon mapping hardcoded di component | Low | - |
| MAINT-03 | **No DTO separation** - Form data structure tied to component | Low | - |

---

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 3 | 3 |
| High | 4 | 3 |
| Medium | 12 | 6 |
| Low | 8 | 1 |

---

## Recommended Actions

1. ✅ **Critical**: Check for active subscribers sebelum allow delete tier
2. ✅ **Critical**: Tambahkan admin role verification
3. ✅ **Critical**: Add confirmation dialog untuk delete
4. ✅ **High**: Implement comprehensive audit logging
5. ✅ **High**: Check for duplicate names sebelum save
6. **High**: Handle inactive tiers dengan existing subscriptions
7. **Medium**: Implement drag-and-drop reordering
8. **Medium**: Add impact preview sebelum tier changes
9. **Medium**: Improve features management UI
10. **Medium**: Handle price change proration
