# Admin Merchant Management Feedback

## Overview
Feedback untuk fitur merchant management termasuk verifikasi dan approval di admin panel.

## File Reviewed
- `src/pages/admin/Merchants.tsx`
- `src/components/admin/BulkApprovalDialog.tsx`
- `src/components/admin/RejectionReasonForm.tsx`
- `src/components/admin/MerchantVerificationHistory.tsx`
- `docs/admin/merchant-management.md`

---

## Bugs & Errors

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| BUG-01 | **Bulk approval not atomic** - Each merchant approved in loop, partial failure possible | High | `Merchants.tsx:371-441` |
| BUG-02 | **Type assertion unsafe** - `data as unknown as Merchant[]` double assertion | Medium | `Merchants.tsx:153` |
| BUG-03 | **Email notification failure ignored** - Email failure di-catch tapi continue anyway | Medium | `Merchants.tsx:288-292` |
| BUG-04 | **Progress simulation fake** - BulkApprovalDialog progress tidak reflect actual progress | Low | `BulkApprovalDialog.tsx:31-33` |

---

## Validations

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| VAL-01 | **No document verification** - Docs tidak di-verify sebelum approval | High | `Merchants.tsx:202-313` |
| VAL-02 | **Rejection details optional** - Details required hanya jika reason 'other' | Medium | `RejectionReasonForm.tsx` |
| VAL-03 | **Approval notes optional** - Bisa approve tanpa catatan sama sekali | Low | `Merchants.tsx:219-221` |

---

## UX & Flow Pengguna

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| UX-01 | **Cluttered table UI** - Terlalu banyak columns dan actions dalam satu table | Medium | `Merchants.tsx` |
| UX-02 | **No document preview inline** - Harus open lightbox untuk setiap document | Medium | - |
| UX-03 | **Bulk approval only for pending** - Tidak bisa bulk reject atau bulk suspend | Medium | `Merchants.tsx:443-458` |
| UX-04 | **Search case-sensitive behavior unclear** - toLowerCase used tapi UX tidak clear | Low | `Merchants.tsx:460-467` |
| UX-05 | **No column sorting** - Table columns tidak bisa di-sort | Medium | - |

---

## Performance

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| PERF-01 | **Sequential bulk operations** - Bulk approval dijalankan sequential, bukan parallel | High | `Merchants.tsx:375-432` |
| PERF-02 | **No pagination** - Semua merchants di-load sekaligus | High | `Merchants.tsx:122-163` |
| PERF-03 | **Multiple email sends in bulk** - Each bulk approval sends separate email | Medium | `Merchants.tsx:416-431` |

---

## Security

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| SEC-01 | **No admin role verification in component** - Relies on ProtectedRoute only | High | `Merchants.tsx` |
| SEC-02 | **Admin ID from client auth** - `supabase.auth.getUser()` di client side | High | `Merchants.tsx:212-213, 321-322` |
| SEC-03 | **Verification documents accessible** - Document URLs visible tanpa additional auth | Medium | - |
| SEC-04 | **Audit log user_agent from client** - User agent bisa di-spoof | Low | `Merchants.tsx:250, 343` |

---

## Consistency & Data Integrity

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| DATA-01 | **Status sync issue** - `verified_at` dan `verification_status` bisa out of sync | Medium | `Merchants.tsx:218-221` |
| DATA-02 | **Resubmitted status not used** - Status 'resubmitted' ada di docs tapi tidak fully implemented | Medium | `Merchants.tsx:77-82` |
| DATA-03 | **Notification type inconsistency** - `verification_approved` vs `approved` di different places | Low | - |

---

## Error Handling & Observability

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| ERR-01 | **Generic catch blocks** - Error details lost di catch | Medium | `Merchants.tsx:304-313` |
| ERR-02 | **Email failures logged but not tracked** - Console log only, no DB logging | Medium | `Merchants.tsx:288-292` |
| ERR-03 | **Bulk approval partial failure not reported** - If some fail, no clear feedback | High | `Merchants.tsx:371-441` |

---

## Maintainability

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| MAINT-01 | **Massive component** - 1044 lines, needs refactoring | Critical | `Merchants.tsx` |
| MAINT-02 | **Inline type definitions** - Interface definitions inline di component | Low | `Merchants.tsx:46-75` |
| MAINT-03 | **Duplicated verification logic** - Similar logic in single and bulk approval | Medium | `Merchants.tsx:202-313 vs 371-441` |

---

## Compatibility & Environment

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| COMPAT-01 | **Window.location.origin usage** - Works but not ideal for SSR | Low | `Merchants.tsx:282, 424` |

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 7 |
| Medium | 15 |
| Low | 7 |

---

## Recommended Actions

1. **Critical**: Refactor Merchants.tsx ke smaller components
2. **High**: Implement atomic bulk operations dengan transaction
3. **High**: Implement pagination untuk merchant list
4. **High**: Convert bulk operations ke parallel dengan Promise.all
5. **High**: Report partial failures dalam bulk operations
6. **High**: Verify documents sebelum allow approval
7. **Medium**: Tambahkan column sorting ke table
8. **Medium**: Implement inline document preview
9. **Medium**: Add bulk reject dan bulk suspend options
10. **Medium**: Standardize notification types
