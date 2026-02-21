# Tenant Settings Feedback

## File Location
- `src/pages/tenant/Settings.tsx`
- `src/pages/tenant/Profile.tsx`
- `src/components/tenant/TenantProfileForm.tsx`
- `src/components/tenant/MoveOutDashboard.tsx`
- `src/components/tenant/MoveOutNoticeDialog.tsx`

## Review Summary

### 1. Bugs & Errors

| Issue | Severity | Description |
|-------|----------|-------------|
| Notification Prefs Update Uses `as any` | Medium | Type assertion used for JSON field update |
| Theme Not Persisted to Server | Low | Theme stored in localStorage only, not synced across devices |
| TenantProfileForm No Current Password | High | Profile update doesn't require current password verification |
| MoveOutDashboard Query Cascade | Medium | Multiple dependent queries may cause loading issues |

### 2. Validations

| Issue | Severity | Description |
|-------|----------|-------------|
| No KTP Number Format Validation | High | NIK (16 digits) not validated properly |
| No Phone Format Validation | Medium | Emergency contact phone not validated |
| No DOB Range Validation | Medium | Date of birth accepts any date |
| Profile Form No Required Fields | High | All fields optional, could submit empty profile |

### 3. UX & Flow Pengguna

| Issue | Severity | Description |
|-------|----------|-------------|
| Missing Tabs from Docs | High | Docs mention Auto-pay settings, Move-out, Transfer but not in Settings.tsx |
| No Password Change | High | Settings page doesn't include password change option |
| Theme Saved Without Confirmation | Low | Theme changes applied immediately without save button |
| No Profile Link | Medium | Settings doesn't link to Profile page |
| No Auto-Pay Settings | Critical | Documented feature not implemented |
| No Request Transfer | High | Documented feature not implemented |

### 4. Performance

| Issue | Severity | Description |
|-------|----------|-------------|
| Multiple Queries in MoveOutDashboard | Medium | 5+ queries run for dashboard, could be optimized |
| localStorage Sync on Every Render | Low | Theme read from localStorage on mount |

### 5. Security

| Issue | Severity | Description |
|-------|----------|-------------|
| No Tenant Role Verification | High | Settings page doesn't verify tenant role |
| KTP Photo Storage | Medium | KTP uploaded to potentially public bucket |
| No PII Encryption | High | KTP number stored in plain text |
| Theme XSS Risk | Low | Theme value from localStorage used without validation |

### 6. Consistency & Data Integrity

| Issue | Severity | Description |
|-------|----------|-------------|
| Notification Prefs Schema | Medium | Notification preferences structure not strictly typed |
| Profile vs Tenant Table | Medium | Some data in profiles, some in tenants, split unclear |

### 7. Error Handling & Observability

| Issue | Severity | Description |
|-------|----------|-------------|
| Generic Error Messages | Medium | Uses toast.error without specific messages |
| No KTP Upload Error Details | Medium | KTP upload failure shows generic message |
| MoveOut Task Toggle Error | Low | Task toggle error handling is basic |

### 8. Maintainability

| Issue | Severity | Description |
|-------|----------|-------------|
| TenantProfileForm Large | Medium | 345 lines, could be split |
| MoveOutDashboard Large | High | 421 lines with complex logic |
| Hardcoded Notification Types | Low | Notification preference keys hardcoded |

### 9. Compatibility & Environment

| Issue | Severity | Description |
|-------|----------|-------------|
| Theme System Preference | Low | System preference listener not cleaned up properly |

---

## MoveOutDashboard Specific Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| Non-Atomic Task Updates | Medium | Task completion updated without transaction |
| Inspection Confirm No Validation | Medium | Inspection can be confirmed without proper checks |
| Timeline Steps Hardcoded | Low | TIMELINE_STEPS should match database enum |
| Deposit Calculation Display | Medium | Deductions shown but breakdown not always available |

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 9 |
| Medium | 14 |
| Low | 7 |

## Recommended Actions

1. **Implement Auto-Pay settings** as documented
2. **Add password change functionality** to settings
3. **Implement Request Transfer** feature as documented
4. **Add KTP number validation** (16 digits, checksum if applicable)
5. **Encrypt PII data** (KTP number) at rest
6. **Add tenant role verification** before showing settings
7. **Split large components** into smaller, focused ones
8. **Use private storage bucket** for KTP photos with proper access controls
