# Merchant Tenants Feedback

## Overview
Comprehensive review of Merchant Tenants Management feature implementation.

## Files Reviewed
- `src/pages/merchant/Tenants.tsx`
- `src/components/tenant/TenantProfileForm.tsx`

## Issues & Findings

### Bugs & Errors
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| TEN-B01 | High | Resend invitation only shows toast, doesn't actually resend email | resendInvitation | Implement actual email resend |
| TEN-B02 | High | window.location.origin for invite URL may not work in all environments | copyInvitationLink | Use environment-based URL |
| TEN-B03 | Medium | Invitation expiry not clearly communicated in UI | Table | Show time remaining |
| TEN-B04 | Medium | No check for existing pending invitation to same email | handleSendInvitation | Prevent duplicate invitations |
| TEN-B05 | Low | Transform of invitation data is complex and error-prone | fetchData | Simplify data transformation |

### Validations
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| TEN-V01 | High | Phone validation too loose (optional, no format) | invitationSchema | Add proper phone format validation |
| TEN-V02 | High | No validation for unit already having pending invitation | handleSendInvitation | Check for existing invitations |
| TEN-V03 | Medium | Email uniqueness not checked per merchant | handleSendInvitation | Prevent duplicate tenant invitations |

### UX & Flow Pengguna
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| TEN-U01 | High | No view of active tenants, only invitations | Tenants.tsx | Add active tenants section |
| TEN-U02 | High | Tenant transfer feature mentioned in docs but not implemented | Tenants.tsx | Implement tenant transfer |
| TEN-U03 | Medium | No bulk invitation feature | Tenants.tsx | Add bulk invite capability |
| TEN-U04 | Medium | Cannot edit invitation after sending | Table actions | Allow email/unit change |
| TEN-U05 | Low | Copy button lacks feedback beyond toast | copyInvitationLink | Add visual indicator |

### Performance
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| TEN-P01 | Medium | useEffect with fetchData pattern (not React Query) | useEffect | Convert to React Query |
| TEN-P02 | Medium | All data fetched on every render potentially | fetchData | Use proper caching |
| TEN-P03 | Low | Available units calculated on every render | availableUnits | Memoize calculation |

### Security
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| TEN-S01 | Critical | Invitation token visible in URL when copied | copyInvitationLink | Consider token obfuscation |
| TEN-S02 | High | No rate limiting on invitation creation | handleSendInvitation | Add rate limiting |
| TEN-S03 | High | Token exposure in invitation table | Table | Consider masking token |
| TEN-S04 | Medium | Cancelled invitations keep token visible | Table | Clear/invalidate token |

### Consistency & Data Integrity
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| TEN-C01 | High | Unit status not updated when invitation accepted | Invitation flow | Trigger unit update on accept |
| TEN-C02 | High | Active tenants from contracts, invitations separate | Data model | Clarify tenant lifecycle |
| TEN-C03 | Medium | Invitation status changes don't trigger notifications | cancelInvitation | Notify relevant parties |

### Error Handling & Observability
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| TEN-E01 | High | Cancel invitation failure doesn't show specific error | cancelInvitation | Show detailed error |
| TEN-E02 | Medium | Console.error for fetch failures | fetchData | Add user-facing error state |
| TEN-E03 | Low | No retry mechanism for failed operations | Mutations | Add retry option |

### Maintainability
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| TEN-M01 | High | File is 483 lines with mixed concerns | Tenants.tsx | Split into components |
| TEN-M02 | Medium | Data transformation logic complex | fetchData | Extract to utility |
| TEN-M03 | Medium | Status colors defined inline | statusColors | Move to shared constants |

### Compatibility & Environment
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| TEN-X01 | Medium | window.location.origin may not work in SSR | copyInvitationLink | Use environment variable |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 12 |
| Medium | 11 |
| Low | 4 |

## Recommended Actions
1. Implement actual email resend functionality
2. Add active tenants view (from contracts)
3. Add invitation validation (no duplicates for email/unit)
4. Implement token security (masking, expiration handling)
5. Convert to React Query for data fetching
6. Refactor large component into smaller files
7. Implement tenant transfer feature as documented
8. Add rate limiting on invitation creation
