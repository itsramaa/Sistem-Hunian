# Disbursement - Feedback

## 1. Bugs & Errors

| ID | Severity | Description | Location |
|----|----------|-------------|----------|
| BUG-001 | Critical | **Bank account table mismatch** - Code queries `vendor_bank_accounts` tapi table mungkin tidak exist | `xendit-disbursement/index.ts:40-44` |
| BUG-002 | Critical | **Escrow transaction reference mismatch** - Webhook queries by `disbursement.id` tapi insert uses `external_id` | `xendit-disbursement-webhook/index.ts:116` vs `xendit-disbursement/index.ts:162` |
| BUG-003 | High | **Fee amount hardcoded** - Xendit disbursement fee Rp 5,500 mungkin berubah | `xendit-disbursement/index.ts:60` |
| BUG-004 | High | **Email sent with empty recipient** - `recipientEmail: ''` pada email notifications | `xendit-disbursement-webhook/index.ts:144`, `scheduled-disbursement/index.ts:290` |
| BUG-005 | High | **Scheduled disbursement clears balance sebelum confirm** - Balance di-set 0 sebelum Xendit confirms | `scheduled-disbursement/index.ts:229-232` |
| BUG-006 | Medium | **Bank code mapping incomplete** - Tidak semua Indonesian banks di-map | `xendit-disbursement/index.ts:71-80` |
| BUG-007 | Medium | **URL construction broken** - `.replace('.supabase.co', '.lovable.app')` mungkin tidak match | `xendit-disbursement-webhook/index.ts:153` |

## 2. Validations

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| VAL-001 | Critical | **No amount validation** - Amount tidak divalidasi minimum/maximum | Validate amount > min_disbursement_amount |
| VAL-002 | High | **No bank account ownership validation** - Bank account bisa milik merchant lain | Validate bank_account belongs to merchant |
| VAL-003 | High | **No escrow balance validation** - Bisa request disbursement > balance | Check balance >= amount before processing |
| VAL-004 | Medium | **No bank account number validation** - Format account number tidak validated | Validate sesuai bank format |
| VAL-005 | Medium | **No verification status check in webhook** - Unverified merchant bisa terima disbursement | Additional check di webhook |

## 3. UX & Flow Pengguna

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| UX-001 | High | **No disbursement request UI** - Merchant tidak bisa manual request disbursement | Create RequestDisbursementDialog |
| UX-002 | High | **No disbursement history UI** - Merchant tidak bisa lihat disbursement history | Create DisbursementHistory component |
| UX-003 | Medium | **No estimated arrival time** - User tidak tahu kapan uang sampai | Show estimated arrival based on bank |
| UX-004 | Medium | **No cancellation option** - User tidak bisa cancel pending disbursement | Add cancel untuk pending status |
| UX-005 | Low | **Notification tidak actionable** - "View" link ke /merchant/escrow tanpa detail | Deep link ke specific disbursement |

## 4. Performance

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| PERF-001 | High | **Sequential merchant processing** - Scheduled disbursement process one by one | Use Promise.allSettled dengan concurrency |
| PERF-002 | Medium | **Multiple DB roundtrips in webhook** - Separate queries untuk disbursement, escrow, bank | Use single query dengan joins |
| PERF-003 | Medium | **No pagination for merchants** - Query all verified merchants | Add pagination |
| PERF-004 | Low | **Unnecessary email function invocation** - Email sent bahkan jika recipientEmail empty | Check email before invoke |

## 5. Security

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| SEC-001 | Critical | **Webhook token optional** - `if (XENDIT_WEBHOOK_TOKEN && callbackToken !== ...)` allows bypass | Make token required |
| SEC-002 | High | **No disbursement amount limits** - Besar disbursement unlimited | Set daily/transaction limits |
| SEC-003 | High | **Bank account details logged** - Account number visible di logs | Mask account numbers |
| SEC-004 | Medium | **No 2FA for large disbursements** - Large amounts tidak require additional auth | Require 2FA untuk > threshold |
| SEC-005 | Medium | **No fraud detection** - Multiple rapid disbursements tidak flagged | Add velocity checks |

## 6. Consistency & Data Integrity

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| DATA-001 | Critical | **Non-atomic balance update** - Balance deducted before Xendit confirms, no transaction | Use database transaction |
| DATA-002 | Critical | **Rollback incomplete** - Failed webhook adds back amount tapi fee sudah deducted | Handle fee rollback |
| DATA-003 | High | **Escrow transaction reference inconsistent** - Different reference formats used | Standardize reference format |
| DATA-004 | High | **pending_balance calculation risky** - `Math.max(0, ...)` masks negative values | Investigate dan fix root cause |
| DATA-005 | Medium | **Merchant stats update not atomic** - `total_disbursed` update separate dari disbursement | Use transaction |

## 7. Error Handling & Observability

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| ERR-001 | High | **Continue on error in scheduled** - Single merchant error doesn't stop processing tapi bisa mask issues | Better error aggregation |
| ERR-002 | High | **Email failures silent** - `try-catch` swallows email errors | Track email delivery status |
| ERR-003 | Medium | **No disbursement attempt tracking** - Failed attempts tidak di-track untuk retry | Add attempt counter |
| ERR-004 | Medium | **Generic failure reasons** - `failureCode || 'Unknown error'` tidak helpful | Map Xendit codes ke user-friendly messages |
| ERR-005 | Low | **No structured logging** - Console.log tanpa correlation ID | Add trace IDs |

## 8. Maintainability

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| MAINT-001 | High | **Duplicate bank code mapping** - Same mapping di multiple files | Extract ke shared utility |
| MAINT-002 | High | **Fee rates scattered** - Fee rates hardcoded di berbagai tempat | Centralize fee configuration |
| MAINT-003 | Medium | **Large function files** - scheduled-disbursement.ts 346 lines | Split into smaller modules |
| MAINT-004 | Medium | **Interface duplication** - `MerchantWithEscrow` defined inline | Move to shared types |
| MAINT-005 | Low | **Notification messages inline** - Hardcoded notification text | Use templates |

## 9. Compatibility & Environment

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| COMP-001 | High | **Cron schedule assumed** - Function expects certain days without config | Make schedule configurable |
| COMP-002 | High | **No Xendit sandbox support** - Live API always used | Add environment switching |
| COMP-003 | Medium | **Indonesian locale hardcoded** - `toLocaleString('id-ID')` everywhere | Make locale configurable |
| COMP-004 | Medium | **Timezone not handled** - Server time used for schedule checking | Use consistent timezone |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 6 |
| High | 14 |
| Medium | 14 |
| Low | 4 |

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Fix webhook token validation - make required, fail closed
2. **[CRITICAL]** Fix atomic balance updates - use database transactions
3. **[CRITICAL]** Fix email recipient empty bug
4. **[CRITICAL]** Validate escrow balance before processing disbursement
5. **[HIGH]** Add disbursement request/history UI untuk merchants
6. **[HIGH]** Implement fraud detection dan velocity checks
7. **[HIGH]** Extract bank code mapping ke shared module
8. **[HIGH]** Add proper Xendit sandbox support
9. **[MEDIUM]** Implement 2FA untuk large disbursements
10. **[MEDIUM]** Add structured logging dengan trace IDs
