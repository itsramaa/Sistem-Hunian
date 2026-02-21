# Tenant Payments Feedback

## File Location
- `src/pages/tenant/Payments.tsx`
- `src/components/payment/XenditPaymentModal.tsx`
- `src/components/tenant/PaymentPlanCard.tsx`

## Review Summary

### 1. Bugs & Errors

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| Duplicate Invoice Display | Medium | Same invoices can appear in both Due tab and Invoices tab | ✅ Fixed - Separate filtering logic |
| Payment Tracking Hook Issue | Medium | `usePaymentTracking` import may fail silently | ⏳ Pending |
| Status Mismatch | High | Pending invoices filter uses `sent` status, not `pending` | ✅ Fixed - Now includes `sent`, `overdue` |

### 2. Validations

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| No Amount Validation | High | Payment amount passed directly to modal without validation | ✅ Fixed - Added amount validation in handlePayNow |
| No Payment Method Validation | Medium | User can attempt payment without selecting method | ⏳ Pending (in modal) |

### 3. UX & Flow Pengguna

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| No Auto-Pay Setup Access | High | Documentation mentions auto-pay but no UI in this page | ⏳ Pending |
| Confusing Tab Structure | Medium | Three tabs with overlapping data (Due, History, Invoices) | ⏳ Pending |
| No Payment Receipt Download | Medium | No way to download receipt after payment | ⏳ Pending |
| No Payment Status Refresh | Medium | User must manually refresh to see payment status update | ⏳ Pending |
| Missing Date Range Filter | Low | Cannot filter by date range | ⏳ Pending |
| No Payment Confirmation | Medium | No confirmation dialog before payment | ✅ Fixed - Added confirmation dialog |

### 4. Performance

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| Two Separate Queries | Low | Payments and invoices fetched separately | ⏳ Pending |
| No Pagination | Medium | All payments/invoices loaded at once | ⏳ Pending |
| Filtering Done Client-Side | Medium | Could be done server-side | ⏳ Pending |

### 5. Security

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| No Tenant Verification | High | Relies on RLS only | ✅ Fixed - Added role check |
| Client-Side Amount Calculation | Critical | `totalDue` and `totalPaid` calculated client-side | ⏳ Pending |
| Payment ID Exposure | Medium | Invoice/payment IDs exposed in client state | ⏳ Pending |

### 6. Consistency & Data Integrity

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| Payments vs Invoices Confusion | High | Two tables (payments, invoices) with overlapping data | ⏳ Pending |
| Total Calculation Inconsistent | Medium | Total due counts both payments and invoices but may double count | ✅ Fixed - Separate useMemo calculations |

### 7. Error Handling & Observability

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| Silent Query Errors | High | Query errors not displayed to user | ✅ Fixed - Added error state UI |
| No Payment Error Recovery | Medium | Failed payments don't show recovery options | ⏳ Pending |
| Missing Analytics Events | Low | Payment completion not tracked | ⏳ Pending |

### 8. Maintainability

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| Large Component | Medium | 414 lines, should be split | ⏳ Pending |
| Duplicate Type Definitions | Medium | Payment and Invoice types duplicated from Invoices.tsx | ⏳ Pending |
| Complex State Management | Low | Multiple selected states could use reducer | ⏳ Pending |

### 9. Compatibility & Environment

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| Payment Gateway Dependency | Medium | Xendit integration may fail without proper error handling | ⏳ Pending |

---

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 1 | 0 |
| High | 5 | 4 |
| Medium | 14 | 3 |
| Low | 4 | 0 |

## Recommended Actions

1. ✅ **Fix status mismatch** - use consistent status filtering
2. ⏳ **Add auto-pay settings access** as documented
3. ⏳ **Consolidate payment/invoice display** to avoid confusion
4. ⏳ **Implement server-side total calculations** for security
5. ✅ **Add payment confirmation dialog** before processing
6. ⏳ **Implement real-time payment status updates**
