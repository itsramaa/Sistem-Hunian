# Tenant Payments Feedback

## File Location
- `src/pages/tenant/Payments.tsx`
- `src/components/payment/XenditPaymentModal.tsx`
- `src/components/tenant/PaymentPlanCard.tsx`

## Review Summary

### 1. Bugs & Errors

| Issue | Severity | Description |
|-------|----------|-------------|
| Duplicate Invoice Display | Medium | Same invoices can appear in both Due tab and Invoices tab |
| Payment Tracking Hook Issue | Medium | `usePaymentTracking` import may fail silently |
| Status Mismatch | High | Pending invoices filter uses `sent` status, not `pending` |

### 2. Validations

| Issue | Severity | Description |
|-------|----------|-------------|
| No Amount Validation | High | Payment amount passed directly to modal without validation |
| No Payment Method Validation | Medium | User can attempt payment without selecting method |

### 3. UX & Flow Pengguna

| Issue | Severity | Description |
|-------|----------|-------------|
| No Auto-Pay Setup Access | High | Documentation mentions auto-pay but no UI in this page |
| Confusing Tab Structure | Medium | Three tabs with overlapping data (Due, History, Invoices) |
| No Payment Receipt Download | Medium | No way to download receipt after payment |
| No Payment Status Refresh | Medium | User must manually refresh to see payment status update |
| Missing Date Range Filter | Low | Cannot filter by date range |
| No Payment Confirmation | Medium | No confirmation dialog before payment |

### 4. Performance

| Issue | Severity | Description |
|-------|----------|-------------|
| Two Separate Queries | Low | Payments and invoices fetched separately |
| No Pagination | Medium | All payments/invoices loaded at once |
| Filtering Done Client-Side | Medium | Could be done server-side |

### 5. Security

| Issue | Severity | Description |
|-------|----------|-------------|
| No Tenant Verification | High | Relies on RLS only |
| Client-Side Amount Calculation | Critical | `totalDue` and `totalPaid` calculated client-side |
| Payment ID Exposure | Medium | Invoice/payment IDs exposed in client state |

### 6. Consistency & Data Integrity

| Issue | Severity | Description |
|-------|----------|-------------|
| Payments vs Invoices Confusion | High | Two tables (payments, invoices) with overlapping data |
| Total Calculation Inconsistent | Medium | Total due counts both payments and invoices but may double count |

### 7. Error Handling & Observability

| Issue | Severity | Description |
|-------|----------|-------------|
| Silent Query Errors | High | Query errors not displayed to user |
| No Payment Error Recovery | Medium | Failed payments don't show recovery options |
| Missing Analytics Events | Low | Payment completion not tracked |

### 8. Maintainability

| Issue | Severity | Description |
|-------|----------|-------------|
| Large Component | Medium | 414 lines, should be split |
| Duplicate Type Definitions | Medium | Payment and Invoice types duplicated from Invoices.tsx |
| Complex State Management | Low | Multiple selected states could use reducer |

### 9. Compatibility & Environment

| Issue | Severity | Description |
|-------|----------|-------------|
| Payment Gateway Dependency | Medium | Xendit integration may fail without proper error handling |

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 5 |
| Medium | 14 |
| Low | 4 |

## Recommended Actions

1. **Fix status mismatch** - use consistent status filtering
2. **Add auto-pay settings access** as documented
3. **Consolidate payment/invoice display** to avoid confusion
4. **Implement server-side total calculations** for security
5. **Add payment confirmation dialog** before processing
6. **Implement real-time payment status updates**
