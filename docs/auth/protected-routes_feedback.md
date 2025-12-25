# Protected Routes - Feedback

## 1. Bugs & Errors

### 🔴 Critical
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| BUG-PR-001 | Race condition role fetching | `useAuth.tsx:85-95` | Role bisa null sementara saat refresh, menyebabkan redirect ke /unauthorized |
| BUG-PR-002 | No recovery from /unauthorized | `ProtectedRoute.tsx:40-42` | User stuck di /unauthorized tanpa cara kembali |

### 🟡 Warning
| ID | Issue | Location | Description |
|----|-------|----------|-------------|
| BUG-PR-003 | Role cache stale | `useAuth.tsx` | Role tidak di-refresh saat user profile update |
| BUG-PR-004 | Admin super access audit | `ProtectedRoute.tsx:47-49` | Admin bisa akses semua route tanpa logging |

## 2. Validations

### Current Implementation
```typescript
// ProtectedRoute.tsx - Line 44-56
if (allowedRoles && allowedRoles.length > 0) {
  if (role === 'admin') {
    return <>{children}</>; // ⚠️ No audit trail
  }
  if (!allowedRoles.includes(role)) {
    return <Navigate to={getRedirectPath(role)} replace />;
  }
}
```

### Missing Validations
| ID | Issue | Recommendation |
|----|-------|----------------|
| VAL-PR-001 | No role validation against DB | Add real-time role verification |
| VAL-PR-002 | Session expiry not checked | Validate session freshness |
| VAL-PR-003 | No multi-tab sync | Sync auth state across tabs |

## 3. UX & Flow Pengguna

### Issues
| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| UX-PR-001 | No toast on redirect | Medium | Inform user mengapa di-redirect |
| UX-PR-002 | Loading spinner generic | Low | Show "Checking permissions..." message |
| UX-PR-003 | /unauthorized page tidak helpful | High | Tambahkan opsi login ulang atau contact admin |
| UX-PR-004 | Deep link tidak preserved | Medium | Simpan intended URL untuk redirect setelah login |
| UX-PR-005 | No role-based menu filtering | Medium | Hide menu items yang tidak accessible |

### Flow Issues
1. **User tanpa role** - Langsung ke /unauthorized tanpa penjelasan
2. **Session expired** - Redirect ke /auth tanpa warning
3. **Role change** - Tidak ada notification saat role berubah

## 4. Performance

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| PERF-PR-001 | Role check setiap render | Medium | Cache role dengan TTL |
| PERF-PR-002 | No route-level code splitting | Medium | Lazy load protected routes |
| PERF-PR-003 | Multiple DB queries | Low | Batch role + profile fetch |
| PERF-PR-004 | Auth listener on every mount | Low | Centralize auth subscription |

## 5. Security

### 🔴 Critical
| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| SEC-PR-001 | Admin bypass tanpa audit | High | Log semua admin access |
| SEC-PR-002 | Role check client-side only | High | Add server-side RLS policies |
| SEC-PR-003 | No session fingerprinting | Medium | Validate session against device |

### 🟡 Warning
| ID | Issue | Risk | Recommendation |
|----|-------|------|----------------|
| SEC-PR-004 | Role stored in React state | Medium | Validate setiap sensitive action |
| SEC-PR-005 | No IP-based access control | Low | Consider geo-blocking untuk admin |
| SEC-PR-006 | Token refresh vulnerability | Medium | Implement token rotation |

### Recommended Security Layers
```typescript
// Multi-layer security check
1. Client-side ProtectedRoute (current) ✅
2. RLS policies per table (exists) ✅
3. Edge function auth check (partial) ⚠️
4. Audit logging (missing) ❌
5. Session validation (missing) ❌
```

## 6. Consistency & Data Integrity

| ID | Issue | Impact | Recommendation |
|----|-------|--------|----------------|
| DATA-PR-001 | Role state desync | High | Implement realtime role subscription |
| DATA-PR-002 | Multiple role possible | Medium | Handle users dengan multiple roles |
| DATA-PR-003 | Profile-role mismatch | Medium | Validate profile matches role |
| DATA-PR-004 | Cache invalidation | Medium | Clear cache on role change |

## 7. Error Handling & Observability

### Current State
```typescript
// ProtectedRoute.tsx - No error boundaries
if (!role) {
  return <Navigate to="/unauthorized" replace />; // No logging
}
```

### Issues
| ID | Issue | Recommendation |
|----|-------|----------------|
| ERR-PR-001 | No error boundary | Wrap dengan ErrorBoundary component |
| ERR-PR-002 | Silent redirects | Log redirect reasons |
| ERR-PR-003 | No metrics | Track access patterns |
| ERR-PR-004 | No alerting | Alert on unusual access patterns |

### Proposed Logging
```typescript
// Recommended audit log structure
{
  event: 'route_access',
  user_id: string,
  role: string,
  route: string,
  allowed: boolean,
  timestamp: Date,
  ip: string,
  user_agent: string
}
```

## 8. Maintainability

| ID | Issue | Recommendation |
|----|-------|----------------|
| MAINT-PR-001 | Role paths hardcoded | Use config/constants file |
| MAINT-PR-002 | No permission abstraction | Create usePermissions hook |
| MAINT-PR-003 | Mixed routing concerns | Separate auth dari routing logic |
| MAINT-PR-004 | No route configuration | Centralize route definitions |

### Suggested Refactoring
```typescript
// config/routes.ts
export const ROUTES = {
  admin: {
    path: '/admin',
    roles: ['admin'],
    children: { ... }
  },
  merchant: {
    path: '/merchant',
    roles: ['merchant', 'admin'],
    children: { ... }
  }
};

// hooks/usePermissions.ts
export function usePermissions() {
  const { role } = useAuth();
  return {
    canAccessAdmin: role === 'admin',
    canManageMerchants: ['admin'].includes(role),
    canViewReports: ['admin', 'merchant'].includes(role),
  };
}
```

## 9. Compatibility & Environment

| ID | Issue | Recommendation |
|----|-------|----------------|
| COMP-PR-001 | No SSR support | Add server-side auth check |
| COMP-PR-002 | Browser back button issues | Handle history properly |
| COMP-PR-003 | Deep linking broken | Preserve original URL |
| COMP-PR-004 | No PWA support | Add service worker auth handling |

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 5 |
| 🟡 Warning | 10 |
| 🔵 Info | 6 |

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Fix race condition saat role loading
2. **[CRITICAL]** Add audit logging untuk admin access
3. **[CRITICAL]** Improve /unauthorized page dengan opsi recovery
4. **[HIGH]** Add server-side role validation
5. **[HIGH]** Implement deep link preservation
6. **[MEDIUM]** Add toast notifications untuk redirects
7. **[MEDIUM]** Centralize route configuration
8. **[LOW]** Add realtime role subscription
9. **[LOW]** Implement permission abstraction hook
