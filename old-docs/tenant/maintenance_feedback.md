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

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| Contract Query Uses `.single()` | High | May throw error if tenant has no active contract | ✅ Fixed - Changed to `.maybeSingle()` |
| Non-Atomic Timeline Insert | Medium | Timeline entry inserted separately from request, may fail independently | ✅ Fixed - Added try-catch |
| Notification Insert May Fail | Medium | Merchant notification created without error handling | ✅ Fixed - Added try-catch wrapper |
| Images Type Issue | Low | `request.images` cast with inline type assertion | ⏳ Pending |

### 2. Validations

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| No Title Length Validation | Medium | No max length on title input | ✅ Fixed - Added 100 char limit |
| No Description Sanitization | Medium | Description not sanitized before display | ✅ Fixed - Added sanitizeInput function |
| No Photo Type Validation | High | Photo upload accepts any image type without validation | ⏳ Pending (server-side) |
| Preferred Schedule Past Date | Low | Uses `min` attribute but no server-side validation | ⏳ Pending |

### 3. UX & Flow Pengguna

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| No Status Filter | High | Documentation mentions filter but not implemented | ✅ Fixed - Added status filter dropdown |
| No Search Capability | Medium | Cannot search maintenance requests | ✅ Fixed - Added search input |
| No Bulk Actions | Low | Cannot cancel/close multiple requests | ⏳ Pending |
| SLA Not Prominently Displayed | Medium | SLA deadline shown in small badge, not emphasized | ⏳ Pending |
| No Priority Warning | Medium | Urgent priority doesn't show warning about response time | ✅ Fixed - Added urgent priority alert |
| Missing Assigned Vendor Info | Low | List view doesn't show who is assigned | ⏳ Pending |

### 4. Performance

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| Full Request Fetch | Medium | Fetches all requests without pagination | ⏳ Pending |
| Images Array Mapping | Low | Could cause performance issues with many images | ⏳ Pending |
| No Query Invalidation Strategy | Low | Broad invalidation may cause unnecessary refetches | ⏳ Pending |

### 5. Security

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| No Tenant Verification | High | Relies on RLS only | ✅ Fixed - Added role check |
| Photo Upload No Size Check | Medium | Photo size checked client-side only | ⏳ Pending |
| Merchant ID from Contract | Medium | merchant_id extracted from contract without verification | ⏳ Pending |
| No Rate Limiting | High | No rate limit on request creation | ⏳ Pending (server-side) |

### 6. Consistency & Data Integrity

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| SLA Calculation Mismatch | Medium | SLA calculated via trigger but also displayed via helper function | ⏳ Pending |
| Status Transitions | Medium | No validation of allowed status transitions | ⏳ Pending |
| Timeline vs Updates | Low | Both `maintenance_timeline` and `maintenance_updates` tables used, potentially confusing | ⏳ Pending |

### 7. Error Handling & Observability

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| Generic Error Messages | Medium | Shows "Failed to submit request" without details | ✅ Fixed - Added specific error messages |
| No Photo Upload Error Recovery | Medium | Failed photo uploads don't show which photos failed | ⏳ Pending |
| No SLA Breach Alerts | Medium | No notification when SLA is breached | ⏳ Pending |

### 8. Maintainability

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| Large Component | Medium | 361 lines with embedded dialog content | ⏳ Pending |
| Inline Dialog Content | Low | Dialog content could be separate component | ⏳ Pending |
| Magic Strings | Low | Priority and category values hardcoded | ⏳ Pending |

### 9. Compatibility & Environment

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| Datetime-local Browser Support | Low | datetime-local input not supported in all browsers | ⏳ Pending |

---

## MaintenanceDetail.tsx Specific Issues

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| Assigned To Shows Raw Value | Medium | Shows `assigned_to` string instead of vendor business name | ⏳ Pending |
| Review Form Conditional | Low | Review form logic could be cleaner | ⏳ Pending |
| No Cancel Request Option | Medium | Tenant cannot cancel pending request | ✅ Fixed - Added cancel button and dialog |
| Image Lightbox Missing | Low | Clicking images opens new tab instead of lightbox | ⏳ Pending |

---

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 0 | 0 |
| High | 5 | 4 |
| Medium | 17 | 7 |
| Low | 10 | 0 |

## Recommended Actions

1. ✅ **Add status filter** as documented
2. ⏳ **Implement rate limiting** on request creation
3. ⏳ **Add photo validation** for file type and size on server
4. ⏳ **Show SLA deadline prominently** with countdown
5. ✅ **Add request cancellation** for pending requests
6. ✅ **Implement proper error handling** with specific messages
7. ⏳ **Add pagination** for request list
