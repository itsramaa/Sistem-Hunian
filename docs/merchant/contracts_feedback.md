# Merchant Contracts Feedback

## Overview
Comprehensive review of Merchant Contracts Management feature implementation.

## Files Reviewed
- `src/pages/merchant/Contracts.tsx`
- `src/components/merchant/ContractDocumentUpload.tsx`
- `src/components/merchant/ContractNoticePeriod.tsx`
- `src/components/signature/SignaturePad.tsx`

## Issues & Findings

### Bugs & Errors
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| CON-B01 | Critical | Contract creation doesn't update unit status to occupied | handleCreateContract | Auto-update unit status when contract is activated |
| CON-B02 | High | Signature upload uses verification-documents bucket (not private) | signContractMutation | Use contract-documents private bucket |
| CON-B03 | High | getPublicUrl on private bucket won't work correctly | signContractMutation | Use signed URL or move to public bucket with proper naming |
| CON-B04 | Medium | End date validation doesn't prevent past dates | contractSchema | Add refinement to ensure end_date > today |
| CON-B05 | Medium | Contract can be created with end_date before start_date | contractSchema | Add cross-field validation |

### Validations
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| CON-V01 | High | No validation that unit isn't already under active contract | handleCreateContract | Check for existing active contracts on unit |
| CON-V02 | High | No validation that tenant isn't already on another active contract | handleCreateContract | Check for existing active contracts for tenant |
| CON-V03 | Medium | Terms field has no length limit in UI | contractSchema | Add max length validation |
| CON-V04 | Medium | Deposit amount can be negative | contractSchema | Add min(0) validation |

### UX & Flow Pengguna
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| CON-U01 | High | No preview of contract before creation | Create Contract dialog | Add contract preview step |
| CON-U02 | Medium | Large file (1009 lines) with multiple concerns | Contracts.tsx | Split into smaller components |
| CON-U03 | Medium | No bulk contract operations | Contracts.tsx | Add bulk status update capability |
| CON-U04 | Low | Filter resets on page refresh | Contracts.tsx | Persist filter state in URL params |

### Performance
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| CON-P01 | Medium | Fetching all contracts without pagination | useQuery | Add pagination for large contract lists |
| CON-P02 | Medium | Multiple separate queries for related data | Contracts.tsx | Combine into single query with joins |
| CON-P03 | Low | Tenant profiles fetched in separate query | tenantProfiles query | Join profiles in main contract query |

### Security
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| CON-S01 | Critical | No merchant ownership verification before contract update | updateTermsMutation | Verify merchant owns contract via RLS |
| CON-S02 | High | Contract document URL publicly accessible | ContractDocumentUpload | Use signed URLs with expiration |
| CON-S03 | High | Signature stored without verification of signer identity | signContractMutation | Add signature verification metadata |
| CON-S04 | Medium | Contract terms can be edited after tenant signs | handleSaveTerms | Lock terms after tenant signature |

### Consistency & Data Integrity
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| CON-C01 | Critical | Unit status not updated when contract status changes | Multiple | Add trigger to sync unit status |
| CON-C02 | High | Signature status logic fragmented | getSignatureStatusBadge | Centralize signature status determination |
| CON-C03 | Medium | Contract 'notice' status not properly tracked | handleMarkNotice | Add notice_date column tracking |

### Error Handling & Observability
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| CON-E01 | High | Signature upload failure doesn't clean up partial state | signContractMutation | Add rollback on failure |
| CON-E02 | Medium | Generic error messages for contract operations | Multiple mutations | Provide specific error context |

### Maintainability
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| CON-M01 | High | Component too large (1009 lines) | Contracts.tsx | Split into ContractList, ContractForm, ContractDetail |
| CON-M02 | Medium | Contract interface defined locally | Contracts.tsx | Move to shared types file |
| CON-M03 | Medium | Status badge logic duplicated | getStatusBadge, getSignatureStatusBadge | Create reusable status components |

### Compatibility & Environment
| ID | Severity | Issue | Location | Recommendation |
|----|----------|-------|----------|----------------|
| CON-X01 | Low | Date formatting uses hardcoded locale | format calls | Use configurable locale |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High | 10 |
| Medium | 12 |
| Low | 3 |

## Recommended Actions
1. Add database trigger to sync unit status with contract status changes
2. Implement contract validation (no overlapping contracts for unit/tenant)
3. Refactor large Contracts.tsx into smaller, focused components
4. Use signed URLs for contract documents and signatures
5. Add merchant ownership verification via RLS policies
6. Lock contract terms after tenant signature
