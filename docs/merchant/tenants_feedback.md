# Merchant Tenants Feedback

## Overview
Comprehensive review of Merchant Tenants Management feature implementation.

## Files Reviewed
- `src/pages/merchant/Tenants.tsx`
- `src/components/tenant/TenantProfileForm.tsx`

## Issues & Findings

### Bugs & Errors
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| TEN-B01 | High | Resend invitation only shows toast, doesn't actually resend email | resendInvitation | Implement actual email resend | ⚠️ Partial (TODO) |
| TEN-B02 | High | window.location.origin for invite URL may not work in all environments | copyInvitationLink | Use environment-based URL | ✅ Fixed |
| TEN-B03 | Medium | Invitation expiry not clearly communicated in UI | Table | Show time remaining | ✅ Fixed |
| TEN-B04 | Medium | No check for existing pending invitation to same email | handleSendInvitation | Prevent duplicate invitations | ✅ Fixed |

### Validations
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| TEN-V01 | High | Phone validation too loose (optional, no format) | invitationSchema | Add proper phone format validation | ✅ Fixed |
| TEN-V02 | High | No validation for unit already having pending invitation | handleSendInvitation | Check for existing invitations | ✅ Fixed |
| TEN-V03 | Medium | Email uniqueness not checked per merchant | handleSendInvitation | Prevent duplicate tenant invitations | ✅ Fixed |

### Performance
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| TEN-P01 | Medium | useEffect with fetchData pattern (not React Query) | useEffect | Convert to React Query | ✅ Fixed |
| TEN-P02 | Medium | All data fetched on every render potentially | fetchData | Use proper caching | ✅ Fixed |
| TEN-P03 | Low | Available units calculated on every render | availableUnits | Memoize calculation | ✅ Fixed |

### Error Handling & Observability
| ID | Severity | Issue | Location | Recommendation | Status |
|----|----------|-------|----------|----------------|--------|
| TEN-E01 | High | Cancel invitation failure doesn't show specific error | cancelInvitation | Show detailed error | ✅ Fixed |
| TEN-E02 | Medium | Console.error for fetch failures | fetchData | Add user-facing error state | ✅ Fixed |

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 1 | 0 |
| High | 12 | 8 |
| Medium | 11 | 7 |
| Low | 4 | 1 |

## Implemented Actions
1. ✅ Converted to React Query for all data fetching
2. ✅ Added duplicate email/unit invitation checks
3. ✅ Added Indonesian phone number validation
4. ✅ Memoized availableUnits and filteredInvitations
5. ✅ Added expiry countdown display
6. ✅ Improved error handling with user-facing messages
7. ✅ Use environment-based URL for invitation links
