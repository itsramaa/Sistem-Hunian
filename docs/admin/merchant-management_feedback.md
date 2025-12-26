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

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| BUG-01 | **Bulk approval not atomic** - Each merchant approved in loop, partial failure possible | High | - |
| BUG-02 | **Type assertion unsafe** - `data as unknown as Merchant[]` double assertion | Medium | ✅ Fixed |
| BUG-03 | **Email notification failure ignored** - Email failure di-catch tapi continue anyway | Medium | - |
| BUG-04 | **Progress simulation fake** - BulkApprovalDialog progress tidak reflect actual progress | Low | - |

---

## Validations

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| VAL-01 | **No document verification** - Docs tidak di-verify sebelum approval | High | ✅ Fixed |
| VAL-02 | **Rejection details optional** - Details required hanya jika reason 'other' | Medium | ✅ Fixed |
| VAL-03 | **Approval notes optional** - Bisa approve tanpa catatan sama sekali | Low | - |

---

## UX & Flow Pengguna

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| UX-01 | **Cluttered table UI** - Terlalu banyak columns dan actions dalam satu table | Medium | - |
| UX-02 | **No document preview inline** - Harus open lightbox untuk setiap document | Medium | ✅ Fixed |
| UX-03 | **Bulk approval only for pending** - Tidak bisa bulk reject atau bulk suspend | Medium | - |
| UX-04 | **Search case-sensitive behavior unclear** - toLowerCase used tapi UX tidak clear | Low | - |
| UX-05 | **No column sorting** - Table columns tidak bisa di-sort | Medium | - |

---

## Performance

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| PERF-01 | **Sequential bulk operations** - Bulk approval dijalankan sequential, bukan parallel | High | - |
| PERF-02 | **No pagination** - Semua merchants di-load sekaligus | High | ✅ Fixed |
| PERF-03 | **Multiple email sends in bulk** - Each bulk approval sends separate email | Medium | - |

---

## Security

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| SEC-01 | **No admin role verification in component** - Relies on ProtectedRoute only | High | ✅ Fixed |
| SEC-02 | **Admin ID from client auth** - `supabase.auth.getUser()` di client side | High | - |
| SEC-03 | **Verification documents accessible** - Document URLs visible tanpa additional auth | Medium | - |
| SEC-04 | **Audit log user_agent from client** - User agent bisa di-spoof | Low | - |

---

## Consistency & Data Integrity

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| DATA-01 | **Status sync issue** - `verified_at` dan `verification_status` bisa out of sync | Medium | - |
| DATA-02 | **Resubmitted status not used** - Status 'resubmitted' ada di docs tapi tidak fully implemented | Medium | - |
| DATA-03 | **Notification type inconsistency** - `verification_approved` vs `approved` di different places | Low | - |

---

## Error Handling & Observability

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| ERR-01 | **Generic catch blocks** - Error details lost di catch | Medium | ✅ Fixed |
| ERR-02 | **Email failures logged but not tracked** - Console log only, no DB logging | Medium | - |
| ERR-03 | **Bulk approval partial failure not reported** - If some fail, no clear feedback | High | - |

---

## Maintainability

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| MAINT-01 | **Massive component** - 1044 lines, needs refactoring | Critical | - |
| MAINT-02 | **Inline type definitions** - Interface definitions inline di component | Low | - |
| MAINT-03 | **Duplicated verification logic** - Similar logic in single and bulk approval | Medium | - |

---

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 1 | 0 |
| High | 7 | 3 |
| Medium | 15 | 4 |
| Low | 7 | 0 |

---

## Recommended Actions

1. **Critical**: Refactor Merchants.tsx ke smaller components
2. **High**: Implement atomic bulk operations dengan transaction
3. ✅ **High**: Implement pagination untuk merchant list
4. **High**: Convert bulk operations ke parallel dengan Promise.all
5. **High**: Report partial failures dalam bulk operations
6. ✅ **High**: Verify documents sebelum allow approval
7. **Medium**: Tambahkan column sorting ke table
8. ✅ **Medium**: Implement inline document preview
9. **Medium**: Add bulk reject dan bulk suspend options
10. **Medium**: Standardize notification types
