# Tenant Contracts Feedback

## File Location
- `src/pages/tenant/Contracts.tsx`
- `src/pages/tenant/SignContract.tsx`
- `src/components/signature/SignaturePad.tsx`
- `src/components/tenant/MoveOutNoticeDialog.tsx`
- `src/components/tenant/MoveOutDashboard.tsx`

## Review Summary

### 1. Bugs & Errors

| Issue | Severity | Description |
|-------|----------|-------------|
| Contract Download URL Issue | High | Uses `generate-invoice-pdf` function for contract download, wrong endpoint |
| Currency Prefix Wrong | Medium | Shows "R" instead of "Rp" for Indonesian Rupiah |
| Early Termination Logic | Medium | `differenceInDays > 30` logic unclear - should check against notice_period_days from contract |
| No Contract Document Validation | Medium | Allows download even if `contract_document_url` is null |

### 2. Validations

| Issue | Severity | Description |
|-------|----------|-------------|
| No Move-Out Date Validation | High | Move-out notice dialog doesn't validate date against notice_period_days |
| Missing Signature Validation | Medium | No check if signature is properly saved before allowing contract actions |

### 3. UX & Flow Pengguna

| Issue | Severity | Description |
|-------|----------|-------------|
| No Contract Renewal Option | Medium | No UI to request contract renewal |
| Limited Contract History Info | Low | Past contracts show minimal info, no ability to download |
| No Pending Signature Reminder | Medium | No prominent reminder if signature is pending |
| Confusing Early Termination Flow | High | Button appears without context on penalties |
| Missing Contract Terms Preview | Low | Terms shown inline, should have expandable modal for long terms |

### 4. Performance

| Issue | Severity | Description |
|-------|----------|-------------|
| Full Contract Fetch | Low | Fetches all contract data even for list view |
| No Lazy Loading | Low | All contracts loaded at once |

### 5. Security

| Issue | Severity | Description |
|-------|----------|-------------|
| No Tenant Ownership Verification | High | Page relies solely on RLS, no explicit tenant check |
| Contract Document URL Exposure | Medium | Public URL for contract documents may expose sensitive data |
| No Signature Verification | High | No verification that signature actually belongs to logged-in user |

### 6. Consistency & Data Integrity

| Issue | Severity | Description |
|-------|----------|-------------|
| Signature Status Mismatch | Medium | `signature_status` may not sync with actual signature URLs |
| Move-Out Notice State | Medium | `move_out_notice_given` may not reflect actual notice record |

### 7. Error Handling & Observability

| Issue | Severity | Description |
|-------|----------|-------------|
| No Error Handling for Download | High | Contract download failure not handled |
| Silent Signature Errors | Medium | Signature upload failures may not be properly reported |

### 8. Maintainability

| Issue | Severity | Description |
|-------|----------|-------------|
| selectedContract Type 'any' | Medium | Uses `any` type for selectedContract state |
| Mixed Concerns | Low | Component handles both view and move-out logic |

### 9. Compatibility & Environment

| Issue | Severity | Description |
|-------|----------|-------------|
| PDF Generation Dependency | Medium | Relies on external edge function that may fail |

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 5 |
| Medium | 11 |
| Low | 4 |

## Recommended Actions

1. **Fix currency display** from "R" to "Rp" for Indonesian Rupiah
2. **Create proper contract PDF endpoint** separate from invoice PDF
3. **Add move-out date validation** against contract's notice_period_days
4. **Implement proper error handling** for document downloads
5. **Add signature verification** to ensure logged-in user is signing
6. **Show early termination penalty preview** before allowing request
