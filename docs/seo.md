# SEO Strategy & Implementation Guide - SiHuni

**Version:** 1.0
**Last Updated:** 2026-02-22
**Status:** Draft
**Document ID:** DOC-SEO-001

## 1. Executive Summary

This document outlines the Search Engine Optimization (SEO) strategy for **SiHuni (Sistem Huni)**. Our primary goal is to capture high-intent traffic from boarding house owners ("Juragan Kos") looking for management solutions.

Given SiHuni's architecture (React + Vite), this strategy emphasizes **Technical SEO** to ensure crawlability of a Single Page Application (SPA) and **Content Authority** to establish trust in the niche market.

**Primary KPI:** Organic Traffic Growth & Keyword Ranking for "Aplikasi Manajemen Kos".
**Secondary KPI:** Organic Conversion Rate (Visitor to Free Trial).

---

## 2. Technical SEO Strategy

### 2.1 SPA Rendering & Crawlability
SiHuni is built on React with Vite. To ensure search engines can index our content effectively, we must address Client-Side Rendering (CSR) limitations.

*   **Strategy:** Implement **Dynamic Pre-rendering** or **Helmet Management** for meta tags.
*   **Tooling:** `react-helmet-async` for managing `<head>` elements dynamically per route.
*   **Canonical Tags:** Strict self-referencing canonicals to prevent duplicate content issues (e.g., `https://sihuni.com/pricing` vs `https://sihuni.com/pricing?ref=promo`).

### 2.2 Core Web Vitals (CWV) Targets
Aligned with `UIUX_Design_Documentation_SiHuni.md` (Performance Values).

| Metric | Target | Optimization Technique |
| :--- | :--- | :--- |
| **LCP (Largest Contentful Paint)** | < 2.5s | Preload hero images (WebP/AVIF), Lazy load below-fold components. |
| **INP (Interaction to Next Paint)** | < 200ms | Optimize React state updates, Debounce heavy input handlers. |
| **CLS (Cumulative Layout Shift)** | < 0.1 | Set explicit `width`/`height` on images, Reserve space for dynamic ads/banners. |

### 2.3 Mobile-First Indexing
*   **Responsive Design:** Use Tailwind CSS breakpoints (`md`, `lg`) to ensure content is identical on mobile and desktop (Google indexes mobile version).
*   **Touch Targets:** Ensure all buttons/links are ≥ 44x44px (Accessibility/SEO overlap).

---

## 3. On-Page SEO Architecture

### 3.1 URL Structure
Clean, semantic, and keyword-rich URLs.

*   **Landing:** `https://sihuni.com/`
*   **Features:** `https://sihuni.com/fitur/pencatatan-penghuni`
*   **Pricing:** `https://sihuni.com/harga`
*   **Blog:** `https://sihuni.com/blog/cara-mengelola-keuangan-kos`
*   **Comparison:** `https://sihuni.com/alternatif/mamikos-vs-sihuni`

### 3.2 Meta Tags Strategy
Every public page must include:

```html
<title>SiHuni - Aplikasi Manajemen Kos Cerdas & Otomatis</title>
<meta name="description" content="Kelola kos lebih mudah dengan fitur OCR KTP otomatis dan scoring penghuni. Coba gratis SiHuni, solusi terbaik untuk juragan kos modern.">
<meta name="robots" content="index, follow">
<meta property="og:title" content="...">
<meta property="og:image" content="https://sihuni.com/assets/og-home.jpg">
```

### 3.3 Heading Hierarchy (H1-H6)
*   **H1:** One per page. Must contain the primary keyword (e.g., "Software Manajemen Kos Terbaik").
*   **H2:** Main sections (e.g., "Fitur Unggulan", "Harga", "Testimoni").
*   **H3:** Sub-sections (e.g., "OCR Otomatis", "Laporan Keuangan").

---

## 4. Schema Markup Implementation

We will use JSON-LD to help Google understand our software entity.

### 4.1 SoftwareApplication Schema (Homepage/App)
To display star ratings and price in search results.

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "SiHuni",
  "operatingSystem": "Web, Android, iOS",
  "applicationCategory": "BusinessApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "IDR"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "120"
  },
  "featureList": "OCR KTP, Tenant Scoring, Financial Reports"
}
```

### 4.2 FAQPage Schema (Support/Pricing)
To capture "People Also Ask" snippets.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Apakah SiHuni gratis?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Ya, SiHuni menyediakan paket Starter gratis selamanya untuk pengelolaan hingga 5 kamar."
    }
  }, {
    "@type": "Question",
    "name": "Bagaimana cara kerja fitur OCR?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Cukup foto KTP calon penghuni, dan sistem kami akan otomatis mengekstrak data NIK, Nama, dan Tanggal Lahir dalam hitungan detik."
    }
  }]
}
```

---

## 5. Semantic Core & Keyword Strategy

### 5.1 Primary Keywords (High Intent)
*   "Aplikasi manajemen kos"
*   "Software pembukuan kos"
*   "Sistem manajemen kost online"
*   "Aplikasi tagihan sewa otomatis"

### 5.2 Secondary Keywords (Informational)
*   "Contoh surat perjanjian sewa kos"
*   "Cara menghitung pajak bisnis kos"
*   "Tips memilih penghuni kos yang baik"
*   "Desain kamar kos 3x4 kamar mandi dalam"

### 5.3 User Intent Mapping

| Keyword | Intent | Target Page | Content Angle |
| :--- | :--- | :--- | :--- |
| "Aplikasi kos gratis" | Transactional | Homepage | "Free Forever Plan" |
| "Masalah pengelolaan kos" | Informational | Blog | "5 Masalah Umum Juragan Kos" |
| "SiHuni vs Excel" | Commercial | Comparison | "Why Automation Beats Spreadsheets" |

---

## 6. Content Marketing Roadmap

Aligned with the **Marketing Strategy (DOC-MKT-001)**, we will build authority through "Hub & Spoke" clusters.

### 6.1 Pillar: Operational Efficiency
*   **Hub Page:** "Panduan Lengkap Operasional Bisnis Kos"
*   **Spokes:**
    *   "Cara Verifikasi KTP Penghuni (Anti Palsu)"
    *   "SOP Kebersihan Kos"
    *   "Draft Peraturan Tata Tertib Kos (Download)"

### 6.2 Pillar: Financial Health
*   **Hub Page:** "Manajemen Keuangan & Profitabilitas Kos"
*   **Spokes:**
    *   "Menghitung ROI Bisnis Kos-kosan"
    *   "Cara Menghemat Listrik Token"
    *   "Pajak Kos: Apa yang Perlu Anda Tahu"

### 6.3 Pillar: Tenant Relations
*   **Hub Page:** "Strategi Retensi & Seleksi Penghuni"
*   **Spokes:**
    *   "Ciri-ciri Penghuni Bermasalah"
    *   "Cara Menagih Tunggakan Tanpa Drama"

---

## 7. Site Architecture & Internal Linking

Visualizing the link equity flow.

```mermaid
graph TD
    Home[Homepage (High Authority)] --> Features
    Home --> Pricing
    Home --> BlogHub
    
    BlogHub --> Art1[Article: Operational]
    BlogHub --> Art2[Article: Financial]
    
    Art1 --> Features[Feature: OCR]
    Art2 --> Pricing
    
    Features --> Signup[Sign Up Page]
```

**Rules:**
1.  Every blog post must link to at least one **Feature Page** (Contextual CTA).
2.  Feature pages should link to related **Success Stories** or **Case Studies**.
3.  No orphan pages (every page must have at least one incoming link).

---

## 8. Monitoring & Analytics

### 8.1 Tools Configuration
*   **Google Search Console (GSC):** Submit XML Sitemap (`sitemap.xml`), monitor "Page Indexing" errors (Soft 404s common in SPAs).
*   **Google Analytics 4 (GA4):** Track custom events: `view_pricing`, `start_trial`, `read_blog_50%`.
*   **Ahrefs/Semrush:** Monitor keyword ranking and backlink health.

### 8.2 Monthly Audit Checklist
1.  [ ] Check for broken links (404s).
2.  [ ] Verify Schema Markup via Google Rich Results Test.
3.  [ ] Analyze "Search Queries" in GSC for new content ideas.
4.  [ ] Review Core Web Vitals report (CrUX data).

---

## 9. Constraints & Assumptions

*   **Assumption:** The marketing team can produce 2-4 high-quality blog posts per month.
*   **Constraint:** Since the main app is behind a login (dashboard), SEO efforts focus on the public-facing Marketing Site (Landing, Blog, Pricing). The Dashboard itself requires `noindex` to prevent private data leakage.

