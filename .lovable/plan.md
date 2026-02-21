

# Maximalisasi PRD DSS Manajemen Kosan v3.0

## Ringkasan Masalah

PRD v2 saat ini **tidak sinkron** dengan arsitektur aktual project. Dokumen ini masih merujuk pada tech stack lama (AWS, Flask, Tesseract, Redis, Celery, Airflow, EC2, dll.) padahal project sudah berjalan di **Lovable Cloud** dengan Deno Edge Functions, Supabase PostgreSQL, dan Gemini AI via Lovable AI Gateway.

Berikut gap utama yang ditemukan:

| Aspek | PRD v2 (Lama) | Arsitektur Aktual (v3.0) |
|-------|---------------|--------------------------|
| Backend | Flask/FastAPI + Python | Deno Edge Functions (43 functions) |
| Database | PostgreSQL 15 + Redis + MongoDB | PostgreSQL 16 via Supabase (72 tables, 215+ RLS) |
| OCR Engine | Tesseract + Python-tesseract | Gemini 2.5 Pro Vision via Lovable AI |
| ML Pipeline | Scikit-learn + XGBoost + Airflow | Gemini 2.5 Pro Reasoning via Lovable AI |
| Infra | AWS EC2 + ALB + S3 + Lambda | Lovable Cloud (serverless, zero-config) |
| State Mgmt | Redux Toolkit | TanStack Query + Zustand |
| Auth | Custom JWT | Supabase Auth + RLS + 7 roles |
| Biaya Infra | ~$135/bulan (AWS) | Included in Lovable Cloud |
| Tim | 14 FTE | Lovable-assisted (significantly smaller) |

## Rencana Perubahan

Rewrite PRD menjadi **v3.0** dengan menyelaraskan seluruh konten ke arsitektur aktual. Struktur section tetap dipertahankan tetapi konten disegarkan total.

### Section-by-Section Changes

**1. Header & Executive Summary**
- Update ke v3.0, status "Aligned with Implementation"
- Pertahankan target KPI (revenue +8-15%, tunggakan -20-30%)
- Tambahkan referensi ke 8 dokumen teknis v3.0

**2. Section 1: Product Vision & Context**
- Pertahankan problem statement (masih relevan)
- Update proposed solution diagram: 3-layer DSS on Lovable Cloud
- Tambahkan mapping ke 12 DSS edge functions aktual

**3. Section 2: Stakeholder Analysis**
- Update persona sesuai SiHuni actors (Merchant/Pemilik Kos, Tenant, Vendor, Admin)
- Selaraskan dengan 7 roles di `user_roles` table
- Tambahkan persona Vendor (dari vendor-ai-assistant yang sudah ada)

**4. Section 3.1: Functional Requirements (FR)**
- **FR-1 (OCR)**: Ganti Tesseract dengan Gemini 2.5 Pro Vision. Update acceptance criteria sesuai confidence thresholds aktual (High >=0.85, Medium 0.60-0.84, Low 0.40-0.59). Referensi 4 OCR edge functions: `ocr-ktp-extract`, `ocr-payment-proof`, `ocr-business-document`, `ocr-maintenance-receipt`
- **FR-2 (ML)**: Ganti Scikit-learn/XGBoost dengan Gemini 2.5 Pro Reasoning. Update 4 ML edge functions: `ml-revenue-forecast`, `ml-tenant-risk-score`, `ml-churn-prediction`, `ml-optimal-pricing`. Selaraskan output format dengan DSS data models dari `api-specification.md`
- **FR-3 (GenAI)**: Update dari Google Gemini API standalone ke Lovable AI Gateway. Referensi 4 advisor functions: `dss-pricing-advisor`, `dss-collection-strategy`, `dss-maintenance-priority`, `dss-investment-insight`
- **FR-4 (Dashboard)**: Selaraskan dengan Recharts + shadcn/ui components. Update layout sesuai actual dashboard yang sudah dibangun
- **FR-5 (Data Management)**: Update schema references ke 72 actual tables. Ganti AWS S3 dengan Supabase Storage

**5. Section 3.2: Non-Functional Requirements (NFR)**
- **NFR-1 Performance**: Update sesuai edge function latency targets
- **NFR-2 Reliability**: Update dengan Lovable Cloud SLA
- **NFR-3 Security**: Rewrite total - RLS-first security, 215+ policies, Supabase Auth, 7 RBAC roles
- **NFR-4 Scalability**: Serverless auto-scaling (bukan EC2 auto-scaling)
- **NFR-5 Usability**: Pertahankan WCAG 2.1 AA, tambahkan shadcn/ui compliance
- **NFR-6 Maintainability**: Update ke TypeScript strict, Deno testing, 28 feature modules
- **NFR-7 Cost**: Rewrite total - Lovable Cloud pricing model, bukan AWS itemized

**6. Section 4: Technology Stack & Architecture**
- Rewrite total sesuai actual stack dari `development-standards.md`:
  - Frontend: React 18 + Vite + Tailwind + shadcn/ui + TanStack Query + Zustand
  - Backend: 43 Deno Edge Functions on Lovable Cloud
  - Database: PostgreSQL 16 (72 tables, 215+ RLS policies)
  - AI: Lovable AI (Gemini 2.5 Pro - Vision + Reasoning)
  - Payments: Xendit
  - Email: Resend
- Update architecture diagram dari AWS multi-tier ke Lovable Cloud serverless
- Update database schema ke actual tables (UUID PKs, timestamptz, numeric for money)
- Update API design dari REST endpoints ke Edge Functions + Supabase SDK direct access

**7. Section 5: ML Model Specifications**
- Pertahankan model descriptions dan scoring formulas (business logic tetap valid)
- Update implementation dari Python libraries ke Gemini 2.5 Pro Reasoning prompts
- Update retraining dari Airflow DAG ke 2 cron jobs (`ml-daily-risk-scoring`, `ml-weekly-forecast`)
- Update monitoring dari CloudWatch ke edge function logs + `ml_model_runs` audit table

**8. Section 6: Data Privacy & Compliance**
- Update encryption dari AWS KMS ke Supabase/Lovable Cloud encryption
- Update RBAC dari 3 roles ke 7 roles
- Update audit trail ke `audit_logs` + `ml_model_runs` (immutable)
- Tambahkan DSS-specific data retention dari `business-process.md` v3.0

**9. Section 7: Product Roadmap**
- Rewrite sesuai Lovable Cloud development velocity
- Update dari 6-phase waterfall ke sprint-based with Lovable AI acceleration
- Update deliverables per phase sesuai actual feature modules

**10. Section 8: Resource Plan & Budget**
- Rewrite total - Lovable-assisted development membutuhkan tim jauh lebih kecil
- Update infra costs ke Lovable Cloud model
- Update per-property cost projection

**11. Section 9: Risk Management**
- Update risks: remove AWS-specific, add Lovable Cloud specific
- Update mitigation strategies sesuai actual architecture

**12. Section 10: Success Metrics & KPI**
- Pertahankan business KPIs (masih relevan)
- Update technical KPIs sesuai edge function monitoring
- Tambahkan DSS-specific KPIs

**13. Sections 11-12: Glossary & Appendix**
- Tambahkan Lovable Cloud terminology
- Update tools & references ke actual stack
- Tambahkan cross-references ke 8 dokumen v3.0

### Skills yang Digunakan

| Skill | Penerapan dalam PRD |
|-------|---------------------|
| `database-design` | Schema design principles, UUID PKs, JSONB patterns, indexing strategy |
| `architecture-patterns` | Serverless modular monolith, feature-based architecture |
| `api-design-principles` | Edge function API design, RLS-first approach |
| `security-auditor` | RLS policies, RBAC, data encryption, audit trails |
| `accessibility-compliance` | WCAG 2.1 AA requirements dalam NFR |
| `performance-engineer` | Edge function latency targets, caching strategy |
| `startup-metrics-framework` | Business KPIs, unit economics, ROI calculations |
| `startup-financial-modeling` | Budget rewrite, per-property cost, breakeven |
| `pricing-strategy` | Subscription tier gating untuk DSS features |
| `gdpr-data-handling` | Data retention, PII handling, consent management |
| `deployment-pipeline-design` | CI/CD via Lovable Cloud, cron jobs |
| `clean-architecture` | Feature-based modules, separation of concerns |
| `web-performance-optimization` | FCP targets, code splitting, lazy loading |
| `responsive-design` | Mobile-first dashboard requirements |
| `prompt-engineering-patterns` | Gemini prompt design untuk OCR/ML/DSS |
| `e2e-testing-patterns` | DSS function testing, UAT criteria |
| `market-sizing-analysis` | Updated market sizing untuk Indonesia kosan |
| `competitive-landscape` | USP comparison dengan actual DSS capabilities |

### Detail Teknis

Berikut contoh perubahan kunci:

**Architecture Diagram (Before vs After)**

Before: AWS EC2 + ALB + RDS + S3 + Lambda + Redis + Airflow
After:
```text
Client (React PWA + Supabase JS SDK)
    |
    +-- Direct CRUD via RLS (72 tables)
    |
    +-- invoke() to 43 Edge Functions
            |
            +-- Xendit (Payments)
            +-- Resend (Email)  
            +-- Lovable AI Gateway
                  +-- Gemini 2.5 Pro Vision (OCR)
                  +-- Gemini 2.5 Pro Reasoning (ML/DSS)
```

**Database Schema (Before vs After)**

Before: `SERIAL` PKs, `ENUM` types, `TIMESTAMP`, 8 tables
After: `UUID` PKs, `text` status columns, `timestamptz`, 72 tables (66 core + 6 DSS) with 215+ RLS policies

**OCR Pipeline (Before vs After)**

Before: Tesseract v5 + NLP entity extraction + Python processing
After: Gemini 2.5 Pro Vision multimodal -- single API call extracts structured JSON with confidence scores

**ML Pipeline (Before vs After)**

Before: Scikit-learn + XGBoost + ARIMA + Airflow DAGs + monthly retraining
After: Gemini 2.5 Pro Reasoning with structured prompts, cached results in `dss_recommendations` + `tenant_risk_scores`, 2 daily/weekly cron jobs, `ml_model_runs` immutable audit

### Estimasi Ukuran

PRD v3.0 akan tetap ~2000-2200 baris (serupa v2) tetapi dengan konten yang 100% aligned dengan implementasi aktual.

