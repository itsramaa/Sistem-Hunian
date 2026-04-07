# Vendor Jobs Feedback

## Bugs & Errors
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Critical | Non-atomic status update | `Jobs.tsx:130-146` | Updates vendor_jobs and maintenance_requests separately without transaction | Open |
| Critical | Missing vendor earning on completed | `Jobs.tsx:168-185` | Earning created but escrow not updated atomically | Open |
| Warning | Timeline insert may fail silently | `Jobs.tsx:157-164` | Timeline creation errors not caught | Open |
| Warning | Notification insert without error handling | `Jobs.tsx:188-196` | Notification failures ignored | Open |
| Info | Type assertion without validation | `Jobs.tsx:82` | `data as VendorJob[]` without runtime validation | Open |

## Validations
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Critical | No completion validation | `Jobs.tsx:275-284` | Can complete job without notes or photos | Open |
| Warning | No job ownership validation | `Jobs.tsx:99-100` | Mutation doesn't verify vendor owns the job | Open |
| ✅ Warning | Missing status transition validation | `Jobs.tsx:106-128` | Any status can transition to any other status | Fixed |
| Info | No agreed_price validation | `Jobs.tsx:169` | Earning created even with null price | Open |

## UX & Flow Pengguna
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| ✅ Warning | No job decline reason | `Jobs.tsx:367` | Vendor can decline without explanation | Fixed |
| ✅ Warning | No confirmation dialogs | `Jobs.tsx:263-264, 267-268` | Accept/Start actions have no confirmation | Fixed |
| Warning | Missing job details view | `Jobs.tsx` | No separate detail page, only card view | Open |
| Info | No SLA countdown | `Jobs.tsx:304-307` | SLA badge shown but no countdown timer | Open |
| Info | No filter by priority | `Jobs.tsx` | Cannot filter jobs by priority level | Open |
| Info | Limited photo preview | `Jobs.tsx:329-330` | Photos open in new tab, no lightbox | Open |

## Performance
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Warning | No pagination | `Jobs.tsx:54-79` | Fetches all jobs without limit | Open |
| Warning | Heavy component re-renders | `Jobs.tsx:286-408` | JobCard recreated on each render | Open |
| Info | Sequential notifications | `Jobs.tsx:188-213` | Tenant and merchant notifications sent sequentially | Open |

## Security
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| ✅ Critical | Missing vendor verification check | `Jobs.tsx` | Unverified vendors can accept/complete jobs | Fixed |
| Warning | No rate limiting | `Jobs.tsx` | Rapid status changes not prevented | Open |
| Warning | Client-side merchant lookup | `Jobs.tsx:199-203` | Merchant user_id fetched on client | Open |

## Consistency & Data Integrity
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Critical | Orphaned records risk | `Jobs.tsx:130-146` | If second update fails, data becomes inconsistent | Open |
| Warning | Status sync issues | `Jobs.tsx:109, 114, 119` | maintenance_requests status may not match vendor_jobs | Open |
| ✅ Warning | Hardcoded 5% fee | `Jobs.tsx:170` | Platform fee should be configurable | Fixed |
| Info | Timeline actor_role hardcoded | `Jobs.tsx:162` | Always 'vendor', even if admin intervenes | Open |

## Error Handling & Observability
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| ✅ Warning | Generic error message | `Jobs.tsx:225` | Shows raw error.message to user | Fixed |
| Warning | No retry mechanism | `Jobs.tsx:87-227` | Failed mutations cannot be retried | Open |
| ✅ Info | Missing loading states per job | `Jobs.tsx:368, 376, 390, 401` | All buttons disabled together | Fixed |

## Maintainability
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Critical | Large mutation function | `Jobs.tsx:87-227` | 140+ lines in single mutation, hard to maintain | Open |
| Warning | Inline status messages | `Jobs.tsx:150-155` | Status messages should be in constants | Open |
| ✅ Warning | Duplicated color logic | `Jobs.tsx:232-251` | Priority/status colors duplicated from Dashboard | Fixed |
| Info | No separation of concerns | `Jobs.tsx` | Business logic mixed with UI | Open |

## Compatibility & Environment
| Severity | Issue | Location | Description | Status |
|----------|-------|----------|-------------|--------|
| Info | Mobile card layout | `Jobs.tsx:287-408` | Card may be crowded on small screens | Open |
| Info | Image loading | `Jobs.tsx:324-335` | No lazy loading for issue photos | Open |

## Summary
| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 6 | 1 |
| Warning | 16 | 7 |
| Info | 12 | 1 |

## Recommended Actions (Completed)
1. ✅ Add job decline reason requirement and confirmation dialogs
2. ✅ Implement proper status transition validation (state machine)
3. ✅ Add vendor verification status check before allowing job actions
4. ✅ Centralize status/priority color mappings
5. ✅ Use configurable platform fee from constants

## Remaining Actions
1. Wrap multi-table updates in database transaction (use edge function or RPC)
2. Split large mutation into smaller, focused functions
3. Add pagination and filtering capabilities
