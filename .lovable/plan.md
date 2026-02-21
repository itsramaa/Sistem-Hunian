

# Maksimalisasi Development Standards Document - SiHuni Platform

## Ringkasan

File `docs/development-standards.md` saat ini mendeskripsikan standar pengembangan yang **sama sekali tidak sesuai** dengan implementasi aktual. Dokumen berbicara tentang:
- **Next.js / React 19** (aktual: React 18 + Vite SPA)
- **NestJS backend** (aktual: 31 Deno Edge Functions)
- **Prisma ORM** (aktual: Supabase SDK direct)
- **Python FastAPI / ML Service** (aktual: tidak ada)
- **BullMQ queue** (aktual: cron edge functions)
- **Monorepo (`apps/`, `packages/`)** (aktual: single Vite project)
- **`useOptimistic` React 19** (aktual: React 18, tidak digunakan)

Dokumen akan di-rewrite total untuk mencerminkan standar pengembangan yang benar-benar diterapkan di codebase.

---

## Perubahan yang Akan Dilakukan

### File: `docs/development-standards.md` (Full Rewrite)

### 1. Introduction (Diperbarui)
- Version 2.0, reflecting actual codebase
- Platform: Lovable Cloud, React 18 SPA + Deno Edge Functions
- No monorepo, no NestJS, no Python, no Docker

### 2. Technology Stack (Dikoreksi Total)

| Layer | Actual Technology | Previous (Wrong) |
|-------|-------------------|------------------|
| **Frontend** | React 18.3 | React 19 / Next.js |
| **Build** | Vite 5.4 + SWC | Vite (generic) |
| **Styling** | Tailwind CSS + shadcn/ui | Tailwind only |
| **State** | Zustand + TanStack Query | Not specified |
| **Backend** | Deno Edge Functions | NestJS 10.x |
| **Database** | Supabase SDK (direct) | Prisma ORM |
| **AI/ML** | Lovable AI (Gemini) | Python FastAPI |
| **Queue** | Cron Edge Functions | BullMQ |
| **Forms** | React Hook Form + Zod | Not specified |
| **Charts** | Recharts | Not specified |
| **Maps** | Leaflet + React Leaflet | Not specified |

### 3. Project Structure (Actual)

```text
src/
  features/          -- 25 feature modules (feature-based architecture)
    auth/            -- components/, hooks/, services/, types/, utils/
    billing/         -- components/, constants/, hooks/, services/, types/, utils/
    contracts/       -- components/, hooks/, services/, types/, utils/
    ...
  shared/            -- Cross-cutting concerns
    components/      -- UI library (54 shadcn components), layouts (5 role-based)
    context/         -- ThemeContext
    hooks/           -- Reusable hooks (useDebounce, useMobile, useResumableUpload, etc.)
    services/        -- Shared services (locationService)
    types/           -- Shared type definitions
    utils/           -- Utility functions (currency, dateUtils, auditLog, statusColors, etc.)
  store/             -- Zustand global store
  constants/         -- Business constants (platformFees, subscriptionStatus, analytics)
  pages/             -- Route page components (lazy-loaded)
  integrations/      -- Auto-generated Supabase client & types
  lib/               -- Integration wrappers
supabase/
  functions/         -- 31 Deno Edge Functions
  config.toml        -- Edge function JWT config (auto-managed)
docs/                -- Architecture & business documentation
```

### 4. Frontend Standards (Diperbarui Total)

#### 4.1 Feature Module Pattern
- Setiap feature di `src/features/` memiliki subdirektori: `components/`, `hooks/`, `services/`, `types/`, `utils/`
- Cross-feature imports harus melalui `@/shared/`
- Contoh aktual dari codebase (auth, billing, contracts, properties, dll.)

#### 4.2 Component Architecture
- **Page Components**: `src/pages/` -- thin wrappers, lazy-loaded via `React.lazy()`
- **Layout Components**: 5 role-based layouts (`AdminLayout`, `MerchantLayout`, `TenantLayout`, `VendorLayout`, `DashboardLayout`)
- **UI Components**: 54 shadcn/ui primitives in `src/shared/components/ui/`
- **Feature Components**: Domain-specific in `src/features/*/components/`
- **Shared Components**: `ConfirmDialog`, `FileUpload`, `EnhancedFileUpload`, `NavLink`, `Meta`

#### 4.3 React Patterns (React 18 -- bukan 19)
- `React.lazy()` + `Suspense` untuk code splitting (semua 80+ pages lazy-loaded)
- `useCallback`, `useState`, `useEffect`, `useContext` -- standard hooks
- Context pattern: `AuthProvider` wrapping entire app
- TanStack Query untuk server state management
- Zustand untuk client UI state (sidebar toggle, persist)
- React Hook Form + Zod untuk form validation

#### 4.4 Routing & Authorization
- React Router v6 (`BrowserRouter` + `Routes` + `Route`)
- `ProtectedRoute` component dengan `allowedRoles` prop
- 4 role prefixes: `/admin/*`, `/merchant/*`, `/tenant/*`, `/vendor/*`
- Public routes: `/auth`, `/invite/:token`, `/referral`, `/payment/*`
- Lazy loading semua page components

#### 4.5 Styling Standards
Berdasarkan Tailwind patterns skill:
- **Semantic color tokens** (WAJIB): `bg-card`, `text-foreground`, `text-muted-foreground` -- JANGAN `bg-white`, `text-gray-900`
- **Dark mode**: Otomatis via CSS variables -- JANGAN manual `dark:` variants
- **Responsive**: Mobile-first (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- **Spacing scale**: 2, 4, 6, 8, 12, 16, 24 -- JANGAN random (5, 7, 9, 11)
- **Font families**: `font-sans` (Inter) untuk body, `font-display` (Plus Jakarta Sans) untuk headings
- **Custom utilities**: `.glass`, `.gradient-primary`, `.gradient-accent`, `.safe-area-top/bottom`
- **Touch targets**: Minimum 44x44px untuk mobile
- **Animations**: Gunakan `transition-transform`/`transition-opacity` (GPU) -- JANGAN `transition-all`

#### 4.6 Design Token Reference (Actual CSS Variables)
Dokumentasi lengkap light/dark mode tokens:
- Primary: `#8B6F47` (Cokelat Gelap)
- Secondary: `#A68B5B` (Cokelat Medium)
- Background: `#FFF8E7` (Krem)
- Accent: `#F4D03F` (Kuning Keemasan)
- Success/Warning/Info/Destructive semantic colors
- Chart colors (5 variants)
- Sidebar-specific colors

### 5. Backend Standards (Deno Edge Functions -- Menggantikan NestJS)

#### 5.1 Edge Function Structure
```text
supabase/functions/[function-name]/
  index.ts          -- Single entry point per function
```

#### 5.2 Standard Pattern
- CORS headers helper (shared pattern across all functions)
- `serve()` from Deno std library
- Supabase client creation with `SUPABASE_SERVICE_ROLE_KEY`
- Environment variables via `Deno.env.get()`
- JSON response with proper status codes

#### 5.3 Security Patterns
- Webhook verification: Timing-safe HMAC comparison (Xendit)
- JWT verification: `verify_jwt` config per function in `config.toml`
- Service role key: For admin-level database operations
- Idempotency: Check existing records before processing (webhooks)

#### 5.4 Error Handling Pattern
- Try/catch at function level
- Console.error for logging
- Structured JSON error responses with CORS headers
- HTTP status codes: 200 (success), 400 (client error), 401 (unauthorized), 500 (server error)

### 6. Data Layer Standards (Menggantikan Prisma)

#### 6.1 Supabase SDK Patterns
- Import: `import { supabase } from "@/integrations/supabase/client"`
- `.select()` for reads, `.insert()`, `.update()`, `.delete()` for writes
- `.maybeSingle()` untuk queries yang mungkin return 0 rows (race condition safe)
- `.eq()`, `.in()`, `.gte()`, `.lte()` untuk filtering
- JANGAN edit `client.ts` atau `types.ts` (auto-generated)

#### 6.2 Type Safety
- Types auto-generated dari database schema di `src/integrations/supabase/types.ts`
- Feature-specific types di `src/features/*/types/`
- Zod schemas untuk runtime validation (forms, API inputs)
- `as never` cast untuk JSONB columns (Supabase SDK limitation)

#### 6.3 Currency & Number Handling
- `formatCurrency()`: `Intl.NumberFormat('id-ID', { currency: 'IDR' })` -- centralized
- `formatCurrencyCompact()`: Rp 1.2M, Rp 500K -- for dashboards
- `parseCurrency()`: Strip formatting for input processing
- `numeric` type di database, `number` di TypeScript
- `Math.round()` untuk fee calculations (avoid floating point)

### 7. State Management Standards (Baru)

#### 7.1 Server State: TanStack Query
- Used for all API data fetching
- `QueryClientProvider` at app root
- Cache-first with stale-while-revalidate

#### 7.2 Client State: Zustand
- Persistent UI state (sidebar, preferences)
- `persist` middleware with `localStorage`
- Minimal global state -- prefer local component state

#### 7.3 Auth State: React Context
- `AuthProvider` wrapping BrowserRouter
- Exposes: `user`, `session`, `profile`, `role`, `merchant`, `vendor`
- Methods: `signIn`, `signUp`, `signOut`, `refreshProfile`
- Session listener via `supabase.auth.onAuthStateChange()`

### 8. Validation Standards (Baru)

#### 8.1 Zod Schemas (Centralized)
Documented schemas from actual codebase:
- `strongPasswordSchema`: 12+ chars, upper/lower/number/special, common password blacklist
- `phoneSchema`: Indonesian format `(+62|62|0)[0-9]{9,13}`
- `emailSchema`: Standard email validation
- `businessNameSchema`: 3-100 chars, alphanumeric + basic punctuation
- `merchantCodeSchema`: 6 chars uppercase alphanumeric
- `referralCodeSchema`: 8 chars uppercase alphanumeric
- `appRoleSchema`: `admin | merchant | tenant | vendor`

#### 8.2 Form Validation
- React Hook Form + Zod resolver
- Indonesian language error messages (Bahasa Indonesia)
- Password strength calculator with visual feedback

### 9. Audit & Logging Standards (Baru)

#### 9.1 Audit Log Pattern
- Centralized via `createAuditLog()` utility
- Typed actions: `create`, `update`, `delete`, `approve`, `reject`, `suspend`, `payout`, `export`, etc.
- Typed entities: `merchant`, `vendor`, `dispute`, `escrow`, `disbursement`, etc.
- Auto-captures: `user_id`, `user_agent`, `timestamp`
- Stores `old_data` and `new_data` for change tracking
- Helper functions: `logExport()`, `logConfigChange()`, `logPayout()`, `logStatusChange()`

### 10. Utility Standards (Baru)

#### 10.1 Date Utilities (Centralized)
- `formatDisplayDate()` -- `date-fns` based formatting
- `isOverdue()`, `isDueSoon()`, `getDaysOverdue()` -- business date logic
- Date range helpers: `getMonthDateRange()`, `getLastNDaysRange()`
- Re-exports from `date-fns` for consistency

#### 10.2 Status Color Mapping (Centralized)
- `getPriorityColor()` -- maps priority to badge variant
- `getJobStatusColor()`, `getOrderStatusColor()`, etc.
- Uses shadcn Badge variants: `default`, `secondary`, `destructive`, `outline`

#### 10.3 Business Constants (Centralized)
- `VENDOR_PLATFORM_FEE_PERCENT`: 5%
- `MINIMUM_PAYOUT_AMOUNT`: Rp 50,000
- `calculatePlatformFee()`, `calculateNetAmount()`

### 11. Build & Performance Standards (Diperbarui)

#### 11.1 Code Splitting Strategy
- 6 manual chunks: `vendor`, `ui`, `data`, `charts`, `maps`
- 80+ lazy-loaded page components
- Chunk size warning limit: 1000 KB
- Compression: Dual gzip + Brotli

#### 11.2 Performance Patterns (dari Tailwind patterns skill)
- GPU-accelerated animations only (`transform`, `opacity`)
- `aspect-ratio` for images (prevent CLS)
- `min-w-0` on grid items (prevent overflow)
- Mobile-first responsive breakpoints

### 12. TypeScript Configuration (Actual)

```json
{
  "compilerOptions": {
    "allowJs": true,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

Note: `noImplicitAny: false` dan `strictNullChecks: false` -- ini adalah konfigurasi pragmatis untuk development speed, bukan strict mode seperti yang diklaim di dokumen lama.

### 13. Import & Path Conventions

- Path alias: `@/` maps to `src/`
- Feature imports: `@/features/auth/hooks/useAuth`
- Shared imports: `@/shared/components/ui/button`
- Integration imports: `@/integrations/supabase/client` (JANGAN di-edit)
- Lib imports: `@/lib/integrations/supabase/client` (wrapper)

### 14. Naming Conventions (Actual)

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `PropertyCard.tsx` |
| Hooks | camelCase `use*` | `useAuth.tsx`, `useDebounce.ts` |
| Services | camelCase | `locationService.ts` |
| Utils | camelCase | `currency.ts`, `dateUtils.ts` |
| Types | PascalCase | `auth.ts` (exports `AppRole`, `UserProfile`) |
| Constants | SCREAMING_SNAKE | `VENDOR_PLATFORM_FEE_PERCENT` |
| Pages | PascalCase | `Dashboard.tsx` |
| Layouts | PascalCase + `Layout` | `AdminLayout.tsx` |
| Edge Functions | kebab-case directory | `xendit-webhook/index.ts` |
| CSS Variables | kebab-case | `--primary-foreground` |
| Database cols | snake_case | `created_at`, `user_id` |
| Zod schemas | camelCase + `Schema` | `strongPasswordSchema` |

### 15. Forbidden Patterns (Baru)

- JANGAN edit `src/integrations/supabase/client.ts` (auto-generated)
- JANGAN edit `src/integrations/supabase/types.ts` (auto-generated)
- JANGAN edit `supabase/config.toml` (auto-managed)
- JANGAN edit `.env` (auto-managed)
- JANGAN gunakan raw colors (`bg-white`, `text-gray-500`) -- gunakan semantic tokens
- JANGAN gunakan `dark:` variants -- semantic tokens handle dark mode
- JANGAN gunakan `any` tanpa justifikasi
- JANGAN gunakan `transition-all` -- gunakan specific properties
- JANGAN gunakan fixed px values untuk font sizes (`text-[16px]`)
- JANGAN gunakan random z-index (`z-[999]`, `z-[9999]`)

### 16. Version Control (Diperbarui)

- Lovable IDE auto-deploys (no manual CI/CD)
- Git-based version history in Lovable
- No branching strategy needed (Lovable manages this)
- Code review via Lovable chat interaction

---

## Skills yang Digunakan

| Skill | Penerapan |
|-------|-----------|
| `tailwind-patterns` | Semantic colors, responsive design, spacing scale, dark mode, touch targets, animation performance, z-index, form validation states |
| `supabase-postgres-best-practices` | Data types (text, timestamptz, numeric), SDK patterns, RLS awareness |
| `api-security-best-practices` | Webhook verification, JWT config, timing-safe comparison |
| `architecture-patterns` | Feature-based module organization, layered service architecture |
| `database-design` | Type safety with auto-generated types, JSONB handling |
| `web-performance-optimization` | Code splitting, lazy loading, GPU animations, compression |
| `pci-compliance` | No PAN storage, tokenized payment references |
| `security-auditor` | Audit log patterns, immutable logging, role-based access |

---

## Hasil Akhir

Dokumen development standards lengkap (~900+ baris) yang mencerminkan standar pengembangan aktual: React 18 + Vite SPA, 25 feature modules, 54 shadcn/ui components, Deno Edge Functions, Supabase SDK direct access, Zustand + TanStack Query state management, Zod validation, dan Tailwind semantic token system -- menggantikan seluruh referensi NestJS/Prisma/Python/BullMQ yang tidak relevan.

