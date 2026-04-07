# Subscription Billing - Feedback

## 1. Bugs & Errors

| ID | Severity | Description | Location |
|----|----------|-------------|----------|
| BUG-001 | Critical | **Yearly detection flawed** - `monthsDiff > 6` logic tidak accurate untuk detecting yearly billing | `subscription-billing/index.ts:84-85` |
| BUG-002 | Critical | **URL replacement broken** - `.replace('supabase.co', 'lovable.app')` mungkin tidak match full URL | `subscription-billing/index.ts:123-124` |
| BUG-003 | High | **Grace period hardcoded** - 7 hari grace period tidak configurable | `subscription-grace-check/index.ts:9` |
| BUG-004 | High | **Free tier query tanpa error handling** - `.maybeSingle()` diikuti nullable check tapi bisa error | `subscription-renewal/index.ts:60-64` |
| BUG-005 | High | **Subscription period hardcoded 30 days** - `+ 30 * 24 * 60 * 60 * 1000` tidak account for actual month length | `subscription-renewal/index.ts:118` |
| BUG-006 | Medium | **Duplicate notifications possible** - No check for existing notification sebelum insert | Multiple files |
| BUG-007 | Medium | **Trial reminder spam** - Daily cron akan send reminder setiap hari dalam window | `subscription-renewal/index.ts:212-243` |

## 2. Validations

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| VAL-001 | Critical | **No tier existence validation di payment** - `tier_id` tidak validated sebelum payment | Validate tier exists dan active |
| VAL-002 | High | **No billing_cycle validation** - Hanya 'monthly' atau 'yearly' valid | Validate dengan enum |
| VAL-003 | High | **No merchant_id ownership validation** - User bisa pay untuk merchant lain | Validate merchant belongs to user |
| VAL-004 | Medium | **No email validation** - `payer_email` bisa invalid | Validate email format |
| VAL-005 | Medium | **Missing required fields check** - `merchant_id`, `tier_id` wajib tapi tidak validated | Add required field validation |

## 3. UX & Flow Pengguna

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| UX-001 | High | **No pending payment indicator** - User tidak tahu ada pending subscription payment | Add PendingPaymentBanner |
| UX-002 | High | **Downgrade scheduled tanpa confirmation** - User mungkin tidak sadar downgrade terjadi | Add clear confirmation flow |
| UX-003 | Medium | **Payment callback handling basic** - `?payment=success/failed` query param handling | Add proper payment confirmation page |
| UX-004 | Medium | **No invoice download** - Subscription invoice tidak bisa di-download | Generate PDF invoice |
| UX-005 | Medium | **Suspension notice terlalu late** - Notice hanya saat sudah suspended | Warn before due date |
| UX-006 | Low | **Yearly discount not prominent** - 20% savings tidak clearly highlighted | Emphasize yearly savings |

## 4. Performance

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| PERF-001 | High | **All subscriptions loaded** - Query semua subscriptions tanpa date filter | Filter by billing date range |
| PERF-002 | High | **Sequential processing** - Subscriptions diproses satu per satu | Use Promise.allSettled |
| PERF-003 | Medium | **Multiple tier queries** - Tier data fetched per subscription | Cache atau batch fetch |
| PERF-004 | Medium | **No database indexes assumed** - Queries on `current_period_end`, `status` | Ensure indexes exist |
| PERF-005 | Low | **Frontend tier fetch on every render** - Tidak cached | Use stale-while-revalidate |

## 5. Security

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| SEC-001 | High | **No rate limiting on payment initiation** - User bisa spam payment requests | Add rate limiting |
| SEC-002 | High | **Payment for any merchant** - Tidak validate user owns merchant | Add ownership validation |
| SEC-003 | Medium | **Tier changes without verification** - Downgrade tanpa additional auth | Consider confirmation for downgrades |
| SEC-004 | Medium | **Price dari client** - Meskipun di-validate, price confirmation should be server-side only | Remove client price, use tier_id only |
| SEC-005 | Low | **CORS too permissive** - `*` origin allowed | Restrict origins |

## 6. Consistency & Data Integrity

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| DATA-001 | Critical | **Non-atomic subscription updates** - Multiple tables updated tanpa transaction | Use database transaction |
| DATA-002 | High | **Grace period state inconsistent** - `grace_period_end` tidak always cleared | Ensure cleanup on payment |
| DATA-003 | High | **Pending changes orphaned** - Pending changes tidak cleaned up on direct upgrade | Clean pending changes |
| DATA-004 | Medium | **Subscription invoice tidak linked** - `subscription_invoices` terpisah dari `merchant_subscriptions` | Ensure proper linking |
| DATA-005 | Medium | **Status transitions uncontrolled** - Status bisa jump between states | Implement state machine |

## 7. Error Handling & Observability

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| ERR-001 | High | **Email errors swallowed** - try-catch tanpa tracking | Track email delivery failures |
| ERR-002 | High | **Partial processing** - Jika satu subscription gagal, others mungkin tidak processed | Continue tapi aggregate errors |
| ERR-003 | Medium | **Generic error toast** - "Failed to process payment" tidak helpful | Show specific error |
| ERR-004 | Medium | **No billing failure alerts** - Critical billing failures tidak trigger alert | Add alerting |
| ERR-005 | Low | **No success metrics** - Tidak track subscription conversion rate | Add metrics |

## 8. Maintainability

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| MAINT-001 | High | **Four separate billing functions** - billing, renewal, payment, grace-check overlap | Consolidate atau clarify responsibilities |
| MAINT-002 | High | **Duplicate tier fetching** - Same query di multiple functions | Extract ke shared module |
| MAINT-003 | Medium | **Period calculation scattered** - Date math inline everywhere | Create period utility |
| MAINT-004 | Medium | **Notification text inline** - Hardcoded strings | Use templates |
| MAINT-005 | Low | **No TypeScript types for tiers** - Using any or inline types | Create shared types |

## 9. Compatibility & Environment

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| COMP-001 | High | **Cron job configuration unclear** - Functions need to run on schedule | Document cron setup |
| COMP-002 | Medium | **No sandbox/test mode** - Live Xendit always used | Add test mode |
| COMP-003 | Medium | **Timezone issues** - Date comparisons use server timezone | Use consistent timezone |
| COMP-004 | Low | **Locale hardcoded** - `id-ID` for formatting | Make configurable |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 4 |
| High | 14 |
| Medium | 16 |
| Low | 5 |

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Fix yearly billing detection logic
2. **[CRITICAL]** Fix URL construction untuk redirect
3. **[CRITICAL]** Add merchant ownership validation di payment
4. **[CRITICAL]** Implement atomic subscription updates
5. **[HIGH]** Add pending payment UI indicator
6. **[HIGH]** Prevent duplicate notifications/reminders
7. **[HIGH]** Add proper rate limiting pada payment initiation
8. **[HIGH]** Consolidate billing functions atau clarify boundaries
9. **[MEDIUM]** Add subscription invoice PDF generation
10. **[MEDIUM]** Implement proper state machine untuk subscription status
