# Xendit Integration - Feedback

## 1. Bugs & Errors

| ID | Severity | Description | Location |
|----|----------|-------------|----------|
| BUG-001 | Critical | **Redirect URL from origin header can be null** - `req.headers.get('origin')` may return null for non-browser requests, causing malformed URLs | `xendit-create-invoice/index.ts:55-56` |
| BUG-002 | Critical | **Transaction update without idempotency check** - Webhook dapat diproses multiple kali untuk transaksi yang sama tanpa pengecekan | `xendit-webhook/index.ts:52-63` |
| BUG-003 | High | **Fee calculation uses integer math** - Rounding errors pada fee calculation dengan `Math.round()` dapat menyebabkan discrepancy | `xendit-webhook/index.ts:329-331` |
| BUG-004 | High | **Success page fetch by external_id tidak handle missing** - Jika transaksi tidak ditemukan, user tetap melihat success page tanpa detail | `Success.tsx:41-50` |
| BUG-005 | Medium | **Webhook token validation dapat bypass** - Jika `XENDIT_WEBHOOK_TOKEN` tidak di-set, webhook tetap diproses | `xendit-webhook/index.ts:24-32` |
| BUG-006 | Medium | **Failed page hardcoded WhatsApp number** - Support number hardcoded dan mungkin tidak valid | `Failed.tsx:23` |

## 2. Validations

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| VAL-001 | Critical | **No amount validation** - Amount tidak divalidasi (min/max/type) | Tambah validasi `amount > 0 && amount < MAX_AMOUNT` |
| VAL-002 | High | **No email format validation** - `payer_email` tidak divalidasi | Gunakan regex atau Zod untuk email validation |
| VAL-003 | High | **No payment_type validation** - `payment_type` tidak divalidasi terhadap enum | Validasi hanya 'rent', 'invoice', 'order' |
| VAL-004 | Medium | **No currency validation** - Currency hardcoded ke IDR | Validate atau make configurable |
| VAL-005 | Medium | **Missing invoice_id/payment_id/order_id** - Tidak ada pengecekan bahwa minimal satu ID disediakan | Tambah validation minimal 1 ID required |

## 3. UX & Flow Pengguna

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| UX-001 | High | **No payment status polling** - User harus refresh manual untuk melihat status update | Implement realtime subscription atau polling |
| UX-002 | High | **Success page tidak handle subscription payments** - Navigasi hardcode ke tenant routes | Detect payment type dan navigate accordingly |
| UX-003 | Medium | **Generic error messages** - Error messages tidak informatif untuk user | Provide user-friendly error descriptions |
| UX-004 | Medium | **No payment confirmation modal** - User langsung redirect ke Xendit tanpa konfirmasi final | Tambah confirmation step |
| UX-005 | Low | **Inconsistent language** - Mix English dan Indonesian | Konsistenkan ke Indonesian |

## 4. Performance

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| PERF-001 | High | **Multiple sequential DB queries in webhook** - Webhook melakukan banyak query sequential | Batch queries atau use transactions |
| PERF-002 | Medium | **No caching for tier data** - Tier data di-fetch untuk setiap subscription webhook | Cache tier data |
| PERF-003 | Medium | **Large webhook function** - `xendit-webhook/index.ts` terlalu besar (500+ lines) | Split into smaller handlers |
| PERF-004 | Low | **Notification email sent synchronously** - Email dikirim dalam webhook flow | Make async/fire-and-forget |

## 5. Security

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| SEC-001 | Critical | **Weak webhook token validation** - Jika token env var tidak set, bypass validation | Fail closed - require token always |
| SEC-002 | Critical | **No request signing verification** - Tidak verify Xendit signature header | Implement HMAC verification |
| SEC-003 | High | **Sensitive data in logs** - Full webhook payload di-log | Mask sensitive fields (email, account) |
| SEC-004 | High | **No rate limiting** - Webhook endpoint bisa di-spam | Implement rate limiting |
| SEC-005 | Medium | **CORS wildcard** - `Access-Control-Allow-Origin: *` terlalu permissive | Restrict ke allowed origins |
| SEC-006 | Medium | **API key exposure risk** - Xendit key used with btoa in multiple places | Centralize key usage |

## 6. Consistency & Data Integrity

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| DATA-001 | Critical | **Non-atomic escrow updates** - Balance update dan transaction insert tidak dalam transaction | Use database transaction |
| DATA-002 | Critical | **Race condition on balance update** - `currentEscrow.balance + netAmount` bisa race | Use atomic update atau pessimistic lock |
| DATA-003 | High | **Status mapping tidak lengkap** - Beberapa Xendit status tidak di-handle | Handle semua possible status |
| DATA-004 | High | **Orphan transactions possible** - Jika Xendit call success tapi DB insert fail, no cleanup | Implement compensating transaction |
| DATA-005 | Medium | **Fee rates hardcoded** - Platform dan gateway fee hardcoded di code | Move to config/database |

## 7. Error Handling & Observability

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| ERR-001 | High | **Silent email failures** - Email errors hanya di-log, tidak di-track | Track email failures untuk retry |
| ERR-002 | High | **No structured logging** - Console.log tanpa structured format | Use structured logging dengan correlation ID |
| ERR-003 | Medium | **Generic error responses** - Error messages tidak distinguish error types | Return specific error codes |
| ERR-004 | Medium | **No webhook delivery tracking** - Tidak track webhook processing results | Store webhook processing logs |
| ERR-005 | Low | **Missing metrics** - Tidak ada metrics untuk payment success rate | Add payment metrics |

## 8. Maintainability

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| MAINT-001 | High | **Massive webhook handler** - Single file handles all payment types (500+ lines) | Split by payment type (subscription, rent, order) |
| MAINT-002 | High | **Duplicate fee calculation** - Fee calculation logic duplicated | Extract to shared utility |
| MAINT-003 | Medium | **Hardcoded URLs** - Redirect URLs constructed inline | Use config constants |
| MAINT-004 | Medium | **Magic numbers** - Invoice duration, fee rates, etc hardcoded | Extract to constants |
| MAINT-005 | Low | **Inconsistent Deno imports** - Different std versions used | Standardize Deno imports |

## 9. Compatibility & Environment

| ID | Severity | Description | Recommendation |
|----|----------|-------------|----------------|
| COMP-001 | High | **Origin header dependency** - Redirect URLs depend on origin header yang bisa null | Use configured base URL |
| COMP-002 | Medium | **Xendit API version not pinned** - Using latest API tanpa version pinning | Pin API version |
| COMP-003 | Medium | **Hardcoded Indonesian locale** - `toLocaleString('id-ID')` hardcoded | Make locale configurable |
| COMP-004 | Low | **Browser-only payment flow** - Modal requires browser untuk redirect | Consider mobile app flow |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 8 |
| High | 14 |
| Medium | 13 |
| Low | 4 |

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Fix webhook token validation - fail if not configured
2. **[CRITICAL]** Implement atomic database operations for escrow updates
3. **[CRITICAL]** Add input validation untuk amount, email, payment_type
4. **[CRITICAL]** Implement Xendit signature verification
5. **[HIGH]** Split large webhook handler into separate functions
6. **[HIGH]** Add realtime payment status updates untuk better UX
7. **[HIGH]** Fix redirect URL construction - use configured base URL
8. **[MEDIUM]** Add structured logging dengan correlation IDs
9. **[MEDIUM]** Extract hardcoded values ke configuration
10. **[LOW]** Standardize language ke Indonesian
