# Admin Referrals Feedback

## Overview
Feedback untuk fitur referral management di admin panel.

## File Reviewed
- `src/pages/admin/Referrals.tsx`
- `docs/admin/referrals.md`

---

## Bugs & Errors

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| BUG-01 | **Reward amount fallback** - Hardcoded 50000 fallback jika reward_amount null | Medium | `Referrals.tsx:109, 311, 358` |
| BUG-02 | **Non-atomic payout** - Update referral dan insert reward tidak dalam transaction | High | `Referrals.tsx:96-114` |
| BUG-03 | **Missing credited_at timezone** - `new Date().toISOString()` tanpa explicit timezone handling | Low | `Referrals.tsx:112` |

---

## Validations

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| VAL-01 | **No duplicate payout check** - Bisa double payout jika button clicked twice quickly | High | `Referrals.tsx:91-126` |
| VAL-02 | **No referral code format validation** - Search accepts any input | Low | `Referrals.tsx:128-133` |

---

## UX & Flow Pengguna

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| UX-01 | **No referral journey tracking** - Tidak bisa lihat detail journey dari referral code ke conversion | High | - |
| UX-02 | **Limited payout options** - Hanya subscription credit, tidak ada cash payout option | Medium | `Referrals.tsx:362` |
| UX-03 | **No bulk payout** - Harus payout satu per satu | Medium | - |
| UX-04 | **Unknown user names** - Menampilkan "Unknown" jika profile tidak ditemukan | Medium | `Referrals.tsx:85-89` |
| UX-05 | **No date range filter** - Tidak bisa filter referrals by date | Medium | - |

---

## Performance

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| PERF-01 | **Separate profiles query** - Profiles fetched separately, bisa di-join dengan referrals | Medium | `Referrals.tsx:74-83` |
| PERF-02 | **No pagination** - All referrals loaded at once | Medium | `Referrals.tsx:50-60` |
| PERF-03 | **Client-side filtering** - Search dan status filter di client | Low | `Referrals.tsx:128-133` |

---

## Security

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| SEC-01 | **No admin role verification** - Page accessible tanpa admin check | Critical | `Referrals.tsx` |
| SEC-02 | **No audit logging** - Payout tidak di-log untuk audit | High | `Referrals.tsx:91-126` |
| SEC-03 | **No double-check for large payouts** - Semua payouts treated sama regardless of amount | Medium | `Referrals.tsx:91-126` |

---

## Consistency & Data Integrity

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| DATA-01 | **Reward amount mismatch** - referral.reward_amount bisa berbeda dengan inserted reward amount | Medium | `Referrals.tsx:109` |
| DATA-02 | **Status inconsistency** - Docs mention more statuses than implemented | Low | `Referrals.tsx:151-162` |
| DATA-03 | **Reward type hardcoded** - 'subscription_credit' hardcoded | Medium | `Referrals.tsx:110` |

---

## Error Handling & Observability

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| ERR-01 | **Generic error message** - "Failed to process payout" tanpa detail | Medium | `Referrals.tsx:124` |
| ERR-02 | **No loading state for table** - `loadingReferrals` used but UI feedback minimal | Low | `Referrals.tsx:164-172` |
| ERR-03 | **Silent partial failures** - Jika referral update succeeds but reward insert fails | High | `Referrals.tsx:96-114` |

---

## Maintainability

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| MAINT-01 | **Inline type definitions** - Referral dan ReferralReward types inline | Low | `Referrals.tsx:16-41` |
| MAINT-02 | **Hardcoded reward amount fallback** - 50000 hardcoded di multiple places | Medium | `Referrals.tsx:109, 311, 358` |
| MAINT-03 | **Mixed concerns** - Component handles UI dan business logic | Medium | `Referrals.tsx` |

---

## Compatibility & Environment

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| COMPAT-01 | **None specific** | - | - |

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 5 |
| Medium | 14 |
| Low | 5 |

---

## Recommended Actions

1. **Critical**: Tambahkan admin role verification
2. **High**: Implement atomic transactions untuk payout
3. **High**: Add double-click prevention / idempotency untuk payout
4. **High**: Implement comprehensive audit logging
5. **High**: Handle partial failures gracefully
6. **Medium**: Add referral journey tracking/visualization
7. **Medium**: Implement bulk payout functionality
8. **Medium**: Add date range filter
9. **Medium**: Join profiles dengan referrals dalam single query
10. **Medium**: Make reward types configurable
