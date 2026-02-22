

# Maximalisasi System Architecture Document v3.0 (DSS Edition)

## Ringkasan Masalah

`system-architecture.md` v1.0 (295 baris) adalah **satu-satunya dokumen arsitektur yang masih belum di-update** ke v3.0. Seluruh konten merujuk pada stack lama yang sudah tidak digunakan:

| Aspek | v1.0 (Sekarang) | Implementasi Aktual (v3.0) |
|-------|-----------------|---------------------------|
| Backend | Python FastAPI + SQLAlchemy + Pydantic | Deno Edge Functions (43 functions) on Lovable Cloud |
| Database | PostgreSQL + Redis (cache/queue) + S3 | PostgreSQL 16 via Supabase (72 tables, 215+ RLS) |
| OCR | Tesseract/PaddleOCR + Celery Worker | Gemini 2.5 Pro Vision via Lovable AI |
| ML | Scikit-learn (in-process) | Gemini 2.5 Pro Reasoning via Lovable AI |
| Infra | AWS EC2 + Docker Compose + Nginx | Lovable Cloud (serverless, CDN, zero-config) |
| State Mgmt | Zustand 4.x (only) | TanStack Query v5 + Zustand v5 |
| Personas | Owner, Manager, Surveyor, Tenant | Merchant, Tenant, Vendor, Admin (7 roles) |
| Data Model | 6 entities (User, Kosan, Room, Tenant, Transaction, Document) | 72 tables (66 core + 6 DSS) |
| Architecture Pattern | Modular Monolith (Python containers) | Serverless Modular Monolith (Edge Functions + RLS-as-API) |
| C4 Diagrams | AWS-centric containers | Lovable Cloud topology |
| External Systems | AWS S3, SendGrid/SES, Midtrans (future) | Supabase Storage, Resend, Xendit (active), Lovable AI |

## Rencana Rewrite

Rewrite total menjadi **v3.0 (DSS Edition)** (~900-1100 baris) yang selaras dengan semua dokumen v3.0 lainnya.

### Struktur Baru (14 Sections)

1. **Introduction** -- Update principles: Serverless-First, Database-as-API, RLS-First Security, AI-Augmented Operations
2. **Architectural Drivers** -- Update business goals & NFRs sesuai PRD v3.0 (revenue +8-15%, tunggakan -20-30%)
3. **System Context (C4 Level 1)** -- Rewrite: 4 personas (Merchant, Tenant, Vendor, Admin) + 4 external systems (Xendit, Resend, Lovable AI, Cron Service)
4. **Container Architecture (C4 Level 2)** -- Rewrite total: React SPA, PostgreSQL (RLS-as-API), 43 Edge Functions, Supabase Storage, Lovable AI Gateway
5. **Component Architecture (C4 Level 3)** -- Rewrite: Feature-based modules (28 modules), bukan Clean Architecture Python layers
6. **Frontend Architecture** -- Baru: React 18 + Vite + shadcn/ui + TanStack Query + Zustand, 25 feature modules, role-based routing
7. **Backend Architecture** -- Baru: Dual-access pattern (SDK direct CRUD + Edge Function invoke), 43 functions taxonomy (core vs DSS)
8. **Data Architecture** -- Rewrite: 72 tables ERD, UUID PKs, timestamptz, numeric for money, JSONB patterns, 8 RLS access patterns
9. **DSS Layer Architecture** -- Baru: OCR pipeline (Gemini Vision), ML pipeline (Gemini Reasoning), AI Advisors, cron automation, `ml_model_runs` audit
10. **Integration Architecture** -- Baru: Xendit payment flow, Resend email, Lovable AI Gateway, webhook patterns
11. **Technology Stack** -- Rewrite total sesuai actual stack
12. **Deployment Architecture** -- Rewrite: Lovable Cloud serverless, 2-environment model (Test/Live), CDN, auto-scaling
13. **Quality Attributes & NFR Mapping** -- Update: edge function latency targets, RLS performance, serverless scaling
14. **Requirement Traceability Matrix** -- Rewrite: map FRs to actual edge functions dan tables

### Detail Perubahan Kunci

**C4 Level 1 (System Context)**
- Personas: Merchant (Pemilik Kos, 40-60yo), Tenant (20-40yo), Vendor (25-45yo), Admin/Support (25-35yo)
- External: Xendit (active, VA/QRIS/e-wallet), Resend (active, 30+ templates), Lovable AI (Gemini 2.5 Pro Vision+Reasoning), External Cron Service

**C4 Level 2 (Container)**
- React SPA -> Supabase SDK -> PostgreSQL (direct CRUD via RLS)
- React SPA -> fetch() -> 43 Edge Functions -> Xendit/Resend/Lovable AI
- PostgreSQL: 72 tables, 215+ RLS policies, 16 DB functions, 45+ triggers
- Supabase Storage: 5 buckets (2 private, 3 public)

**C4 Level 3 (Component -- Frontend)**
- 25 frontend feature modules from `src/features/`
- Shared layer: `src/shared/components/ui/` (54 shadcn/ui), `src/shared/hooks/`, `src/lib/`

**DSS Layer**
- OCR Pipeline: Upload -> Supabase Storage -> Edge Function -> Gemini 2.5 Pro Vision -> `ocr_results` table
- ML Pipeline: Cron trigger -> Edge Function -> Gemini 2.5 Pro Reasoning -> `tenant_risk_scores` / `dss_recommendations`
- AI Advisors: User request -> Edge Function -> Gemini structured prompt -> recommendation card
- 12 DSS edge functions, 6 DSS tables, 2 daily/weekly cron jobs

**Data Architecture**
- 72 tables grouped: Identity (6), Property (4), Contract (8), Billing (8), Subscription (4), Maintenance (4), Marketplace (5), Forum (4), Chat (4), Referral (3), System (9), DSS (6), Config (7)
- Key relationships: auth.users -> profiles -> user_roles -> merchants/tenants/vendors -> properties -> units -> contracts -> invoices -> payments

**Integration Patterns**
- Xendit: xendit-create-invoice -> webhook callback -> xendit-webhook (HMAC verification)
- Resend: send-notification edge function, 30+ templates
- Lovable AI: Edge function -> AI Gateway -> Gemini 2.5 Pro (Vision for OCR, Reasoning for ML/DSS)

### Skills yang Diterapkan

| Skill | Penerapan |
|-------|-----------|
| `architecture-patterns` | C4 diagrams, serverless modular monolith, feature-based architecture |
| `clean-architecture` | Layer separation, dependency direction in frontend modules |
| `database-design` | ERD, UUID PKs, JSONB patterns, indexing, RLS |
| `api-design-principles` | Dual-access pattern (SDK + Edge Functions), REST conventions |
| `security-auditor` | RLS-first security, RBAC, zero-trust data access |
| `performance-engineer` | Edge function cold starts, CDN caching, query optimization |
| `web-performance-optimization` | Code splitting, lazy loading, Vite build optimization |
| `deployment-pipeline-design` | Lovable Cloud 2-environment model, auto-deploy |
| `responsive-design` | Mobile-first architecture, portal layouts |
| `prompt-engineering-patterns` | Gemini prompt architecture for OCR/ML/DSS |
| `startup-metrics-framework` | KPI-driven architecture decisions |
| `supabase-postgres-best-practices` | RLS performance, connection pooling, realtime |

### Cross-References

- `backend-architecture.md` v3.0 -- Detailed edge function specs (1823 baris)
- `database-schema.md` v3.0 -- Full 72-table schema (1856 baris)
- `deployment-infrastructure.md` v3.0 -- Lovable Cloud deployment (781 baris)
- `security-architecture.md` v3.0 -- Security deep-dive (1033 baris)
- `api-specification.md` v3.0 -- API endpoints (2698 baris)
- `development-standards.md` v3.0 -- Coding standards (1205 baris)
- `PRD_DSS_Manajemen_Kosan_v2_Professional.md` v3.0 -- Requirements
- `UIUX_Design_Documentation_SiHuni.md` v3.0 -- Design system

### Estimasi

System Architecture v3.0: ~900-1100 baris (vs 295 saat ini). Fokus pada high-level architectural view yang menjadi "peta navigasi" ke dokumen detail lainnya, menghindari duplikasi konten yang sudah ada di `backend-architecture.md` dan `database-schema.md`.

