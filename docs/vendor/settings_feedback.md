# Vendor Settings Feedback

## Bugs & Errors
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Critical | Profile update uses wrong column | `Settings.tsx:142` | Updates by `profile.id` but profiles table uses `user_id` |
| Warning | Bank account primary flag race | `Settings.tsx:202-231` | No transaction for checking/updating primary status |
| Warning | Password reset no current password | `Settings.tsx:266-284` | Can change password without verifying current |
| Info | Notification immediate save | `Settings.tsx:191-195` | Each toggle triggers API call |

## Validations
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Critical | Weak password validation | `Settings.tsx:277-279` | Only checks length >= 6, no strength requirements |
| Warning | Phone number no format check | `Settings.tsx:363-364` | Any string accepted for phone |
| Warning | Bank account number no validation | `Settings.tsx:287-291` | No format or length check |
| Warning | Branch code optional risk | `Settings.tsx:212` | Some banks require branch code |
| Info | Full name no validation | `Settings.tsx:341-344` | Can be empty or whitespace only |

## UX & Flow Pengguna
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | 6-tab layout crowded | `Settings.tsx:303-328` | Too many tabs, especially on mobile |
| Warning | No unsaved changes warning | `Settings.tsx` | Can navigate away with unsaved changes |
| Warning | Email cannot be changed | `Settings.tsx:350-357` | No email change option or explanation why |
| Warning | No account deletion option | `Settings.tsx` | Cannot delete vendor account |
| Info | No password strength meter | `Settings.tsx:389-418` | No visual feedback on password strength |
| Info | No 2FA option | `Settings.tsx` | No two-factor authentication setup |

## Performance
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | Multiple queries on mount | `Settings.tsx:62-95` | 3 separate queries for related data |
| Warning | Immediate notification updates | `Settings.tsx:191-195` | Each toggle triggers mutation |
| Info | No debounce on profile updates | `Settings.tsx` | Could debounce profile saves |

## Security
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Critical | Bank details fully visible | `Settings.tsx` | Full account numbers displayed |
| Critical | No current password check | `Settings.tsx:155-168` | Password changed without verification |
| Warning | No session management | `Settings.tsx` | Cannot view/revoke active sessions |
| Warning | Notification settings stored in vendor | `Settings.tsx:175-188` | Should be separate secure table |
| Info | No login history | `Settings.tsx` | Cannot view recent login attempts |

## Consistency & Data Integrity
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | Bank table name mismatch | `Settings.tsx:67` | Uses `vendor_bank_accounts` but doc says `bank_accounts` |
| Warning | Profile vs Profiles inconsistency | `Settings.tsx:133-152` | Updates profiles table, not profile |
| Info | Notification defaults | `Settings.tsx:107-115` | Defaults to true if null, not explicit |

## Error Handling & Observability
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | Generic error messages | `Settings.tsx:150-152, 166-168` | Shows raw error.message |
| Warning | No form error state | `Settings.tsx` | Errors shown only via toast |
| Info | No loading states for tabs | `Settings.tsx` | Content loads without feedback |

## Maintainability
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Critical | Very large component | `Settings.tsx` | 613+ lines, needs major refactoring |
| Warning | Multiple concerns in one file | `Settings.tsx` | Profile, password, notifications, banking, disbursement, verification |
| Warning | Inline state management | `Settings.tsx:40-70` | Multiple useState could be consolidated |
| Info | No form library | `Settings.tsx` | Should use react-hook-form for complex forms |

## Compatibility & Environment
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | Tab labels hidden on mobile | `Settings.tsx:304-328` | Only icons visible on small screens |
| Info | Form inputs not optimized for mobile | `Settings.tsx` | Input types could be improved (tel, etc.) |

## Summary
| Severity | Count |
|----------|-------|
| Critical | 5 |
| Warning | 18 |
| Info | 11 |

## Recommended Actions
1. Fix profile update to use user_id instead of profile.id
2. Require current password before allowing password change
3. Mask bank account numbers (show last 4 digits only)
4. Split large component into separate tab components
5. Add form validation with react-hook-form + zod
6. Add password strength requirements and meter
7. Implement 2FA option for vendor accounts
8. Add unsaved changes warning before navigation
