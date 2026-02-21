# Backend Architecture Document - Sistem DSS Manajemen Kosan

**Version:** 3.0  
**Date:** 2026-02-21  
**Status:** Implementation Complete  
**Platform:** Lovable Cloud (Deno Edge Functions + PostgreSQL)  
**Architecture:** Serverless Modular Monolith + AI-Powered DSS Layer  

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
12. [DSS Layer — OCR Services](#12-dss-layer--ocr-services)
13. [DSS Layer — ML Predictive Analytics](#13-dss-layer--ml-predictive-analytics)
14. [DSS Layer — AI Decision Support](#14-dss-layer--ai-decision-support)
15. [Notification System](#15-notification-system)
16. [Subscription & Billing Engine](#16-subscription--billing-engine)
17. [Referral Commission Engine](#17-referral-commission-engine)
18. [Frontend Architecture](#18-frontend-architecture)
19. [Security Architecture](#19-security-architecture)
20. [Scalability & Performance](#20-scalability--performance)
21. [Development Standards](#21-development-standards)
22. [Deployment Architecture](#22-deployment-architecture)
23. [Monitoring & Observability](#23-monitoring--observability)

---

## 1. Architectural Overview

Sistem DSS Manajemen Kosan's backend is designed as a **Serverless Modular Monolith + AI-Powered DSS Layer** running on Lovable Cloud. It combines the simplicity of a single deployment unit with the isolation of serverless edge functions for complex business logic, augmented by an intelligent Decision Support System (DSS) for OCR document digitization, ML predictive analytics, and AI-driven recommendations.

### 1.1 Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Serverless-First** | 43 Deno Edge Functions handle all server-side logic |
| **Database-as-API** | PostgreSQL + RLS policies serve as the primary API for CRUD |
| **Event-Driven** | Webhooks and cron jobs handle async workflows |
| **Zero-Trust Data** | Row Level Security (RLS) enforces access at the database level |
| **Feature-Based Modularity** | 28 feature modules with isolated services, hooks, types, and components |
| **AI-Augmented Operations** | Lovable AI (Gemini 2.5 Pro) powers OCR, ML predictions, and decision support |
| **Data-Driven Insights** | Revenue +8-15%, tunggakan -20-30% through predictive analytics |

### 1.2 Key Metrics

| Metric | Value |
|--------|-------|
| Edge Functions | 43 (31 core + 12 DSS) |
| Database Tables | 46+ (40 core + 6 DSS) |
| Feature Modules | 28 (25 core + 3 DSS) |
| RLS Policies | 120+ |
| Notification Templates | 30+ |
| Supported Roles | 7 (super_admin, admin, moderator, support, merchant, tenant, vendor) |
| DSS Models | 4 (revenue forecast, risk scoring, churn prediction, optimal pricing) |
| OCR Capabilities | 4 (KTP, payment proof, business docs, maintenance receipts) |

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
| **AI Provider** | Lovable AI (Gemini 2.5 Pro) | Vision + Reasoning for OCR/ML/DSS + Chatbot |
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
        EF[31 Core Edge Functions]
    end

    subgraph "DSS Layer - AI-Powered"
        OCR[4 OCR Functions<br/>KTP, Payment, Docs, Receipts]
        ML[4 ML Functions<br/>Revenue, Risk, Churn, Pricing]
        DSS[4 DSS Advisors<br/>Pricing, Collection, Maintenance, Investment]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL 16<br/>46+ Tables)]
        RLS[RLS Policies 120+]
        RT[Realtime Engine]
        ST[Supabase Storage]
    end

    subgraph "External Services"
        XEN[Xendit Payment Gateway]
        RSN[Resend Email API]
        LAI[Lovable AI / Gemini 2.5 Pro<br/>Vision + Reasoning + Tool Calling]
        WA[WhatsApp API]
    end

    subgraph "Async Processing"
        CRON[Cron Scheduler<br/>12 Core + 2 DSS Jobs]
        WH[Webhook Handlers]
    end

    PWA --> RQ
    PWA --> ZS
    RQ --> SDK
    SDK -->|Direct CRUD with RLS| PG
    SDK -->|invoke| EF
    SDK -->|invoke| OCR
    SDK -->|invoke| ML
    SDK -->|invoke| DSS
    EF -->|Service Role Key| PG
    EF --> XEN
    EF --> RSN
    EF --> LAI
    EF --> WA
    OCR -->|Vision API| LAI
    OCR -->|Store results| PG
    OCR -->|Fetch images| ST
    ML -->|Reasoning API| LAI
    ML -->|Historical data| PG
    DSS -->|Combines ML + Context| LAI
    DSS -->|Read/Write| PG
    PG --> RLS
    PG --> RT
    RT -->|Realtime subscriptions| PWA
    XEN -->|Webhook| WH
    WH --> EF
    CRON -->|Daily triggers| EF
    CRON -->|Daily/Weekly| ML
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

Each of the 28 feature modules follows a consistent **Clean Architecture** layout:

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

### 4.3 Feature Modules (28 Modules)

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
| `dss-ocr` | **[NEW]** Document digitization via AI vision | `ocr_results`, `payment_verifications`, `maintenance_expenses` |
| `dss-ml` | **[NEW]** Predictive analytics (revenue, risk, churn, pricing) | `tenant_risk_scores`, `ml_model_runs` |
| `dss-advisor` | **[NEW]** AI decision support recommendations | `dss_recommendations` |
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

### 5.1 Schema Overview (46+ Tables)

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

    merchants ||--o{ tenant_risk_scores : "merchant_id"
    merchants ||--o{ dss_recommendations : "merchant_id"
    merchants ||--o{ ml_model_runs : "merchant_id"
    merchants ||--o{ ocr_results : "merchant_id"
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

#### DSS — OCR & Document Intelligence (3 tables)
| Table | Purpose | RLS |
|-------|---------|-----|
| `ocr_results` | OCR extraction results (KTP, payment proof, business docs, receipts) with confidence scores | Merchant own + admin read |
| `payment_verifications` | OCR-matched payment proofs linked to invoices | Merchant own + admin read |
| `maintenance_expenses` | Cost tracking from receipt OCR, linked to maintenance requests | Merchant own + admin read |

#### DSS — ML Predictive Analytics (2 tables)
| Table | Purpose | RLS |
|-------|---------|-----|
| `tenant_risk_scores` | Cached risk scores per tenant (0-100, updated daily/on-demand) | Merchant own + admin read |
| `ml_model_runs` | Audit log for ML predictions (input hash, output, model version, latency) | Merchant own + admin read |

#### DSS — AI Decision Support (1 table)
| Table | Purpose | RLS |
|-------|---------|-----|
| `dss_recommendations` | Stored AI recommendations with status tracking (pending/accepted/dismissed) | Merchant own + admin read |

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

43 Deno Edge Functions organized into 13 functional categories:

```
supabase/functions/
├── # --- Core Operations (31 functions) ---
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
├── xendit-webhook/               # Payment callback
│
├── # --- DSS: OCR Services (4 functions) ---
├── ocr-ktp-extract/              # KTP data extraction (Gemini Vision)
├── ocr-payment-proof/            # Payment receipt matching (Gemini Vision)
├── ocr-business-document/        # NIB/SIUP/Akta extraction (Gemini Vision)
├── ocr-maintenance-receipt/      # Maintenance expense tracking (Gemini Vision)
│
├── # --- DSS: ML Analytics (4 functions) ---
├── ml-revenue-forecast/          # Revenue prediction 3-12 months
├── ml-tenant-risk-score/         # Tenant risk scoring 0-100
├── ml-churn-prediction/          # Churn probability prediction
├── ml-optimal-pricing/           # Unit pricing optimization
│
├── # --- DSS: AI Decision Support (4 functions) ---
├── dss-pricing-advisor/          # Pricing recommendations
├── dss-collection-strategy/      # Collection approach per tenant
├── dss-maintenance-priority/     # Maintenance prioritization
└── dss-investment-insight/       # ROI analysis per property
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

#### Pattern E: DSS Function (AI-Powered with Tier Gating)
```typescript
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return unauthorized();

  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } }
  });
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return unauthorized();

  // 1. Verify subscription tier allows this DSS feature
  const { data: merchant } = await supabaseAdmin.from('merchants')
    .select('id, merchant_subscriptions!inner(tier_id, subscription_tiers!inner(name, features))')
    .eq('user_id', user.id).single();
  
  const tierFeatures = merchant?.merchant_subscriptions?.subscription_tiers?.features;
  if (!tierFeatures?.dss_enabled) return forbidden('DSS_TIER_REQUIRED');

  // 2. Check usage limits (per tier per month)
  const usageCount = await checkMonthlyUsage(supabaseAdmin, merchant.id, 'ocr_ktp');
  if (usageCount >= tierFeatures.ocr_ktp_limit) return tooManyRequests('USAGE_LIMIT_EXCEEDED');

  // 3. Aggregate historical data from database
  const contextData = await aggregateContextData(supabaseAdmin, merchant.id);

  // 4. Call Lovable AI (Gemini 2.5 Pro) with structured output
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: JSON.stringify(contextData) }],
      tools: [{ type: 'function', function: { name: 'analyze', parameters: outputSchema } }],
      tool_choice: { type: 'function', function: { name: 'analyze' } }
    })
  });

  // 5. Parse structured output + store in ml_model_runs for audit
  const result = parseToolCallResponse(aiResponse);
  await supabaseAdmin.from('ml_model_runs').insert({
    merchant_id: merchant.id,
    function_name: 'ml-tenant-risk-score',
    input_hash: hashInput(contextData),
    output: result,
    model_version: 'google/gemini-2.5-pro',
    latency_ms: Date.now() - startTime
  });

  return json(result);
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

    section DSS ML Jobs
    ml-daily-risk-scoring       :07:00, 30min
    ml-weekly-forecast          :08:00, 45min
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
| `ml-daily-risk-scoring` | Daily 07:00 | **[DSS]** Batch risk scoring for all active tenants per merchant | Updates `tenant_risk_scores`, triggers notifications for high/critical |
| `ml-weekly-forecast` | Weekly Monday 08:00 | **[DSS]** Revenue forecast update for all merchants with Pro+ tier | Updates `ml_model_runs`, generates `dss_recommendations` |

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

## 12. DSS Layer — OCR Services

### 12.1 OCR Architecture Overview

```mermaid
graph TD
    subgraph "OCR Pipeline"
        IMG[Image Upload<br/>Supabase Storage] --> FETCH[Fetch Image<br/>Base64 Encode]
        FETCH --> VISION[Lovable AI<br/>Gemini 2.5 Pro Vision]
        VISION --> TOOL[Tool Calling<br/>Structured Extraction]
        TOOL --> VALIDATE[Confidence Check<br/>>= 80% auto-fill]
        VALIDATE -->|Pass| AUTO[Auto-populate Forms]
        VALIDATE -->|Fail| MANUAL[Manual Review Queue]
        TOOL --> STORE[Store in ocr_results]
    end
```

### 12.2 OCR Functions

| Function | Input | Output | Use Case |
|----------|-------|--------|----------|
| `ocr-ktp-extract` | KTP photo URL | NIK, nama, alamat, TTL, gender | Tenant registration auto-fill |
| `ocr-payment-proof` | Transfer receipt URL | Amount, bank, date, ref number | Invoice matching (±Rp 1000 tolerance) |
| `ocr-business-document` | NIB/SIUP/Akta/NPWP URL | Document fields, expiry | Merchant verification auto-fill |
| `ocr-maintenance-receipt` | Receipt/nota photo URL | Items, quantities, amounts, total | Maintenance cost tracking |

### 12.3 OCR Implementation Pattern

```typescript
// All OCR functions follow this pattern:
// 1. Fetch image from private Supabase Storage bucket
const { data: imageBlob } = await supabase.storage
  .from('verification-documents')
  .download(imagePath);

// 2. Convert to base64 for Gemini Vision API
const arrayBuffer = await imageBlob.arrayBuffer();
const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

// 3. Send multimodal request with structured output via tool calling
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'google/gemini-2.5-pro',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: extractionPrompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
      ]
    }],
    tools: [{ type: 'function', function: { name: 'extract_data', parameters: schema } }],
    tool_choice: { type: 'function', function: { name: 'extract_data' } }
  })
});

// 4. Store result with confidence score
await supabase.from('ocr_results').insert({
  merchant_id, document_type, source_url: imagePath,
  extracted_data: result, confidence_score: result.confidence,
  status: result.confidence >= 0.8 ? 'auto_accepted' : 'needs_review'
});
```

### 12.4 Payment Proof Matching Logic

```mermaid
sequenceDiagram
    participant T as Tenant
    participant FE as Frontend
    participant OCR as ocr-payment-proof
    participant AI as Gemini Vision
    participant DB as Database

    T->>FE: Upload bukti transfer
    FE->>OCR: invoke({ image_url, invoice_id? })
    OCR->>AI: Extract amount, bank, date, reference
    AI-->>OCR: Structured data + confidence
    
    alt invoice_id provided
        OCR->>DB: Match against specific invoice
    else no invoice_id
        OCR->>DB: Fuzzy match: amount ±Rp1000, date ±7 days
    end
    
    OCR->>DB: Create payment_verification record
    OCR->>DB: Update invoice status if confidence >= 80%
    OCR-->>FE: { matched_invoice, confidence, needs_review }
```

---

## 13. DSS Layer — ML Predictive Analytics

### 13.1 ML Architecture Overview

```mermaid
graph TD
    subgraph "ML Pipeline"
        DATA[Historical Data<br/>Payments, Contracts, Units] --> AGG[Data Aggregation<br/>Edge Function]
        AGG --> CONTEXT[Context Builder<br/>JSON Summary]
        CONTEXT --> GEMINI[Lovable AI<br/>Gemini 2.5 Pro Reasoning]
        GEMINI --> TOOL2[Tool Calling<br/>Structured Predictions]
        TOOL2 --> CACHE[Cache Results<br/>tenant_risk_scores]
        TOOL2 --> AUDIT[Audit Trail<br/>ml_model_runs]
        CACHE --> NOTIFY[Notifications<br/>High/Critical Alerts]
    end
```

### 13.2 ML Models

#### Revenue Forecasting (`ml-revenue-forecast`)
- **Input Data:** 12 months payment history, occupancy trends, contract renewals
- **Output:** Monthly predicted revenue with confidence intervals (3/6/12 month horizon)
- **Refresh:** Weekly (cron) or on-demand
- **Accuracy target:** ±15% confidence interval

#### Tenant Risk Scoring (`ml-tenant-risk-score`)
- **Input Data:** Payment history (late ratio, overdue count), contract compliance, maintenance complaints, collections history
- **Output:** Score 0-100, risk level (low/medium/high/critical), risk factors, recommended actions
- **Refresh:** Daily (cron) or on-demand per tenant
- **Thresholds:** Low (0-25), Medium (26-50), High (51-75), Critical (76-100)
- **Side Effects:** Notifications for high/critical scores

#### Churn Prediction (`ml-churn-prediction`)
- **Input Data:** Payment delays trend, maintenance complaints, contract end proximity, move-out notices
- **Output:** Churn probability (0-1), risk factors, retention suggestions
- **Window:** 1/3/6 months prediction horizon
- **Trigger:** Probability > 0.6 triggers merchant notification

#### Optimal Pricing (`ml-optimal-pricing`)
- **Input Data:** Unit amenities, location, occupancy history, comparable units, historical rent amounts
- **Output:** Current price, suggested price, price range (min/max), justification, market comparison
- **Method:** Comparative analysis across merchant's portfolio + city-level benchmarks

### 13.3 ML Data Aggregation Pattern

```typescript
// Pattern: Aggregate historical data, send as context to Gemini
async function buildTenantRiskContext(supabase, tenantId: string) {
  // Parallel data fetching for efficiency
  const [payments, invoices, contracts, collections] = await Promise.all([
    supabase.from('payments')
      .select('amount, status, due_date, paid_at')
      .eq('tenant_user_id', tenantId)
      .order('created_at', { ascending: false }).limit(100),
    supabase.from('invoices')
      .select('status, due_date, late_fee, overdue_since')
      .eq('tenant_user_id', tenantId)
      .order('created_at', { ascending: false }).limit(50),
    supabase.from('contracts')
      .select('status, start_date, end_date, churn_reason')
      .eq('tenant_user_id', tenantId),
    supabase.from('collections_cases')
      .select('status, days_overdue, escalation_level')
      .eq('tenant_user_id', tenantId)
  ]);

  return {
    payment_summary: {
      total: payments.data.length,
      late_count: payments.data.filter(p => p.paid_at > p.due_date).length,
      late_ratio: /* calculated */,
    },
    overdue_invoices: invoices.data.filter(i => i.status === 'overdue').length,
    active_collections: collections.data.filter(c => c.status === 'active').length,
    contract_history: contracts.data,
  };
}
```

### 13.4 Risk Score Caching Strategy

```
┌──────────────────────────────────────────────────┐
│           Risk Score Update Flow                  │
├──────────────────────────────────────────────────┤
│ Daily Cron (ml-daily-risk-scoring)               │
│   → Batch all active tenants per merchant        │
│   → Update tenant_risk_scores table              │
│   → Send notifications for score changes         │
├──────────────────────────────────────────────────┤
│ On-Demand (merchant clicks "Refresh Score")      │
│   → Single tenant recalculation                  │
│   → Immediate UI update via React Query          │
├──────────────────────────────────────────────────┤
│ Cache TTL: 24 hours (staleTime in React Query)   │
│ Invalidation: After payment/invoice status change│
└──────────────────────────────────────────────────┘
```

---

## 14. DSS Layer — AI Decision Support

### 14.1 DSS Architecture Overview

```mermaid
graph TD
    subgraph "Decision Support Pipeline"
        REQ[Merchant Request] --> GATHER[Gather Context]
        GATHER --> ML_DATA[ML Model Results<br/>Risk Scores, Forecasts]
        GATHER --> HIST[Historical Data<br/>Payments, Contracts]
        GATHER --> PROP[Property Context<br/>Units, Occupancy]
        
        ML_DATA --> ADVISOR[AI Advisor<br/>Gemini 2.5 Pro]
        HIST --> ADVISOR
        PROP --> ADVISOR
        
        ADVISOR --> REC[Recommendations<br/>Prioritized Actions]
        REC --> STORE2[Store in dss_recommendations]
        REC --> UI[Merchant Dashboard<br/>Actionable Cards]
    end
```

### 14.2 DSS Advisors

#### Pricing Advisor (`dss-pricing-advisor`)
- **Combines:** `ml-optimal-pricing` output + occupancy trends + market context
- **Output:** Strategic pricing advice, per-unit recommendations with expected impact
- **Example:** "Unit 3A harga bisa dinaikkan Rp 200k/bulan (+8%) karena occupancy rate 95% dan amenities di atas rata-rata. Expected revenue increase: Rp 2.4M/tahun"

#### Collection Strategy (`dss-collection-strategy`)
- **Combines:** `ml-tenant-risk-score` + payment history + escalation data
- **Output:** Per-tenant collection approach, timing, channel, message templates
- **Example:** "Tenant Budi (risk: 72/critical): Kirim WhatsApp reminder H-3, followed by call H+1. Tawarkan cicilan 3x jika overdue > 14 hari. Success probability: 68%"

#### Maintenance Priority (`dss-maintenance-priority`)
- **Combines:** Open requests + tenant satisfaction impact + unit revenue impact
- **Output:** Prioritized maintenance queue with impact analysis
- **Example:** "Request #45 (AC rusak, Unit 5B) → Priority Score: 92. Impact: tenant churn risk naik 30% jika tidak resolved dalam 48 jam. Estimated cost: Rp 500k"

#### Investment Insight (`dss-investment-insight`)
- **Combines:** P&L per property + occupancy trends + maintenance costs
- **Output:** ROI analysis, improvement suggestions with payback period
- **Example:** "Property Kosan Mawar: ROI current 12%. Renovasi kamar mandi (Rp 15M) → projected ROI 18% (+6%), payback 8 bulan"

### 14.3 Recommendation Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Generated: AI creates recommendation
    Generated --> Viewed: Merchant opens dashboard
    Viewed --> Accepted: Merchant clicks "Apply"
    Viewed --> Dismissed: Merchant clicks "Dismiss"
    Accepted --> Executed: Action completed
    Dismissed --> [*]
    Executed --> [*]
    
    note right of Generated: Stored in dss_recommendations
    note right of Accepted: Track conversion rate
```

### 14.4 DSS Feature Gating by Subscription Tier

| Feature | Free | Basic | Professional | Enterprise |
|---------|------|-------|-------------|-----------|
| OCR KTP | ❌ | ❌ | 10/bulan | Unlimited |
| OCR Payment Proof | ❌ | 5/bulan | 50/bulan | Unlimited |
| OCR Business Doc | ❌ | ❌ | 10/bulan | Unlimited |
| OCR Maintenance Receipt | ❌ | ❌ | 20/bulan | Unlimited |
| Revenue Forecast | ❌ | ❌ | ✅ | ✅ |
| Tenant Risk Score | ❌ | ❌ | ✅ | ✅ |
| Churn Prediction | ❌ | ❌ | ❌ | ✅ |
| Optimal Pricing | ❌ | ❌ | ❌ | ✅ |
| Pricing Advisor | ❌ | ❌ | ❌ | ✅ |
| Collection Strategy | ❌ | ❌ | ❌ | ✅ |
| Maintenance Priority | ❌ | ❌ | ✅ | ✅ |
| Investment Insight | ❌ | ❌ | ❌ | ✅ |

---

## 15. Notification System

### 15.1 Architecture

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

### 15.2 Notification Types (30+)

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

## 16. Subscription & Billing Engine

### 16.1 Subscription Lifecycle

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

### 16.2 Billing Automation (from `billing-automation` skill)

| Step | Function | Action |
|------|----------|--------|
| 1 | `subscription-billing` | Check subscriptions due, create `subscription_invoices` |
| 2 | `subscription-payment` | Create Xendit payment for subscription invoice |
| 3 | `xendit-webhook` | Process payment callback |
| 4 | `subscription-renewal` | Extend subscription period on payment |
| 5 | `subscription-grace-check` | Suspend if grace period expires |

### 16.3 Tier Limits Enforcement

| Tier | Properties | Units | Tenants | Features |
|------|-----------|-------|---------|----------|
| **Basic** | 1 | 5 | 5 | Core features |
| **Pro** | 5 | 50 | 50 | + Analytics, AI, Auto-pay |
| **Enterprise** | Unlimited | Unlimited | Unlimited | + Priority support, Custom branding |

---

## 17. Referral Commission Engine

### 17.1 Referral Flow (from `referral-program` skill)

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

### 17.2 Commission Types

| Referral Type | Reward | Condition |
|--------------|--------|-----------|
| Merchant → Merchant | Subscription credit | Referee completes first payment |
| Merchant → Tenant | Rent discount (months) | Referee signs contract |
| Tenant → Tenant | Rent discount | Referee completes first payment |
| Vendor → Vendor | Order commission | Referee completes first order |

---

## 18. Frontend Architecture

### 18.1 Routing Architecture

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

### 18.2 State Management

| Concern | Tool | Usage |
|---------|------|-------|
| **Server State** | TanStack React Query v5 | Data fetching, caching, mutations, optimistic updates |
| **Client State** | Zustand | Auth state, UI preferences, filters |
| **Form State** | React Hook Form | Form data, validation, submission |
| **URL State** | React Router v6 | Route params, search params |

### 18.3 Data Fetching Pattern

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

## 19. Security Architecture

### 19.1 Defense in Depth (from `api-security-best-practices` skill)

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

### 19.2 Security Measures

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

### 19.3 PCI Compliance Notes (from `pci-compliance` skill)

- **No card data storage**: All payment processing through Xendit (PCI DSS Level 1)
- **Tokenized payments**: Xendit handles card tokenization
- **Redirect model**: Users redirected to Xendit-hosted payment page
- **Webhook only**: Payment status received only via verified webhooks

---

## 20. Scalability & Performance

### 20.1 Performance Optimizations (from `web-performance-optimization` skill)

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

### 20.2 Database Performance (from `sql-optimization-patterns` skill)

| Optimization | Applied To |
|-------------|-----------|
| **Composite indexes** | `(merchant_id, status)` on invoices, contracts |
| **Partial indexes** | Active contracts only for unit lookup |
| **JSONB indexes (GIN)** | `line_items`, `features`, `ocr_data` |
| **Materialized views** | Analytics aggregations (planned) |
| **Query result limits** | Default 1000 rows per Supabase query |

### 20.3 Caching Strategy

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

## 21. Development Standards

### 21.1 Code Conventions (from `clean-architecture` skill)

| Standard | Rule |
|----------|------|
| **TypeScript** | Strict mode, no `any` (use `unknown` + type guards) |
| **Naming** | camelCase functions, PascalCase components, snake_case DB columns |
| **Imports** | Path aliases (`@/features/`, `@/shared/`) |
| **Components** | Small, focused, max 200 lines per file |
| **Services** | Pure functions, no side effects, return typed data |
| **Hooks** | Single responsibility, compose via custom hooks |
| **Types** | Co-located in `types/` within each feature module |

### 21.2 Error Handling Patterns

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

### 21.3 Testing Strategy

| Level | Tool | Coverage Target |
|-------|------|----------------|
| **Unit Tests** | Vitest | Pure utility functions, type guards |
| **Component Tests** | Testing Library | Interactive components |
| **Integration Tests** | Vitest + Supabase | Service functions with DB |
| **E2E Tests** | Browser automation | Critical flows (auth → create → pay) |

---

## 22. Deployment Architecture

### 22.1 Environment Architecture

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

### 22.2 Deployment Pipeline

| Step | Action | Automatic |
|------|--------|-----------|
| 1 | Code change in Lovable IDE | ✅ |
| 2 | TypeScript compilation check | ✅ |
| 3 | Preview deployment | ✅ |
| 4 | Edge function deployment | ✅ |
| 5 | Database migration (user-approved) | Semi-auto |
| 6 | Production publish | Manual trigger |

### 22.3 Environment Separation

| Aspect | Test | Production |
|--------|------|-----------|
| Database | Isolated schema + data | Separate database |
| Edge Functions | Auto-deployed on save | Deployed on publish |
| Storage | Shared buckets (different paths) | Same |
| Secrets | Same configuration | Same |

---

## 23. Monitoring & Observability

### 23.1 Logging Architecture

```mermaid
graph LR
    EF[Edge Functions] -->|console.log| LOGS[Function Logs]
    DB[Database] -->|postgres_logs| DBLOGS[DB Logs]
    AUTH[Auth System] -->|auth_logs| ALOGS[Auth Logs]

    LOGS --> DASH[Lovable Cloud Dashboard]
    DBLOGS --> DASH
    ALOGS --> DASH
```

### 23.2 Audit Trail

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

### 23.3 Analytics Events

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
| `LOVABLE_API_KEY` | Edge Functions | Lovable AI Gateway (OCR/ML/DSS) — auto-provisioned |
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
