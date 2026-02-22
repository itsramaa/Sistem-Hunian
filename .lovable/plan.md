

# Maximalisasi SEO Strategy Document v3.0 (DSS Edition)

## Ringkasan Masalah

Dokumen `seo.md` v1.0 (222 baris) masih generik dan belum aligned dengan implementasi aktual serta dokumen v3.0 lainnya:

| Aspek | v1.0 (Sekarang) | Implementasi Aktual / Dokumen v3.0 |
|-------|-----------------|-------------------------------------|
| Meta Tags | Contoh HTML statis | `Meta` component via `react-helmet-async` (sudah aktif di `App.tsx`) |
| Brand Name | "SiHuni" | "Sistem Hunian" (default title di `Meta` component) |
| OG Image | `og-home.jpg` placeholder | `/placeholder.svg` (belum ada OG image asli) |
| robots.txt | Tidak didokumentasikan | Sudah ada di `public/robots.txt` (5 user-agents) |
| sitemap.xml | Disebutkan tapi tidak ada | Belum dibuat -- perlu implementasi |
| noindex Dashboard | Disebutkan tapi belum diimplementasikan | Tidak ada `noindex` meta di dashboard routes |
| Keyword Strategy | 4 primary keywords saja | Marketing v3.0 punya keyword research lengkap per buyer stage |
| Content Pillars | 3 pillars sederhana | Marketing v3.0 punya 6 pillars termasuk AI & Data Intelligence |
| Comparison Pages | 1 contoh | Marketing v3.0 punya 6 comparison pages dengan URL patterns |
| Free Tools SEO | Tidak ada | Marketing v3.0 punya 5 free tools sebagai SEO lead magnets |
| DSS Content | Tidak ada | DSS features (OCR, ML, AI Advisors) belum dimapping ke SEO |
| Schema Markup | SoftwareApplication + FAQ saja | Perlu Organization, BreadcrumbList, HowTo, Article |
| Programmatic SEO | Tidak ada | Peluang: location pages (`/kos/jakarta`), price pages (`/harga-kos/bandung`) |
| Internal Linking | Diagram sederhana (6 nodes) | 4 portals, 25+ public routes, complex link architecture |
| Performance/CWV | Generik | Perlu alignment dengan actual Vite build, code splitting, CDN |
| Competitor SEO | Tidak ada | Marketing v3.0 punya competitor analysis |
| AI Content Strategy | Tidak ada | Peluang: AI-generated blog content, DSS thought leadership |

## Rencana Rewrite

Rewrite total menjadi **v3.0 (DSS Edition)** (~600-750 baris) yang selaras dengan `marketing.md` v3.0, PRD v3.0, dan implementasi aktual.

### Struktur Baru (16 Sections)

1. **Executive Summary** -- Update KPIs, align dengan marketing North Star metric
2. **Technical SEO: SPA Crawlability** -- Update: `react-helmet-async` (aktual), `Meta` component API, pre-rendering strategy, `robots.txt` (aktual), sitemap.xml (perlu dibuat)
3. **Core Web Vitals & Performance** -- Update: Vite build optimization, `vite-plugin-compression`, code splitting via `lazy()`, CDN dari Lovable Cloud
4. **Mobile-First Indexing** -- Update: Tailwind responsive aktual, 4 portal layouts, mobile bottom nav, touch targets
5. **URL Architecture** -- Rewrite: actual route structure (public vs authenticated), dashboard `noindex` strategy, clean URL patterns for SEO pages
6. **Meta Tags Implementation** -- Rewrite: `Meta` component API aktual, per-route meta mapping, OG images strategy, Twitter cards
7. **Heading Hierarchy** -- Update: actual page H1/H2/H3 mapping sesuai UI/UX v3.0
8. **Schema Markup (JSON-LD)** -- Expand: SoftwareApplication, Organization, FAQPage, BreadcrumbList, HowTo, Article, Product (pricing tiers)
9. **Keyword Strategy** -- Rewrite: align dengan marketing v3.0 keyword research, 4 buyer stages, long-tail DSS keywords
10. **Content SEO: Hub & Spoke** -- Rewrite: 6 content pillars dari marketing v3.0, DSS content cluster baru
11. **Programmatic SEO Opportunity** -- BARU: Feasibility analysis untuk location-based pages, price comparison pages, kos directory
12. **Comparison Pages SEO** -- BARU: 6 comparison pages dari marketing v3.0 dengan on-page SEO spec
13. **Free Tool Pages SEO** -- BARU: 5 free tools sebagai link magnets, lead capture, keyword targeting
14. **Internal Linking Architecture** -- Rewrite: full site map, link equity flow, breadcrumb strategy, contextual CTAs
15. **Monitoring, Analytics & Audit** -- Update: GSC, GA4 events (actual), monthly/quarterly audit checklist
16. **Implementation Checklist & Prioritization** -- BARU: prioritized SEO task backlog with effort/impact matrix

### Detail Perubahan Kunci

**Section 2: Technical SEO (Rewrite)**
- Dokumentasikan `Meta` component (`src/shared/components/meta.tsx`) dengan API props: `title`, `description`, `image`, `url`, `type`
- Default values: title="Sistem Hunian", description="Platform manajemen properti terintegrasi"
- Title format: `{PageTitle} | Sistem Hunian`
- `HelmetProvider` wraps entire app di `App.tsx`
- `robots.txt` aktual: allows Googlebot, Bingbot, Twitterbot, facebookexternalhit, wildcard
- Gap: tidak ada `Disallow` untuk dashboard routes, tidak ada sitemap reference
- Action items: tambah sitemap.xml, tambah `Disallow: /merchant/`, `/tenant/`, `/vendor/`, `/admin/` ke robots.txt
- Pre-rendering: evaluate Rendertron/prerender.io untuk SPA atau SSG export untuk public pages

**Section 3: Core Web Vitals (Update)**
- Vite build sudah menggunakan `vite-plugin-compression` (Gzip/Brotli)
- Code splitting: 25 feature modules lazy-loaded via `React.lazy()` (terlihat di `App.tsx`)
- Lovable Cloud CDN: static assets auto-cached
- Image optimization: perlu WebP/AVIF strategy untuk landing page
- Font loading: Inter + Plus Jakarta Sans -- perlu `font-display: swap`

**Section 6: Meta Tags (Rewrite Total)**
- Per-route meta tag mapping:

| Route | Title | Description |
|-------|-------|-------------|
| `/` | Sistem Hunian - Aplikasi Manajemen Kos Cerdas | Kelola kos lebih mudah dengan AI, automasi billing, dan OCR KTP... |
| `/harga` | Harga & Paket - Sistem Hunian | Mulai gratis, upgrade kapan saja. Paket mulai Rp 99.000/bulan... |
| `/fitur/*` | {Feature} - Fitur Sistem Hunian | {Feature description}... |
| `/blog/*` | {Article Title} - Blog Sistem Hunian | {Article excerpt}... |
| `/vs/*` | SiHuni vs {Competitor} - Perbandingan | Bandingkan SiHuni dengan {competitor}... |

- OG image strategy: buat template OG image 1200x630px per page type
- Gap: semua dashboard routes perlu `<meta name="robots" content="noindex, nofollow">`

**Section 9: Keyword Strategy (Align dengan Marketing v3.0)**
- Primary keywords (High Intent): "Aplikasi manajemen kos", "Software pembukuan kos", "Sistem manajemen kost online", "Aplikasi tagihan sewa otomatis"
- DSS keywords (BARU): "AI untuk bisnis kos", "prediksi tunggakan sewa", "OCR KTP otomatis", "analisis harga sewa AI", "scoring penyewa kos"
- Long-tail DSS: "cara foto KTP langsung jadi data", "prediksi pendapatan kos", "rekomendasi harga sewa AI"
- Buyer stage mapping dari marketing v3.0 (Awareness -> Consideration -> Decision -> Implementation)
- Competitor keywords: "SiHuni vs Excel", "SiHuni vs WhatsApp", "aplikasi kos terbaik 2026"

**Section 11: Programmatic SEO (BARU)**
- Feasibility Index analysis menggunakan `programmatic-seo` skill
- Kandidat patterns:
  1. Location pages: `/kos/{kota}` -- "harga kos Jakarta", "kos murah Bandung"
  2. Price comparison: `/harga-kos/{kota}` -- "harga kos {kota} 2026"
  3. Tips per kategori: `/tips/{topik}` -- "tips kelola kos {topik}"
- Data source: public rental price data, city listings
- Risk assessment: thin content risk jika data tidak cukup per kota
- Recommendation: mulai dengan 10 kota besar, expand jika traction ada

**Section 12: Comparison Pages (BARU dari Marketing v3.0)**
- 6 comparison pages dengan full SEO spec:
  - `/vs/excel` -- "aplikasi kos vs excel"
  - `/vs/whatsapp` -- "manajemen kos tanpa whatsapp"
  - `/alternatives/manual` -- "digitalisasi kos"
  - `/blog/best-kos-apps` -- "aplikasi manajemen kos terbaik 2026"
  - `/vs/consultant` -- "konsultan properti kos" (NEW: AI angle)
  - `/blog/ai-kos` -- "AI untuk manajemen kos" (NEW: thought leadership)

**Section 13: Free Tool Pages SEO (BARU)**
- 5 tools dari marketing v3.0 sebagai SEO landing pages:
  1. Kalkulator ROI Kos -- "kalkulator investasi kos"
  2. Template Kontrak Sewa -- "contoh kontrak sewa kos" (HIGH volume)
  3. Cek Harga Sewa per Kota -- "harga sewa kos {kota}"
  4. Kalkulator Biaya Renovasi -- "biaya renovasi kamar kos"
  5. AI Analisis Harga Sewa -- "harga sewa kos ideal" (NEW: AI-powered)
- Each tool page: H1 with keyword, embedded tool, partial gating for lead capture

### Skills yang Diterapkan

| Skill | Penerapan |
|-------|-----------|
| `seo-fundamentals` | E-E-A-T framework, CWV targets, technical SEO principles |
| `seo-audit` | Current state gap analysis, implementation checklist |
| `on-page-seo-auditor` | Meta tags, heading hierarchy, URL structure audit |
| `seo-meta-optimizer` / `meta-tags-optimizer` | Per-route meta tag mapping, OG strategy |
| `seo-structure-architect` | URL architecture, breadcrumb strategy, internal linking |
| `seo-keyword-strategist` / `keyword-research` | Keyword expansion, buyer stage mapping, DSS keywords |
| `seo-content-planner` / `seo-content-writer` | Hub & spoke structure, content calendar alignment |
| `programmatic-seo` | Feasibility index for location/price pages |
| `schema-markup-generator` / `schema-markup` | JSON-LD specs (7 schema types) |
| `technical-seo-checker` | SPA crawlability, robots.txt, sitemap |
| `content-strategy` | 6 pillars alignment, content gap analysis |
| `content-gap-analysis` | DSS content opportunities, competitor gaps |
| `competitor-alternatives` | Comparison page SEO specs |
| `free-tool-strategy` | Free tool pages as SEO assets |
| `internal-linking-optimizer` | Link equity flow, contextual CTA rules |
| `seo-authority-builder` | E-E-A-T signals, backlink strategy |
| `web-performance-optimization` | CWV optimization aligned with Vite/Tailwind |
| `accessibility-compliance` | SEO-accessibility overlap (alt text, semantic HTML) |
| `analytics-tracking` | GSC/GA4 configuration, event tracking |
| `serp-analysis` | SERP feature targeting (FAQ, How-to, Software) |

### Cross-References

- `marketing.md` v3.0 -- Content pillars, keyword research, comparison pages, free tools, pricing tiers
- `UIUX_Design_Documentation_SiHuni.md` v3.0 -- Performance targets, responsive design, heading hierarchy
- `PRD_DSS_Manajemen_Kosan_v2_Professional.md` v3.0 -- DSS features untuk keyword mapping
- `system-architecture.md` v3.0 -- SPA architecture, CDN, deployment
- `deployment-infrastructure.md` v3.0 -- Lovable Cloud CDN, build pipeline
- `security-architecture.md` v3.0 -- noindex dashboard requirements

### Estimasi

SEO Strategy v3.0: ~650-750 baris (vs 222 saat ini), dengan konten 100% aligned dengan marketing v3.0 dan implementasi teknis aktual. Fokus pada actionable SEO tasks dengan prioritization matrix.

