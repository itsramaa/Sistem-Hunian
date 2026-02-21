# Development Standards & Best Practices
**System:** SiHuni (Sistem Hunian)  
**Version:** 2.0.0  
**Last Updated:** 2026-02-21  
**Status:** Enforced

---

## 1. Guiding Principles

### 1.1 Core Philosophies
*   **Single Responsibility Principle (SRP):** Every module, hook, or function should have one, and only one, reason to change.
*   **Feature-Based Architecture:** Code is organized by business domain, not technical type. Each feature is a self-contained module.
*   **DRY (Don't Repeat Yourself):** Centralized utilities, shared hooks, and design tokens over copy-pasting.
*   **Type Safety:** Strict TypeScript with auto-generated database types. `any` is forbidden unless explicitly justified in comments.
*   **Accessibility First:** All UI components must meet WCAG 2.1 AA standards by default.
*   **Semantic Theming:** All colors via CSS custom properties — never raw color classes in components.

---

## 2. Technology Stack

| Layer | Technology | Version | Usage |
|-------|------------|---------|-------|
| **Frontend** | React | 18.3.x | Hooks, Context, Lazy Loading |
| **Build Tool** | Vite | 5.4.x | HMR, SWC, Code Splitting, Compression |
| **Styling** | Tailwind CSS + shadcn/ui | 3.4+ | Utility-first + 54 pre-built components |
| **State (Server)** | TanStack Query | 5.x | Cache-first data fetching, stale-while-revalidate |
| **State (Client)** | Zustand | 5.x | Persistent UI state (sidebar, preferences) |
| **Forms** | React Hook Form + Zod | 7.x / 3.x | Validation, error handling |
| **Routing** | React Router | 6.x | SPA routing, role-based guards |
| **Backend** | Deno Edge Functions | Latest | 31 serverless functions on Lovable Cloud |
| **Database** | Supabase SDK (PostgreSQL 16) | 2.89+ | Direct SDK access with RLS |
| **AI** | Lovable AI (Gemini) | — | Role-specific chatbot assistants |
| **Charts** | Recharts | 2.x | Dashboard visualizations |
| **Maps** | Leaflet + React Leaflet | 1.9 / 4.2 | Property location mapping |
| **Auth** | Supabase Auth (JWT) | — | RBAC via `user_roles` + `has_role()` |
| **Payments** | Xendit | — | Invoice, VA, e-wallet, QRIS, disbursement |
| **Email** | Resend | — | Transactional emails (30+ templates) |

---

## 3. Project Structure

```text
src/
├── features/                    # 25 feature modules (domain-based)
│   ├── auth/                    # Authentication & authorization
│   │   ├── components/          # LoginForm, SignupForm, AuthLoadingSkeleton
│   │   ├── hooks/               # useAuth (context provider)
│   │   ├── services/            # authService
│   │   ├── types/               # AppRole, UserProfile, MerchantProfile
│   │   └── utils/               # passwordStrength, validation
│   ├── billing/                 # Invoices, payments, late fees
│   │   ├── components/
│   │   ├── constants/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── contracts/               # Lease contracts, signatures
│   ├── dashboard/               # Role-specific dashboards
│   ├── maintenance/             # Work orders, vendor assignment
│   ├── properties/              # Properties & units management
│   ├── tenants/                 # Tenant management & invitations
│   ├── vendors/                 # Vendor marketplace & orders
│   ├── escrow/                  # Escrow accounts & disbursements
│   ├── subscriptions/           # Merchant subscription tiers
│   ├── disputes/                # Tenant-merchant dispute resolution
│   ├── forum/                   # Community forum
│   ├── notifications/           # In-app & push notifications
│   ├── analytics/               # Event tracking & reporting
│   ├── platform-config/         # Admin platform settings
│   ├── referrals/               # Referral program
│   ├── move-out/                # Move-out inspections & deposits
│   ├── collections/             # Debt collection cases
│   ├── ai-chatbot/              # AI assistant per role
│   ├── admin/                   # Admin-specific features
│   └── ...
├── shared/                      # Cross-cutting concerns
│   ├── components/              # Shared UI (ConfirmDialog, FileUpload, NavLink, Meta)
│   │   └── ui/                  # 54 shadcn/ui primitives
│   ├── context/                 # ThemeContext
│   ├── hooks/                   # useDebounce, useMobile, useResumableUpload
│   ├── services/                # locationService
│   ├── types/                   # Shared type definitions
│   └── utils/                   # currency, dateUtils, auditLog, statusColors
├── store/                       # Zustand global store
├── constants/                   # platformFees, subscriptionStatus, analytics
├── pages/                       # Route page components (80+ lazy-loaded)
├── integrations/                # Auto-generated Supabase client & types (DO NOT EDIT)
└── lib/                         # Integration wrappers

supabase/
├── functions/                   # 31 Deno Edge Functions
│   ├── _shared/                 # Shared utilities (CORS, helpers)
│   ├── xendit-webhook/
│   ├── ai-chatbot/
│   └── ...
└── config.toml                  # Edge function JWT config (auto-managed)

docs/                            # Architecture & business documentation
```

---

## 4. Frontend Standards

### 4.1 Feature Module Pattern

Every feature in `src/features/` follows this structure:

```text
src/features/{feature-name}/
├── components/     # Feature-specific React components
├── hooks/          # Feature-specific custom hooks
├── services/       # API calls & business logic
├── types/          # TypeScript types & Zod schemas
└── utils/          # Feature-specific utilities
```

**Rules:**
- Cross-feature imports MUST go through `@/shared/`
- Feature modules MUST NOT import directly from other features
- Page components in `src/pages/` are thin wrappers that compose feature components

### 4.2 Component Architecture

| Layer | Location | Responsibility | Example |
|-------|----------|---------------|---------|
| **Page** | `src/pages/` | Route entry, lazy-loaded | `Dashboard.tsx`, `Auth.tsx` |
| **Layout** | `src/shared/components/` | Role-based shell | `AdminLayout`, `MerchantLayout`, `TenantLayout`, `VendorLayout` |
| **UI Primitive** | `src/shared/components/ui/` | shadcn/ui atoms | `Button`, `Card`, `Dialog`, `Table` |
| **Feature** | `src/features/*/components/` | Domain-specific | `InvoiceList`, `PropertyCard`, `ContractForm` |
| **Shared** | `src/shared/components/` | Cross-feature | `ConfirmDialog`, `FileUpload`, `EnhancedFileUpload`, `NavLink`, `Meta` |

### 4.3 React Patterns (React 18)

```tsx
// ✅ Lazy loading (ALL pages must use this)
const Dashboard = lazy(() => import('@/pages/Dashboard'));

// ✅ Context pattern for auth
function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={<LoadingSkeleton />}>
            <Routes>{/* ... */}</Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </AuthProvider>
  );
}

// ✅ TanStack Query for server state
const { data, isLoading } = useQuery({
  queryKey: ['properties', merchantId],
  queryFn: () => propertyService.fetchAll(merchantId),
});

// ✅ Zustand for client UI state
const useSidebarStore = create(
  persist((set) => ({
    isOpen: true,
    toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  }), { name: 'sidebar' })
);

// ✅ React Hook Form + Zod
const form = useForm<ContractFormData>({
  resolver: zodResolver(contractSchema),
});
```

**Forbidden React patterns:**
- ❌ `useOptimistic` (React 19 only, not available)
- ❌ `use()` for promise unwrapping (React 19 only)
- ❌ Class components
- ❌ `forwardRef` without clear justification

### 4.4 Routing & Authorization

```tsx
// Role-based route protection
<Route element={<ProtectedRoute allowedRoles={['admin']} />}>
  <Route path="/admin/*" element={<AdminLayout />}>
    <Route path="dashboard" element={<AdminDashboard />} />
  </Route>
</Route>
```

| Route Prefix | Role | Example |
|-------------|------|---------|
| `/admin/*` | `admin` | `/admin/dashboard`, `/admin/merchants` |
| `/merchant/*` | `merchant` | `/merchant/properties`, `/merchant/billing` |
| `/tenant/*` | `tenant` | `/tenant/payments`, `/tenant/maintenance` |
| `/vendor/*` | `vendor` | `/vendor/orders`, `/vendor/products` |
| `/auth` | Public | Login, signup |
| `/invite/:token` | Public | Tenant invitation acceptance |
| `/referral` | Public | Referral landing page |
| `/payment/*` | Public | Payment callback pages |

### 4.5 Styling Standards

**MANDATORY: Semantic color tokens only**

```tsx
// ✅ CORRECT — semantic tokens
<div className="bg-card text-card-foreground border border-border rounded-lg p-6">
  <h2 className="text-foreground font-display text-xl font-semibold">Title</h2>
  <p className="text-muted-foreground text-sm">Description</p>
  <Button variant="default">Action</Button>
</div>

// ❌ FORBIDDEN — raw colors
<div className="bg-white text-gray-900 border border-gray-200 rounded-lg p-6">
  <h2 className="text-black font-bold text-xl">Title</h2>
  <p className="text-gray-500 text-sm">Description</p>
</div>
```

**Responsive design — mobile-first:**

```tsx
// ✅ CORRECT
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

// ❌ WRONG — desktop-first
<div className="grid grid-cols-3 sm:grid-cols-1">
```

**Spacing scale:** Use Tailwind defaults (2, 4, 6, 8, 12, 16, 24). Avoid random values (5, 7, 9, 11).

**Touch targets:** Minimum 44×44px for interactive elements on mobile.

**Animations — GPU-accelerated only:**

```tsx
// ✅ CORRECT
<div className="transition-transform duration-200 hover:scale-105">
<div className="transition-opacity duration-150">

// ❌ FORBIDDEN
<div className="transition-all duration-300">
```

**Dark mode:** Handled automatically via CSS variables. Never use `dark:` variants manually.

**Font families:**
- `font-sans` (Inter) — body text
- `font-display` (Plus Jakarta Sans) — headings

**Custom utilities available:**
- `.glass` — frosted glass effect
- `.gradient-primary`, `.gradient-accent` — brand gradients
- `.safe-area-top`, `.safe-area-bottom` — iOS safe area

### 4.6 Design Token Reference

```css
/* Light Mode (index.css :root) */
--primary: 35 32% 41%;           /* #8B6F47 — Cokelat Gelap */
--secondary: 35 30% 50%;         /* #A68B5B — Cokelat Medium */
--background: 42 100% 96%;       /* #FFF8E7 — Krem */
--accent: 48 89% 60%;            /* #F4D03F — Kuning Keemasan */
--foreground: 35 25% 20%;        /* Dark brown text */
--card: 40 50% 98%;              /* Warm white card */
--muted: 35 20% 93%;             /* Subtle muted bg */
--destructive: 0 84% 60%;        /* Red */
--success: 142 71% 45%;          /* Green */
--warning: 38 92% 50%;           /* Orange */
--info: 217 91% 60%;             /* Blue */
--chart-1 through --chart-5      /* Dashboard chart palette */
--sidebar-*                      /* Sidebar-specific tokens */
```

All colors defined in HSL format. Use via Tailwind classes: `bg-primary`, `text-foreground`, `border-border`, etc.

---

## 5. Backend Standards (Deno Edge Functions)

### 5.1 Function Structure

```text
supabase/functions/{function-name}/
└── index.ts          # Single entry point
```

### 5.2 Standard Pattern

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Business logic here...

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
```

### 5.3 Security Patterns

**Webhook verification (Xendit):**

```typescript
import { timingSafeEqual } from "https://deno.land/std/crypto/timing_safe_equal.ts";

function verifyWebhookToken(request: Request): boolean {
  const token = request.headers.get("x-callback-token");
  const expected = Deno.env.get("XENDIT_WEBHOOK_TOKEN");
  if (!token || !expected) return false;
  
  const a = new TextEncoder().encode(token);
  const b = new TextEncoder().encode(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
```

**JWT verification config (`supabase/config.toml`):**

| Setting | When to Use |
|---------|-------------|
| `verify_jwt = true` | Authenticated endpoints (default) |
| `verify_jwt = false` | Public endpoints (webhooks, invitations, signup bootstrap) |

**Public functions (verify_jwt = false):**
- `get-tenant-invitation` — token-based validation
- `accept-tenant-invitation` — token-based validation
- `ensure-user-bootstrap` — called during signup
- `subscription-payment` — Xendit callback/redirect

### 5.4 Error Handling

- Try/catch at function level — always return JSON with CORS headers
- `console.error()` for logging (visible in edge function logs)
- HTTP status codes: `200` success, `400` client error, `401` unauthorized, `404` not found, `500` server error
- Idempotency: Always check existing records before processing (especially webhooks)

### 5.5 Environment Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `SUPABASE_URL` | Edge Functions | Database connection |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions | Admin-level access |
| `SUPABASE_ANON_KEY` | Edge Functions | Public-level access |
| `XENDIT_SECRET_KEY` | Edge Functions | Payment gateway API |
| `XENDIT_WEBHOOK_TOKEN` | Edge Functions | Webhook HMAC verification |
| `RESEND_API_KEY` | Edge Functions | Email service |
| `LOVABLE_API_KEY` | Edge Functions | AI chatbot |

---

## 6. Data Layer Standards

### 6.1 Supabase SDK Patterns

```typescript
// ✅ CORRECT import (DO NOT modify this file)
import { supabase } from "@/integrations/supabase/client";

// ✅ Read with filtering
const { data, error } = await supabase
  .from('contracts')
  .select('*, units(*), profiles(*)')
  .eq('merchant_id', merchantId)
  .eq('status', 'active')
  .order('created_at', { ascending: false });

// ✅ Safe single-row fetch (handles race conditions)
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .maybeSingle();  // Returns null if not found, no error

// ✅ Insert
const { data, error } = await supabase
  .from('contracts')
  .insert({ unit_id, tenant_user_id, rent_amount, start_date, end_date, merchant_id })
  .select()
  .single();

// ✅ Update
const { error } = await supabase
  .from('contracts')
  .update({ status: 'terminated', actual_end_date: new Date().toISOString() })
  .eq('id', contractId);
```

### 6.2 Type Safety

- **Auto-generated types**: `src/integrations/supabase/types.ts` — reflects database schema, DO NOT EDIT
- **Feature types**: `src/features/*/types/` — domain-specific interfaces
- **Zod schemas**: Runtime validation for forms and API inputs
- **JSONB columns**: Use `as never` cast when needed (Supabase SDK limitation)

```typescript
// ✅ Type-safe query result
const { data } = await supabase
  .from('invoices')
  .select('*')
  .returns<Database['public']['Tables']['invoices']['Row'][]>();
```

### 6.3 Currency & Number Handling

```typescript
// Centralized in @/shared/utils/currency.ts

// ✅ Display formatting
formatCurrency(1500000);        // "Rp 1.500.000"
formatCurrencyCompact(1500000); // "Rp 1,5M"

// ✅ Fee calculations — always use Math.round()
const platformFee = Math.round(amount * VENDOR_PLATFORM_FEE_PERCENT / 100);
const netAmount = amount - platformFee;

// ✅ Database: numeric type → TypeScript: number
// Never use float for money — always numeric(10,2) in DB
```

---

## 7. State Management

### 7.1 Server State — TanStack Query

```typescript
// All API data fetching goes through TanStack Query
const { data, isLoading, error } = useQuery({
  queryKey: ['invoices', merchantId, status],
  queryFn: () => invoiceService.fetchByMerchant(merchantId, status),
});

// Mutations with cache invalidation
const mutation = useMutation({
  mutationFn: invoiceService.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    toast.success('Invoice created');
  },
});
```

### 7.2 Client State — Zustand

```typescript
// Only for persistent UI state (sidebar, preferences)
// Prefer local component state (useState) for ephemeral UI state
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSidebarStore = create(
  persist(
    (set) => ({
      isOpen: true,
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    { name: 'sidebar-store' }
  )
);
```

### 7.3 Auth State — React Context

```typescript
// AuthProvider wraps entire app
// Exposes: user, session, profile, role, merchant, vendor, isLoading
// Methods: signIn, signUp, signOut, refreshProfile
// Session listener via supabase.auth.onAuthStateChange()

const { user, role, isLoading, signIn, signOut } = useAuth();
```

---

## 8. Validation Standards

### 8.1 Zod Schemas

```typescript
// Centralized in feature types/ directories

// Password — 12+ chars, mixed case, numbers, special chars
export const strongPasswordSchema = z.string()
  .min(12, 'Minimum 12 karakter')
  .regex(/[A-Z]/, 'Harus mengandung huruf besar')
  .regex(/[a-z]/, 'Harus mengandung huruf kecil')
  .regex(/[0-9]/, 'Harus mengandung angka')
  .regex(/[^A-Za-z0-9]/, 'Harus mengandung karakter spesial');

// Phone — Indonesian format
export const phoneSchema = z.string()
  .regex(/^(\+62|62|0)[0-9]{9,13}$/, 'Format nomor telepon tidak valid');

// Business name — 3-100 chars
export const businessNameSchema = z.string()
  .min(3, 'Minimal 3 karakter')
  .max(100, 'Maksimal 100 karakter');

// Contract form (example with refinements)
export const contractSchema = z.object({
  unit_id: z.string().min(1, 'Pilih unit'),
  tenant_user_id: z.string().min(1, 'Pilih penyewa'),
  start_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
  end_date: z.string().min(1, 'Tanggal akhir wajib diisi'),
  rent_amount: z.coerce.number().positive('Sewa harus positif'),
  deposit_amount: z.coerce.number().min(0, 'Deposit tidak boleh negatif'),
}).refine((data) => new Date(data.end_date) > new Date(data.start_date), {
  message: 'Tanggal akhir harus setelah tanggal mulai',
  path: ['end_date'],
});
```

### 8.2 Form Validation Pattern

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm<ContractFormData>({
  resolver: zodResolver(contractSchema),
  defaultValues: { rent_amount: 0, deposit_amount: 0 },
});

// Error messages in Bahasa Indonesia
// Visual password strength feedback with progress bar
```

---

## 9. Audit & Logging

### 9.1 Audit Log Pattern

```typescript
// Centralized in @/shared/utils/auditLog.ts
import { createAuditLog } from '@/shared/utils/auditLog';

await createAuditLog({
  action: 'approve',
  entity_type: 'merchant',
  entity_id: merchantId,
  old_data: { verification_status: 'pending' },
  new_data: { verification_status: 'verified' },
});

// Helper functions for common operations
await logExport('merchants', { count: 150, format: 'csv' });
await logConfigChange('billing_settings', oldValue, newValue);
await logPayout(disbursementId, amount, merchantName);
await logStatusChange('dispute', disputeId, 'open', 'resolved');
```

**Typed actions:** `create`, `update`, `delete`, `approve`, `reject`, `suspend`, `payout`, `export`, `login`, `config_change`

**Typed entities:** `merchant`, `vendor`, `tenant`, `dispute`, `escrow`, `disbursement`, `contract`, `invoice`, `property`, `subscription`

**Auto-captured fields:** `user_id`, `user_agent`, `timestamp`, `ip_address`

---

## 10. Utility Standards

### 10.1 Date Utilities

```typescript
// Centralized in @/shared/utils/dateUtils.ts
import { formatDisplayDate, isOverdue, isDueSoon, getDaysOverdue } from '@/shared/utils/dateUtils';

formatDisplayDate('2026-02-21');  // "21 Februari 2026"
isOverdue('2026-02-01');          // true
isDueSoon('2026-02-23', 3);      // true (within 3 days)
getDaysOverdue('2026-02-01');    // 20
```

### 10.2 Status Color Mapping

```typescript
// Centralized in @/shared/utils/statusColors.ts
import { getPriorityColor, getStatusBadgeVariant } from '@/shared/utils/statusColors';

getPriorityColor('high');     // 'destructive'
getPriorityColor('medium');   // 'default'
getPriorityColor('low');      // 'secondary'

// Uses shadcn Badge variants: 'default' | 'secondary' | 'destructive' | 'outline'
```

### 10.3 Business Constants

```typescript
// Centralized in @/constants/platformFees.ts
export const VENDOR_PLATFORM_FEE_PERCENT = 5;
export const MINIMUM_PAYOUT_AMOUNT = 50000; // Rp 50,000

export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * VENDOR_PLATFORM_FEE_PERCENT / 100);
}

export function calculateNetAmount(amount: number): number {
  return amount - calculatePlatformFee(amount);
}
```

---

## 11. Build & Performance

### 11.1 Code Splitting Strategy

| Chunk | Contents | Purpose |
|-------|----------|---------|
| `vendor` | react, react-dom, react-router-dom, react-helmet-async | Core framework |
| `ui` | 25 Radix UI packages, CVA, lucide-react | UI component library |
| `data` | TanStack Query, Supabase SDK, Zod, Zustand | Data layer |
| `charts` | Recharts | Dashboard charts (loaded on demand) |
| `maps` | Leaflet, React Leaflet | Property maps (loaded on demand) |

- **80+ pages** lazy-loaded via `React.lazy()`
- **Chunk size warning:** 1000 KB limit
- **Compression:** Dual gzip + Brotli via `vite-plugin-compression`

### 11.2 Performance Patterns

```tsx
// ✅ GPU-accelerated animations only
className="transition-transform duration-200"
className="transition-opacity duration-150"

// ✅ Aspect ratio for images (prevents CLS)
className="aspect-video object-cover"

// ✅ Prevent grid item overflow
className="min-w-0"

// ✅ Mobile-first responsive
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// ❌ FORBIDDEN
className="transition-all"          // Animates everything, bad perf
className="text-[16px]"             // Use Tailwind scale: text-base
className="z-[999]"                 // Use defined z-index scale
```

---

## 12. TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "noImplicitAny": false,
    "strictNullChecks": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

> **Note:** `noImplicitAny: false` and `strictNullChecks: false` are pragmatic choices for development velocity. Feature-specific type safety is enforced via Zod schemas and auto-generated Supabase types.

---

## 13. Import & Path Conventions

```typescript
// Path alias: @/ → src/
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/shared/components/ui/button';
import { supabase } from '@/integrations/supabase/client';  // DO NOT EDIT
import { formatCurrency } from '@/shared/utils/currency';
import { VENDOR_PLATFORM_FEE_PERCENT } from '@/constants/platformFees';
```

**Import order:**
1. React / external libraries
2. `@/shared/` (components, hooks, utils)
3. `@/features/` (feature-specific)
4. `@/integrations/` (auto-generated)
5. `@/constants/`
6. Relative imports (`./ `, `../`)

---

## 14. Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `PropertyCard.tsx`, `InvoiceList.tsx` |
| Hooks | camelCase `use*` | `useAuth.tsx`, `useDebounce.ts` |
| Services | camelCase + `Service` | `propertyService.ts`, `locationService.ts` |
| Utils | camelCase | `currency.ts`, `dateUtils.ts` |
| Types | PascalCase exports | `AppRole`, `UserProfile`, `MerchantProfile` |
| Constants | SCREAMING_SNAKE | `VENDOR_PLATFORM_FEE_PERCENT` |
| Pages | PascalCase | `Dashboard.tsx`, `Auth.tsx` |
| Layouts | PascalCase + `Layout` | `AdminLayout.tsx`, `MerchantLayout.tsx` |
| Edge Functions | kebab-case directory | `xendit-webhook/index.ts` |
| CSS Variables | kebab-case | `--primary-foreground`, `--chart-1` |
| Database columns | snake_case | `created_at`, `user_id`, `rent_amount` |
| Zod schemas | camelCase + `Schema` | `strongPasswordSchema`, `contractSchema` |
| Store hooks | camelCase `use*Store` | `useSidebarStore` |

---

## 15. Forbidden Patterns

### 15.1 Auto-Generated Files (DO NOT EDIT)
- ❌ `src/integrations/supabase/client.ts`
- ❌ `src/integrations/supabase/types.ts`
- ❌ `supabase/config.toml`
- ❌ `.env`

### 15.2 Styling Anti-Patterns
- ❌ Raw colors: `bg-white`, `text-gray-500`, `border-gray-200`
- ❌ Manual dark mode: `dark:bg-gray-900`, `dark:text-white`
- ❌ `transition-all` — use specific properties
- ❌ Arbitrary font sizes: `text-[16px]` — use `text-base`
- ❌ Random z-index: `z-[999]`, `z-[9999]`
- ❌ Random spacing: `p-5`, `m-7`, `gap-9`

### 15.3 Code Anti-Patterns
- ❌ `any` type without explicit comment justification
- ❌ Direct `fetch()` to Supabase — use SDK
- ❌ `console.log` in production code (use `console.error` for errors only)
- ❌ Inline styles — use Tailwind classes
- ❌ Non-lazy page imports
- ❌ Cross-feature direct imports (must go through `@/shared/`)

---

## 16. Accessibility (WCAG 2.1 AA)

- **Semantic HTML:** Use `<button>`, `<nav>`, `<main>`, `<article>`, `<section>` correctly
- **Forms:** All inputs MUST have associated labels (`htmlFor` + `id`)
- **Focus Management:** Visible focus rings (customized in Tailwind theme via `ring-ring`)
- **ARIA:** Use only when semantic HTML is insufficient
- **Color Contrast:** Minimum 4.5:1 for text, 3:1 for large text
- **Touch Targets:** Minimum 44×44px on mobile
- **Screen Readers:** Alt text on all images, `aria-label` on icon-only buttons

---

## 17. Version Control

- **Auto-deploy:** Lovable IDE handles deployment automatically
- **Version history:** Git-based, managed by Lovable
- **No branching strategy:** Lovable manages this internally
- **Code review:** Via Lovable chat interaction
- **No CI/CD pipeline:** Build, test, and deploy are handled by the platform

---

## 18. Testing Strategy

### 18.1 Test Pyramid

| Level | Coverage Target | Tool | Scope |
|-------|----------------|------|-------|
| **Unit** | 70% | Vitest | Business logic, utilities, hooks |
| **Integration** | 20% | Vitest + React Testing Library | Component interactions, API calls |
| **E2E** | 10% | Manual / Browser tools | Critical user flows |

### 18.2 Test Naming Convention

```typescript
describe('formatCurrency', () => {
  it('should format IDR with thousand separators', () => {
    expect(formatCurrency(1500000)).toBe('Rp 1.500.000');
  });

  it('should handle zero amount', () => {
    expect(formatCurrency(0)).toBe('Rp 0');
  });
});
```

### 18.3 Edge Function Testing

```typescript
// Test via curl or Lovable browser tools
// Verify: response status, JSON structure, database state changes
// Always test with and without auth headers for protected functions
```

---

## 19. Security Checklist

- [ ] RLS policies on all tables with user-specific data
- [ ] `verify_jwt = true` for all authenticated endpoints
- [ ] Webhook tokens verified with timing-safe comparison
- [ ] No PCI data stored (Xendit handles payment data)
- [ ] Input sanitization via DOMPurify for user-generated HTML
- [ ] Audit logs for all admin/sensitive operations
- [ ] Service role key NEVER exposed to frontend
- [ ] CORS headers on all edge function responses
- [ ] Rate limiting via Lovable Cloud (built-in)
- [ ] No database credentials in frontend code

---

## Appendix: Skills Applied

| Skill | Application |
|-------|-------------|
| `tailwind-patterns` | Semantic tokens, responsive design, spacing scale, dark mode, touch targets, GPU animations, z-index discipline |
| `supabase-postgres-best-practices` | Data types (text, timestamptz, numeric), SDK patterns, RLS, maybeSingle() |
| `api-security-best-practices` | Webhook HMAC verification, JWT config, timing-safe comparison, CORS |
| `architecture-patterns` | Feature-based modules, layered services, separation of concerns |
| `web-performance-optimization` | Code splitting (6 chunks), lazy loading (80+ pages), gzip+brotli compression |
| `pci-compliance` | No PAN storage, tokenized payment references via Xendit |
| `security-auditor` | Audit log patterns, immutable logging, RBAC, RLS enforcement |
| `schema-data-types` | bigint IDs, text over varchar, timestamptz, numeric for money |
