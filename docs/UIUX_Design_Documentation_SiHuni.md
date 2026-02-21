# UI/UX Design Documentation
## Sistem DSS Manajemen Kosan — "SiHuni"
**Version:** 3.0 (DSS Edition) | **Status:** Aligned with Implementation  
**Date:** 21 Februari 2026 | **Theme:** Warm, Earthy, Professional Property Management SaaS  
**Stack:** React 18 + Tailwind CSS + shadcn/ui + Radix UI + Lucide React + Recharts

---

## CROSS-REFERENCE

Dokumen ini merupakan bagian dari 9 dokumen teknis v3.0 SiHuni:

| # | Dokumen | Versi |
|---|---------|-------|
| 1 | `database-schema.md` | v3.0 — 72 tables, 215+ RLS policies |
| 2 | `api-specification.md` | v3.0 — 43 Edge Functions |
| 3 | `backend-architecture.md` | v3.0 — Lovable Cloud + Deno |
| 4 | `business-process.md` | v3.0 — 20+ workflows |
| 5 | `development-standards.md` | v3.0 — Coding standards |
| 6 | `testing-strategy.md` | v3.0 — Test patterns |
| 7 | `deployment-guide.md` | v3.0 — CI/CD |
| 8 | `PRD_DSS_Manajemen_Kosan_v2_Professional.md` | v3.0 — Product Requirements |
| 9 | **`UIUX_Design_Documentation_SiHuni.md`** | **v3.0 — This document** |

---

## TABLE OF CONTENTS

1. [Design Philosophy](#1-design-philosophy)
2. [Typography System](#2-typography-system)
3. [Color System](#3-color-system)
4. [Design Tokens](#4-design-tokens)
5. [Component Library — shadcn/ui](#5-component-library--shadcnui)
6. [Layout System — 4 Portals](#6-layout-system--4-portals)
7. [Navigation System](#7-navigation-system)
8. [Spacing & Sizing](#8-spacing--sizing)
9. [Accessibility Guidelines](#9-accessibility-guidelines)
10. [Responsive Design](#10-responsive-design)
11. [Dark Mode Implementation](#11-dark-mode-implementation)
12. [Design Patterns & Interactions](#12-design-patterns--interactions)
13. [Icon System — Lucide React](#13-icon-system--lucide-react)
14. [Animation & Micro-interactions](#14-animation--micro-interactions)
15. [DSS: OCR Interface Patterns](#15-dss-ocr-interface-patterns)
16. [DSS: Risk & Analytics Dashboard](#16-dss-risk--analytics-dashboard)
17. [DSS: AI Advisor UI Patterns](#17-dss-ai-advisor-ui-patterns)
18. [DSS: Confidence Score Visualization](#18-dss-confidence-score-visualization)
19. [DSS: Tier-Gated Feature UI](#19-dss-tier-gated-feature-ui)
20. [Floating AI Assistant](#20-floating-ai-assistant)
21. [Form Patterns](#21-form-patterns)
22. [Data Table Patterns](#22-data-table-patterns)
23. [Chart & Data Visualization](#23-chart--data-visualization)
24. [Implementation Checklist](#24-implementation-checklist)

---

## 1. DESIGN PHILOSOPHY

### 1.1 Brand Identity

**Brand Name:** SiHuni (Sistem Hunian / Housing System)

**Design Theme:** Warm, Earthy, Professional Property Management SaaS with AI-Augmented Decision Support

**Core Values:**
- **Trustworthy:** Data-driven, secure, transparent AI reasoning
- **Approachable:** Warm brown tones, friendly Bahasa Indonesia, intuitive interactions
- **Efficient:** Clean layouts, minimal cognitive load, quick actions, AI-assisted workflows
- **Accessible:** WCAG 2.1 AA compliant, inclusive design
- **Intelligent:** AI insights surfaced contextually, confidence scores visible, DSS recommendations actionable

### 1.2 Design Principles

```
┌──────────────────────────────────────────────────────────────┐
│ 1. CLARITY                                                   │
│    Information hierarchy clear; users understand at a glance │
│    → No jargon; labels explicit; error messages helpful      │
│                                                              │
│ 2. CONSISTENCY                                               │
│    Predictable patterns across all 4 portals                 │
│    → Same design tokens; consistent spacing; familiar layout │
│                                                              │
│ 3. EFFICIENCY                                                │
│    Minimize clicks & friction for common tasks               │
│    → Quick actions visible; smart defaults; batch operations  │
│                                                              │
│ 4. AFFORDANCE                                                │
│    UI elements signal their function (clickable, editable)   │
│    → shadcn/ui variants; hover states; Lucide icons          │
│                                                              │
│ 5. FEEDBACK                                                  │
│    System responds to user actions with clear indication     │
│    → Sonner toasts; skeleton loading; progress indicators    │
│                                                              │
│ 6. ACCESSIBILITY                                             │
│    Inclusive design for users of all abilities                │
│    → Color contrast; keyboard nav; Radix ARIA; focus rings   │
│                                                              │
│ 7. AI TRANSPARENCY (DSS)                                     │
│    AI decisions are explainable and confidence-scored         │
│    → Confidence badges; reasoning panels; human override     │
└──────────────────────────────────────────────────────────────┘
```

### 1.3 Design Vision

**Visual Style:** Modern, minimalist with warm earthy accents and AI-driven data visualization

**Inspiration:** Indonesian property/real estate design language (wood, earth tones, warm hospitality)

**Target Users (4 Personas):**

| Persona | Role | Age | Tech Literacy | Primary Portal |
|---------|------|-----|--------------|----------------|
| Pemilik Kos | Merchant | 40-60 yo | Moderate | Merchant Portal (sidebar) |
| Penghuni/Penyewa | Tenant | 20-40 yo | High | Tenant Portal (mobile-first, bottom nav) |
| Penyedia Jasa | Vendor | 25-45 yo | Moderate-High | Vendor Portal (sidebar) |
| Admin Platform | Admin | 25-35 yo | High | Admin Portal (sidebar) |

**DSS Design Vision:**
- Data-driven decisions surfaced through contextual AI recommendations
- Confidence scores visible on all AI-generated outputs
- Human-in-the-loop: all AI recommendations require explicit acceptance
- Progressive disclosure: summary first, details on demand

---

## 2. TYPOGRAPHY SYSTEM

### 2.1 Font Family Stack

Defined in `tailwind.config.ts`:

```typescript
fontFamily: {
  sans: ["Inter", "system-ui", "sans-serif"],      // Body text
  display: ["Plus Jakarta Sans", "system-ui", "sans-serif"], // Headings
}
```

Loaded via Google Fonts in `index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
```

**Base style** applied globally in `index.css`:

```css
body {
  @apply bg-background text-foreground font-sans antialiased;
}

h1, h2, h3, h4, h5, h6 {
  @apply font-display font-semibold tracking-tight;
}
```

### 2.2 Typographic Scale (Tailwind Classes)

**Headings (font-display = Plus Jakarta Sans):**

| Level | Tailwind Class | Size | Weight | Usage |
|-------|---------------|------|--------|-------|
| H1 | `text-4xl font-bold` | 36px | 700 | Page titles |
| H2 | `text-3xl font-bold` | 30px | 700 | Section headers |
| H3 | `text-2xl font-semibold` | 24px | 600 | Subsection headers |
| H4 | `text-xl font-semibold` | 20px | 600 | Card titles |
| H5 | `text-base font-semibold` | 16px | 600 | Form section labels |
| H6 | `text-sm font-semibold` | 14px | 600 | Minor labels |

**Body Text (font-sans = Inter):**

| Type | Tailwind Class | Size | Usage |
|------|---------------|------|-------|
| Body Large | `text-base` | 16px | Main body, descriptions |
| Body Default | `text-sm` | 14px | Standard body, form inputs |
| Body Small | `text-xs` | 12px | Helper text, captions |
| Caption | `text-[11px]` | 11px | Timestamps, footnotes |

### 2.3 Text Utilities

```tsx
// Truncation — built into Tailwind
<p className="truncate">Single line truncation...</p>
<p className="line-clamp-2">Multi-line (2 lines)...</p>
<p className="line-clamp-3">Multi-line (3 lines)...</p>

// Text balance — custom utility in index.css
<h1 className="text-balance">Balanced heading text</h1>
```

---

## 3. COLOR SYSTEM

### 3.1 CSS Variable Format

**IMPORTANT:** SiHuni uses HSL values **without** the `hsl()` wrapper in CSS variables. The `hsl()` is applied in `tailwind.config.ts` via `hsl(var(--token))`.

```css
/* ✅ Correct — raw HSL values */
--primary: 35 32% 41%;

/* ❌ Wrong — do NOT wrap in hsl() */
--primary: hsl(35, 32%, 41%);
```

### 3.2 Light Mode Palette (`:root` in `index.css`)

#### Primary & Secondary

| Token | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--primary` | `35 32% 41%` | #8B6F47 | CTA buttons, links, focus rings |
| `--primary-foreground` | `0 0% 100%` | #FFFFFF | Text on primary |
| `--secondary` | `37 32% 50%` | #A68B5B | Secondary buttons, hover |
| `--secondary-foreground` | `0 0% 100%` | #FFFFFF | Text on secondary |
| `--accent` | `48 89% 60%` | #F4D03F | Highlights, badges, price displays |
| `--accent-foreground` | `35 32% 15%` | #2E2618 | Dark text on accent |

#### Backgrounds & Surfaces

| Token | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--background` | `42 100% 96%` | #FFF8E7 | Page background (krem) |
| `--foreground` | `35 32% 20%` | #453A2B | Main text color |
| `--card` | `0 0% 100%` | #FFFFFF | Card background |
| `--card-foreground` | `35 32% 20%` | #453A2B | Card text |
| `--popover` | `0 0% 100%` | #FFFFFF | Popover background |
| `--popover-foreground` | `35 32% 20%` | #453A2B | Popover text |
| `--muted` | `42 40% 93%` | #F0E8D8 | Disabled state, inactive tabs |
| `--muted-foreground` | `37 25% 45%` | #8F7A56 | Subtle text, help text |

#### Semantic Colors

| Token | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--success` | `142 71% 45%` | #22C55E | Positive states, checkmarks |
| `--success-foreground` | `0 0% 100%` | #FFFFFF | Text on success |
| `--warning` | `38 92% 50%` | #F59E0B | Caution messages, warnings |
| `--warning-foreground` | `0 0% 100%` | #FFFFFF | Text on warning |
| `--info` | `217 91% 60%` | #3B82F6 | Information hints |
| `--info-foreground` | `0 0% 100%` | #FFFFFF | Text on info |
| `--destructive` | `0 84% 60%` | #EF4444 | Errors, delete actions |
| `--destructive-foreground` | `0 0% 100%` | #FFFFFF | Text on destructive |

#### Borders & Inputs

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--border` | `37 30% 85%` | Light brown border |
| `--input` | `37 30% 85%` | Input border/bg |
| `--ring` | `35 32% 41%` | Focus ring (= primary) |
| `--radius` | `0.5rem` (8px) | Default border radius |

#### Sidebar (Dark Brown Theme)

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--sidebar-background` | `35 32% 20%` | Dark brown sidebar bg |
| `--sidebar-foreground` | `42 100% 96%` | Cream text |
| `--sidebar-primary` | `48 89% 60%` | Gold active/hover |
| `--sidebar-primary-foreground` | `35 32% 15%` | Dark text on gold |
| `--sidebar-accent` | `35 32% 28%` | Medium brown hover |
| `--sidebar-accent-foreground` | `42 100% 96%` | Cream text |
| `--sidebar-border` | `35 32% 28%` | Border in sidebar |
| `--sidebar-ring` | `48 89% 60%` | Focus ring in sidebar |

#### Chart Colors (5 Tokens)

| Token | HSL Value | Semantic Meaning |
|-------|-----------|-----------------|
| `--chart-1` | `35 32% 41%` | Primary data series (brown) |
| `--chart-2` | `48 89% 60%` | Secondary comparison (gold) |
| `--chart-3` | `142 71% 45%` | Growth/positive (green) |
| `--chart-4` | `37 32% 50%` | Tertiary data (medium brown) |
| `--chart-5` | `38 92% 50%` | Warnings/concerns (amber) |

### 3.3 Dark Mode Palette (`.dark` class in `index.css`)

```css
.dark {
  --primary: 37 32% 55%;           /* Lighter brown */
  --primary-foreground: 0 0% 100%;
  --secondary: 35 25% 25%;
  --secondary-foreground: 42 100% 96%;
  --background: 35 32% 8%;         /* Very dark brown */
  --foreground: 42 100% 96%;       /* Light cream */
  --card: 35 32% 12%;
  --card-foreground: 42 100% 96%;
  --popover: 35 32% 12%;
  --popover-foreground: 42 100% 96%;
  --muted: 35 25% 18%;
  --muted-foreground: 37 25% 65%;
  --accent: 48 89% 50%;            /* Brighter gold */
  --accent-foreground: 35 32% 10%;
  --destructive: 0 63% 40%;
  --destructive-foreground: 0 0% 100%;
  --success: 142 71% 35%;
  --success-foreground: 0 0% 100%;
  --warning: 38 92% 40%;
  --warning-foreground: 0 0% 100%;
  --info: 217 91% 50%;
  --info-foreground: 0 0% 100%;
  --border: 35 25% 20%;
  --input: 35 25% 20%;
  --ring: 37 32% 55%;
  --sidebar-background: 35 32% 6%;
  --sidebar-foreground: 42 100% 96%;
  --sidebar-primary: 48 89% 50%;
  --sidebar-primary-foreground: 35 32% 10%;
  --sidebar-accent: 35 25% 15%;
  --sidebar-accent-foreground: 42 100% 96%;
  --sidebar-border: 35 25% 15%;
  --sidebar-ring: 48 89% 50%;
}
```

### 3.4 Color Contrast Compliance

**WCAG 2.1 AA Minimum:** 4.5:1 for normal text, 3:1 for large text

| Foreground | Background | Ratio | Status |
|-----------|-----------|-------|--------|
| #453A2B (Foreground) | #FFF8E7 (Background) | 8.2:1 | ✅ AAA |
| #FFFFFF (White) | #8B6F47 (Primary) | 4.8:1 | ✅ AA |
| #FFFFFF (White) | #A68B5B (Secondary) | 4.5:1 | ✅ AA |
| #1C1710 (Dark text) | #F4D03F (Accent) | 11.2:1 | ✅ AAA |
| #FFF8E7 (Light text) | #453A2B (Sidebar bg) | 8.2:1 | ✅ AAA |

### 3.5 Custom Utility Gradients (in `index.css`)

```css
.gradient-primary {
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(187 73% 35%) 100%);
}

.gradient-accent {
  background: linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(25 95% 45%) 100%);
}

.glass {
  @apply bg-background/80 backdrop-blur-sm;
}
```

---

## 4. DESIGN TOKENS

### 4.1 Token Architecture

All design tokens are defined in TWO authoritative files:

1. **`src/index.css`** — CSS custom properties (colors, radius)
2. **`tailwind.config.ts`** — Extended Tailwind config (fonts, shadows, keyframes, colors mapping)

Components use Tailwind utility classes referencing these tokens. **Never hardcode color values in components.**

```tsx
// ✅ Correct — uses design token
<div className="bg-primary text-primary-foreground">

// ❌ Wrong — hardcoded color
<div className="bg-[#8B6F47] text-white">
```

### 4.2 Border Radius (from `index.css`)

```css
--radius: 0.5rem;  /* 8px base */
```

Extended in `tailwind.config.ts`:

```typescript
borderRadius: {
  lg: "var(--radius)",           // 8px — cards, dialogs
  md: "calc(var(--radius) - 2px)", // 6px — buttons, inputs
  sm: "calc(var(--radius) - 4px)", // 4px — badges, small elements
}
```

### 4.3 Shadow System (from `tailwind.config.ts`)

```typescript
boxShadow: {
  card: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  elevated: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
}
```

Usage:

| Element | Shadow Class | When |
|---------|-------------|------|
| Card (rest) | `shadow-card` | Default card state |
| Card (hover) | `shadow-card-hover` | On hover interaction |
| Modal/Dialog | `shadow-elevated` | Elevated components |
| FAB | `shadow-lg` | Floating action button |

### 4.4 Keyframe Animations (from `tailwind.config.ts`)

```typescript
keyframes: {
  "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
  "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
  "fade-in":        { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
  "slide-in-right": { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
  "pulse-subtle":   { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.8" } },
},
animation: {
  "accordion-down": "accordion-down 0.2s ease-out",
  "accordion-up":   "accordion-up 0.2s ease-out",
  "fade-in":        "fade-in 0.3s ease-out",
  "slide-in-right": "slide-in-right 0.3s ease-out",
  "pulse-subtle":   "pulse-subtle 2s ease-in-out infinite",
}
```

---

## 5. COMPONENT LIBRARY — shadcn/ui

### 5.1 Overview

SiHuni uses **54 shadcn/ui components** built on Radix UI primitives. All components are located in `src/shared/components/ui/` and use `class-variance-authority` (CVA) for variant management.

**Import pattern:**

```tsx
import { Button } from "@/shared/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
```

### 5.2 Component Inventory

| Category | Components | Count |
|----------|-----------|-------|
| **Layout** | Card, Separator, Aspect Ratio, Resizable, Scroll Area | 5 |
| **Navigation** | Breadcrumb, Navigation Menu, Pagination, Tabs, Sidebar | 5 |
| **Data Input** | Button, Input, Textarea, Select, Checkbox, Radio Group, Switch, Slider, Toggle, Toggle Group, Calendar, Date Range Picker, Input OTP, Form, Label | 15 |
| **Data Display** | Table, Badge, Avatar, Hover Card, Chart, Progress, Skeleton, Skeletons | 8 |
| **Feedback** | Alert, Alert Dialog, Dialog, Drawer, Sheet, Toast, Toaster, Sonner, Tooltip, Popover | 10 |
| **Overlay** | Dropdown Menu, Context Menu, Menubar, Command, Collapsible, Accordion, Carousel | 7 |
| **Custom** | PDFDownloadProgress, PhotoUploadProgress, PullToRefresh | 3 |
| **Hooks** | use-toast | 1 |
| **Total** | | **54** |

### 5.3 Button Component (CVA-based)

```tsx
import { Button } from "@/shared/components/ui/button";
import { Plus, Trash2, Loader2 } from "lucide-react";

// Variants
<Button variant="default">Simpan Harga</Button>        {/* Primary brown */}
<Button variant="secondary">Batalkan</Button>           {/* Secondary */}
<Button variant="destructive">Hapus Kamar</Button>      {/* Red */}
<Button variant="outline">Pelajari Lebih Lanjut</Button>{/* Bordered */}
<Button variant="ghost">Menu Item</Button>              {/* Minimal */}
<Button variant="link">Lihat Detail</Button>            {/* Text link */}

// Sizes
<Button size="sm">Small</Button>     {/* h-9 px-3 */}
<Button size="default">Default</Button> {/* h-10 px-4 py-2 */}
<Button size="lg">Large</Button>     {/* h-11 px-8 */}
<Button size="icon">              {/* h-10 w-10 */}
  <Plus className="h-4 w-4" />
</Button>

// With icon
<Button><Plus className="mr-2 h-4 w-4" /> Upload Dokumen</Button>

// Loading state
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Memproses...
</Button>

// Full width
<Button className="w-full">Submit</Button>
```

### 5.4 Card Component

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";

<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Kamar 102</CardTitle>
      <Badge variant="default" className="bg-success/10 text-success">Terisi</Badge>
    </div>
    <CardDescription>Lantai 1, luas 20 m², AC + WiFi</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-bold">Rp 1.500.000</p>
    <p className="text-sm text-muted-foreground">/bulan</p>
  </CardContent>
  <CardFooter className="gap-2">
    <Button size="sm">Edit</Button>
    <Button variant="outline" size="sm">Detail</Button>
  </CardFooter>
</Card>
```

### 5.5 Badge Component

```tsx
import { Badge } from "@/shared/components/ui/badge";

// Built-in variants
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Overdue</Badge>
<Badge variant="outline">Draft</Badge>

// Semantic status badges (custom classes using design tokens)
<Badge className="bg-success/10 text-success border-success/20">Terisi</Badge>
<Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>
<Badge className="bg-destructive/10 text-destructive border-destructive/20">Overdue</Badge>
<Badge className="bg-info/10 text-info border-info/20">Info</Badge>
```

### 5.6 Dialog & Alert Dialog

```tsx
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger,
} from "@/shared/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Update Harga</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Update Harga Kamar</DialogTitle>
      <DialogDescription>Masukkan harga baru untuk kamar ini.</DialogDescription>
    </DialogHeader>
    {/* Form content */}
    <DialogFooter>
      <Button variant="outline">Batalkan</Button>
      <Button>Simpan Perubahan</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 5.7 Toast Notifications (Sonner)

```tsx
import { toast } from "sonner";

// Success
toast.success("Harga berhasil diperbarui");

// Error
toast.error("Gagal menyimpan data", {
  description: "Pastikan koneksi internet Anda stabil.",
});

// With action
toast("Kontrak akan berakhir", {
  description: "Kontrak Kamar 102 berakhir dalam 30 hari.",
  action: {
    label: "Perpanjang",
    onClick: () => handleRenew(),
  },
});
```

### 5.8 Form Components

```tsx
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";

// Text Input
<div className="space-y-2">
  <Label htmlFor="name">Nama Penyewa</Label>
  <Input id="name" placeholder="Ahmad Rizki" />
  <p className="text-xs text-muted-foreground">Masukkan nama lengkap sesuai KTP</p>
</div>

// Select
<Select>
  <SelectTrigger><SelectValue placeholder="Pilih Status" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="occupied">Terisi</SelectItem>
    <SelectItem value="vacant">Kosong</SelectItem>
    <SelectItem value="maintenance">Maintenance</SelectItem>
  </SelectContent>
</Select>

// Checkbox
<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Saya setuju dengan syarat & ketentuan</Label>
</div>

// Switch
<div className="flex items-center space-x-2">
  <Switch id="notifications" />
  <Label htmlFor="notifications">Aktifkan Notifikasi</Label>
</div>
```

### 5.9 Table Component

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nama</TableHead>
      <TableHead>Kamar</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Harga</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-medium">Ahmad Rizki</TableCell>
      <TableCell>102</TableCell>
      <TableCell>
        <Badge className="bg-success/10 text-success">Aktif</Badge>
      </TableCell>
      <TableCell className="text-right">Rp 1.500.000</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### 5.10 Custom Components

| Component | File | Purpose |
|-----------|------|---------|
| `PDFDownloadProgress` | `PDFDownloadProgress.tsx` | Progress indicator for PDF generation/download |
| `PhotoUploadProgress` | `PhotoUploadProgress.tsx` | Progress indicator for photo uploads with preview |
| `PullToRefresh` | `PullToRefresh.tsx` | Mobile pull-to-refresh gesture handler |

---

## 6. LAYOUT SYSTEM — 4 PORTALS

### 6.1 Architecture Overview

SiHuni has 2 layout components serving 4 role-based portals:

```
┌──────────────────────────────────────────────────────┐
│ DashboardLayout.tsx (Entry Point)                    │
│   ├─ isMobile? → MobileLayout.tsx                    │
│   └─ isDesktop? → SidebarProvider + AppSidebar       │
├──────────────────────────────────────────────────────┤
│ Roles:                                               │
│   tenant   → Mobile: Bottom Nav (5 items) + Header   │
│              Desktop: Sidebar + Breadcrumb           │
│   merchant → Mobile: Header only (no bottom nav)     │
│              Desktop: Sidebar + Breadcrumb           │
│   vendor   → Mobile: Header only                     │
│              Desktop: Sidebar + Breadcrumb           │
│   admin    → Mobile: Header only                     │
│              Desktop: Sidebar + Breadcrumb           │
└──────────────────────────────────────────────────────┘
```

### 6.2 Desktop Layout (Sidebar + SidebarInset)

Uses shadcn/ui `SidebarProvider` pattern:

```tsx
<SidebarProvider>
  <AppSidebar role={role} />
  <SidebarInset>
    <header className="flex h-16 shrink-0 items-center gap-2">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>...</Breadcrumb>
      <div className="ml-auto">
        <NotificationsDropdown />
      </div>
    </header>
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {children}
    </div>
  </SidebarInset>
</SidebarProvider>
```

**Sidebar features:**
- Collapsible (icon-only mode)
- Dark brown theme (`--sidebar-background: 35 32% 20%`)
- Gold active state (`--sidebar-primary: 48 89% 60%`)
- Role-specific brand identity (name, subtitle, icon, colors)
- Grouped navigation sections

### 6.3 Mobile Layout

```tsx
<div className="min-h-screen bg-background flex flex-col">
  <MobileHeader role={role} title={title} showBack={showBack} />
  <main className={cn("flex-1 px-4 pt-4 overflow-auto", hasBottomNav ? "pb-20" : "pb-4")}>
    {children}
  </main>
  {hasBottomNav && <MobileBottomNav items={bottomNav} basePath={basePath} />}
  {showAIButton && <FloatingActionButton type="ai" ... />}
  {showCreateButton && <FloatingActionButton type="create" ... />}
  <ChatbotDialog isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
</div>
```

**Mobile Header features:**
- Sticky top with `z-40`
- Breadcrumb-style title (Dashboard > Page Name)
- Back button auto-detection from nav config
- Notifications dropdown
- Settings button on profile page

### 6.4 Portal Brand Identity

Defined in `navigation-config.ts`:

| Role | Name | Subtitle | Icon | Accent |
|------|------|----------|------|--------|
| tenant | SiHuni | Tenant Portal | Command | `bg-sidebar-primary` |
| merchant | SiHuni | Merchant Portal | Building2 | `gradient-primary` |
| vendor | SiHuni | Vendor Portal | Wrench | `bg-success` |
| admin | SiHuni | Admin Panel | Building2 | `gradient-primary` |

---

## 7. NAVIGATION SYSTEM

### 7.1 Role-Based Navigation Config

All navigation is centralized in `src/shared/components/layouts/navigation-config.ts`:

```typescript
type UserRole = "tenant" | "merchant" | "vendor" | "admin";

interface RoleConfig {
  brand: { name: string; subtitle: string; icon: LucideIcon; iconBgClass: string };
  mainNav: NavGroup[];           // Sidebar groups
  bottomNav?: NavItem[];         // Mobile bottom nav (tenant only)
  hasBottomNav: boolean;
  hasFloatingAI: boolean;
  globalFloatingAI?: boolean;    // AI FAB on all pages
  mainPagesWithAI?: string[];    // AI FAB on specific pages only
}
```

### 7.2 Tenant Navigation (10 sidebar items + 5 bottom nav)

**Sidebar Groups:**
```
Menu Utama:
  Dashboard, Pembayaran, Tagihan, Kontrak, Marketplace

Aktivitas:
  Maintenance, Pesanan, Forum, Referral
```

**Mobile Bottom Nav (5 items):**

| Icon | Label | Path |
|------|-------|------|
| LayoutDashboard | Beranda | `/tenant` |
| Wallet | Bayar | `/tenant/payments` |
| MessageSquare | Forum | `/tenant/forum` |
| ShoppingBag | Pesanan | `/tenant/orders` |
| User | Profil | `/tenant/profile` |

### 7.3 Merchant Navigation (10 items)

```
Dashboard, Properties, Units, Tenants, Contracts,
Invoices, Payments, Maintenance, Move-Outs, Reports
```

### 7.4 Vendor Navigation (7 items)

```
Dashboard, Products, Orders, Jobs, Earnings, Analytics, Referrals
```

### 7.5 Admin Navigation (17 items)

```
Dashboard, Merchants, Properties, Vendors, Tenants, Admin Users,
Escrow, Subscriptions, Disputes, Analytics, Platform Config,
Referrals, Chatbot KB, Orders, Audit Logs, Forum Mod, Admin 2FA, Settings
```

### 7.6 Active State Detection

```typescript
function isPathActive(path: string, currentPath: string, basePath: string): boolean {
  if (path === basePath) return currentPath === basePath;
  return currentPath.startsWith(path);
}
```

Mobile bottom nav: `text-primary` for active, `text-muted-foreground` for inactive.

---

## 8. SPACING & SIZING

### 8.1 Tailwind Spacing Scale

SiHuni uses Tailwind's default 4px-based spacing scale:

| Class | Value | Usage |
|-------|-------|-------|
| `gap-1`, `p-1` | 4px | Micro spacing (icon margins) |
| `gap-2`, `p-2` | 8px | Small gaps (list items) |
| `gap-3`, `p-3` | 12px | Component inner padding |
| `gap-4`, `p-4` | 16px | **Base content padding** |
| `gap-5`, `p-5` | 20px | Card padding |
| `gap-6`, `p-6` | 24px | Section spacing |
| `gap-8`, `p-8` | 32px | Large section spacing |

### 8.2 Component Sizing

**Touch Target Minimum:** 44px (Mobile), 40px (Desktop)

| Element | Tailwind Classes | Min Height |
|---------|-----------------|-----------|
| Button SM | `h-9 px-3` | 36px |
| Button Default | `h-10 px-4 py-2` | 40px |
| Button LG | `h-11 px-8` | 44px |
| Button Icon | `h-10 w-10` | 40px |
| Input | `h-10 px-3 py-2` | 40px |
| Mobile Bottom Nav | `h-16` | 64px |
| Mobile Header | `h-14` | 56px |
| Desktop Header | `h-16` | 64px |

### 8.3 Icon Sizing Convention

| Context | Lucide Size | Tailwind Class |
|---------|------------|---------------|
| Inside buttons/inputs | 16px | `h-4 w-4` |
| Standalone small | 20px | `h-5 w-5` |
| Navigation/actions | 20-24px | `h-5 w-5` to `h-6 w-6` |
| Hero/feature | 32px+ | `h-8 w-8` |

---

## 9. ACCESSIBILITY GUIDELINES

### 9.1 WCAG 2.1 AA Compliance

SiHuni targets **WCAG 2.1 Level AA** for all portals.

#### Color Contrast

- Normal text: ≥ 4.5:1 ratio
- Large text (18pt+): ≥ 3:1 ratio
- UI components (borders, icons): ≥ 3:1 ratio

#### Built-in via Radix UI

All shadcn/ui components use Radix UI primitives which provide:

- **Focus management** — Automatic focus trapping in dialogs/modals
- **Keyboard navigation** — Arrow keys in menus, Escape to close
- **ARIA attributes** — `role`, `aria-expanded`, `aria-selected`, etc.
- **Screen reader** — Proper announcement of state changes

#### Focus Ring

Applied globally via Tailwind:

```css
/* Default focus-visible ring */
button:focus-visible,
input:focus-visible,
a:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

### 9.2 Keyboard Navigation Patterns

| Pattern | Keys | Component |
|---------|------|-----------|
| Menu navigation | `↑↓` arrows | DropdownMenu, Select, Command |
| Tab switching | `←→` arrows | Tabs |
| Modal close | `Escape` | Dialog, Sheet, Drawer |
| Accordion toggle | `Enter/Space` | Accordion |
| Checkbox toggle | `Space` | Checkbox |
| Submit form | `Enter` | Form |

### 9.3 Semantic HTML

```tsx
// Layout landmarks
<header role="banner">        {/* MobileHeader / Desktop header */}
<nav role="navigation">        {/* Sidebar / Bottom nav */}
<main role="main">             {/* Main content area */}
<aside role="complementary">   {/* Chatbot dialog */}

// Proper heading hierarchy
<h1>  {/* One per page — page title */}
<h2>  {/* Section headers */}
<h3>  {/* Card titles */}
```

### 9.4 Accessibility Checklist

```
☐ Color contrast ≥ 4.5:1 for all text on background
☐ Focus indicators visible on all interactive elements
☐ All images have descriptive alt text
☐ All form inputs have associated <Label> components
☐ Error messages linked to inputs via aria-describedby
☐ Dialogs have proper focus trapping (Radix built-in)
☐ Touch targets ≥ 44px on mobile
☐ Content readable at 200% zoom
☐ No auto-playing animations
☐ Skip links for keyboard navigation
```

---

## 10. RESPONSIVE DESIGN

### 10.1 Breakpoints (Tailwind Default)

| Prefix | Min Width | Device |
|--------|----------|--------|
| (none) | 0px | Mobile (default) |
| `sm:` | 640px | Landscape phone |
| `md:` | 768px | Tablet — **layout switch point** |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Large desktop |
| `2xl:` | 1400px | Container max-width |

### 10.2 Mobile Detection

SiHuni uses a custom hook for layout switching:

```typescript
// src/shared/hooks/use-mobile.tsx
function useIsMobile(): boolean {
  // Returns true when viewport < 768px (md breakpoint)
}
```

**Layout behavior:**
- `< md (768px)`: `MobileLayout` — full-width, bottom nav (tenant), sticky header
- `≥ md (768px)`: `DashboardLayout` — sidebar + inset content

### 10.3 Mobile-Specific CSS

From `index.css`:

```css
/* Safe areas for mobile devices (notch, home indicator) */
.safe-area-top {
  padding-top: env(safe-area-inset-top, 0px);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.pb-safe {
  padding-bottom: max(env(safe-area-inset-bottom, 0px), 1rem);
}

/* Smooth scrolling & overscroll */
html {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

body {
  overscroll-behavior-y: contain;
}

/* Touch optimizations */
@media (hover: none) and (pointer: coarse) {
  button, a, [role="button"] {
    -webkit-tap-highlight-color: transparent;
  }
}
```

### 10.4 Responsive Grid Patterns

```tsx
// KPI cards: 1 col mobile, 2 col tablet, 4 col desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <Card>...</Card>
</div>

// Content + sidebar: stacked mobile, side-by-side desktop
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">{/* Main content */}</div>
  <div>{/* Sidebar/filters */}</div>
</div>
```

---

## 11. DARK MODE IMPLEMENTATION

### 11.1 Technical Approach

SiHuni uses **class-based dark mode** via Tailwind:

```typescript
// tailwind.config.ts
darkMode: ["class"],
```

The `dark` class is toggled on the `<html>` element. Dark mode preference is persisted using **Zustand** store with `localStorage`.

### 11.2 Color Switching

All components use semantic tokens that automatically adapt:

```tsx
// This works in both light and dark mode automatically
<div className="bg-background text-foreground">
  <Card>
    <CardContent className="text-muted-foreground">
      Colors switch based on .dark class
    </CardContent>
  </Card>
</div>
```

### 11.3 Special Dark Mode Considerations

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Page bg | Cream (#FFF8E7) | Very dark brown (#1C1710) |
| Cards | White (#FFFFFF) | Dark brown (#2A2219) |
| Sidebar | Dark brown bg | Even darker bg |
| Charts | Standard palette | Desaturated for readability |
| Success green | `142 71% 45%` | `142 71% 35%` (darkened) |
| Destructive | `0 84% 60%` | `0 63% 40%` (darkened) |

---

## 12. DESIGN PATTERNS & INTERACTIONS

### 12.1 Loading States — Skeleton

```tsx
import { Skeleton } from "@/shared/components/ui/skeleton";

// Card skeleton
<Card>
  <CardHeader>
    <Skeleton className="h-5 w-[200px]" />
    <Skeleton className="h-4 w-[300px]" />
  </CardHeader>
  <CardContent className="space-y-3">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-[80%]" />
  </CardContent>
</Card>
```

Custom skeleton variants in `skeletons.tsx` for page-level loading.

### 12.2 Empty States

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
  <h3 className="text-lg font-semibold mb-2">Belum ada data</h3>
  <p className="text-sm text-muted-foreground mb-6 max-w-sm">
    Mulai dengan menambahkan properti pertama Anda.
  </p>
  <Button>
    <Plus className="mr-2 h-4 w-4" />
    Tambah Properti
  </Button>
</div>
```

### 12.3 Confirmation Dialog

```tsx
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm">Hapus</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Yakin hapus kamar ini?</AlertDialogTitle>
      <AlertDialogDescription>
        Tindakan ini tidak dapat dibatalkan. Semua data terkait akan dihapus.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Batalkan</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive text-destructive-foreground">
        Hapus
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 12.4 Search & Filter Pattern

```tsx
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Search } from "lucide-react";

<div className="flex flex-col sm:flex-row gap-4 mb-6">
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input placeholder="Cari nama penyewa..." className="pl-9" />
  </div>
  <div className="flex gap-2">
    <Button variant={filter === "all" ? "default" : "outline"} size="sm">Semua</Button>
    <Button variant={filter === "active" ? "default" : "outline"} size="sm">Aktif</Button>
    <Button variant={filter === "overdue" ? "default" : "outline"} size="sm">Tertunda</Button>
  </div>
</div>
```

---

## 13. ICON SYSTEM — Lucide React

### 13.1 Library

SiHuni uses **Lucide React** (`lucide-react@^0.462.0`) — a maintained fork of Feather Icons with 1,400+ icons.

```tsx
import { Home, Users, Wallet, Settings, Bell, Search } from "lucide-react";
```

### 13.2 Sizing Convention

| Context | Class | Size |
|---------|-------|------|
| Button icon (with text) | `h-4 w-4` | 16px |
| Navigation icon | `h-5 w-5` | 20px |
| Standalone action | `h-5 w-5` | 20px |
| Feature/hero icon | `h-6 w-6` to `h-8 w-8` | 24-32px |
| Empty state illustration | `h-12 w-12` | 48px |

### 13.3 Navigation Icons Mapping

| Area | Icons Used |
|------|-----------|
| Dashboard | `LayoutDashboard` |
| Properties | `Building2`, `Home` |
| Tenants | `Users`, `User` |
| Payments | `Wallet`, `CreditCard` |
| Contracts | `FileText`, `ClipboardList` |
| Maintenance | `Wrench` |
| Analytics | `BarChart3` |
| Settings | `Settings` |
| Notifications | `Bell` |
| Chat/AI | `MessageCircle`, `MessageSquare` |
| Actions | `Plus`, `Trash2`, `Edit`, `ArrowLeft` |
| Status | `AlertTriangle`, `Shield`, `Gift` |
| Commerce | `Store`, `ShoppingBag`, `ShoppingCart`, `Package` |

---

## 14. ANIMATION & MICRO-INTERACTIONS

### 14.1 Tailwind Animations (from config)

| Animation | Duration | Usage |
|-----------|----------|-------|
| `animate-fade-in` | 300ms ease-out | Page content entrance |
| `animate-slide-in-right` | 300ms ease-out | Sheet/drawer entrance |
| `animate-pulse-subtle` | 2s infinite | Subtle attention indicator |
| `animate-accordion-down` | 200ms ease-out | Accordion expand |
| `animate-accordion-up` | 200ms ease-out | Accordion collapse |

### 14.2 Interaction Patterns

```tsx
// Card hover effect
<Card className="transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer">

// Button press feedback
<Button className="active:scale-[0.98] transition-transform">

// Link underline animation (built into Tailwind)
<a className="underline-offset-4 hover:underline transition-all">
```

### 14.3 Loading Spinner

```tsx
import { Loader2 } from "lucide-react";

<Loader2 className="h-6 w-6 animate-spin text-primary" />
```

### 14.4 Performance Guidelines

- Use `transform` and `opacity` for animations (GPU-accelerated)
- Prefer Tailwind `transition-*` over CSS `@keyframes` for simple interactions
- Keep animations ≤ 300ms for UI responsiveness
- Use `will-change` sparingly — only for known animation targets
- Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 15. DSS: OCR INTERFACE PATTERNS

### 15.1 Document Upload Area

```tsx
// Drag-and-drop upload zone
<div className="border-2 border-dashed border-border rounded-lg p-8 text-center
                hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer">
  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
  <p className="text-sm font-medium">Seret foto KTP ke sini</p>
  <p className="text-xs text-muted-foreground mt-1">
    atau klik untuk memilih file (JPG, PNG, max 5MB)
  </p>
</div>
```

### 15.2 Processing State

```tsx
<div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
  <Loader2 className="h-5 w-5 animate-spin text-primary" />
  <div>
    <p className="text-sm font-medium">Menganalisis dokumen...</p>
    <p className="text-xs text-muted-foreground">
      Gemini Vision sedang mengekstrak data dari foto KTP
    </p>
  </div>
</div>
```

### 15.3 OCR Result Display

Side-by-side layout: original image + extracted data with confidence badges.

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Left: Original Document */}
  <Card>
    <CardHeader><CardTitle className="text-base">Dokumen Asli</CardTitle></CardHeader>
    <CardContent>
      <img src={imageUrl} alt="KTP" className="rounded-lg w-full object-contain" />
    </CardContent>
  </Card>

  {/* Right: Extracted Data */}
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Data Terekstrak</CardTitle>
      <ConfidenceBadge level="high" score={0.92} />
    </CardHeader>
    <CardContent className="space-y-4">
      <ExtractedField label="NIK" value="3201XXXXXX" confidence={0.95} />
      <ExtractedField label="Nama" value="Ahmad Rizki" confidence={0.92} />
      <ExtractedField label="Alamat" value="Jl. Merdeka No. 10" confidence={0.78} />
    </CardContent>
  </Card>
</div>
```

### 15.4 Extracted Field Component

```tsx
function ExtractedField({ label, value, confidence }: { label: string; value: string; confidence: number }) {
  const level = confidence >= 0.85 ? "high" : confidence >= 0.60 ? "medium" : "low";
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
      <ConfidenceBadge level={level} score={confidence} />
    </div>
  );
}
```

### 15.5 Payment Proof Matching

```tsx
// Tolerance indicator for payment matching
<div className="flex items-center gap-2 p-3 rounded-lg bg-success/10">
  <CheckCircle className="h-4 w-4 text-success" />
  <span className="text-sm">
    Jumlah cocok (±Rp 1.000 toleransi): <strong>Rp 1.500.000</strong>
  </span>
</div>

// Mismatch warning
<div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10">
  <AlertTriangle className="h-4 w-4 text-warning" />
  <span className="text-sm">
    Selisih Rp 50.000 — perlu review manual
  </span>
</div>
```

---

## 16. DSS: RISK & ANALYTICS DASHBOARD

### 16.1 Risk Score Gauge

Color-coded 0-100 scale:

| Range | Color Token | Label | Meaning |
|-------|------------|-------|---------|
| 0-25 | `text-success` / `bg-success/10` | Low Risk | Tenant reliable |
| 26-50 | `text-warning` / `bg-warning/10` | Medium Risk | Monitor closely |
| 51-75 | `text-warning` / `bg-warning/20` | High Risk | Intervention needed |
| 76-100 | `text-destructive` / `bg-destructive/10` | Critical | Immediate action |

```tsx
function RiskScoreIndicator({ score }: { score: number }) {
  const config = score <= 25
    ? { color: "text-success", bg: "bg-success/10", label: "Rendah" }
    : score <= 50
    ? { color: "text-warning", bg: "bg-warning/10", label: "Sedang" }
    : score <= 75
    ? { color: "text-warning", bg: "bg-warning/20", label: "Tinggi" }
    : { color: "text-destructive", bg: "bg-destructive/10", label: "Kritis" };

  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium", config.bg, config.color)}>
      <span className="tabular-nums">{score}</span>
      <span>— {config.label}</span>
    </div>
  );
}
```

### 16.2 KPI Metric Cards

```tsx
<Card>
  <CardContent className="pt-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Hunian</p>
        <p className="text-2xl font-bold">76%</p>
      </div>
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Home className="h-5 w-5 text-primary" />
      </div>
    </div>
    <div className="flex items-center gap-1 mt-2">
      <TrendingUp className="h-3 w-3 text-success" />
      <span className="text-xs text-success">+5.2%</span>
      <span className="text-xs text-muted-foreground">vs bulan lalu</span>
    </div>
  </CardContent>
</Card>
```

### 16.3 Revenue Forecast Chart

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from "recharts";

<Card>
  <CardHeader>
    <CardTitle>Forecast Pendapatan</CardTitle>
    <CardDescription>Prediksi 6 bulan ke depan</CardDescription>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={forecastData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip />
        {/* Actual data — solid line */}
        <Line type="monotone" dataKey="actual" stroke="hsl(var(--chart-1))" strokeWidth={2} />
        {/* Predicted data — dashed line */}
        <Line type="monotone" dataKey="predicted" stroke="hsl(var(--chart-2))" strokeDasharray="5 5" />
        {/* Confidence band — filled area */}
        <Area type="monotone" dataKey="upperBound" stroke="none" fill="hsl(var(--chart-2))" fillOpacity={0.1} />
      </LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

### 16.4 Trend Indicators

```tsx
// Positive trend
<div className="flex items-center gap-1">
  <TrendingUp className="h-3 w-3 text-success" />
  <span className="text-xs font-medium text-success">+12.5%</span>
</div>

// Negative trend
<div className="flex items-center gap-1">
  <TrendingDown className="h-3 w-3 text-destructive" />
  <span className="text-xs font-medium text-destructive">-3.2%</span>
</div>

// Neutral
<div className="flex items-center gap-1">
  <Minus className="h-3 w-3 text-muted-foreground" />
  <span className="text-xs font-medium text-muted-foreground">0%</span>
</div>
```

---

## 17. DSS: AI ADVISOR UI PATTERNS

### 17.1 Recommendation Card

```tsx
<Card className="border-l-4 border-l-primary">
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <CardTitle className="text-base">Rekomendasi Harga</CardTitle>
      </div>
      <ConfidenceBadge level="high" score={0.88} />
    </div>
  </CardHeader>
  <CardContent className="space-y-3">
    <p className="text-sm">
      Naikkan harga Kamar 102 dari <strong>Rp 1.500.000</strong> ke{" "}
      <strong>Rp 1.650.000</strong> (+10%).
    </p>
    <div className="bg-muted p-3 rounded-lg">
      <p className="text-xs font-medium text-muted-foreground mb-1">Alasan AI:</p>
      <p className="text-xs text-muted-foreground">
        Occupancy rate 95%, harga di bawah median area (Rp 1.700.000),
        tenant risk score rendah (22/100).
      </p>
    </div>
  </CardContent>
  <CardFooter className="gap-2">
    <Button size="sm">Terima</Button>
    <Button variant="outline" size="sm">Tolak</Button>
    <Button variant="ghost" size="sm">Nanti</Button>
  </CardFooter>
</Card>
```

### 17.2 Recommendation Lifecycle Badges

| Status | Badge Style | Description |
|--------|-----------|-------------|
| Generated | `bg-info/10 text-info` | AI baru saja membuat rekomendasi |
| Viewed | `bg-muted text-muted-foreground` | Merchant sudah membaca |
| Accepted | `bg-success/10 text-success` | Diterima dan diterapkan |
| Rejected | `bg-destructive/10 text-destructive` | Ditolak dengan alasan |
| Measured | `bg-primary/10 text-primary` | Dampak sudah terukur |

### 17.3 Advisor Types

| Advisor | Icon | Edge Function | Purpose |
|---------|------|--------------|---------|
| Pricing | `DollarSign` | `dss-pricing-advisor` | Optimasi harga per-unit |
| Collection | `CreditCard` | `dss-collection-strategy` | Strategi penagihan overdue |
| Maintenance | `Wrench` | `dss-maintenance-priority` | Prioritas maintenance |
| Investment | `TrendingUp` | `dss-investment-insight` | Analisis ROI properti |

### 17.4 AI Response Streaming

In chatbot dialog, AI responses stream with a typewriter effect:

```tsx
// Streaming indicator
<div className="flex items-center gap-2 py-2">
  <div className="flex gap-1">
    <span className="h-2 w-2 rounded-full bg-primary animate-pulse-subtle" />
    <span className="h-2 w-2 rounded-full bg-primary animate-pulse-subtle [animation-delay:0.2s]" />
    <span className="h-2 w-2 rounded-full bg-primary animate-pulse-subtle [animation-delay:0.4s]" />
  </div>
  <span className="text-xs text-muted-foreground">SiHuni AI sedang mengetik...</span>
</div>
```

---

## 18. DSS: CONFIDENCE SCORE VISUALIZATION

### 18.1 Confidence Levels

| Level | Range | Color | Auto Action |
|-------|-------|-------|-------------|
| **High** | ≥ 0.85 | `bg-success/10 text-success` | Auto-accepted |
| **Medium** | 0.60 – 0.84 | `bg-warning/10 text-warning` | Manual review required |
| **Low** | 0.40 – 0.59 | `bg-destructive/10 text-destructive` | Re-upload / re-process |
| **Failed** | < 0.40 | `bg-destructive text-destructive-foreground` | Rejected |

### 18.2 Badge Variant

```tsx
function ConfidenceBadge({ level, score }: { level: "high" | "medium" | "low"; score: number }) {
  const config = {
    high:   { className: "bg-success/10 text-success border-success/20", label: "High" },
    medium: { className: "bg-warning/10 text-warning border-warning/20", label: "Medium" },
    low:    { className: "bg-destructive/10 text-destructive border-destructive/20", label: "Low" },
  }[level];

  return (
    <Badge variant="outline" className={cn("font-mono text-xs", config.className)}>
      {config.label} {(score * 100).toFixed(0)}%
    </Badge>
  );
}
```

### 18.3 Progress Bar Variant

```tsx
import { Progress } from "@/shared/components/ui/progress";

<div className="space-y-1">
  <div className="flex justify-between text-xs">
    <span className="text-muted-foreground">Confidence</span>
    <span className="font-mono font-medium">{(score * 100).toFixed(0)}%</span>
  </div>
  <Progress
    value={score * 100}
    className={cn(
      score >= 0.85 ? "[&>div]:bg-success" :
      score >= 0.60 ? "[&>div]:bg-warning" :
      "[&>div]:bg-destructive"
    )}
  />
</div>
```

### 18.4 Table Column (Sortable)

```tsx
<TableHead className="cursor-pointer" onClick={() => onSort("confidence")}>
  Confidence
  <ArrowUpDown className="ml-1 h-3 w-3 inline" />
</TableHead>

<TableCell>
  <ConfidenceBadge level={getLevel(row.confidence)} score={row.confidence} />
</TableCell>
```

---

## 19. DSS: TIER-GATED FEATURE UI

### 19.1 Lock Overlay

For features gated behind subscription tiers:

```tsx
<div className="relative">
  {/* Blurred content */}
  <div className="blur-sm pointer-events-none select-none">
    <Card>{/* Premium feature content */}</Card>
  </div>

  {/* Lock overlay */}
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
    <Lock className="h-8 w-8 text-muted-foreground mb-3" />
    <p className="text-sm font-medium mb-1">Fitur Premium</p>
    <p className="text-xs text-muted-foreground mb-4">Upgrade ke paket Business untuk akses</p>
    <Button size="sm">
      <Sparkles className="mr-2 h-3 w-3" />
      Upgrade Sekarang
    </Button>
  </div>
</div>
```

### 19.2 Tier Badges

```tsx
<Badge className="bg-primary/10 text-primary">Starter</Badge>
<Badge className="bg-accent/10 text-accent-foreground border border-accent/20">Pro</Badge>
<Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground">Business</Badge>
<Badge className="gradient-primary text-primary-foreground">Enterprise</Badge>
```

### 19.3 Inline Upgrade Prompt

```tsx
<div className="flex items-center gap-3 p-4 bg-accent/5 border border-accent/20 rounded-lg">
  <Sparkles className="h-5 w-5 text-accent-foreground shrink-0" />
  <div className="flex-1">
    <p className="text-sm font-medium">AI Revenue Forecast tersedia di paket Pro</p>
    <p className="text-xs text-muted-foreground">
      Prediksi pendapatan 6 bulan ke depan dengan akurasi 85%+
    </p>
  </div>
  <Button variant="outline" size="sm">Upgrade</Button>
</div>
```

### 19.4 Feature Gating Matrix

| Feature | Starter | Pro | Business | Enterprise |
|---------|---------|-----|----------|------------|
| Basic Dashboard | ✅ | ✅ | ✅ | ✅ |
| OCR KTP | ✅ | ✅ | ✅ | ✅ |
| Payment Tracking | ✅ | ✅ | ✅ | ✅ |
| OCR Payment Proof | ❌ | ✅ | ✅ | ✅ |
| Risk Scoring | ❌ | ✅ | ✅ | ✅ |
| Revenue Forecast | ❌ | ❌ | ✅ | ✅ |
| AI Pricing Advisor | ❌ | ❌ | ✅ | ✅ |
| Churn Prediction | ❌ | ❌ | ❌ | ✅ |
| Custom ML Models | ❌ | ❌ | ❌ | ✅ |

---

## 20. FLOATING AI ASSISTANT

### 20.1 FloatingActionButton Component

Located at `src/shared/components/layouts/FloatingActionButton.tsx`:

```tsx
type FloatingButtonType = 'ai' | 'create' | 'none';

// AI button — bottom-right, toggles chatbot dialog
<FloatingActionButton
  type="ai"
  isOpen={isChatOpen}
  onClick={handleAIButtonClick}
  hasBottomNav={config.hasBottomNav}  // Adjusts position for tenant bottom nav
/>

// Create button — bottom-right, triggers action
<FloatingActionButton
  type="create"
  onClick={() => navigate("/tenant/maintenance/new")}
  icon={Plus}
  hasBottomNav={config.hasBottomNav}
/>
```

**Positioning:**

| State | Class |
|-------|-------|
| Default | `fixed right-6 bottom-6 z-50` |
| With bottom nav (tenant mobile) | `bottom-24` (above 64px nav) |
| AI open state | `rotate-90` (X icon) |

### 20.2 AI FAB Visibility Rules

From `navigation-config.ts`:

| Role | `hasFloatingAI` | `globalFloatingAI` | Visibility |
|------|-----------------|-------------------|------------|
| Tenant | ✅ | ✅ | All pages |
| Merchant | ✅ | ✅ | All pages |
| Vendor | ✅ | ✅ | All pages |
| Admin | ✅ | ✅ | All pages |

### 20.3 ChatbotDialog

Located at `src/features/chatbot/components/ChatbotDialog.tsx`:

- Opens as a sheet/dialog overlay
- Message list with user/AI bubbles
- Quick action buttons
- Streaming AI response with typing indicator
- Role-specific context (tenant sees payment help, merchant sees management tips)
- Conversation persistence via `chat_conversations` + `chat_messages` tables

---

## 21. FORM PATTERNS

### 21.1 Form Library Stack

| Library | Purpose |
|---------|---------|
| React Hook Form | Form state management, validation |
| Zod | Schema-based runtime validation |
| shadcn/ui Form | Form field wrapper with Label + error display |

### 21.2 Standard Form Pattern

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";

const schema = z.object({
  name: z.string().min(2, "Minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  rent: z.number().min(500000, "Minimal Rp 500.000"),
});

function TenantForm() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", rent: 0 },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Penyewa</FormLabel>
              <FormControl>
                <Input placeholder="Ahmad Rizki" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Simpan</Button>
      </form>
    </Form>
  );
}
```

### 21.3 Error States

```tsx
// Error styling is automatic via FormMessage component:
// - Red text below input
// - Ring color changes to destructive on invalid inputs

// Custom inline error
<p className="text-sm text-destructive flex items-center gap-1">
  <AlertCircle className="h-3 w-3" />
  NIK sudah terdaftar di sistem
</p>
```

---

## 22. DATA TABLE PATTERNS

### 22.1 Standard Data Table

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";

<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Daftar Penyewa</CardTitle>
      <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Tambah</Button>
    </div>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Kamar</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Sewa/bln</TableHead>
          <TableHead className="w-[40px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {tenants.map(tenant => (
          <TableRow key={tenant.id}>
            <TableCell className="font-medium">{tenant.name}</TableCell>
            <TableCell>{tenant.unit}</TableCell>
            <TableCell><StatusBadge status={tenant.status} /></TableCell>
            <TableCell className="text-right font-mono">
              {formatCurrency(tenant.rent)}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Lihat Detail</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Hapus</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

### 22.2 Mobile Table (Card List)

On mobile, tables transform into card lists:

```tsx
{isMobile ? (
  <div className="space-y-3">
    {tenants.map(tenant => (
      <Card key={tenant.id} className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{tenant.name}</p>
            <p className="text-sm text-muted-foreground">Kamar {tenant.unit}</p>
          </div>
          <StatusBadge status={tenant.status} />
        </div>
        <p className="text-lg font-bold mt-2">{formatCurrency(tenant.rent)}</p>
      </Card>
    ))}
  </div>
) : (
  <Table>...</Table>
)}
```

---

## 23. CHART & DATA VISUALIZATION

### 23.1 Recharts Integration

SiHuni uses **Recharts** (`recharts@^2.15.4`) for all data visualization, with chart colors mapped to CSS variables.

### 23.2 Chart Color Tokens

| Token | Variable | Semantic Use |
|-------|----------|-------------|
| `chart-1` | `hsl(var(--chart-1))` | Primary data (brown) |
| `chart-2` | `hsl(var(--chart-2))` | Comparison data (gold) |
| `chart-3` | `hsl(var(--chart-3))` | Positive/growth (green) |
| `chart-4` | `hsl(var(--chart-4))` | Tertiary (medium brown) |
| `chart-5` | `hsl(var(--chart-5))` | Warning/concern (amber) |

### 23.3 Responsive Chart Container

```tsx
<Card>
  <CardHeader>
    <CardTitle>Pendapatan Bulanan</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
        <YAxis className="text-xs fill-muted-foreground" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

### 23.4 DSS-Specific Charts

| Chart Type | Recharts Component | Data Source | Portal |
|-----------|-------------------|-------------|--------|
| Revenue Forecast | `LineChart` + `Area` | `ml-revenue-forecast` | Merchant |
| Risk Distribution | `BarChart` | `ml-tenant-risk-score` | Merchant |
| Occupancy Trend | `AreaChart` | DB query | Merchant, Admin |
| Payment Timeline | `LineChart` | `invoices` + `payments` | Merchant |
| Churn Prediction | `ComposedChart` | `ml-churn-prediction` | Merchant |
| Vendor Earnings | `BarChart` | `vendor_earnings` | Vendor |
| Platform Analytics | `PieChart` + `BarChart` | Admin aggregates | Admin |

---

## 24. IMPLEMENTATION CHECKLIST

### 24.1 Foundation ✅ (Implemented)

```
✅ React 18 + Vite 5.4 + TypeScript
✅ Tailwind CSS + CSS Variables in index.css
✅ shadcn/ui installed (54 components)
✅ Fonts loaded (Plus Jakarta Sans + Inter)
✅ Design tokens in tailwind.config.ts
✅ Dark mode (class-based via Tailwind)
✅ Lucide React icons
```

### 24.2 Layout & Navigation ✅ (Implemented)

```
✅ DashboardLayout with SidebarProvider
✅ MobileLayout with MobileHeader + MobileBottomNav
✅ Role-based navigation config (4 roles)
✅ Breadcrumb navigation (desktop)
✅ Collapsible sidebar
✅ Active route detection
✅ Mobile safe areas
```

### 24.3 Components ✅ (Implemented)

```
✅ 54 shadcn/ui components installed
✅ Sonner for toast notifications
✅ Form pattern (React Hook Form + Zod)
✅ Custom components (PDFDownload, PhotoUpload, PullToRefresh)
```

### 24.4 DSS Features 🔧 (In Progress)

```
✅ Floating AI Assistant (FAB + ChatbotDialog)
✅ Chatbot conversation persistence
✅ Analytics tracking hooks
🔧 OCR Interface (edge functions exist, UI needs polish)
🔧 Risk Score Dashboard (data models ready)
🔧 AI Advisor recommendation cards
🔧 Confidence score visualizations
🔧 Tier-gated feature UI
🔧 Revenue forecast charts
```

### 24.5 Accessibility ✅ (via Radix)

```
✅ Radix UI primitives (ARIA, keyboard, focus trap)
✅ Color contrast AA compliant
✅ Focus visible rings
✅ Semantic HTML landmarks
✅ Touch targets ≥ 44px on mobile
🔧 Screen reader testing
🔧 Skip links
🔧 prefers-reduced-motion support
```

### 24.6 Performance ✅ (Implemented)

```
✅ Lazy-loaded pages (80+ routes)
✅ TanStack Query for server state caching
✅ Vite code splitting
✅ Compression plugin (vite-plugin-compression)
✅ Antialiased text rendering
✅ GPU-accelerated animations (transform/opacity)
```

### 24.7 Design QA Checklist

```
☐ All colors use CSS variable tokens (no hardcoded hex/rgb)
☐ All text meets 4.5:1 contrast ratio
☐ All buttons use shadcn/ui Button with CVA variants
☐ All modals use shadcn/ui Dialog (Radix-based)
☐ All toasts use Sonner (not custom)
☐ All forms use React Hook Form + Zod + shadcn Form
☐ All icons use Lucide React (not SVG inline)
☐ All loading states use Skeleton or Loader2 spinner
☐ All empty states have illustration + CTA
☐ Mobile: bottom nav visible only for tenant
☐ Mobile: touch targets ≥ 44px
☐ Mobile: safe area padding applied
☐ Dark mode: all semantic colors switch correctly
☐ Charts: use --chart-* tokens, not hardcoded colors
☐ DSS: confidence badges on all AI outputs
☐ DSS: recommendation cards have accept/reject actions
```

---

## APPENDIX: QUICK REFERENCE

### Color Palette Quick Ref

| Name | HSL Token | Hex | Usage |
|------|-----------|-----|-------|
| Primary | `35 32% 41%` | #8B6F47 | Buttons, links |
| Secondary | `37 32% 50%` | #A68B5B | Secondary actions |
| Accent | `48 89% 60%` | #F4D03F | Highlights, prices |
| Background | `42 100% 96%` | #FFF8E7 | Page bg |
| Foreground | `35 32% 20%` | #453A2B | Main text |
| Success | `142 71% 45%` | #22C55E | ✓ Positive |
| Warning | `38 92% 50%` | #F59E0B | ⚠ Caution |
| Destructive | `0 84% 60%` | #EF4444 | ✕ Error |
| Info | `217 91% 60%` | #3B82F6 | ℹ Information |

### Component Import Quick Ref

```tsx
// Most common imports
import { Button } from "@/shared/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { toast } from "sonner";

// Lucide icons
import { Plus, Edit, Trash2, Search, Loader2, ArrowLeft, MoreHorizontal } from "lucide-react";
```

### Tailwind Spacing Quick Ref

| Class | Value | Usage |
|-------|-------|-------|
| `gap-1` / `p-1` | 4px | Micro spacing |
| `gap-2` / `p-2` | 8px | Small gaps |
| `gap-4` / `p-4` | 16px | **Base padding** |
| `gap-6` / `p-6` | 24px | Card/section padding |
| `gap-8` / `p-8` | 32px | Large section spacing |

---

**Document Version:** 3.0 (DSS Edition)  
**Last Updated:** 21 Februari 2026  
**Maintained By:** SiHuni Development Team  
**Alignment:** 100% synchronized with codebase implementation  
**Next Review:** Quarterly or when design system changes occur

**Skills Applied:** `ui-ux-designer`, `design-system-patterns`, `accessibility-compliance`, `responsive-design`, `interaction-design`, `visual-design-foundations`, `shadcn-ui`, `tailwind-css-patterns`, `radix-ui-design-system`, `web-performance-optimization`, `frontend-design`, `stitch-ui-design`, `icon-design`, `prompt-engineering-patterns`, `startup-metrics-framework`, `pricing-strategy`

---

**End of UI/UX Design Documentation v3.0**
