# Vendor Jobs Feedback

## Bugs & Errors
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Critical | Non-atomic status update | `Jobs.tsx:130-146` | Updates vendor_jobs and maintenance_requests separately without transaction |
| Critical | Missing vendor earning on completed | `Jobs.tsx:168-185` | Earning created but escrow not updated atomically |
| Warning | Timeline insert may fail silently | `Jobs.tsx:157-164` | Timeline creation errors not caught |
| Warning | Notification insert without error handling | `Jobs.tsx:188-196` | Notification failures ignored |
| Info | Type assertion without validation | `Jobs.tsx:82` | `data as VendorJob[]` without runtime validation |

## Validations
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Critical | No completion validation | `Jobs.tsx:275-284` | Can complete job without notes or photos |
| Warning | No job ownership validation | `Jobs.tsx:99-100` | Mutation doesn't verify vendor owns the job |
| Warning | Missing status transition validation | `Jobs.tsx:106-128` | Any status can transition to any other status |
| Info | No agreed_price validation | `Jobs.tsx:169` | Earning created even with null price |

## UX & Flow Pengguna
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | No job decline reason | `Jobs.tsx:367` | Vendor can decline without explanation |
| Warning | No confirmation dialogs | `Jobs.tsx:263-264, 267-268` | Accept/Start actions have no confirmation |
| Warning | Missing job details view | `Jobs.tsx` | No separate detail page, only card view |
| Info | No SLA countdown | `Jobs.tsx:304-307` | SLA badge shown but no countdown timer |
| Info | No filter by priority | `Jobs.tsx` | Cannot filter jobs by priority level |
| Info | Limited photo preview | `Jobs.tsx:329-330` | Photos open in new tab, no lightbox |

## Performance
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | No pagination | `Jobs.tsx:54-79` | Fetches all jobs without limit |
| Warning | Heavy component re-renders | `Jobs.tsx:286-408` | JobCard recreated on each render |
| Info | Sequential notifications | `Jobs.tsx:188-213` | Tenant and merchant notifications sent sequentially |

## Security
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Critical | Missing vendor verification check | `Jobs.tsx` | Unverified vendors can accept/complete jobs |
| Warning | No rate limiting | `Jobs.tsx` | Rapid status changes not prevented |
| Warning | Client-side merchant lookup | `Jobs.tsx:199-203` | Merchant user_id fetched on client |

## Consistency & Data Integrity
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Critical | Orphaned records risk | `Jobs.tsx:130-146` | If second update fails, data becomes inconsistent |
| Warning | Status sync issues | `Jobs.tsx:109, 114, 119` | maintenance_requests status may not match vendor_jobs |
| Warning | Hardcoded 5% fee | `Jobs.tsx:170` | Platform fee should be configurable |
| Info | Timeline actor_role hardcoded | `Jobs.tsx:162` | Always 'vendor', even if admin intervenes |

## Error Handling & Observability
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Warning | Generic error message | `Jobs.tsx:225` | Shows raw error.message to user |
| Warning | No retry mechanism | `Jobs.tsx:87-227` | Failed mutations cannot be retried |
| Info | Missing loading states per job | `Jobs.tsx:368, 376, 390, 401` | All buttons disabled together |

## Maintainability
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Critical | Large mutation function | `Jobs.tsx:87-227` | 140+ lines in single mutation, hard to maintain |
| Warning | Inline status messages | `Jobs.tsx:150-155` | Status messages should be in constants |
| Warning | Duplicated color logic | `Jobs.tsx:232-251` | Priority/status colors duplicated from Dashboard |
| Info | No separation of concerns | `Jobs.tsx` | Business logic mixed with UI |

## Compatibility & Environment
| Severity | Issue | Location | Description |
|----------|-------|----------|-------------|
| Info | Mobile card layout | `Jobs.tsx:287-408` | Card may be crowded on small screens |
| Info | Image loading | `Jobs.tsx:324-335` | No lazy loading for issue photos |

## Summary
| Severity | Count |
|----------|-------|
| Critical | 6 |
| Warning | 16 |
| Info | 12 |

## Recommended Actions
1. Wrap multi-table updates in database transaction (use edge function or RPC)
2. Add job decline reason requirement and confirmation dialogs
3. Implement proper status transition validation (state machine)
4. Add vendor verification status check before allowing job actions
5. Split large mutation into smaller, focused functions
6. Add pagination and filtering capabilities
7. Centralize status/priority color mappings
