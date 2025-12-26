# Tenant Maintenance Feedback

## File Location
- `src/pages/tenant/Maintenance.tsx`
- `src/pages/tenant/MaintenanceDetail.tsx`
- `src/components/maintenance/MaintenancePhotoUpload.tsx`
- `src/components/maintenance/MaintenanceReplyForm.tsx`
- `src/components/maintenance/MaintenanceReviewForm.tsx`
- `src/components/maintenance/UpdateTimeline.tsx`
- `src/components/maintenance/SLABadge.tsx`

## Review Summary

### 1. Bugs & Errors

| Issue | Severity | Description |
|-------|----------|-------------|
| Contract Query Uses `.single()` | High | May throw error if tenant has no active contract |
| Non-Atomic Timeline Insert | Medium | Timeline entry inserted separately from request, may fail independently |
| Notification Insert May Fail | Medium | Merchant notification created without error handling |
| Images Type Issue | Low | `request.images` cast with inline type assertion |

### 2. Validations

| Issue | Severity | Description |
|-------|----------|-------------|
| No Title Length Validation | Medium | No max length on title input |
| No Description Sanitization | Medium | Description not sanitized before display |
| No Photo Type Validation | High | Photo upload accepts any image type without validation |
| Preferred Schedule Past Date | Low | Uses `min` attribute but no server-side validation |

### 3. UX & Flow Pengguna

| Issue | Severity | Description |
|-------|----------|-------------|
| No Status Filter | High | Documentation mentions filter but not implemented |
| No Search Capability | Medium | Cannot search maintenance requests |
| No Bulk Actions | Low | Cannot cancel/close multiple requests |
| SLA Not Prominently Displayed | Medium | SLA deadline shown in small badge, not emphasized |
| No Priority Warning | Medium | Urgent priority doesn't show warning about response time |
| Missing Assigned Vendor Info | Low | List view doesn't show who is assigned |

### 4. Performance

| Issue | Severity | Description |
|-------|----------|-------------|
| Full Request Fetch | Medium | Fetches all requests without pagination |
| Images Array Mapping | Low | Could cause performance issues with many images |
| No Query Invalidation Strategy | Low | Broad invalidation may cause unnecessary refetches |

### 5. Security

| Issue | Severity | Description |
|-------|----------|-------------|
| No Tenant Verification | High | Relies on RLS only |
| Photo Upload No Size Check | Medium | Photo size checked client-side only |
| Merchant ID from Contract | Medium | merchant_id extracted from contract without verification |
| No Rate Limiting | High | No rate limit on request creation |

### 6. Consistency & Data Integrity

| Issue | Severity | Description |
|-------|----------|-------------|
| SLA Calculation Mismatch | Medium | SLA calculated via trigger but also displayed via helper function |
| Status Transitions | Medium | No validation of allowed status transitions |
| Timeline vs Updates | Low | Both `maintenance_timeline` and `maintenance_updates` tables used, potentially confusing |

### 7. Error Handling & Observability

| Issue | Severity | Description |
|-------|----------|-------------|
| Generic Error Messages | Medium | Shows "Failed to submit request" without details |
| No Photo Upload Error Recovery | Medium | Failed photo uploads don't show which photos failed |
| No SLA Breach Alerts | Medium | No notification when SLA is breached |

### 8. Maintainability

| Issue | Severity | Description |
|-------|----------|-------------|
| Large Component | Medium | 361 lines with embedded dialog content |
| Inline Dialog Content | Low | Dialog content could be separate component |
| Magic Strings | Low | Priority and category values hardcoded |

### 9. Compatibility & Environment

| Issue | Severity | Description |
|-------|----------|-------------|
| Datetime-local Browser Support | Low | datetime-local input not supported in all browsers |

---

## MaintenanceDetail.tsx Specific Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| Assigned To Shows Raw Value | Medium | Shows `assigned_to` string instead of vendor business name |
| Review Form Conditional | Low | Review form logic could be cleaner |
| No Cancel Request Option | Medium | Tenant cannot cancel pending request |
| Image Lightbox Missing | Low | Clicking images opens new tab instead of lightbox |

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 5 |
| Medium | 17 |
| Low | 10 |

## Recommended Actions

1. **Add status filter** as documented
2. **Implement rate limiting** on request creation
3. **Add photo validation** for file type and size on server
4. **Show SLA deadline prominently** with countdown
5. **Add request cancellation** for pending requests
6. **Implement proper error handling** with specific messages
7. **Add pagination** for request list
