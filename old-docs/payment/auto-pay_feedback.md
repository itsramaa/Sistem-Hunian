# Auto-Pay - Feedback

## 1. Bugs & Errors

| ID | Severity | Description | Location |
|----|----------|-------------|----------|
| BUG-001 | Critical | **Auto-pay creates Xendit invoice, not actual payment** - Function hanya membuat invoice link, tidak melakukan pembayaran otomatis | `auto-pay-execute/index.ts:109-118` |
| BUG-002 | Critical | **No saved payment method support** - Auto-pay seharusnya menggunakan saved card/VA, bukan generate invoice baru | Missing implementation |
| BUG-003 | High | **Day matching bisa miss** - Jika auto_pay_day = 31 tapi bulan hanya 30 hari, tenant tidak di-process | `auto-pay-execute/index.ts:41` |
| BUG-004 | High | **Invoices with grace_period_active tidak excluded** - Bisa double-charge invoice yang sudah dalam payment plan | `auto-pay-execute/index.ts:82-83` |
| BUG-005 | Medium | **No timezone consideration** - `new Date().getDate()` uses server timezone, bukan tenant timezone | `auto-pay-execute/index.ts:21-22` |
| BUG-006 | Medium | **Profile join bisa null** - `tenant.profiles` bisa null jika profile belum ada | `auto-pay-execute/index.ts:100-102` |

## 2. Validations

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| VAL-001 | Critical | **No payment method validation** - Auto-pay diaktifkan tanpa saved payment method | Require saved payment method sebelum enable |
| VAL-002 | High | **No auto_pay_day range validation** - Day bisa invalid (0, 32, etc) | Validate 1-28 untuk safety |
| VAL-003 | High | **No duplicate invoice check** - Bisa create multiple Xendit invoices untuk invoice yang sama | Check existing pending Xendit transaction |
| VAL-004 | Medium | **No tenant verification status check** - Unverified tenant bisa enable auto-pay | Check tenant verification first |
| VAL-005 | Medium | **No invoice amount validation** - Bisa process invoice dengan amount = 0 | Skip zero amount invoices |

## 3. UX & Flow Pengguna

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| UX-001 | Critical | **Misleading feature name** - "Auto-Pay" suggests automatic payment, tapi hanya sends payment link | Rename ke "Auto-Invoice Reminder" atau implement real auto-pay |
| UX-002 | High | **No UI untuk manage auto-pay** - Tenant settings untuk auto-pay tidak ada di UI | Create TenantAutoPaySettings component |
| UX-003 | High | **No notification preferences** - User tidak bisa pilih channel notification (email/in-app/WhatsApp) | Add notification preferences |
| UX-004 | Medium | **No preview of next auto-pay** - User tidak tahu kapan auto-pay akan berjalan | Show next auto-pay date |
| UX-005 | Medium | **No opt-out for specific invoice** - User tidak bisa exclude invoice tertentu dari auto-pay | Add invoice-level auto-pay override |

## 4. Performance

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| PERF-001 | High | **Sequential processing** - Tenants diproses satu per satu dalam loop | Use Promise.all dengan concurrency limit |
| PERF-002 | High | **Multiple edge function invocations per invoice** - Xendit dan notification function dipanggil terpisah | Batch operations |
| PERF-003 | Medium | **No pagination for tenants** - Query all tenants tanpa limit | Add pagination atau cursor |
| PERF-004 | Medium | **N+1 query pattern** - Invoices di-query per tenant, bukan batch | Single query with joins |
| PERF-005 | Low | **Notification insert per invoice** - Individual inserts | Batch insert notifications |

## 5. Security

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| SEC-001 | High | **No authentication check** - Function bisa dipanggil tanpa auth | Add service role or cron auth |
| SEC-002 | High | **Tenant ID logged** - User IDs di-log | Mask atau hash user IDs |
| SEC-003 | Medium | **No rate limiting** - Function bisa di-invoke repeatedly | Add execution lock/mutex |
| SEC-004 | Medium | **CORS wildcard** - Endpoint accessible from anywhere | Restrict CORS |
| SEC-005 | Low | **Console logging sensitive data** - Email dan payment info di-log | Mask sensitive data |

## 6. Consistency & Data Integrity

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| DATA-001 | High | **No idempotency** - Re-running function on same day creates duplicate Xendit invoices | Track processing dengan date lock |
| DATA-002 | High | **No status update on invoice** - Invoice status tidak di-update setelah Xendit invoice created | Update invoice dengan xendit_invoice_id |
| DATA-003 | Medium | **Silent notification failures** - Notification errors tidak di-track | Store notification status |
| DATA-004 | Medium | **No audit trail** - Tidak ada log permanen untuk auto-pay executions | Create auto_pay_logs table |
| DATA-005 | Low | **Results not stored** - Execution results hanya di-return, tidak disimpan | Store execution history |

## 7. Error Handling & Observability

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| ERR-001 | High | **Continue on error hides issues** - Loop continues even after critical errors | Aggregate and report all errors |
| ERR-002 | High | **Notification error swallowed** - try-catch pada notification tanpa retry | Implement retry queue |
| ERR-003 | Medium | **No alerting** - Critical failures tidak trigger alert | Add alert untuk high error rate |
| ERR-004 | Medium | **Generic error messages** - Error messages tidak specific | Include context dalam error |
| ERR-005 | Low | **No execution metrics** - Tidak track success rate, timing, etc | Add metrics collection |

## 8. Maintainability

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| MAINT-001 | High | **Hardcoded notification message** - Notification text inline di code | Use template atau i18n |
| MAINT-002 | Medium | **Deep nesting** - Multiple levels of try-catch dan loops | Refactor ke smaller functions |
| MAINT-003 | Medium | **Magic numbers** - Query limits, etc tidak named | Extract to constants |
| MAINT-004 | Low | **Type assertions** - `as any` used untuk profile dan contract | Define proper types |
| MAINT-005 | Low | **No unit tests** - Function tidak testable | Add dependency injection |

## 9. Compatibility & Environment

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| COMP-001 | High | **Cron job tidak configured** - No cron setup untuk daily execution | Add cron configuration |
| COMP-002 | Medium | **Timezone hardcoded** - Server timezone assumed | Use tenant timezone atau config |
| COMP-003 | Medium | **No retry mechanism** - Jika function fail, no automatic retry | Add retry dengan backoff |
| COMP-004 | Low | **Date format hardcoded** - `toISOString().split('T')[0]` pattern | Use date library |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 4 |
| High | 13 |
| Medium | 14 |
| Low | 6 |

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Clarify/rename feature - either implement real auto-payment atau rename ke "auto-reminder"
2. **[CRITICAL]** Implement saved payment method support untuk true auto-pay
3. **[CRITICAL]** Add payment method validation sebelum enable auto-pay
4. **[HIGH]** Create tenant UI untuk manage auto-pay settings
5. **[HIGH]** Add idempotency check untuk prevent duplicate processing
6. **[HIGH]** Handle edge case untuk bulan dengan hari < 31
7. **[HIGH]** Add cron job configuration untuk daily execution
8. **[MEDIUM]** Implement timezone-aware processing
9. **[MEDIUM]** Add execution history dan audit trail
10. **[LOW]** Extract notification templates
