

# Deep Dive: UIUX + SEO + API Contract Alignment

## Audit Summary

Cross-referencing `UIUX_Design_Documentation_SiHuni.md`, `seo.md`, `api-specification.md`, `marketing.md`, and `business-process.md` against the current codebase reveals significant gaps across 4 categories.

---

## Category 1: SEO Critical (P0 - from `seo.md` Section 16.1)

These are marked as P0 in the SEO doc but **none are implemented**.

### Gap 1.1: Meta Component Missing `noindex` + `canonical` Props

**Current:** `src/shared/components/meta.tsx` has `title`, `description`, `image`, `url`, `type` only. No `noindex` prop, no `<link rel="canonical">`.

**Required by:** `seo.md` Section 5.2 (all dashboard routes MUST have `noindex, nofollow`), Section 5.3 (self-referencing canonicals on every page).

**Fix:** Add `noindex?: boolean` and `canonical?: string` props to `Meta` component. Render `<meta name="robots" content="noindex, nofollow">` when `noindex` is true, otherwise `index, follow`. Always render `<link rel="canonical">`.

### Gap 1.2: Dashboard Layouts Missing `noindex` Meta

**Current:** `DashboardLayout.tsx`, `MobileLayout.tsx` -- no `Meta` component rendered at all. All 4 portal routes (merchant/tenant/vendor/admin) are indexable by search engines.

**Required by:** `seo.md` Section 5.2, `UIUX_Design_Documentation_SiHuni.md` Section 24.

**Fix:** Add `<Meta noindex />` in `DashboardLayout.tsx` (covers all 4 portals for both desktop and mobile). Also add to Auth page.

### Gap 1.3: `robots.txt` Missing Disallow Rules

**Current:** `public/robots.txt` only has `Allow: /` for all bots. No disallow rules, no sitemap reference.

**Required by:** `seo.md` Section 2.2.

**Fix:** Add `Disallow` rules for `/merchant/`, `/tenant/`, `/vendor/`, `/admin/`, `/onboarding/`, `/auth/`. Add `Sitemap:` reference.

### Gap 1.4: No `sitemap.xml`

**Current:** No sitemap exists.

**Required by:** `seo.md` Section 2.3.

**Fix:** Create `public/sitemap.xml` with all public indexable routes: `/`, `/auth` (redirect, excluded), public pages. Since most public pages (pricing, features, blog, comparison, tools) don't exist yet, create a minimal sitemap with the homepage only and add entries as pages are built.

### Gap 1.5: `index.html` Fixes

**Current issues:**
- `theme-color` is `#2563eb` (blue) -- should be `#8B6F47` (brand primary brown per `UIUX_Design_Documentation_SiHuni.md`)
- No `<link rel="preconnect">` for backend origins (required by `seo.md` Section 3.2)
- `canonical` URL points to `https://sihuni.app` -- should match actual deployment domain
- Missing `font-display: swap` preload hint (fonts load via CSS `@import` with `&display=swap` which is fine, but `<link rel="preload">` for critical fonts is recommended per `seo.md` Section 3.3)

**Fix:** Update `theme-color` to `#8B6F47`. Add preconnect for Supabase origin. Keep canonical as-is (domain TBD per `seo.md` Appendix B).

---

## Category 2: SEO P1 (Structured Data + Per-Route Meta)

### Gap 2.1: No JSON-LD Structured Data

**Current:** Zero `schema.org` markup anywhere in the codebase.

**Required by:** `seo.md` Sections 8.1-8.6 (SoftwareApplication, Organization, FAQPage, BreadcrumbList, HowTo, Article).

**Fix:** Create a `JsonLd` component in `src/shared/components/json-ld.tsx`. Implement `SoftwareApplication` + `Organization` schemas on the homepage (`Index.tsx`). Other schemas (FAQ, HowTo, Article) are for pages that don't exist yet -- skip for now.

### Gap 2.2: Homepage Not Using `Meta` Component

**Current:** `Index.tsx` has no `<Meta>` component. Relies entirely on `index.html` static meta tags.

**Required by:** `seo.md` Section 6.1 per-route meta mapping.

**Fix:** Add `<Meta>` to `Index.tsx` with proper title and description per `seo.md` Section 6.1: title="Sistem Hunian -- Aplikasi Manajemen Kos Cerdas", description per spec.

---

## Category 3: DSS UI Components (from `UIUX_Design_Documentation_SiHuni.md` Sections 15-19)

These are reusable DSS UI components defined in the design doc but **not yet created**.

### Gap 3.1: `ConfidenceBadge` Component

**Required by:** Sections 15.3, 15.4, 17.1, 18.2. Used across OCR results, AI recommendations, and risk dashboards.

**Fix:** Create `src/shared/components/dss/ConfidenceBadge.tsx` following the exact spec in Section 18.2.

### Gap 3.2: `RiskScoreIndicator` Component

**Required by:** Section 16.1. Color-coded 0-100 scale (Low/Medium/High/Critical).

**Fix:** Create `src/shared/components/dss/RiskScoreIndicator.tsx` following Section 16.1 spec.

### Gap 3.3: `ExtractedField` Component

**Required by:** Section 15.4. Shows OCR-extracted data with per-field confidence.

**Fix:** Create `src/shared/components/dss/ExtractedField.tsx` following Section 15.4 spec.

### Gap 3.4: `TierGatedFeature` Component

**Required by:** Section 19.1. Lock overlay for subscription-gated features.

**Fix:** Create `src/shared/components/dss/TierGatedFeature.tsx` following Section 19.1 spec.

### Gap 3.5: `RecommendationCard` Component

**Required by:** Section 17.1. AI advisor recommendation card with accept/reject/defer actions.

**Fix:** Create `src/shared/components/dss/RecommendationCard.tsx` following Section 17.1 spec.

---

## Category 4: Accessibility (from `UIUX_Design_Documentation_SiHuni.md` Section 9 + `.trae/skills/accessibility-compliance`)

### Gap 4.1: No `prefers-reduced-motion` Global CSS

**Current:** Only exists in the default `App.css` (Vite boilerplate). Not in `index.css`.

**Required by:** Section 14.4, accessibility-compliance skill.

**Fix:** Add `@media (prefers-reduced-motion: reduce)` rule in `index.css` to disable all animations.

### Gap 4.2: No Skip Links in Dashboard Layouts

**Current:** Skip links only exist in `AuthForm.tsx`. Dashboard layouts (where users spend most time) have none.

**Required by:** Section 9.3 (semantic HTML landmarks), Section 24.5 (`skip links` marked as needed), WCAG 2.1 AA (2.4.1).

**Fix:** Add skip-to-main-content link in `DashboardLayout.tsx` and `MobileLayout.tsx`.

---

## Implementation Plan (12 Edits)

| # | File | Action | Category |
|---|------|--------|----------|
| 1 | `src/shared/components/meta.tsx` | Add `noindex`, `canonical` props | SEO P0 |
| 2 | `src/shared/components/layouts/DashboardLayout.tsx` | Add `<Meta noindex />` + skip link | SEO P0 + A11y |
| 3 | `src/shared/components/layouts/MobileLayout.tsx` | Add `<Meta noindex />` + skip link | SEO P0 + A11y |
| 4 | `src/pages/Auth.tsx` | Add `<Meta noindex />` | SEO P0 |
| 5 | `public/robots.txt` | Add Disallow rules + Sitemap ref | SEO P0 |
| 6 | `public/sitemap.xml` | Create minimal sitemap | SEO P0 |
| 7 | `index.html` | Fix theme-color, add preconnect | SEO P0 |
| 8 | `src/shared/components/json-ld.tsx` | Create JsonLd component | SEO P1 |
| 9 | `src/pages/Index.tsx` | Add `<Meta>` + `<JsonLd>` for homepage | SEO P1 |
| 10 | `src/shared/components/dss/ConfidenceBadge.tsx` | Create component per UIUX spec 18.2 | DSS UI |
| 11 | `src/shared/components/dss/RiskScoreIndicator.tsx` | Create component per UIUX spec 16.1 | DSS UI |
| 12 | `src/shared/components/dss/ExtractedField.tsx` | Create component per UIUX spec 15.4 | DSS UI |
| 13 | `src/shared/components/dss/TierGatedFeature.tsx` | Create component per UIUX spec 19.1 | DSS UI |
| 14 | `src/shared/components/dss/RecommendationCard.tsx` | Create component per UIUX spec 17.1 | DSS UI |
| 15 | `src/shared/components/dss/index.ts` | Barrel export for all DSS components | DSS UI |
| 16 | `src/index.css` | Add `prefers-reduced-motion` rule | A11y |

## Technical Notes

- No database changes required
- All edits are additive (backward compatible)
- DSS components are created but not yet consumed -- they'll be integrated when DSS features are built (OCR UI, Risk Dashboard, AI Advisors)
- Homepage content remains in English for now -- Bahasa Indonesia localization of the landing page is a marketing/content task, not a code alignment task
- The `Meta` component uses `react-helmet-async` which is already installed and `HelmetProvider` already wraps the app
- Sitemap is minimal (homepage only) since comparison pages, tools, blog, and feature pages don't exist yet

