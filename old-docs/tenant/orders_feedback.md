# Tenant Orders Feedback

## File Location
- `src/pages/tenant/Orders.tsx`

## Review Summary

### 1. Bugs & Errors

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| Cancel Doesn't Update Vendor Inventory | High | Cancelling order doesn't revert product stock/availability | ⚠️ Backend |
| Review Fetches vendor_id Again | Medium | vendor_id already in order data but queried again | ✅ Fixed |
| No Refund Processing | High | Cancel sets status but doesn't trigger refund | ⚠️ Backend |
| Order Number May Be Null | Low | `order_number` displayed without null check | ✅ Fixed |

### 2. Validations

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| Review Rating Not Validated | Medium | Rating 1-5 enforced only by UI | ✅ Fixed |
| No Review Text Length Limit | Low | Review text has no max length | ✅ Fixed |
| Cancel Reason Not Required | Medium | Order cancelled without requiring reason | ✅ Fixed |

### 3. UX & Flow Pengguna

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| No Order Detail View | High | Cannot see full order details (line items, costs breakdown) | ✅ Fixed |
| No Status Filter | Medium | Documentation mentions status filter but not implemented | ✅ Fixed |
| No Reorder Capability | Medium | Documentation mentions reorder but not implemented | ⚠️ Backlog |
| No Tracking Timeline | Medium | Cannot see order progress timeline | ⚠️ Backlog |
| No Cancel Confirmation | High | Cancel happens immediately without confirmation | ✅ Fixed |
| Limited Order Info | Medium | Missing payment method, delivery info | ✅ Partial |
| No Contact Vendor | Medium | Cannot contact vendor about order | ⚠️ Backlog |
| Review Modal Rating UX | Low | Star selection could be more intuitive | ✅ Fixed |

### 4. Performance

| Issue | Severity | Description |
|-------|----------|-------------|
| Full Order Fetch | Medium | Fetches all orders without pagination |
| Separate Reviews Query | Low | Reviews could be joined with orders query |
| No Order Caching | Low | Orders not cached for offline viewing |

### 5. Security

| Issue | Severity | Description |
|-------|----------|-------------|
| No Tenant Role Check | High | Any authenticated user can access |
| Client-Side Cancel Status | High | Cancel status update has no server-side validation of allowed transitions |
| Order Data Exposure | Medium | Full order details including vendor info exposed |
| No Rate Limit on Cancel | Medium | Can spam cancel requests |

### 6. Consistency & Data Integrity

| Issue | Severity | Description |
|-------|----------|-------------|
| Status Transition Not Validated | Critical | Any status can be set to "canceled" without validation |
| Review Creates Without Order Status Check | High | Review can be submitted even if order was refunded |
| Vendor Rating Update | Medium | Review submission should update vendor rating (may rely on trigger) |

### 7. Error Handling & Observability

| Issue | Severity | Description |
|-------|----------|-------------|
| Generic Cancel Error | Medium | Shows generic error without details |
| No Cancel Success Details | Low | Doesn't show expected refund info after cancel |
| No Analytics for Reviews | Low | Review submissions not tracked |

### 8. Maintainability

| Issue | Severity | Description |
|-------|----------|-------------|
| Inline Status Colors | Low | `statusColors` could be in shared config |
| Large Component | Medium | 317 lines, review dialog could be separate |
| Review Logic in Component | Medium | Review submission logic should be in hook |

### 9. Compatibility & Environment

| Issue | Severity | Description |
|-------|----------|-------------|
| No Offline Capability | Low | Orders not available offline |

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 6 |
| Medium | 14 |
| Low | 8 |

## Recommended Actions

1. **Add cancel confirmation dialog** with reason input
2. **Implement server-side status transition validation** in edge function
3. **Add order detail view** with full information
4. **Implement reorder functionality** as documented
5. **Add status filter** as documented
6. **Trigger refund process** on order cancellation
7. **Add pagination** for order list
8. **Implement contact vendor** feature
