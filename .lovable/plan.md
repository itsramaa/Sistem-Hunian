
# Maximalisasi UI/UX Design Documentation v3.0 (DSS Edition)

## Masalah

Dokumen UI/UX saat ini (v1.0, 3059 baris) memiliki gap signifikan dengan implementasi aktual:

| Aspek | v1.0 (Sekarang) | Implementasi Aktual |
|-------|-----------------|---------------------|
| Component Library | Raw HTML/CSS examples (8 komponen) | shadcn/ui + Radix UI (54 komponen) |
| Styling | Vanilla CSS manual | Tailwind CSS + CSS Variables via `tailwind.config.ts` |
| Icon System | "Heroicons/Feather recommended" | Lucide React (sudah dipakai) |
| Layout | Generic sidebar layout | 4 portal layouts (Tenant, Merchant, Vendor, Admin) + Mobile Layout |
| Navigation | Hamburger menu manual | Role-based nav config, mobile bottom nav, collapsible sidebar |
| AI/DSS UI | Tidak ada | Floating AI button, chatbot dialog, DSS dashboard components |
| Dark Mode | `prefers-color-scheme` media query | `class`-based dark mode via Tailwind `darkMode: ["class"]` |
| State Management | Vanilla JS | React Context + Zustand (sidebar state) |
| Toast/Notifications | Custom CSS toast | Sonner library |
| Charts | Tidak ada | Recharts dengan 5 chart color tokens |

## Rencana Rewrite

Rewrite total menjadi **v3.0** yang 100% aligned dengan arsitektur aktual. Struktur baru:

### Daftar Isi Baru (24 Section)

1. Design Philosophy (dipertahankan + update DSS vision)
2. Typography System (dipertahankan, update ke Tailwind classes)
3. Color System (update ke HSL variables format aktual dari `index.css`)
4. Design Tokens (update ke Tailwind config format aktual)
5. Component Library - shadcn/ui (rewrite total: 54 komponen aktual)
6. Layout System - 4 Portals (baru: Tenant, Merchant, Vendor, Admin)
7. Navigation System (baru: role-based config, mobile bottom nav)
8. Spacing & Sizing (update ke Tailwind spacing scale)
9. Accessibility Guidelines (dipertahankan + ARIA patterns aktual)
10. Responsive Design (update: Tailwind breakpoints, mobile-first)
11. Dark Mode Implementation (rewrite: class-based, Zustand)
12. Design Patterns & Interactions (update: skeleton, empty states, loading)
13. Icon System - Lucide React (rewrite total)
14. Animation & Micro-interactions (update: Tailwind keyframes aktual)
15. **DSS: OCR Interface Patterns (BARU)**
16. **DSS: Risk & Analytics Dashboard (BARU)**
17. **DSS: AI Advisor UI Patterns (BARU)**
18. **DSS: Confidence Score Visualization (BARU)**
19. **DSS: Tier-Gated Feature UI (BARU)**
20. Floating AI Assistant (baru: FAB + chatbot dialog)
21. Form Patterns (baru: React Hook Form + Zod)
22. Data Table Patterns (update: TanStack-compatible)
23. Chart & Data Visualization (baru: Recharts patterns)
24. Implementation Checklist (update ke actual stack)

### Detail Perubahan per Section

**Section 1-4: Foundation**
- Update Design Vision: tambahkan DSS value ("Data-driven decisions, AI-augmented workflows")
- Update target users: 4 personas (Merchant 40-60yo, Tenant 20-40yo, Vendor 25-45yo, Admin 25-35yo)
- Color System: gunakan format HSL tanpa `hsl()` wrapper sesuai `index.css` aktual (e.g., `35 32% 41%`)
- Design Tokens: referensi langsung ke `tailwind.config.ts` values

**Section 5: Component Library (Rewrite Total)**
- Dokumentasikan 54 shadcn/ui components yang sudah terinstall
- Gunakan JSX/TSX examples bukan raw HTML
- Referensi import path aktual: `@/shared/components/ui/button`
- Tambahkan variant mapping ke Tailwind classes (bukan CSS manual)
- Contoh: Button menggunakan `class-variance-authority`, bukan `.btn-primary` CSS

**Section 6-7: Layout & Navigation (Baru)**
- Dokumentasikan `DashboardLayout.tsx` (desktop) dan `MobileLayout.tsx`
- Mapping dari `navigation-config.ts`: 4 role configs, brand identity per role
- Mobile bottom nav: 5 items untuk tenant, none untuk merchant/vendor/admin
- Sidebar: `sidebar.tsx` dari shadcn/ui, collapsible, dark brown theme

**Section 15: DSS OCR Interface Patterns (Baru)**
- Upload area: drag-and-drop image upload untuk KTP/bukti bayar
- Processing state: spinner + "Menganalisis dokumen..."
- Result display: extracted fields dengan confidence badges
  - High (>=0.85): `bg-success/10 text-success` -- auto-accepted
  - Medium (0.60-0.84): `bg-warning/10 text-warning` -- manual review
  - Low (0.40-0.59): `bg-destructive/10 text-destructive` -- re-upload required
- Side-by-side: original image vs extracted data
- Payment matching: tolerance indicator (plus/minus Rp 1,000)

**Section 16: DSS Risk & Analytics Dashboard (Baru)**
- Risk score gauge: 0-100 scale with color zones
  - 0-25: Green (`text-success`)
  - 26-50: Yellow (`text-warning`) 
  - 51-75: Orange (`text-warning` darker)
  - 76-100: Red (`text-destructive`)
- Revenue forecast chart: Recharts LineChart with prediction band
- Occupancy heatmap: grid visualization
- Trend indicators: arrow up/down with percentage change

**Section 17: DSS AI Advisor UI Patterns (Baru)**
- Recommendation card: title + reasoning + confidence + action buttons
- Status lifecycle badges: generated -> viewed -> accepted/rejected -> measured
- Advisor types: pricing, collection, maintenance priority, investment
- AI response streaming: typewriter effect in chatbot dialog

**Section 18: Confidence Score Visualization (Baru)**
- Progress bar variant: filled to confidence percentage
- Badge variant: color-coded label (High/Medium/Low)
- Tooltip: detailed breakdown on hover
- Table column: sortable confidence values

**Section 19: Tier-Gated Feature UI (Baru)**
- Lock overlay: blur + lock icon + "Upgrade to [Tier]" CTA
- Feature comparison table: checkmarks per tier
- Upgrade prompt: inline banner when accessing gated feature
- Badge: "Pro", "Business", "Enterprise" tier labels

**Section 20: Floating AI Assistant (Baru)**
- FloatingActionButton component: bottom-right, primary color, sparkle icon
- ChatbotDialog: sheet/drawer with message list, quick actions, streaming
- Role-specific: tenant (global), merchant (global), vendor (embedded in dashboard)
- Mobile: respects bottom nav spacing (bottom-20 positioning)

**Section 23: Chart & Data Visualization (Baru)**
- Recharts integration patterns
- 5 chart color tokens mapped to semantic meanings
- Responsive chart containers
- DSS-specific charts: risk distribution, revenue forecast, occupancy trends

### Skills yang Diterapkan

| Skill | Penerapan |
|-------|-----------|
| `ui-ux-designer` | Keseluruhan struktur, design principles, user flows |
| `design-system-patterns` | Token architecture, component taxonomy, variant system |
| `accessibility-compliance` | WCAG 2.1 AA, ARIA patterns, keyboard navigation |
| `responsive-design` | Breakpoint strategy, mobile-first, touch targets |
| `interaction-design` | Micro-interactions, state transitions, feedback loops |
| `visual-design-foundations` | Color theory, typography scale, spacing rhythm |
| `shadcn-ui` | Component API reference, variant mapping |
| `tailwind-css-patterns` | Utility classes, custom extensions, dark mode |
| `radix-ui-design-system` | Accessible primitives, composition patterns |
| `web-performance-optimization` | Animation performance, lazy loading UI |
| `frontend-design` | React component patterns, JSX examples |
| `stitch-ui-design` | Design token structure, systematic naming |
| `icon-design` | Lucide icon system, sizing conventions |
| `prompt-engineering-patterns` | AI chatbot UI, streaming response display |
| `startup-metrics-framework` | KPI dashboard layout, metric card design |
| `pricing-strategy` | Tier-gated UI, upgrade flow design |

### Estimasi

PRD UI/UX v3.0: ~3200-3500 baris (vs 3059 saat ini), tetapi dengan 100% konten yang selaras dengan implementasi aktual dan 10 section DSS baru.
