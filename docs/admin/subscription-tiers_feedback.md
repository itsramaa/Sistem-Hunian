# Admin Subscription Tiers Feedback

## Overview
Feedback untuk fitur subscription tier management di admin panel.

## File Reviewed
- `src/pages/admin/SubscriptionTiers.tsx`
- `docs/admin/subscription-tiers.md`

---

## Bugs & Errors

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| BUG-01 | **Delete tier with active subscribers** - Bisa delete tier yang masih punya active subscribers | Critical | `SubscriptionTiers.tsx:109-119` |
| BUG-02 | **Sort order conflict** - New tier gets `tiers.length + 1`, bisa conflict jika tier deleted | Medium | `SubscriptionTiers.tsx:93-96` |
| BUG-03 | **Yearly price 0 treated as null** - Input 0 converted to null, beda dengan free tier | Low | `SubscriptionTiers.tsx:77` |
| BUG-04 | **Features array handling** - Empty string items after split not properly filtered | Low | `SubscriptionTiers.tsx:66-69` |

---

## Validations

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| VAL-01 | **No duplicate name check** - Bisa create tier dengan nama sama | High | `SubscriptionTiers.tsx:64-97` |
| VAL-02 | **Negative values possible** - min="0" dan min="1" tapi no server validation | Medium | `SubscriptionTiers.tsx:334-377` |
| VAL-03 | **No features validation** - Features bisa berisi any text tanpa format check | Low | `SubscriptionTiers.tsx:390-398` |
| VAL-04 | **Name format not validated** - Internal name bisa punya spaces dan special chars | Medium | `SubscriptionTiers.tsx:300-308` |

---

## UX & Flow Pengguna

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| UX-01 | **No confirmation for delete** - Delete langsung execute tanpa confirmation | High | `SubscriptionTiers.tsx:226-231` |
| UX-02 | **No drag-and-drop reorder** - sort_order harus di-edit manually | Medium | - |
| UX-03 | **Features as textarea** - Sulit manage banyak features dengan textarea | Medium | `SubscriptionTiers.tsx:390-398` |
| UX-04 | **No preview of tier changes impact** - Tidak tau berapa merchants affected | Medium | - |
| UX-05 | **Limited to 5 features display** - More than 5 features hidden di card view | Low | `SubscriptionTiers.tsx:272-284` |

---

## Performance

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| PERF-01 | **Re-render on dialog open** - Form state reset setiap dialog open/close | Low | `SubscriptionTiers.tsx:121-142` |

---

## Security

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| SEC-01 | **No admin role verification** - Page accessible tanpa admin check | Critical | `SubscriptionTiers.tsx` |
| SEC-02 | **No audit logging** - Tier changes tidak di-log | High | `SubscriptionTiers.tsx:64-107` |
| SEC-03 | **Delete without checking dependencies** - Tier deleted tanpa check subscriptions | Critical | `SubscriptionTiers.tsx:109-119` |

---

## Consistency & Data Integrity

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| DATA-01 | **is_active inconsistency** - Tier bisa inactive tapi merchants masih subscribed | High | `SubscriptionTiers.tsx:81` |
| DATA-02 | **sort_order gaps** - Deleting tier bisa create gaps di sort_order | Medium | `SubscriptionTiers.tsx:109-119` |
| DATA-03 | **Price changes not prorated** - Mengubah price tidak affect existing subscriptions | Medium | - |

---

## Error Handling & Observability

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| ERR-01 | **Generic error messages** - Error message tidak specific | Medium | `SubscriptionTiers.tsx:104, 118` |
| ERR-02 | **No constraint violation handling** - Database constraint errors shown as generic | Medium | `SubscriptionTiers.tsx:104` |
| ERR-03 | **Delete mutation error unclear** - "Failed to delete tier" tanpa reason | Medium | `SubscriptionTiers.tsx:118` |

---

## Maintainability

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| MAINT-01 | **defaultFormData inline** - Form default values hardcoded | Low | `SubscriptionTiers.tsx:32-44` |
| MAINT-02 | **getTierIcon hardcoded** - Icon mapping hardcoded di component | Low | `SubscriptionTiers.tsx:155-164` |
| MAINT-03 | **No DTO separation** - Form data structure tied to component | Low | - |

---

## Compatibility & Environment

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| COMPAT-01 | **None specific** | - | - |

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High | 4 |
| Medium | 12 |
| Low | 8 |

---

## Recommended Actions

1. **Critical**: Check for active subscribers sebelum allow delete tier
2. **Critical**: Tambahkan admin role verification
3. **Critical**: Add confirmation dialog untuk delete
4. **High**: Implement comprehensive audit logging
5. **High**: Check for duplicate names sebelum save
6. **High**: Handle inactive tiers dengan existing subscriptions
7. **Medium**: Implement drag-and-drop reordering
8. **Medium**: Add impact preview sebelum tier changes
9. **Medium**: Improve features management UI
10. **Medium**: Handle price change proration
