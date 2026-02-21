
# Maksimalisasi Deployment & Infrastructure Document - SiHuni Platform

## Ringkasan

File `docs/deployment-infrastructure.md` saat ini mendeskripsikan arsitektur **yang sama sekali tidak sesuai** dengan implementasi aktual. Dokumen berbicara tentang AWS VPC, ECS Clusters, NestJS containers, Docker, RDS Proxy, BullMQ workers, dan CloudFormation -- **tidak satupun teknologi tersebut digunakan**. Platform sebenarnya berjalan di **Lovable Cloud** (Supabase-powered) dengan frontend React/Vite dan 31 Deno Edge Functions.

Dokumen akan di-rewrite total untuk mencerminkan infrastruktur deployment sebenarnya.

---

## Perubahan yang Akan Dilakukan

### File: `docs/deployment-infrastructure.md` (Full Rewrite)

### 1. Introduction (Diperbarui Total)
- Platform: Lovable Cloud (bukan AWS)
- Architecture: Serverless Modular Monolith (bukan ECS microservices)
- No Docker, no Kubernetes, no VPC management
- Two environments: Test (preview) + Production (published)
- Document version: v2.0

### 2. Platform Architecture (Baru - Menggantikan AWS Diagram)

Diagram arsitektur yang benar:

```text
User Browser
    |
    v
Lovable CDN (*.lovable.app / custom domain)
    |
    v
React SPA (Vite build, gzip+brotli compressed)
    |
    +---> Supabase PostgreSQL 16 (direct via SDK + RLS)
    +---> 31 Deno Edge Functions (serverless, auto-scaling)
    +---> Supabase Storage (5 buckets)
    +---> External: Xendit, Resend, Lovable AI
```

Mermaid diagram pengganti untuk high-level deployment topology.

### 3. Technology Stack - Deployment Layer

| Component | Actual Technology | Previous (Wrong) |
|-----------|-------------------|------------------|
| **Hosting** | Lovable Cloud CDN | AWS CloudFront + ALB |
| **Backend Runtime** | Deno Edge Functions | NestJS on ECS |
| **Database** | Supabase PostgreSQL 16 | AWS RDS + RDS Proxy |
| **Cache** | None (Supabase built-in) | ElastiCache Redis |
| **Storage** | Supabase Storage (S3-compatible) | AWS S3 direct |
| **Secrets** | Lovable Cloud Secrets | AWS Secrets Manager |
| **CI/CD** | Lovable auto-deploy | GitHub Actions + ECR |
| **Containerization** | None (serverless) | Docker + ECS |
| **IaC** | None needed | Terraform/CloudFormation |

### 4. Environment Architecture

#### 4.1 Two-Environment Model

| Aspect | Test (Preview) | Production (Published) |
|--------|----------------|------------------------|
| URL | `*-preview--*.lovable.app` | `testing-sihuni.lovable.app` / custom domain |
| Database | Isolated test schema+data | Separate production database |
| Edge Functions | Auto-deployed on code change | Deployed immediately (backend) |
| Frontend | Auto-deployed on code change | Manual publish trigger |
| Secrets | Shared configuration | Shared configuration |
| Storage | Shared buckets | Shared buckets |

#### 4.2 Environment Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `SUPABASE_URL` | Edge Functions | Database connection |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions | Admin-level access |
| `SUPABASE_ANON_KEY` | Edge Functions | Public-level access |
| `XENDIT_SECRET_KEY` | Edge Functions | Payment gateway |
| `XENDIT_WEBHOOK_TOKEN` | Edge Functions | Webhook verification |
| `RESEND_API_KEY` | Edge Functions | Email service |
| `LOVABLE_API_KEY` | Edge Functions | AI chatbot |
| `VITE_SUPABASE_URL` | Frontend | Client SDK |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend | Client SDK |

### 5. Deployment Pipeline (Actual Flow)

Mermaid sequence diagram showing the real pipeline:

1. Developer edits code in Lovable IDE
2. TypeScript compilation check (automatic)
3. Preview deployment (automatic, instant)
4. Edge functions deploy (automatic, immediate)
5. Database migration (semi-automatic, user-approved)
6. Production publish (manual trigger via Publish button)

Key distinctions:
- Frontend changes require manual "Update" click to go live
- Backend changes (edge functions, DB migrations) deploy immediately
- No Docker builds, no container registries, no CI/CD pipelines

### 6. Frontend Build & Optimization

#### 6.1 Vite Build Configuration
- Build tool: Vite 5.4 with React SWC plugin
- Compression: Dual gzip + Brotli (via `vite-plugin-compression`)
- Code splitting strategy (6 manual chunks):
  - `vendor`: react, react-dom, react-router-dom, react-helmet-async
  - `ui`: 25 Radix UI packages + CVA + lucide-react
  - `data`: TanStack Query, Supabase SDK, Zod, Zustand
  - `charts`: Recharts
  - `maps`: Leaflet, React Leaflet
  - Dynamic imports: 25 feature modules lazy-loaded per route
- Chunk size warning limit: 1000 KB

#### 6.2 Static Asset Delivery
- Served via Lovable CDN with edge caching
- Content hashing for cache-busting
- Immutable asset headers for hashed files

### 7. Edge Functions Infrastructure

#### 7.1 Runtime Details
- Runtime: Deno (V8 isolate, TypeScript native)
- Cold start: ~50-200ms
- Auto-scaling: Managed by Lovable Cloud (zero config)
- No container management required

#### 7.2 Function Catalog (31 Functions)

Grouped by category with JWT verification status:

| Category | Functions | verify_jwt |
|----------|-----------|------------|
| **Auth** | `ensure-user-bootstrap`, `validate-admin-secret`, `auth-webhook` | false/true |
| **Tenant Invitation** | `get-tenant-invitation`, `accept-tenant-invitation` | false |
| **Billing Crons** | `auto-generate-invoices`, `auto-pay-execute`, `check-overdue-escalation`, `check-payment-plan` | true |
| **Payment** | `xendit-create-invoice`, `xendit-webhook`, `subscription-payment` | mixed |
| **Escrow** | `scheduled-disbursement`, `xendit-disbursement`, `xendit-disbursement-webhook`, `process-deposit-refund` | true |
| **Subscription** | `subscription-billing`, `subscription-renewal`, `subscription-grace-check` | true |
| **Referral** | `process-referral-commissions`, `process-referral-reward`, `process-vendor-order-referral` | true |
| **AI** | `ai-chatbot`, `merchant-ai-assistant`, `vendor-ai-assistant` | true |
| **Notification** | `send-notification`, `send-payment-reminder`, `whatsapp-notification` | true |
| **Operations** | `vacancy-tracking-cron`, `order-auto-reject`, `generate-invoice-pdf` | true |

#### 7.3 Public Functions (No Auth Required)
4 functions with `verify_jwt = false` in `supabase/config.toml`:
- `get-tenant-invitation` -- Token-based validation
- `accept-tenant-invitation` -- Token-based validation
- `ensure-user-bootstrap` -- Called during signup
- `subscription-payment` -- Xendit callback/redirect

### 8. Database Infrastructure

#### 8.1 PostgreSQL 16 on Lovable Cloud
- 66 public tables
- 18 database functions
- 191 RLS policies
- 1 custom enum (`app_role`)
- Auto-managed by Lovable Cloud (no DBA required)
- Connection pooling: Built-in (Supavisor)
- Backups: Automatic daily snapshots

#### 8.2 Migration Strategy
- Migrations created via Lovable IDE database migration tool
- User approval required before execution
- Migrations apply to Test environment first
- Publishing deploys schema changes to Production
- **Critical**: Check Live data before destructive schema changes

### 9. Storage Infrastructure

#### 9.1 Supabase Storage Buckets

| Bucket | Public | Purpose | Content |
|--------|--------|---------|---------|
| `verification-documents` | No | KTP, business docs | Private merchant/vendor docs |
| `property-images` | Yes | Property photos | Unit and property images |
| `maintenance-photos` | Yes | Maintenance evidence | Before/after repair photos |
| `product-photos` | Yes | Vendor products | Marketplace product images |
| `contract-documents` | No | Signed contracts | Digital signatures, PDFs |

#### 9.2 Storage Policies
- Private buckets: Accessible only via authenticated requests with RLS
- Public buckets: Read-accessible via CDN URL, write requires auth
- File path convention: `{user_id}/{folder}/{timestamp}-{random}.{ext}`

### 10. External Service Integrations

#### 10.1 Xendit (Payment Gateway)
- Invoice creation API
- Webhook callbacks (PAID, EXPIRED, FAILED)
- Disbursement API (bank transfers)
- Disbursement webhook confirmation
- Webhook verification: HMAC-based token validation
- Idempotency: Duplicate webhook detection via `xendit_transactions` table

#### 10.2 Resend (Email)
- Transactional emails (30+ templates)
- Triggered from edge functions
- Categories: payment confirmations, overdue reminders, subscription notices, invitations

#### 10.3 Lovable AI (Chatbot)
- Models: Gemini 2.5 Flash/Pro (no API key needed)
- 3 role-specific assistants
- Context injection from database per role

### 11. Cron Job Infrastructure

#### 11.1 Scheduling Architecture
- 12 daily automated jobs
- Triggered via external cron service calling edge function endpoints
- Each job is an independent edge function with its own error handling
- Idempotent design (safe to re-run)

#### 11.2 Cron Job Schedule

| Time | Function | Purpose |
|------|----------|---------|
| 00:00 | `auto-generate-invoices` | Generate rent invoices on billing day |
| 01:00 | `check-overdue-escalation` | Escalate overdue invoices (4-tier) |
| 02:00 | `check-payment-plan` | Monitor installment deadlines |
| 03:00 | `auto-pay-execute` | Process auto-pay enabled tenants |
| 04:00 | `subscription-billing` | Generate subscription invoices |
| 05:00 | `subscription-renewal` | Auto-renew expiring subscriptions |
| 06:00 | `subscription-grace-check` | Suspend/cancel grace-expired subs |
| 07:00 | `process-referral-commissions` | Process pending referral rewards |
| 08:00 | `send-payment-reminder` | Send upcoming payment reminders |
| 09:00 | `scheduled-disbursement` | Process merchant payouts |
| 10:00 | `order-auto-reject` | Reject unconfirmed orders (48h) |
| 11:00 | `vacancy-tracking-cron` | Update vacancy day counters |

### 12. Security Infrastructure

#### 12.1 Authentication Layer
- Supabase Auth (JWT-based)
- RBAC via `user_roles` table + `has_role()` function
- Admin 2FA (TOTP) via `otpauth` library
- Session management: Supabase built-in (refresh tokens)

#### 12.2 Data Security
- Row Level Security (RLS): 191 policies enforce data isolation
- All edge functions use `SUPABASE_SERVICE_ROLE_KEY` for admin operations
- Webhook verification: Timing-safe HMAC comparison for Xendit
- Input sanitization: DOMPurify for user-generated content
- No PCI data storage: Xendit handles all card/payment data

#### 12.3 Network Security
- HTTPS enforced on all endpoints
- CORS managed by Supabase Edge Functions
- Rate limiting: Built-in via Supabase/Lovable Cloud
- No exposed database ports (SDK-only access)

### 13. Scalability Architecture

#### 13.1 Frontend Scaling
- Static SPA served from CDN (infinite horizontal scaling)
- Code splitting reduces initial bundle size
- Lazy loading for 25 feature modules

#### 13.2 Backend Scaling
- Edge functions: Auto-scale to zero, scale up on demand
- Database: Lovable Cloud managed (upgradable instance size in Settings)
- Storage: S3-compatible, virtually unlimited
- No manual capacity planning required

#### 13.3 Performance Optimization
- TanStack Query: Client-side caching with stale-while-revalidate
- Supabase SDK: Connection pooling via Supavisor
- Partial indexes: Optimized queries for status-based filters
- JSONB: Flexible schema for dynamic data (settings, metadata)

### 14. Monitoring & Observability

#### 14.1 Available Monitoring
- Edge Function logs (Lovable Cloud dashboard)
- Database logs (postgres_logs)
- Auth logs (auth_logs)
- Audit trail (`audit_logs` table -- immutable)
- Analytics events (`analytics_events` table)

#### 14.2 Error Tracking
- Console-based logging in edge functions
- Frontend: Browser console + Lovable debug tools
- No external APM (DataDog/Sentry) currently integrated

#### 14.3 Business Metrics
- `analytics_events` table for user behavior tracking
- Dashboard analytics built into admin panel
- Recharts visualizations for revenue, occupancy, subscription metrics

### 15. Disaster Recovery

#### 15.1 Backup Strategy
- Database: Automatic daily backups (Lovable Cloud managed)
- Point-in-time recovery: Available via Cloud settings
- Storage: Object versioning via Supabase Storage
- Code: Git-based version history in Lovable IDE

#### 15.2 Recovery Procedures
- Database restore: Via Lovable Cloud advanced settings
- Code rollback: Revert to previous version in Lovable IDE
- Edge function rollback: Re-deploy previous code version

#### 15.3 Data Protection
- Test and Production databases are fully isolated
- Publishing deploys schema only (no data sync)
- Destructive schema changes require manual Live data migration

### 16. Cost Architecture

#### 16.1 Lovable Cloud Pricing
- Usage-based pricing with free tier
- Instance size upgradable in Settings (affects cost)
- Edge function invocations: Usage-based
- Storage: Usage-based
- Database: Included in Cloud plan

#### 16.2 External Service Costs
- Xendit: Per-transaction fees (VA, e-wallet, QRIS rates)
- Resend: Per-email pricing
- Lovable AI: Usage-based with free tier included

### 17. Deployment Checklist

Pre-production checklist for new releases:
1. All TypeScript errors resolved
2. RLS policies verified for new tables
3. Edge functions tested via curl/preview
4. Database migrations applied and verified in Test
5. Secrets configured for all required API keys
6. Storage bucket policies set correctly
7. Cron job endpoints tested manually
8. Publish frontend via Publish button
9. Verify production URL health

---

## Skills yang Digunakan

| Skill | Penerapan |
|-------|-----------|
| `deployment-pipeline-design` | Pipeline stages, environment strategy, rollback procedures |
| `architecture-patterns` | Serverless modular monolith, event-driven cron architecture |
| `api-security-best-practices` | HTTPS, CORS, webhook verification, secrets management |
| `pci-compliance` | No PCI data storage, tokenized payment handling |
| `security-auditor` | RLS audit, audit trail, data isolation |
| `web-performance-optimization` | Code splitting, compression (gzip+brotli), lazy loading, CDN |
| `supabase-postgres-best-practices` | Connection pooling, RLS, indexing, backup strategy |
| `billing-automation` | Cron job scheduling, idempotent job design |
| `workflow-patterns` | Environment separation, migration workflow |

---

## Hasil Akhir

Dokumen deployment & infrastructure lengkap (~800+ baris) yang mencerminkan arsitektur Lovable Cloud sebenarnya: serverless Deno Edge Functions, Supabase PostgreSQL, React/Vite SPA dengan CDN delivery, 5 storage buckets, 12 cron jobs, dan zero-config auto-scaling -- menggantikan seluruh referensi AWS/Docker/ECS yang tidak relevan.
