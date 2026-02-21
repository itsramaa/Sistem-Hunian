# Tenant Invoices Feedback

## File Location
- `src/pages/tenant/Invoices.tsx`
- `src/components/tenant/PaymentPlanCard.tsx`
- `src/components/payment/XenditPaymentModal.tsx`

## Review Summary

### 1. Bugs & Errors

| Issue | Severity | Description |
|-------|----------|-------------|
| PDF Opens Print Dialog | Medium | `downloadInvoicePdf` opens print window instead of actual PDF download |
| No Auth Token in PDF Request | High | PDF generation request doesn't include auth token |
| Payment Modal Missing Contract Info | Medium | Payment modal doesn't include contract reference |

### 2. Validations

| Issue | Severity | Description |
|-------|----------|-------------|
| No Invoice Status Validation | Low | Allows payment attempt on any invoice status |
| No Amount Verification | Medium | Client-side amount used without server validation |

### 3. UX & Flow Pengguna

| Issue | Severity | Description |
|-------|----------|-------------|
| No Status Filter | High | Documentation mentions filter by status but not implemented |
| No Pagination | Medium | All invoices loaded at once, no pagination |
| No Search Capability | Medium | Cannot search invoices by number or description |
| Table Not Mobile Friendly | High | Wide table doesn't adapt well to mobile screens |
| No Invoice Detail View | Medium | No modal/page to see full invoice details |
| Late Fee Not Explained | Low | Shows late fee badge but no tooltip explaining fee calculation |

### 4. Performance

| Issue | Severity | Description |
|-------|----------|-------------|
| Full Invoice Fetch | Medium | Fetches all invoices without limit/pagination |
| Separate Payment Plans Query | Low | Could be combined with invoice query |

### 5. Security

| Issue | Severity | Description |
|-------|----------|-------------|
| No Tenant Verification | High | Relies on RLS only, no explicit tenant check |
| Client-Side Amount Handling | High | Total amount sent to payment gateway from client state |
| PDF URL Exposure | Medium | PDF generation endpoint may be accessible without proper auth |

### 6. Consistency & Data Integrity

| Issue | Severity | Description |
|-------|----------|-------------|
| Status Filtering Inconsistent | Medium | `pendingInvoices` filters `pending`, `sent`, `overdue` but payment tab only shows `sent` |
| Total Calculation Client-Side | Medium | Should verify total matches server calculation |

### 7. Error Handling & Observability

| Issue | Severity | Description |
|-------|----------|-------------|
| Generic PDF Error | Medium | Shows generic error message without details |
| No Payment Tracking | Low | No analytics for invoice payment attempts |
| No Error State UI | Medium | Failed queries show nothing, not error state |

### 8. Maintainability

| Issue | Severity | Description |
|-------|----------|-------------|
| Duplicate Type Definitions | Medium | Invoice type defined in multiple files |
| Large Component | Medium | 408 lines, should be split |
| Hardcoded SUPABASE_URL | Low | Could use environment variable helper |

### 9. Compatibility & Environment

| Issue | Severity | Description |
|-------|----------|-------------|
| Print Window Popup Blocking | Medium | Print window may be blocked by browser |

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 4 |
| Medium | 14 |
| Low | 4 |

## Recommended Actions

1. **Implement actual PDF download** instead of print window
2. **Add status filter dropdown** as documented
3. **Create mobile-friendly invoice cards** for small screens
4. **Implement pagination** for invoice list
5. **Add server-side payment amount verification** in edge function
6. **Add proper auth token** to PDF generation request
