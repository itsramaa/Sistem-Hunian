# Backend Architecture Document - SiHuni (Sistem Manajemen Hunian)

**Version:** 2.0  
**Date:** 2026-02-21  
**Status:** Implementation Complete  
**Platform:** Lovable Cloud (Deno Edge Functions + PostgreSQL)  

---

## Table of Contents

1. [Architectural Overview](#1-architectural-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture Diagram](#3-system-architecture-diagram)
4. [Clean Architecture Implementation](#4-clean-architecture-implementation)
5. [Database Architecture](#5-database-architecture)
6. [Authentication & Security](#6-authentication--security)
7. [Edge Functions Architecture](#7-edge-functions-architecture)
8. [Async Processing & Cron Jobs](#8-async-processing--cron-jobs)
9. [Payment Pipeline (Xendit)](#9-payment-pipeline-xendit)
10. [Escrow & Disbursement Engine](#10-escrow--disbursement-engine)
11. [AI & Chatbot Architecture](#11-ai--chatbot-architecture)
12. [Notification System](#12-notification-system)
13. [Subscription & Billing Engine](#13-subscription--billing-engine)
14. [Referral Commission Engine](#14-referral-commission-engine)
15. [Frontend Architecture](#15-frontend-architecture)
16. [Security Architecture](#16-security-architecture)
17. [Scalability & Performance](#17-scalability--performance)
18. [Development Standards](#18-development-standards)
19. [Deployment Architecture](#19-deployment-architecture)
20. [Monitoring & Observability](#20-monitoring--observability)

---

## 1. Architectural Overview

SiHuni's backend is designed as a **Serverless Modular Monolith** running on Lovable Cloud. It combines the simplicity of a single deployment unit with the isolation of serverless edge functions for complex business logic.

### 1.1 Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Serverless-First** | 31 Deno Edge Functions handle all server-side logic |
| **Database-as-API** | PostgreSQL + RLS policies serve as the primary API for CRUD |
| **Event-Driven** | Webhooks and cron jobs handle async workflows |
| **Zero-Trust Data** | Row Level Security (RLS) enforces access at the database level |
| **Feature-Based Modularity** | 25 feature modules with isolated services, hooks, types, and components |

### 1.2 Key Metrics

| Metric | Value |
|--------|-------|
| Edge Functions | 31 |
| Database Tables | 40+ |
| Feature Modules | 25 |
| RLS Policies | 100+ |
| Notification Templates | 30+ |
| Supported Roles | 7 (super_admin, admin, moderator, support, merchant, tenant, vendor) |

---

## 2. Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Runtime** | Deno (Edge Functions) | Secure by default, TypeScript native, fast cold starts |
| **Frontend** | React 18 + TypeScript + Vite | Component-based UI with type safety and fast HMR |
| **Database** | PostgreSQL 16 (Supabase) | JSONB support, RLS, realtime subscriptions |
| **ORM/Client** | Supabase JS SDK v2 | Type-safe queries, realtime, auth, storage integration |
| **State Management** | TanStack React Query v5 + Zustand | Server state caching + client state management |
| **Payment Gateway** | Xendit | Indonesia-focused payment infra (VA, e-wallet, QRIS) |
| **Email Service** | Resend API | Developer-friendly transactional email |
| **AI Provider** | Lovable AI (Gemini models) | Context-aware chatbot without API key management |
| **Storage** | Supabase Storage | Object storage for KTP, signatures, documents, images |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first CSS with accessible component library |
| **Forms** | React Hook Form + Zod | Performant forms with schema-based validation |
| **Charts** | Recharts | Composable chart components for analytics dashboards |
| **Maps** | React Leaflet | Property location mapping |
| **PDF** | Edge Function (HTML→PDF) | Server-side invoice PDF generation |
| **Routing** | React Router v6 | Client-side routing with role-based guards |

---

## 3. System Architecture Diagram

```mermaid
graph TD
    subgraph "Client Layer"
        PWA[React PWA / SPA]
        RQ[TanStack React Query]
        ZS[Zustand Store]
    end

    subgraph "API Layer"
        SDK[Supabase JS SDK]
        EF[31 Deno Edge Functions]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL 16)]
        RLS[RLS Policies]
        RT[Realtime Engine]
        ST[Supabase Storage]
    end

    subgraph "External Services"
        XEN[Xendit Payment Gateway]
        RSN[Resend Email API]
        LAI[Lovable AI / Gemini]
        WA[WhatsApp API]
    end

    subgraph "Async Processing"
        CRON[Cron Scheduler]
        WH[Webhook Handlers]
    end

    PWA --> RQ
    PWA --> ZS
    RQ --> SDK
    SDK -->|Direct CRUD with RLS| PG
    SDK -->|invoke| EF
    EF -->|Service Role Key| PG
    EF --> XEN
    EF --> RSN
    EF --> LAI
    EF --> WA
    PG --> RLS
    PG --> RT
    RT -->|Realtime subscriptions| PWA
    XEN -->|Webhook| WH
    WH --> EF
    CRON -->|Daily triggers| EF
```

### 3.1 Data Flow Patterns

```mermaid
graph LR
    subgraph "Pattern 1: Direct CRUD"
        C1[Client] -->|SDK + RLS| DB1[(Database)]
    end

    subgraph "Pattern 2: Edge Function"
        C2[Client] -->|invoke| EF2[Edge Function]
        EF2 -->|Service Role| DB2[(Database)]
        EF2 -->|API call| EXT2[External Service]
    end

    subgraph "Pattern 3: Webhook"
        EXT3[Xendit] -->|POST| WH3[Webhook Handler]
        WH3 -->|Service Role| DB3[(Database)]
        WH3 -->|invoke| NTF3[Notification]
    end

    subgraph "Pattern 4: Cron"
        SCH4[Scheduler] -->|POST| CRON4[Cron Function]
        CRON4 -->|Service Role| DB4[(Database)]
        CRON4 -->|invoke| NTF4[Notification]
    end
```

---

## 4. Clean Architecture Implementation

### 4.1 Frontend Feature Module Structure

Each of the 25 feature modules follows a consistent **Clean Architecture** layout:

```
src/features/{module}/
├── components/          # UI components (Presentational + Container)
│   ├── admin/           # Admin-specific components
│   └── tenant/          # Tenant-specific components
├── hooks/               # Custom React hooks (use cases)
│   ├── use{Module}.ts           # Main data hook
│   └── use{Module}Actions.ts   # Mutation hooks
├── services/            # Data access layer (Supabase queries)
│   └── {module}Service.ts
├── types/               # TypeScript interfaces & types
│   └── index.ts
└── utils/               # Pure utility functions
```

### 4.2 Layer Responsibilities

```mermaid
graph TB
    subgraph "Presentation Layer"
        PAGES[Pages / Routes]
        COMP[Components]
    end

    subgraph "Application Layer"
        HOOKS[Custom Hooks]
        RQ2[React Query]
    end

    subgraph "Domain Layer"
        TYPES[TypeScript Types/Interfaces]
        UTILS[Business Logic Utils]
    end

    subgraph "Infrastructure Layer"
        SVC[Service Functions]
        SDK2[Supabase SDK Client]
        EF3[Edge Functions]
    end

    PAGES --> COMP
    COMP --> HOOKS
    HOOKS --> RQ2
    RQ2 --> SVC
    HOOKS --> TYPES
    SVC --> SDK2
    SVC --> TYPES
    UTILS --> TYPES
    SDK2 --> EF3
```

| Layer | Responsibility | Dependencies |
|-------|---------------|--------------|
| **Presentation** | UI rendering, user interaction, routing | Application Layer |
| **Application** | Use case orchestration, data fetching/caching, mutations | Domain + Infrastructure |
| **Domain** | Type definitions, business rules, validation schemas | None (pure) |
| **Infrastructure** | Database queries, API calls, storage operations | Supabase SDK |

### 4.3 Feature Modules (25 Modules)

| Module | Description | Key Tables |
|--------|-------------|------------|
| `analytics` | Dashboard analytics, merchant stats, churn analysis | `analytics_events`, `contracts` |
| `audit-logs` | System audit trail, admin activity logs | `audit_logs` |
| `auth` | Authentication, registration, role management, 2FA | `profiles`, `user_roles` |
| `billing` | Subscription billing, payment status | `merchant_subscriptions`, `subscription_invoices` |
| `chatbot` | AI chatbot, knowledge base management | `chat_conversations`, `chat_messages`, `chatbot_knowledge` |
| `contracts` | Contract lifecycle, signatures, move-out, early termination | `contracts`, `move_out_notices`, `move_out_inspections` |
| `dashboard` | Role-specific dashboards (admin, merchant, tenant, vendor) | Multiple tables |
| `disputes` | Tenant-merchant dispute resolution | `disputes` |
| `escrow` | Escrow management, disbursement review | `escrow_accounts`, `escrow_transactions`, `disbursements` |
| `forum` | Community forum, posts, comments, moderation | `forum_posts`, `forum_comments`, `forum_reports` |
| `maintenance` | Maintenance requests, vendor assignment, timeline | `maintenance_requests`, `maintenance_updates` |
| `notifications` | In-app notification center | `notifications` |
| `orders` | Marketplace orders, fulfillment tracking | `orders`, `order_items` |
| `payments` | Payment processing, invoice management | `invoices`, `payments`, `xendit_transactions` |
| `platform-config` | Platform settings, feature flags | `platform_settings` |
| `products` | Vendor product catalog | `products` |
| `profile` | User profile management | `profiles` |
| `properties` | Property & unit management | `properties`, `units` |
| `referrals` | Referral program, commission tracking | `referrals`, `referral_rewards` |
| `search` | Global search across entities | Multiple tables |
| `signature` | Digital signature capture (canvas-based) | `contracts` (signature URLs) |
| `subscriptions` | Subscription tier management | `subscription_tiers`, `merchant_subscriptions` |
| `users` | Admin user management, merchant/tenant/vendor administration | `profiles`, `merchants`, `tenants`, `vendors` |
| `vendors` | Vendor management, verification | `vendors`, `vendor_verifications` |
| `verification` | Document verification workflow | `merchant_verifications`, `vendor_verifications` |

---

## 5. Database Architecture

### 5.1 Schema Overview (40+ Tables)

```mermaid
erDiagram
    auth_users ||--o{ profiles : "user_id"
    auth_users ||--o{ user_roles : "user_id"
    auth_users ||--o{ merchants : "user_id"
    auth_users ||--o{ tenants : "user_id"
    auth_users ||--o{ vendors : "user_id"

    merchants ||--o{ properties : "merchant_id"
    merchants ||--o{ contracts : "merchant_id"
    merchants ||--o{ invoices : "merchant_id"
    merchants ||--o{ escrow_accounts : "merchant_id"
    merchants ||--o{ bank_accounts : "merchant_id"
    merchants ||--o{ merchant_subscriptions : "merchant_id"
    merchants ||--o{ merchant_verifications : "merchant_id"

    properties ||--o{ units : "property_id"
    units ||--o{ contracts : "unit_id"

    contracts ||--o{ invoices : "contract_id"
    contracts ||--o{ move_out_notices : "contract_id"
    contracts ||--o{ deposit_refunds : "contract_id"
    contracts ||--o{ early_termination_requests : "contract_id"

    invoices ||--o{ payments : "invoice_id"
    invoices ||--o{ late_fee_records : "invoice_id"
    invoices ||--o{ collections_cases : "invoice_id"

    escrow_accounts ||--o{ escrow_transactions : "escrow_account_id"
    escrow_accounts ||--o{ disbursements : "escrow_account_id"

    vendors ||--o{ products : "vendor_id"
    vendors ||--o{ vendor_verifications : "vendor_id"
    vendors ||--o{ vendor_bank_accounts : "vendor_id"

    subscription_tiers ||--o{ merchant_subscriptions : "tier_id"
```

### 5.2 Table Groups

#### Core Identity (5 tables)
| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User profile data (name, email, phone, avatar, 2FA) | Own data + admin read |
| `user_roles` | RBAC role assignments (`app_role` enum) | Admin manage, user read own |
| `merchants` | Merchant business data, verification status | Own data + admin manage |
| `tenants` | Tenant profile, KTP, emergency contacts, notification prefs | Own data + merchant read linked |
| `vendors` | Vendor business data, categories, verification | Own data + admin manage |

#### Property Management (2 tables)
| Table | Purpose | RLS |
|-------|---------|-----|
| `properties` | Property listings with type, address, amenities, images | Merchant own + admin manage |
| `units` | Individual units within properties (price, status, floor) | Merchant own + admin manage |

#### Contract Lifecycle (7 tables)
| Table | Purpose | RLS |
|-------|---------|-----|
| `contracts` | Rental contracts with terms, signatures, billing config | Merchant manage + tenant read |
| `move_out_notices` | Formal move-out notifications with expected dates | Merchant + tenant access |
| `move_out_inspections` | Property inspection reports with deductions | Merchant manage + tenant confirm |
| `move_out_tasks` | Checklist items for move-out process | Merchant + tenant access |
| `deposit_refunds` | Deposit refund tracking with bank details | Merchant manage + tenant read |
| `deposit_disputes` | Tenant disputes on deposit deductions | Tenant create + admin resolve |
| `early_termination_requests` | Early contract termination with penalty calculation | Tenant request + merchant respond |

#### Financial (8 tables)
| Table | Purpose | RLS |
|-------|---------|-----|
| `invoices` | Rent/service invoices with line items, late fees | Merchant manage + tenant read |
| `payments` | Payment records (rent, deposit, order, subscription) | Merchant manage + tenant read |
| `xendit_transactions` | Xendit payment gateway transaction records | System create + user read own |
| `payment_plans` | Installment/deferred payment arrangements | Merchant create + tenant accept |
| `late_fee_records` | Late fee calculation audit trail | System managed |
| `collections_cases` | Overdue invoice escalation tracking | Merchant manage + admin read |
| `escrow_accounts` | Merchant escrow balance tracking | Merchant read + admin manage |
| `escrow_transactions` | Escrow credit/debit transaction ledger | Merchant read + admin manage |
| `disbursements` | Payout processing to merchant/vendor bank accounts | Admin review + merchant read |

#### Subscription (4 tables)
| Table | Purpose | RLS |
|-------|---------|-----|
| `subscription_tiers` | Platform subscription plans (Basic/Pro/Enterprise) | Public read + admin manage |
| `merchant_subscriptions` | Active merchant subscriptions | Merchant read + admin manage |
| `subscription_invoices` | Subscription billing invoices | Merchant read + admin manage |
| `cancellation_feedback` | Post-cancellation survey data | Merchant insert + admin read |

#### Marketplace (4 tables)
| Table | Purpose | RLS |
|-------|---------|-----|
| `products` | Vendor product catalog | Vendor manage + public read |
| `orders` | Purchase orders from tenants/merchants | Buyer read + vendor manage |
| `order_items` | Individual items within orders | Follows order access |
| `order_reviews` | Product/vendor reviews | Buyer create + public read |

#### Maintenance (4 tables)
| Table | Purpose | RLS |
|-------|---------|-----|
| `maintenance_requests` | Repair/maintenance request tickets | Tenant create + merchant manage |
| `maintenance_updates` | Status updates and comments on requests | Author create + involved read |
| `maintenance_timeline` | Automated timeline tracking | System managed |
| `maintenance_reviews` | Tenant reviews of completed maintenance | Tenant create + vendor read |

#### Community (4 tables)
| Table | Purpose | RLS |
|-------|---------|-----|
| `forum_posts` | Community forum posts | Author manage + public read visible |
| `forum_comments` | Threaded comments with nested replies | Author manage + public read visible |
| `forum_likes` | Post/comment like records | User own |
| `forum_reports` | Content moderation reports | Reporter create + admin review |

#### Referral (2 tables)
| Table | Purpose | RLS |
|-------|---------|-----|
| `referrals` | Referral tracking (referrer → referee) | User own + admin manage |
| `referral_rewards` | Commission/reward tracking | User read + admin manage |

#### System (5 tables)
| Table | Purpose | RLS |
|-------|---------|-----|
| `notifications` | In-app notification records | User own |
| `audit_logs` | System audit trail (immutable) | Admin read + system insert |
| `analytics_events` | User behavior tracking | System managed |
| `platform_settings` | Platform configuration (JSONB values) | Public read + admin manage |
| `chatbot_knowledge` | AI knowledge base Q&A pairs | Admin manage |

#### Location (2 tables)
| Table | Purpose | RLS |
|-------|---------|-----|
| `provinces` | Indonesian provinces reference | Public read |
| `cities` | Indonesian cities reference | Public read |

### 5.3 Indexing Strategy

Following `supabase-postgres-best-practices` skill:

| Index Type | Columns | Purpose |
|------------|---------|---------|
| **B-Tree** | `merchant_id`, `tenant_user_id`, `user_id` | FK lookups, RLS policy evaluation |
| **B-Tree** | `status` (on invoices, contracts, orders) | Status filtering queries |
| **B-Tree Composite** | `(merchant_id, status)` | Filtered merchant queries |
| **B-Tree Composite** | `(contract_id, due_date)` | Invoice ordering per contract |
| **GIN** | `line_items` (JSONB on invoices) | JSONB containment queries |
| **GIN** | `features` (JSONB on subscription_tiers) | Feature flag lookups |
| **GIN** | `tags` (on forum_posts) | Tag-based search |

### 5.4 RLS Policy Design

All tables use **restrictive** RLS mode (explicit DENY by default):

```sql
-- Pattern: Merchant owns data through merchant_id
CREATE POLICY "Merchants can manage their invoices"
ON public.invoices FOR ALL
USING (EXISTS (
  SELECT 1 FROM merchants m
  WHERE m.id = invoices.merchant_id AND m.user_id = auth.uid()
));

-- Pattern: Tenant sees own data via tenant_user_id
CREATE POLICY "Tenants can view their invoices"
ON public.invoices FOR SELECT
USING (tenant_user_id = auth.uid());

-- Pattern: Admin sees all via role check
CREATE POLICY "Admins can manage all invoices"
ON public.invoices FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
```

**Key RLS function:**
```sql
CREATE FUNCTION has_role(user_id UUID, role app_role) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = $1 AND user_roles.role = $2
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

---

## 6. Authentication & Security

### 6.1 Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client (React)
    participant A as Supabase Auth
    participant B as ensure-user-bootstrap
    participant DB as PostgreSQL

    U->>C: Sign Up (email + password)
    C->>A: supabase.auth.signUp()
    A->>U: Confirmation Email
    U->>A: Confirm Email
    A->>C: Session + JWT
    C->>B: invoke('ensure-user-bootstrap')
    B->>DB: Create profile
    B->>DB: Assign role (from metadata)
    B->>DB: Create merchant/tenant/vendor record
    B-->>C: { success: true, role, profile }
```

### 6.2 RBAC (Role-Based Access Control)

```mermaid
graph TD
    subgraph "Role Hierarchy"
        SA[super_admin] --> A[admin]
        A --> MOD[moderator]
        A --> SUP[support]
        MER[merchant] -.->|independent| A
        TEN[tenant] -.->|independent| A
        VEN[vendor] -.->|independent| A
    end
```

| Role | Scope | Capabilities |
|------|-------|-------------|
| `super_admin` | Global | All admin + system config, role management |
| `admin` | Global | User management, verifications, escrow, platform settings |
| `moderator` | Forum | Content moderation, post/comment visibility |
| `support` | Limited | View tickets, respond to disputes |
| `merchant` | Own Data | Properties, units, contracts, invoices, bank accounts |
| `tenant` | Own Data | View invoices, pay rent, maintenance requests, forum |
| `vendor` | Own Data | Products, orders, bank accounts, maintenance jobs |

### 6.3 Admin 2FA (TOTP)

```mermaid
sequenceDiagram
    participant Admin as Admin User
    participant FE as Frontend
    participant DB as Database
    participant TOTP as OTPAuth Library

    Admin->>FE: Enable 2FA
    FE->>TOTP: Generate Secret + QR Code
    FE->>Admin: Display QR Code
    Admin->>FE: Scan & Enter OTP Code
    FE->>TOTP: Validate OTP
    FE->>DB: Store encrypted secret in profiles.admin_2fa_secret
    Note over DB: admin_2fa_enabled = true

    Admin->>FE: Login (requires 2FA)
    FE->>Admin: Prompt for OTP
    Admin->>FE: Enter OTP
    FE->>TOTP: Validate against stored secret
    FE->>Admin: Access granted
```

### 6.4 Tenant Invitation Flow (Public Endpoints)

```mermaid
sequenceDiagram
    participant M as Merchant
    participant DB as Database
    participant T as Tenant (New User)
    participant EF1 as get-tenant-invitation
    participant EF2 as accept-tenant-invitation

    M->>DB: Create invitation (unit, contract terms)
    DB-->>M: Invitation token (UUID)
    M->>T: Share invitation link

    T->>EF1: POST { token }
    Note over EF1: No JWT required
    EF1->>DB: Validate token, check expiry
    EF1-->>T: { invitation details, property info }

    T->>T: Sign up / Sign in
    T->>EF2: POST { token, user_id, contract_duration }
    Note over EF2: No JWT required
    EF2->>DB: Create tenant profile
    EF2->>DB: Create contract
    EF2->>DB: Generate initial invoices
    EF2->>DB: Update unit status → occupied
    EF2-->>T: { success, contract_id }
```

---

## 7. Edge Functions Architecture

### 7.1 Overview

31 Deno Edge Functions organized into 10 functional categories:

```
supabase/functions/
├── accept-tenant-invitation/     # Tenant onboarding
├── ai-chatbot/                   # Multi-role AI chatbot
├── auth-webhook/                 # Auth event handler
├── auto-generate-invoices/       # Billing automation (cron)
├── auto-pay-execute/             # Auto-pay processing (cron)
├── check-overdue-escalation/     # Overdue escalation (cron)
├── check-payment-plan/           # Payment plan monitor (cron)
├── ensure-user-bootstrap/        # User profile bootstrap
├── generate-invoice-pdf/         # PDF generation
├── get-tenant-invitation/        # Invitation validation
├── merchant-ai-assistant/        # Merchant AI helper
├── order-auto-reject/            # Order timeout (cron)
├── process-deposit-refund/       # Deposit refund via Xendit
├── process-referral-commissions/ # Referral processing (cron)
├── process-referral-reward/      # Reward crediting
├── process-vendor-order-referral/# Vendor referral bonus
├── scheduled-disbursement/       # Auto-disbursement (cron)
├── send-notification/            # Email via Resend (30+ templates)
├── send-payment-reminder/        # Payment reminders (cron)
├── subscription-billing/         # Subscription invoicing (cron)
├── subscription-grace-check/     # Grace period monitor (cron)
├── subscription-payment/         # Subscription payment creation
├── subscription-renewal/         # Auto-renewal (cron)
├── vacancy-tracking-cron/        # Vacancy monitoring (cron)
├── validate-admin-secret/        # Admin 2FA validation
├── vendor-ai-assistant/          # Vendor AI helper
├── whatsapp-notification/        # WhatsApp messaging
├── xendit-create-invoice/        # Payment invoice creation
├── xendit-disbursement/          # Disbursement processing
├── xendit-disbursement-webhook/  # Disbursement callback
└── xendit-webhook/               # Payment callback
```

### 7.2 Edge Function Patterns

#### Pattern A: Authenticated Function (JWT Required)
```typescript
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return unauthorized();

  // Create user-context client for RLS
  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } }
  });

  // Create admin client for service-role operations
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return unauthorized();

  // Business logic...
});
```

#### Pattern B: Webhook Handler (Token Verification)
```typescript
serve(async (req) => {
  const callbackToken = req.headers.get('x-callback-token');
  const XENDIT_WEBHOOK_TOKEN = Deno.env.get('XENDIT_WEBHOOK_TOKEN');

  // Timing-safe comparison (prevent timing attacks)
  const encoder = new TextEncoder();
  const a = encoder.encode(callbackToken);
  const b = encoder.encode(XENDIT_WEBHOOK_TOKEN);
  
  if (a.byteLength !== b.byteLength) return unauthorized();
  let diff = 0;
  for (let i = 0; i < a.byteLength; i++) diff |= a[i] ^ b[i];
  if (diff !== 0) return unauthorized();

  // Process webhook payload...
});
```

#### Pattern C: Cron Job (Service Role Only)
```typescript
serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Query all relevant records (bypasses RLS)
  // Process batch operations
  // Send notifications for state changes
});
```

#### Pattern D: Public Endpoint (No Auth)
```typescript
serve(async (req) => {
  const { token } = await req.json();
  
  // Input validation
  if (!token || typeof token !== 'string') return badRequest('INVALID_TOKEN');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // Validate token against database
  // Return public-safe data
});
```

### 7.3 Error Handling Standards

All edge functions use consistent error codes (from `api-security-best-practices` skill):

```typescript
const ERROR_CODES = {
  RATE_LIMIT: 'ERR_RATE_LIMIT',
  AI_UNAVAILABLE: 'ERR_AI_UNAVAILABLE',
  INVALID_INPUT: 'ERR_INVALID_INPUT',
  AUTH_REQUIRED: 'ERR_AUTH_REQUIRED',
  CONTEXT_FAILED: 'ERR_CONTEXT_FAILED',
};

// Standard error response
return new Response(
  JSON.stringify({ error: ERROR_CODES.INVALID_INPUT, message: 'Detailed description' }),
  { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
);
```

### 7.4 CORS Configuration

All edge functions include standardized CORS headers:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-callback-token',
};
```

---

## 8. Async Processing & Cron Jobs

### 8.1 Cron Job Schedule

```mermaid
gantt
    title Daily Cron Job Execution Order
    dateFormat HH:mm
    axisFormat %H:%M

    section Billing
    auto-generate-invoices      :00:00, 30min
    send-payment-reminder       :00:30, 20min
    check-overdue-escalation    :01:00, 20min
    check-payment-plan          :01:30, 15min

    section Subscriptions
    subscription-billing        :02:00, 20min
    subscription-renewal        :02:30, 15min
    subscription-grace-check    :03:00, 15min

    section Operations
    scheduled-disbursement      :04:00, 30min
    vacancy-tracking-cron       :05:00, 20min
    order-auto-reject           :05:30, 15min
    process-referral-commissions:06:00, 15min
```

### 8.2 Cron Functions Detail

| Function | Trigger | Logic | Side Effects |
|----------|---------|-------|-------------|
| `auto-generate-invoices` | Daily | Find active contracts where `billing_day = today`, generate rent invoices | Creates `invoices`, sends email via `send-notification` |
| `send-payment-reminder` | Daily | Find unpaid invoices due in 7d/3d/today | Sends email reminders |
| `check-overdue-escalation` | Daily | Find overdue invoices, apply late fees, escalate to collections | Updates `invoices`, creates `late_fee_records`, `collections_cases` |
| `check-payment-plan` | Daily | Monitor installment payments, auto-default missed plans | Updates `payment_plans` status |
| `subscription-billing` | Daily | Check subscriptions due for billing, create subscription invoices | Creates `subscription_invoices` |
| `subscription-renewal` | Daily | Auto-renew subscriptions at period end | Updates `merchant_subscriptions` |
| `subscription-grace-check` | Daily | Suspend/cancel overdue subscriptions after grace period | Updates subscription status, sends notifications |
| `scheduled-disbursement` | Daily | Process merchant escrow disbursements based on schedule | Creates `disbursements`, calls Xendit API |
| `vacancy-tracking-cron` | Daily | Track vacant units, calculate vacancy days, alert merchants | Updates unit metadata, sends notifications |
| `order-auto-reject` | Daily | Auto-reject vendor orders not responded within 48 hours | Updates `orders` status |
| `process-referral-commissions` | Daily | Process eligible referral commissions based on criteria | Creates `referral_rewards` |
| `auto-pay-execute` | Daily | Execute auto-pay for tenants with `auto_pay_enabled = true` | Creates Xendit invoices |

---

## 9. Payment Pipeline (Xendit)

### 9.1 Payment Flow

```mermaid
sequenceDiagram
    participant T as Tenant
    participant FE as Frontend
    participant EF as xendit-create-invoice
    participant X as Xendit API
    participant WH as xendit-webhook
    participant DB as Database
    participant NTF as send-notification
    participant ESC as Escrow

    T->>FE: Click "Pay Invoice"
    FE->>EF: invoke({ invoice_id, payment_method })
    EF->>DB: Fetch invoice + merchant details
    EF->>X: POST /v2/invoices
    X-->>EF: { invoice_url, id }
    EF->>DB: Create xendit_transaction (status: pending)
    EF-->>FE: { payment_url }
    FE->>T: Redirect to Xendit payment page

    T->>X: Complete payment
    X->>WH: POST webhook (status: PAID)
    WH->>WH: Timing-safe token verification
    WH->>X: GET /v2/invoices/{id} (server-side verification)
    WH->>DB: Update xendit_transaction (status: paid)
    WH->>DB: Update invoice (status: paid, paid_at)
    WH->>DB: Update payment record
    WH->>ESC: Calculate fees, credit escrow
    Note over ESC: Gross - 1% platform - 2.5% gateway = Net
    WH->>NTF: Send payment receipt to tenant
    WH->>NTF: Send payment notification to merchant
```

### 9.2 Fee Calculation Engine

```
┌─────────────────────────────────────────┐
│         Payment Fee Breakdown           │
├─────────────────────────────────────────┤
│ Gross Amount (paid by tenant)     100%  │
│ ├─ Platform Fee                   -1%   │
│ ├─ Gateway Fee (Xendit)           -2.5% │
│ └─ Net to Escrow                  96.5% │
├─────────────────────────────────────────┤
│         Disbursement Fees               │
├─────────────────────────────────────────┤
│ Daily schedule                    0.25% │
│ Weekly schedule                   0.20% │
│ Bi-weekly schedule                0.15% │
│ Monthly schedule                  0.10% │
└─────────────────────────────────────────┘
```

### 9.3 Webhook Security (from `api-security-best-practices` skill)

1. **Token Verification**: Timing-safe byte comparison prevents timing attacks
2. **Server-Side Validation**: Cross-verify payment status with Xendit API
3. **Idempotency**: Check `xendit_transactions.xendit_invoice_id` before processing (from `payment-integration` skill)
4. **Atomic Updates**: All database changes within single transaction scope

---

## 10. Escrow & Disbursement Engine

### 10.1 Escrow Flow

```mermaid
stateDiagram-v2
    [*] --> PaymentReceived
    PaymentReceived --> FeeDeducted: Calculate fees
    FeeDeducted --> EscrowCredited: Net amount credited
    EscrowCredited --> DisbursementScheduled: Based on merchant schedule
    DisbursementScheduled --> DisbursementProcessing: Xendit API call
    DisbursementProcessing --> DisbursementCompleted: Webhook confirms
    DisbursementProcessing --> DisbursementFailed: Webhook reports failure
    DisbursementFailed --> DisbursementScheduled: Retry
    DisbursementCompleted --> [*]
```

### 10.2 Disbursement Schedules

| Schedule | Processing | Fee Rate | Min Amount |
|----------|-----------|----------|------------|
| Daily | Every day at 04:00 | 0.25% | Configurable per merchant |
| Weekly | Every Monday | 0.20% | Configurable per merchant |
| Bi-weekly | 1st & 15th | 0.15% | Configurable per merchant |
| Monthly | 1st of month | 0.10% | Configurable per merchant |

### 10.3 Escrow Transaction Types

| Type | Direction | Description |
|------|-----------|-------------|
| `rent_payment` | Credit | Tenant rent payment received |
| `deposit_payment` | Credit | Security deposit received |
| `order_payment` | Credit | Marketplace order payment |
| `disbursement` | Debit | Payout to merchant bank account |
| `refund` | Debit | Tenant refund processed |
| `platform_fee` | Debit | Platform commission deducted |

---

## 11. AI & Chatbot Architecture

### 11.1 Multi-Role AI System

```mermaid
graph TD
    subgraph "AI Chatbot System"
        TC[Tenant Chatbot] --> CTX[Context Builder]
        MC[Merchant AI Assistant] --> CTX
        VC[Vendor AI Assistant] --> CTX

        CTX --> |Contract data| DB[(Database)]
        CTX --> |Invoice data| DB
        CTX --> |Property data| DB
        CTX --> |Knowledge base| DB

        CTX --> SAN[Input Sanitizer]
        SAN --> AI[Lovable AI / Gemini]
        AI --> RES[Response Formatter]
    end
```

### 11.2 Context-Aware Prompt Engineering

Each AI assistant builds role-specific context:

| Role | Context Data | Knowledge Source |
|------|-------------|-----------------|
| **Tenant** | Active contract, invoices, maintenance requests, property info | `chatbot_knowledge` + live DB |
| **Merchant** | Properties, units, financial summaries, tenant info | `chatbot_knowledge` + live DB |
| **Vendor** | Products, orders, reviews, earnings | `chatbot_knowledge` + live DB |

### 11.3 Security (from `api-security-best-practices` skill)

**Prompt Injection Prevention:**
```typescript
const sanitizeInput = (input: string): string => {
  const patterns = [
    /ignore previous instructions/gi,
    /system:/gi,
    /\[INST\]/gi,
    /<\|.*?\|>/g,
    /```system/gi,
    /\bprompt\s*:/gi,
  ];
  let sanitized = input;
  patterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[filtered]');
  });
  return sanitized.trim().substring(0, 2000); // Max 2000 chars
};
```

---

## 12. Notification System

### 12.1 Architecture

```mermaid
graph LR
    subgraph "Triggers"
        WH[Webhooks]
        CRON[Cron Jobs]
        EF[Edge Functions]
        CLIENT[Client Actions]
    end

    subgraph "send-notification"
        ROUTER[Template Router]
        T1[30+ Email Templates]
        RESEND[Resend API]
    end

    subgraph "Channels"
        EMAIL[Email]
        INAPP[In-App Notifications]
        WA2[WhatsApp]
    end

    WH --> ROUTER
    CRON --> ROUTER
    EF --> ROUTER
    CLIENT -->|Direct DB insert| INAPP

    ROUTER --> T1
    T1 --> RESEND
    RESEND --> EMAIL

    EF --> WA2
```

### 12.2 Notification Types (30+)

| Category | Types |
|----------|-------|
| **Billing** | `invoice`, `payment_reminder`, `payment_receipt`, `payment_received`, `late_fee_applied` |
| **Subscription** | `subscription_upgrade`, `subscription_payment`, `subscription_invoice`, `subscription_suspended`, `subscription_cancelled`, `subscription_renewal_reminder` |
| **Tenant** | `tenant_registration`, `tenant_invitation` |
| **Disbursement** | `disbursement_processing`, `disbursement_success`, `disbursement_failed` |
| **Maintenance** | `maintenance_update` |
| **Payment Plans** | `payment_plan_offered`, `payment_plan_accepted`, `payment_plan_defaulted` |
| **Move-Out** | `move_out_notice_received`, `move_out_notice_confirmed`, `inspection_scheduled`, `inspection_completed`, `deposit_refunded` |
| **Termination** | `early_termination_approved`, `early_termination_denied` |
| **Verification** | `verification_approved`, `verification_rejected` |
| **Operations** | `vacancy_alert`, `auto_pay_invoice` |
| **General** | `general` (customizable) |

---

## 13. Subscription & Billing Engine

### 13.1 Subscription Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Trial: Merchant signs up
    Trial --> Active: Trial ends + payment
    Trial --> Cancelled: No payment
    Active --> PastDue: Invoice overdue
    PastDue --> GracePeriod: Grace period starts
    GracePeriod --> Suspended: Grace period expired
    Suspended --> Active: Payment received
    Suspended --> Cancelled: No payment after X days
    Active --> CancellationRequested: Merchant requests cancel
    CancellationRequested --> Cancelled: End of billing period
    Cancelled --> [*]
```

### 13.2 Billing Automation (from `billing-automation` skill)

| Step | Function | Action |
|------|----------|--------|
| 1 | `subscription-billing` | Check subscriptions due, create `subscription_invoices` |
| 2 | `subscription-payment` | Create Xendit payment for subscription invoice |
| 3 | `xendit-webhook` | Process payment callback |
| 4 | `subscription-renewal` | Extend subscription period on payment |
| 5 | `subscription-grace-check` | Suspend if grace period expires |

### 13.3 Tier Limits Enforcement

| Tier | Properties | Units | Tenants | Features |
|------|-----------|-------|---------|----------|
| **Basic** | 1 | 5 | 5 | Core features |
| **Pro** | 5 | 50 | 50 | + Analytics, AI, Auto-pay |
| **Enterprise** | Unlimited | Unlimited | Unlimited | + Priority support, Custom branding |

---

## 14. Referral Commission Engine

### 14.1 Referral Flow (from `referral-program` skill)

```mermaid
sequenceDiagram
    participant R as Referrer
    participant DB as Database
    participant RE as Referee
    participant CRON as process-referral-commissions
    participant RW as process-referral-reward

    R->>DB: Generate referral code
    R->>RE: Share code
    RE->>DB: Sign up with referral code
    DB->>DB: Create referral (status: pending)

    RE->>DB: Complete first payment
    DB->>DB: Update referral (status: converted)

    CRON->>DB: Check eligible referrals
    CRON->>RW: invoke({ referral_id })
    RW->>DB: Create referral_reward (credit/discount)
    RW->>DB: Update referral (reward_paid: true)
```

### 14.2 Commission Types

| Referral Type | Reward | Condition |
|--------------|--------|-----------|
| Merchant → Merchant | Subscription credit | Referee completes first payment |
| Merchant → Tenant | Rent discount (months) | Referee signs contract |
| Tenant → Tenant | Rent discount | Referee completes first payment |
| Vendor → Vendor | Order commission | Referee completes first order |

---

## 15. Frontend Architecture

### 15.1 Routing Architecture

```mermaid
graph TD
    subgraph "Public Routes"
        LP[Landing Page /]
        LG[Login /auth]
        INV[Invitation /invitation/:token]
    end

    subgraph "Protected Routes (AuthGuard)"
        subgraph "Admin Routes"
            AD[Dashboard /admin]
            AM[Merchants /admin/merchants]
            AT[Tenants /admin/tenants]
            AV[Vendors /admin/vendors]
            AN[Analytics /admin/analytics]
            AE[Escrow /admin/escrow]
            AF[Forum Mod /admin/forum]
            AS[Settings /admin/settings]
        end

        subgraph "Merchant Routes"
            MD[Dashboard /merchant]
            MP[Properties /merchant/properties]
            MC[Contracts /merchant/contracts]
            MI[Invoices /merchant/invoices]
            MM[Maintenance /merchant/maintenance]
        end

        subgraph "Tenant Routes"
            TD2[Dashboard /tenant]
            TI[Invoices /tenant/invoices]
            TM[Maintenance /tenant/maintenance]
            TF[Forum /tenant/forum]
        end

        subgraph "Vendor Routes"
            VD[Dashboard /vendor]
            VP[Products /vendor/products]
            VO[Orders /vendor/orders]
        end
    end
```

### 15.2 State Management

| Concern | Tool | Usage |
|---------|------|-------|
| **Server State** | TanStack React Query v5 | Data fetching, caching, mutations, optimistic updates |
| **Client State** | Zustand | Auth state, UI preferences, filters |
| **Form State** | React Hook Form | Form data, validation, submission |
| **URL State** | React Router v6 | Route params, search params |

### 15.3 Data Fetching Pattern

```typescript
// Hook (Application Layer)
export const useContracts = (merchantId: string) => {
  return useQuery({
    queryKey: ['contracts', merchantId],
    queryFn: () => contractService.getMerchantContracts(merchantId),
    enabled: !!merchantId,
  });
};

// Service (Infrastructure Layer)
export const contractService = {
  async getMerchantContracts(merchantId: string): Promise<Contract[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`*, unit:units (unit_number, property:properties (name, address, city))`)
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as Contract[];
  },
};
```

---

## 16. Security Architecture

### 16.1 Defense in Depth (from `api-security-best-practices` skill)

```mermaid
graph TB
    subgraph "Layer 1: Network"
        TLS[TLS 1.3]
        CORS[CORS Policy]
    end

    subgraph "Layer 2: Authentication"
        JWT[JWT Validation]
        TOTP[Admin 2FA / TOTP]
        WHS[Webhook Token Verification]
    end

    subgraph "Layer 3: Authorization"
        RBAC2[RBAC Role Checks]
        RLS2[Database RLS Policies]
    end

    subgraph "Layer 4: Input"
        VAL[Input Validation]
        SAN2[Prompt Injection Sanitization]
        XSS[XSS Prevention / DOMPurify]
    end

    subgraph "Layer 5: Data"
        ENC[Sensitive Field Masking]
        AUD[Audit Logging]
        IMM[Immutable Audit Trail]
    end

    TLS --> JWT
    CORS --> JWT
    JWT --> RBAC2
    TOTP --> RBAC2
    WHS --> RBAC2
    RBAC2 --> RLS2
    RLS2 --> VAL
    VAL --> SAN2
    SAN2 --> ENC
    ENC --> AUD
```

### 16.2 Security Measures

| Measure | Implementation | Skill Reference |
|---------|---------------|-----------------|
| **RLS on all tables** | Restrictive mode, 100+ policies | `supabase-postgres-best-practices` |
| **JWT validation** | Edge functions verify `Authorization` header | `api-security-best-practices` |
| **Webhook security** | Timing-safe token comparison | `payment-integration` |
| **Server-side verification** | Cross-verify Xendit payment status via API | `payment-integration` |
| **Input sanitization** | Prompt injection pattern filtering | `api-security-best-practices` |
| **XSS prevention** | DOMPurify for user-generated content | `frontend-security-coder` |
| **Admin 2FA** | TOTP via OTPAuth library | `auth-implementation-patterns` |
| **Service role isolation** | Service role key only in edge functions (server-side) | `supabase-postgres-best-practices` |
| **Audit logging** | Immutable `audit_logs` table (insert-only, admin read) | `security-auditor` |
| **Sensitive data** | 2FA secrets stored encrypted in DB | `pci-compliance` |

### 16.3 PCI Compliance Notes (from `pci-compliance` skill)

- **No card data storage**: All payment processing through Xendit (PCI DSS Level 1)
- **Tokenized payments**: Xendit handles card tokenization
- **Redirect model**: Users redirected to Xendit-hosted payment page
- **Webhook only**: Payment status received only via verified webhooks

---

## 17. Scalability & Performance

### 17.1 Performance Optimizations (from `web-performance-optimization` skill)

| Technique | Implementation |
|-----------|---------------|
| **Code Splitting** | React.lazy() for route-based splitting |
| **Query Caching** | TanStack Query with `staleTime` and `gcTime` |
| **Optimistic Updates** | Mutation with `onMutate` for instant UI feedback |
| **Connection Pooling** | Supabase managed PgBouncer (transaction mode) |
| **Edge Functions** | Deno cold start < 200ms |
| **Compression** | Vite compression plugin (gzip/brotli) |
| **Lazy Loading** | Images and heavy components |
| **Pagination** | Offset-based pagination with configurable page size |

### 17.2 Database Performance (from `sql-optimization-patterns` skill)

| Optimization | Applied To |
|-------------|-----------|
| **Composite indexes** | `(merchant_id, status)` on invoices, contracts |
| **Partial indexes** | Active contracts only for unit lookup |
| **JSONB indexes (GIN)** | `line_items`, `features`, `ocr_data` |
| **Materialized views** | Analytics aggregations (planned) |
| **Query result limits** | Default 1000 rows per Supabase query |

### 17.3 Caching Strategy

```
┌──────────────────────────────────────────────────┐
│              Caching Layers                      │
├──────────────────────────────────────────────────┤
│ L1: React Query (in-memory)                      │
│     staleTime: 30s-5min (by query type)          │
│     gcTime: 10min                                │
├──────────────────────────────────────────────────┤
│ L2: Browser (Service Worker / HTTP cache)        │
│     Static assets: 1 year (content-hashed)       │
│     API responses: no-cache (RLS-dependent)      │
├──────────────────────────────────────────────────┤
│ L3: Database (PostgreSQL shared_buffers)         │
│     Managed by Supabase infrastructure           │
└──────────────────────────────────────────────────┘
```

---

## 18. Development Standards

### 18.1 Code Conventions (from `clean-architecture` skill)

| Standard | Rule |
|----------|------|
| **TypeScript** | Strict mode, no `any` (use `unknown` + type guards) |
| **Naming** | camelCase functions, PascalCase components, snake_case DB columns |
| **Imports** | Path aliases (`@/features/`, `@/shared/`) |
| **Components** | Small, focused, max 200 lines per file |
| **Services** | Pure functions, no side effects, return typed data |
| **Hooks** | Single responsibility, compose via custom hooks |
| **Types** | Co-located in `types/` within each feature module |

### 18.2 Error Handling Patterns

```typescript
// Service layer: throw errors
async function fetchInvoices(merchantId: string): Promise<Invoice[]> {
  const { data, error } = await supabase.from('invoices')...;
  if (error) throw error; // Let React Query handle it
  return data;
}

// Hook layer: React Query error boundary
const { data, error, isLoading } = useQuery({
  queryKey: ['invoices', merchantId],
  queryFn: () => fetchInvoices(merchantId),
  retry: 3,
});

// Component layer: render error states
if (error) return <ErrorDisplay error={error} />;
```

### 18.3 Testing Strategy

| Level | Tool | Coverage Target |
|-------|------|----------------|
| **Unit Tests** | Vitest | Pure utility functions, type guards |
| **Component Tests** | Testing Library | Interactive components |
| **Integration Tests** | Vitest + Supabase | Service functions with DB |
| **E2E Tests** | Browser automation | Critical flows (auth → create → pay) |

---

## 19. Deployment Architecture

### 19.1 Environment Architecture

```mermaid
graph LR
    subgraph "Development"
        DEV[Lovable IDE]
        PREVIEW[Preview URL]
    end

    subgraph "Test Environment"
        TEST_DB[(Test Database)]
        TEST_EF[Test Edge Functions]
    end

    subgraph "Production"
        PROD_URL[Published URL]
        PROD_DB[(Production Database)]
        PROD_EF[Production Edge Functions]
    end

    DEV -->|Auto-deploy| PREVIEW
    PREVIEW --> TEST_DB
    PREVIEW --> TEST_EF
    DEV -->|Publish| PROD_URL
    PROD_URL --> PROD_DB
    PROD_URL --> PROD_EF
```

### 19.2 Deployment Pipeline

| Step | Action | Automatic |
|------|--------|-----------|
| 1 | Code change in Lovable IDE | ✅ |
| 2 | TypeScript compilation check | ✅ |
| 3 | Preview deployment | ✅ |
| 4 | Edge function deployment | ✅ |
| 5 | Database migration (user-approved) | Semi-auto |
| 6 | Production publish | Manual trigger |

### 19.3 Environment Separation

| Aspect | Test | Production |
|--------|------|-----------|
| Database | Isolated schema + data | Separate database |
| Edge Functions | Auto-deployed on save | Deployed on publish |
| Storage | Shared buckets (different paths) | Same |
| Secrets | Same configuration | Same |

---

## 20. Monitoring & Observability

### 20.1 Logging Architecture

```mermaid
graph LR
    EF[Edge Functions] -->|console.log| LOGS[Function Logs]
    DB[Database] -->|postgres_logs| DBLOGS[DB Logs]
    AUTH[Auth System] -->|auth_logs| ALOGS[Auth Logs]

    LOGS --> DASH[Lovable Cloud Dashboard]
    DBLOGS --> DASH
    ALOGS --> DASH
```

### 20.2 Audit Trail

All significant actions are logged to `audit_logs`:

```typescript
// Automatic audit logging for admin actions
await supabase.from('audit_logs').insert({
  user_id: currentUserId,
  action: 'merchant_approved',
  entity_type: 'merchant',
  entity_id: merchantId,
  old_data: { verification_status: 'pending' },
  new_data: { verification_status: 'approved' },
  ip_address: request.headers.get('x-forwarded-for'),
  user_agent: request.headers.get('user-agent'),
});
```

### 20.3 Analytics Events

User behavior tracking via `analytics_events`:

| Event Type | Data |
|-----------|------|
| `page_view` | Page path, session ID |
| `feature_used` | Feature name, duration |
| `payment_initiated` | Amount, method |
| `error_occurred` | Error code, stack trace |

---

## Appendix A: Environment Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `SUPABASE_URL` | Edge Functions | Database connection URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions | Admin-level database access |
| `SUPABASE_ANON_KEY` | Edge Functions | User-level database access |
| `XENDIT_SECRET_KEY` | Edge Functions | Xendit API authentication |
| `XENDIT_WEBHOOK_TOKEN` | Edge Functions | Webhook verification |
| `RESEND_API_KEY` | Edge Functions | Email sending |
| `ADMIN_SETUP_SECRET` | Edge Functions | Admin bootstrap secret |
| `VITE_SUPABASE_URL` | Frontend | Client-side Supabase URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend | Client-side anon key |

## Appendix B: Skills Applied

| Skill | Application |
|-------|------------|
| `supabase-postgres-best-practices` | RLS design, connection pooling, indexing strategy |
| `api-security-best-practices` | JWT auth, webhook security, input validation, CORS |
| `api-design-principles` | Error handling, response format, pagination |
| `payment-integration` | Xendit webhook idempotency, fee calculation, PCI notes |
| `billing-automation` | Invoice lifecycle, subscription billing, cron scheduling |
| `referral-program` | Commission flow, multi-tier rewards |
| `clean-architecture` | Feature module structure, layer separation |
| `database-design` | Schema design, relationships, indexing |
| `architecture-patterns` | Serverless modular monolith, event-driven |
| `web-performance-optimization` | Code splitting, caching, lazy loading |
| `sql-optimization-patterns` | Composite indexes, partial indexes, JSONB |
| `pci-compliance` | No card storage, tokenized payments, redirect model |
| `auth-implementation-patterns` | RBAC, 2FA, invitation flow |
| `security-auditor` | Audit trail, immutable logs |
| `frontend-security-coder` | XSS prevention, DOMPurify |
| `react-patterns` | Custom hooks, compound components, context providers |
| `design-system-patterns` | Tailwind tokens, shadcn/ui variants |
