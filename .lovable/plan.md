
# Dashboard Customization + API & Integration Framework

## Overview

Two features:
1. **Dashboard Customization** -- Drag-drop widget reordering, show/hide widgets, saved preferences per merchant
2. **API & Integration Framework** -- REST API via edge function for external integrations + webhook system for event notifications

---

## Feature 3: Dashboard Customization

### 3A: Database -- `dashboard_preferences` Table

Create table to store per-merchant widget layout:

```
dashboard_preferences
  id              uuid PK
  merchant_id     uuid FK merchants UNIQUE
  widget_order    jsonb NOT NULL DEFAULT '[]'   -- ordered list of widget IDs
  hidden_widgets  jsonb NOT NULL DEFAULT '[]'   -- list of hidden widget IDs
  created_at      timestamptz DEFAULT now()
  updated_at      timestamptz DEFAULT now()
```

RLS: merchant can read/write their own preferences only.

Widget IDs will be predefined constants like: `'kpi_strip'`, `'quick_actions'`, `'subscription'`, `'charts'`, `'property_overview'`, `'financial_summary'`, `'vacancy'`.

### 3B: Dashboard Preferences Service

Create `src/features/dashboard/services/dashboardPreferencesService.ts`:
- `fetchPreferences(merchantId)` -- get saved preferences or return defaults
- `savePreferences(merchantId, data)` -- upsert widget order + hidden widgets
- Default widget order: `['kpi_strip', 'quick_actions', 'charts', 'property_overview', 'vacancy']`

### 3C: Hooks

Create `src/features/dashboard/hooks/useDashboardPreferences.ts`:
- `useDashboardPreferences(merchantId)` -- query
- `useSaveDashboardPreferences()` -- mutation with optimistic update

### 3D: Customize Dashboard Dialog

Create `src/features/dashboard/components/DashboardCustomizeDialog.tsx`:
- Modal triggered by a "Kustomisasi" button in the dashboard header
- List of all available widgets with:
  - Toggle switch to show/hide each widget
  - Drag handle to reorder (using simple up/down arrow buttons -- no drag-drop library needed)
  - Widget name + description
- Preview of layout order
- Save button persists to database
- Reset to Default button

### 3E: Modify Dashboard Page

Update `src/pages/merchant/Dashboard.tsx`:
- Import preferences hook
- Add "Kustomisasi" button next to "Segarkan" in PageHeader
- Wrap each dashboard section in a widget container identified by widget ID
- Render widgets in order from preferences, skip hidden ones
- Each section becomes a `DashboardWidget` wrapper that maps ID to component

### 3F: Widget Registry

Create `src/features/dashboard/constants/widgetRegistry.ts`:
- Map of widget ID to: label, description, component reference, default visibility
- Used by both the customize dialog and the dashboard renderer

---

## Feature 4: API & Integration Framework

### 4A: Database -- `api_keys` and `webhook_endpoints` Tables

**`api_keys`**:
```
id              uuid PK
merchant_id     uuid FK merchants
key_hash        text NOT NULL        -- SHA-256 hash of the API key
key_prefix      text NOT NULL        -- first 8 chars for display (e.g. "pk_live_a1b2...")
name            text NOT NULL        -- friendly name
scopes          jsonb DEFAULT '["read"]'  -- read, write, webhook
rate_limit      integer DEFAULT 1000  -- requests per hour
last_used_at    timestamptz
is_active       boolean DEFAULT true
created_at      timestamptz DEFAULT now()
expires_at      timestamptz
```

**`webhook_endpoints`**:
```
id              uuid PK
merchant_id     uuid FK merchants
url             text NOT NULL
events          jsonb NOT NULL       -- list of event types to subscribe to
secret          text NOT NULL        -- webhook signing secret
is_active       boolean DEFAULT true
last_triggered_at timestamptz
failure_count   integer DEFAULT 0
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

**`webhook_logs`**:
```
id              uuid PK
webhook_id      uuid FK webhook_endpoints
event_type      text NOT NULL
payload         jsonb NOT NULL
response_status integer
response_body   text
delivered_at    timestamptz DEFAULT now()
```

RLS: merchant CRUD on own keys and endpoints.

### 4B: API Gateway Edge Function

Create `supabase/functions/merchant-api/index.ts`:
- Authentication via `X-API-Key` header
- Validates key hash against `api_keys` table
- Rate limiting check (count requests in last hour)
- Routes:
  - `GET /properties` -- list merchant's properties
  - `GET /properties/:id` -- single property with units
  - `GET /units` -- list units (filterable by property_id, status)
  - `GET /tenants` -- list active tenants
  - `GET /invoices` -- list invoices (filterable by status, date range)
  - `GET /payments` -- list payments
  - `GET /maintenance` -- list maintenance requests
  - `GET /contracts` -- list contracts
- All responses follow consistent JSON format with pagination:
  ```json
  { "data": [...], "meta": { "page": 1, "per_page": 20, "total": 150 } }
  ```
- Update `supabase/config.toml` with `verify_jwt = false` for this function (uses API key auth instead)

### 4C: Webhook Dispatcher Edge Function

Create `supabase/functions/webhook-dispatcher/index.ts`:
- Called internally (by triggers or other edge functions) when events occur
- Looks up all active webhook endpoints for the merchant that subscribe to the event type
- Signs payload with HMAC-SHA256 using the endpoint's secret
- Sends POST to each endpoint URL with:
  - `X-Webhook-Signature` header
  - Event payload as JSON body
- Logs delivery result to `webhook_logs`
- Supported events: `payment.received`, `payment.verified`, `invoice.created`, `invoice.overdue`, `maintenance.created`, `maintenance.completed`, `tenant.moved_in`, `tenant.moved_out`, `contract.signed`, `contract.expired`
- Set `verify_jwt = false` in config.toml (called internally)

### 4D: API Management Page

Create `src/pages/merchant/ApiIntegration.tsx`:
- **Tab 1: API Keys** -- Create, view (masked), revoke API keys. Show scopes and rate limits. Copy key on creation (shown once)
- **Tab 2: Webhooks** -- Add/edit/delete webhook endpoints. Select events to subscribe. Test endpoint button (sends test payload). View delivery logs with status
- **Tab 3: Dokumentasi** -- Inline API documentation showing available endpoints, request/response examples, authentication guide, webhook event list with payload schemas

### 4E: API Management Service

Create `src/features/integrations/services/apiIntegrationService.ts`:
- `createApiKey(merchantId, name, scopes)` -- generate random key, store hash, return plaintext once
- `listApiKeys(merchantId)` -- list keys (prefix only, no full key)
- `revokeApiKey(id)` -- set is_active = false
- `createWebhook(merchantId, url, events)` -- create endpoint with generated secret
- `updateWebhook(id, data)` -- edit URL/events
- `deleteWebhook(id)` -- delete endpoint
- `testWebhook(id)` -- send test event payload
- `fetchWebhookLogs(webhookId)` -- delivery history

### 4F: Hooks

Create `src/features/integrations/hooks/useApiIntegration.ts`:
- `useApiKeys(merchantId)` -- query
- `useCreateApiKey()` -- mutation
- `useRevokeApiKey()` -- mutation
- `useWebhooks(merchantId)` -- query
- `useCreateWebhook()` / `useUpdateWebhook()` / `useDeleteWebhook()` -- mutations
- `useTestWebhook()` -- mutation
- `useWebhookLogs(webhookId)` -- query

### 4G: Navigation & Routes

Add to `navigation-config.ts` under a new "Pengaturan" group or existing "Wawasan":
- `/merchant/api-integration` with `ScanText` icon, label "API & Integrasi"

Add route to `App.tsx`.

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| CREATE | DB migration | `dashboard_preferences`, `api_keys`, `webhook_endpoints`, `webhook_logs` tables |
| CREATE | `src/features/dashboard/services/dashboardPreferencesService.ts` | Preferences CRUD |
| CREATE | `src/features/dashboard/hooks/useDashboardPreferences.ts` | TanStack Query hooks |
| CREATE | `src/features/dashboard/constants/widgetRegistry.ts` | Widget ID to component mapping |
| CREATE | `src/features/dashboard/components/DashboardCustomizeDialog.tsx` | Customize modal with reorder + toggle |
| MODIFY | `src/pages/merchant/Dashboard.tsx` | Dynamic widget rendering from preferences |
| CREATE | `supabase/functions/merchant-api/index.ts` | REST API gateway edge function |
| CREATE | `supabase/functions/webhook-dispatcher/index.ts` | Webhook delivery edge function |
| CREATE | `src/features/integrations/services/apiIntegrationService.ts` | API key + webhook CRUD |
| CREATE | `src/features/integrations/hooks/useApiIntegration.ts` | TanStack Query hooks |
| CREATE | `src/pages/merchant/ApiIntegration.tsx` | API management page with docs |
| MODIFY | `src/shared/components/layouts/navigation-config.ts` | Add API Integration nav item |
| MODIFY | `src/App.tsx` | Add route |
| MODIFY | `supabase/config.toml` | Add merchant-api + webhook-dispatcher JWT config |
| MODIFY | `old-docs/PMS_Audit_Report_FULL.md` | Mark Dashboard Customization + API Framework status |

---

## Technical Notes

- Dashboard customization uses simple up/down arrow buttons for reordering instead of a drag-drop library -- keeps it lightweight with no new dependencies
- API keys are generated client-side using `crypto.randomUUID()` + `crypto.getRandomValues()`, hashed with SHA-256 before storage. Plaintext shown once on creation
- Webhook signatures use HMAC-SHA256 with the endpoint's secret for verification by receivers
- The `merchant-api` edge function uses `verify_jwt = false` because it authenticates via API key header instead of JWT
- Rate limiting is implemented by counting rows in a simple request log or by checking `last_used_at` + counter field
- All API responses follow REST best practices: consistent error format, pagination metadata, proper HTTP status codes
- Webhook dispatcher handles retries by incrementing `failure_count`; endpoints with 10+ consecutive failures are auto-deactivated
