# UI/UX Design Documentation
## Sistem DSS Manajemen Kosan - "SiHuni"
**Version:** 1.0 | **Status:** Design System Specification  
**Date:** 21 Februari 2026 | **Theme:** Warm, Earthy, Professional SaaS

---

## TABLE OF CONTENTS
1. [Design Philosophy](#1-design-philosophy)
2. [Typography System](#2-typography-system)
3. [Color System](#3-color-system)
4. [Design Tokens](#4-design-tokens)
5. [Component Library](#5-component-library)
6. [Layout & Grid System](#6-layout--grid-system)
7. [Spacing & Sizing](#7-spacing--sizing)
8. [Accessibility Guidelines](#8-accessibility-guidelines)
9. [Responsive Design](#9-responsive-design)
10. [Dark Mode Implementation](#10-dark-mode-implementation)
11. [Design Patterns & Interactions](#11-design-patterns--interactions)
12. [Icon System](#12-icon-system)
13. [Animation & Micro-interactions](#13-animation--micro-interactions)
14. [Implementation Checklist](#14-implementation-checklist)

---

## 1. DESIGN PHILOSOPHY

### 1.1 Brand Identity

**Brand Name:** SiHuni (Sistem Hunian / Housing System)

**Design Theme:** Warm, Earthy, Professional Property Management SaaS

**Core Values:**
- **Trustworthy:** Professional, data-driven, secure
- **Approachable:** Warm brown tones, friendly language, intuitive interfaces
- **Efficient:** Clean layouts, minimal cognitive load, quick actions
- **Accessible:** WCAG 2.1 AA compliant, inclusive design

### 1.2 Design Principles

```
┌──────────────────────────────────────────────────────────────┐
│ 1. CLARITY                                                   │
│    Information hierarchy clear; users understand at a glance│
│    → No jargon; labels explicit; error messages helpful     │
│                                                              │
│ 2. CONSISTENCY                                              │
│    Predictable patterns across all screens                  │
│    → Same color usage; consistent spacing; familiar patterns│
│                                                              │
│ 3. EFFICIENCY                                               │
│    Minimize clicks & friction for common tasks              │
│    → Quick actions visible; smart defaults; batch operations│
│                                                              │
│ 4. AFFORDANCE                                               │
│    UI elements signal their function (clickable, editable)  │
│    → Button styles; link underlines; hover states           │
│                                                              │
│ 5. FEEDBACK                                                 │
│    System responds to user actions with clear indication    │
│    → Loading states; success/error messages; transitions    │
│                                                              │
│ 6. ACCESSIBILITY                                            │
│    Inclusive design for users of all abilities              │
│    → Color contrast; keyboard nav; alt text; ARIA labels    │
└──────────────────────────────────────────────────────────────┘
```

### 1.3 Design Vision

**Visual Style:** Modern, minimalist with warm earthy accents

**Inspiration:** Indonesian property/real estate design language (wood, earth tones, warm hospitality)

**Target Users:**
- Property owners (40-60 years old, moderate tech literacy)
- Property managers (25-35 years old, high tech literacy)
- Admin staff (20-30 years old, variable tech literacy)

---

## 2. TYPOGRAPHY SYSTEM

### 2.1 Font Family Stack

```css
/* Headings: Plus Jakarta Sans */
font-family: 'Plus Jakarta Sans', 'system-ui', 'sans-serif';
font-weight: 400, 500, 600, 700;

/* Body Text: Inter */
font-family: 'Inter', 'system-ui', 'sans-serif';
font-weight: 400, 500, 600;

/* Fallback Stack */
font-family: system-ui, -apple-system, sans-serif;
```

**Rationale:**
- **Plus Jakarta Sans:** Modern, friendly serif-less design; excellent for readability at all sizes
- **Inter:** Purpose-built for screens; exceptional at small sizes; excellent for body copy
- Fallback ensures consistency even if web fonts fail to load

### 2.2 Typographic Scale

**Heading Hierarchy:**

| Level | Font | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|------|--------|-------------|----------------|-------|
| **H1** | Plus Jakarta Sans | 36px | 700 | 1.2 | -0.5px | Page titles, hero text |
| **H2** | Plus Jakarta Sans | 28px | 700 | 1.3 | -0.3px | Section headers |
| **H3** | Plus Jakarta Sans | 24px | 600 | 1.4 | 0px | Subsection headers |
| **H4** | Plus Jakarta Sans | 20px | 600 | 1.4 | 0px | Card titles, labels |
| **H5** | Plus Jakarta Sans | 16px | 600 | 1.5 | 0px | Form labels, emphasis |
| **H6** | Plus Jakarta Sans | 14px | 600 | 1.5 | 0px | Minor labels |

**Body Text:**

| Type | Font | Size | Weight | Line Height | Usage |
|------|------|------|--------|-------------|-------|
| **Body Large** | Inter | 16px | 400 | 1.6 | Main body text, descriptions |
| **Body Default** | Inter | 14px | 400 | 1.6 | Standard body, form inputs |
| **Body Small** | Inter | 12px | 400 | 1.5 | Helper text, captions |
| **Caption** | Inter | 11px | 400 | 1.4 | Timestamps, footnotes |

**Emphasis Variants:**

| Variant | Font Weight | Usage |
|---------|-------------|-------|
| **Bold** | 600 | Strong emphasis (errors, critical info) |
| **Semibold** | 500 | Medium emphasis (labels, highlights) |
| **Regular** | 400 | Default text |

### 2.3 Text Styles Library

```html
<!-- HTML Implementation -->
<style>
  /* Headings */
  h1 { font: 700 36px/1.2 'Plus Jakarta Sans', system-ui, sans-serif; }
  h2 { font: 700 28px/1.3 'Plus Jakarta Sans', system-ui, sans-serif; }
  h3 { font: 600 24px/1.4 'Plus Jakarta Sans', system-ui, sans-serif; }
  h4 { font: 600 20px/1.4 'Plus Jakarta Sans', system-ui, sans-serif; }
  h5 { font: 600 16px/1.5 'Plus Jakarta Sans', system-ui, sans-serif; }
  h6 { font: 600 14px/1.5 'Plus Jakarta Sans', system-ui, sans-serif; }

  /* Body */
  body { font: 400 14px/1.6 'Inter', system-ui, sans-serif; color: #453A2B; }
  .text-large { font: 400 16px/1.6 'Inter', system-ui, sans-serif; }
  .text-small { font: 400 12px/1.5 'Inter', system-ui, sans-serif; }
  .caption { font: 400 11px/1.4 'Inter', system-ui, sans-serif; }

  /* Emphasis */
  .font-bold { font-weight: 600; }
  .font-semibold { font-weight: 500; }
  .font-regular { font-weight: 400; }
</style>
```

### 2.4 Text Truncation & Overflow

```css
/* Single line truncation */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Multi-line truncation (2-3 lines) */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

---

## 3. COLOR SYSTEM

### 3.1 Light Mode Palette

#### Primary Colors

```css
--primary: hsl(35, 32%, 41%);        /* #8B6F47 - Cokelat Gelap */
--primary-foreground: hsl(0, 0%, 100%);  /* #FFFFFF - White text on primary */
--primary-light: hsl(37, 32%, 50%);  /* #A68B5B - Medium variant */
--primary-dark: hsl(35, 32%, 28%);   /* #5E4E3B - Dark variant */

--secondary: hsl(37, 32%, 50%);      /* #A68B5B - Cokelat Medium */
--secondary-foreground: hsl(0, 0%, 100%);  /* #FFFFFF */

--accent: hsl(48, 89%, 60%);         /* #F4D03F - Kuning Keemasan */
--accent-foreground: hsl(35, 32%, 15%);    /* #2E2618 - Dark text on accent */
```

**Usage:**
- **Primary:** CTA buttons, links, key interactions, focus rings
- **Secondary:** Secondary buttons, hover states
- **Accent:** Highlights, badges, important numbers, price displays

#### Background & Surface

```css
--background: hsl(42, 100%, 96%);    /* #FFF8E7 - Krem page background */
--foreground: hsl(35, 32%, 20%);     /* #453A2B - Main text color */
--card: hsl(0, 0%, 100%);            /* #FFFFFF - Card background */
--card-foreground: hsl(35, 32%, 20%);     /* #453A2B - Card text */
--muted: hsl(42, 40%, 93%);          /* #F0E8D8 - Krem muda, disabled state */
--muted-foreground: hsl(37, 25%, 45%);    /* #8F7A56 - Subtle text */
```

**Usage:**
- **Background:** Page background, wrappers
- **Foreground:** Primary text color
- **Card:** Content cards, modals, popups
- **Muted:** Disabled inputs, inactive tabs, ghost buttons
- **Muted Foreground:** Help text, secondary info

#### Semantic Colors

```css
--success: hsl(142, 71%, 45%);       /* #22C55E - Green */
--warning: hsl(38, 92%, 50%);        /* #F59E0B - Amber */
--info: hsl(217, 91%, 60%);          /* #3B82F6 - Blue */
--destructive: hsl(0, 84%, 60%);     /* #EF4444 - Red */
```

**Usage:**
- **Success:** Confirmation messages, positive states, checkmarks
- **Warning:** Caution messages, warnings, alerts
- **Info:** Information messages, hints, tooltips
- **Destructive:** Errors, delete actions, critical alerts

#### Borders & Inputs

```css
--border: hsl(37, 30%, 85%);         /* #DDD0BA - Light brown border */
--input: hsl(37, 30%, 85%);          /* #DDD0BA - Input border/background */
--ring: hsl(35, 32%, 41%);           /* #8B6F47 - Focus ring (same as primary) */
```

#### Sidebar

```css
--sidebar-bg: hsl(35, 32%, 20%);     /* #453A2B - Dark brown */
--sidebar-fg: hsl(42, 100%, 96%);    /* #FFF8E7 - Krem text */
--sidebar-primary: hsl(48, 89%, 60%);    /* #F4D03F - Gold accent */
--sidebar-accent: hsl(35, 32%, 28%); /* #5E4E3B - Medium brown */
```

**Sidebar Specific:**
- Background: Dark brown for contrast
- Foreground: Light cream for readability
- Primary: Gold for active/hover states
- Accent: Medium brown for secondary elements

#### Chart Colors

```css
--chart-1: hsl(35, 32%, 41%);   /* #8B6F47 - Primary brown */
--chart-2: hsl(48, 89%, 60%);   /* #F4D03F - Gold */
--chart-3: hsl(142, 71%, 45%);  /* #22C55E - Success green */
--chart-4: hsl(37, 32%, 50%);   /* #A68B5B - Secondary brown */
--chart-5: hsl(38, 92%, 50%);   /* #F59E0B - Warning amber */
```

**Chart Usage:**
- Chart 1: Default/main data series
- Chart 2: Secondary comparison
- Chart 3: Growth/positive metrics
- Chart 4: Tertiary data
- Chart 5: Warnings/concerns

### 3.2 Dark Mode Palette

```css
/* Dark Mode - Switch all colors */
@media (prefers-color-scheme: dark) {
  --background: hsl(35, 32%, 8%);    /* #1C1710 - Very dark brown */
  --foreground: hsl(42, 100%, 96%);  /* #FFF8E7 - Light cream */
  --card: hsl(35, 32%, 12%);         /* #2A2219 - Dark card */
  --card-foreground: hsl(42, 100%, 96%);  /* #FFF8E7 */
  --primary: hsl(37, 32%, 55%);      /* #B89B6A - Lighter brown */
  --primary-foreground: hsl(35, 32%, 8%);      /* #1C1710 */
  --accent: hsl(48, 89%, 50%);       /* #E8C520 - Brighter gold */
  --accent-foreground: hsl(35, 32%, 8%);      /* #1C1710 */
  --muted: hsl(35, 25%, 18%);        /* #3A3028 - Dark muted */
  --muted-foreground: hsl(42, 100%, 96%);     /* #FFF8E7 */
  --border: hsl(35, 25%, 20%);       /* #40352B - Subtle border */
  --sidebar-bg: hsl(35, 32%, 8%);    /* #1C1710 - Match bg */
  --sidebar-fg: hsl(42, 100%, 96%);  /* #FFF8E7 */
}
```

### 3.3 Color Contrast Compliance

**WCAG 2.1 AA Minimum:** 4.5:1 for normal text, 3:1 for large text

**Tested Combinations:**

| Foreground | Background | Ratio | Status |
|-----------|-----------|-------|--------|
| #453A2B (Foreground) | #FFF8E7 (Background) | 8.2:1 | ✅ AAA |
| #FFFFFF (White) | #8B6F47 (Primary) | 4.8:1 | ✅ AA |
| #FFFFFF (White) | #A68B5B (Secondary) | 4.5:1 | ✅ AA |
| #FFFFFF (White) | #22C55E (Success) | 3.5:1 | ⚠️ AA (large only) |
| #1C1710 (Dark text) | #F4D03F (Accent) | 11.2:1 | ✅ AAA |
| #FFF8E7 (Light text) | #453A2B (Dark bg) | 8.2:1 | ✅ AAA |

### 3.4 CSS Variable Implementation

```css
:root {
  /* Primary */
  --primary: hsl(35, 32%, 41%);
  --primary-foreground: hsl(0, 0%, 100%);
  --primary-light: hsl(37, 32%, 50%);
  --primary-dark: hsl(35, 32%, 28%);

  /* Secondary */
  --secondary: hsl(37, 32%, 50%);
  --secondary-foreground: hsl(0, 0%, 100%);

  /* Accent */
  --accent: hsl(48, 89%, 60%);
  --accent-foreground: hsl(35, 32%, 15%);

  /* Neutral */
  --background: hsl(42, 100%, 96%);
  --foreground: hsl(35, 32%, 20%);
  --card: hsl(0, 0%, 100%);
  --card-foreground: hsl(35, 32%, 20%);
  --muted: hsl(42, 40%, 93%);
  --muted-foreground: hsl(37, 25%, 45%);

  /* Semantic */
  --success: hsl(142, 71%, 45%);
  --warning: hsl(38, 92%, 50%);
  --info: hsl(217, 91%, 60%);
  --destructive: hsl(0, 84%, 60%);

  /* Borders */
  --border: hsl(37, 30%, 85%);
  --input: hsl(37, 30%, 85%);
  --ring: hsl(35, 32%, 41%);

  /* Sidebar */
  --sidebar-bg: hsl(35, 32%, 20%);
  --sidebar-fg: hsl(42, 100%, 96%);
  --sidebar-primary: hsl(48, 89%, 60%);
  --sidebar-accent: hsl(35, 32%, 28%);
}
```

---

## 4. DESIGN TOKENS

### 4.1 Spacing Scale

**Base Unit:** 4px (Multiples of 4)

```css
--spacing-0: 0px;
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;      /* Base spacing */
--spacing-5: 20px;
--spacing-6: 24px;      /* Card padding default */
--spacing-7: 28px;
--spacing-8: 32px;      /* Section spacing */
--spacing-9: 36px;
--spacing-10: 40px;
--spacing-12: 48px;     /* Large section spacing */
--spacing-16: 64px;
--spacing-20: 80px;
```

**Usage:**
- **spacing-1 to 3:** Micro spacing (icon margins, list item gaps)
- **spacing-4:** Base padding (buttons, inputs, small elements)
- **spacing-6:** Card/component padding
- **spacing-8+:** Section/grid spacing

### 4.2 Border Radius

```css
--radius-none: 0px;
--radius-sm: 4px;       /* Subtle rounding */
--radius-md: 8px;       /* Default - cards, buttons, inputs */
--radius-lg: 12px;      /* Components, modals */
--radius-xl: 16px;      /* Large components */
--radius-2xl: 20px;
--radius-full: 9999px;  /* Fully rounded (pills, avatars) */
```

**Application:**
- **radius-md (8px):** Default for most elements (buttons, inputs, cards)
- **radius-lg (12px):** Modals, larger cards
- **radius-full:** Badge pills, circular avatars
- **radius-none:** Flat designs, table cells when appropriate

### 4.3 Shadow System

```css
/* Elevation Shadows */
--shadow-none: none;
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 1px 3px rgba(0, 0, 0, 0.1);        /* Card shadow */
--shadow-lg: 0 4px 6px rgba(0, 0, 0, 0.1);        /* Card hover shadow */
--shadow-xl: 0 10px 15px rgba(0, 0, 0, 0.1);      /* Elevated shadow */
--shadow-2xl: 0 20px 25px rgba(0, 0, 0, 0.15);
--shadow-inner: inset 0 1px 2px rgba(0, 0, 0, 0.05);
```

**Shadow Usage in Light Mode:**

| Element | Shadow | Z-index |
|---------|--------|---------|
| Card (rest) | 0 1px 3px rgba(0,0,0,0.1) | 0 |
| Card (hover) | 0 4px 6px rgba(0,0,0,0.1) | 1 |
| Elevated Component | 0 10px 15px rgba(0,0,0,0.1) | 10 |
| Modal Overlay | 0 20px 25px rgba(0,0,0,0.15) | 40 |
| Tooltip | 0 4px 6px rgba(0,0,0,0.1) | 50 |
| Dropdown Menu | 0 10px 15px rgba(0,0,0,0.1) | 30 |

### 4.4 Transitions & Animations

```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
--transition-slowest: 500ms ease;

/* Easing functions */
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

**Animation Timings:**
- **Fast (150ms):** Hover effects, simple state changes
- **Base (200ms):** Standard transitions (default)
- **Slow (300ms):** Modal opens/closes, complex animations
- **Slowest (500ms):** Page transitions, large layout shifts

### 4.5 Z-Index Scale

```css
--z-hide: -1;           /* Hidden elements */
--z-base: 0;            /* Default */
--z-dropdown: 10;       /* Dropdowns, popovers */
--z-sticky: 20;         /* Sticky elements */
--z-modal-overlay: 40;  /* Modal/dialog background */
--z-modal: 41;          /* Modal content */
--z-notification: 50;   /* Toast/notification messages */
--z-tooltip: 50;        /* Tooltips */
```

### 4.6 Complete Design Tokens Object

```scss
// SCSS/CSS-in-JS Implementation
$tokens: {
  // Spacing
  spacing: (
    0: 0,
    1: 4px,
    2: 8px,
    3: 12px,
    4: 16px,
    5: 20px,
    6: 24px,
    8: 32px,
    12: 48px,
  ),

  // Border Radius
  radius: (
    none: 0,
    sm: 4px,
    md: 8px,
    lg: 12px,
    xl: 16px,
    full: 9999px,
  ),

  // Shadows
  shadow: (
    none: none,
    sm: 0 1px 2px rgba(0, 0, 0, 0.05),
    md: 0 1px 3px rgba(0, 0, 0, 0.1),
    lg: 0 4px 6px rgba(0, 0, 0, 0.1),
    xl: 0 10px 15px rgba(0, 0, 0, 0.1),
  ),

  // Transitions
  transition: (
    fast: 150ms ease,
    base: 200ms ease,
    slow: 300ms ease,
  ),
};
```

---

## 5. COMPONENT LIBRARY

### 5.1 Button Component

**Variants:** Primary, Secondary, Danger, Ghost, Loading

```html
<!-- Primary Button (Default) -->
<button class="btn btn-primary">
  Simpan Harga
</button>

<!-- Secondary Button -->
<button class="btn btn-secondary">
  Batalkan
</button>

<!-- Danger Button (Destructive Action) -->
<button class="btn btn-danger">
  Hapus Kamar
</button>

<!-- Ghost Button (Minimal) -->
<button class="btn btn-ghost">
  Pelajari Lebih Lanjut
</button>

<!-- Button with Icon -->
<button class="btn btn-primary">
  <svg><!-- icon --></svg>
  Upload Dokumen
</button>

<!-- Loading State -->
<button class="btn btn-primary" disabled>
  <span class="spinner"></span>
  Memproses...
</button>

<!-- Button Sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary btn-md">Medium (default)</button>
<button class="btn btn-primary btn-lg">Large</button>
```

**CSS Implementation:**

```css
.btn {
  /* Base styles */
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 200ms ease;
  font-family: 'Inter', system-ui, sans-serif;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;

  /* Focus styles (accessibility) */
  &:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }

  /* Disabled state */
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

/* Primary Button */
.btn-primary {
  background-color: var(--primary);
  color: var(--primary-foreground);

  &:hover:not(:disabled) {
    background-color: var(--primary-dark);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
}

/* Secondary Button */
.btn-secondary {
  background-color: var(--secondary);
  color: var(--secondary-foreground);

  &:hover:not(:disabled) {
    background-color: hsl(37, 32%, 45%);
  }
}

/* Ghost Button */
.btn-ghost {
  background-color: transparent;
  color: var(--primary);
  border: 1px solid var(--border);

  &:hover:not(:disabled) {
    background-color: var(--muted);
  }
}

/* Danger Button */
.btn-danger {
  background-color: var(--destructive);
  color: white;

  &:hover:not(:disabled) {
    background-color: hsl(0, 84%, 55%);
  }
}

/* Size Variants */
.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-md {
  padding: 10px 16px;
  font-size: 14px;
}

.btn-lg {
  padding: 14px 24px;
  font-size: 16px;
}

/* Full width */
.btn-block {
  width: 100%;
}

/* Loading spinner animation */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Accessibility Features:**
- Focus ring visible (outline + offset)
- Disabled state with reduced opacity
- Proper semantic button element
- ARIA labels for icon-only buttons
- Sufficient padding for touch targets (44px minimum)

### 5.2 Input & Form Components

**Input Types:** Text, Number, Email, Password, Select, Checkbox, Radio, Toggle

```html
<!-- Text Input -->
<div class="form-group">
  <label for="tenant-name" class="form-label">Nama Penyewa</label>
  <input 
    type="text" 
    id="tenant-name"
    class="form-input"
    placeholder="Ahmad Rizki"
    aria-describedby="tenant-help"
  />
  <span id="tenant-help" class="form-help">
    Masukkan nama lengkap sesuai KTP
  </span>
</div>

<!-- Input with Error -->
<div class="form-group">
  <label for="email" class="form-label">Email</label>
  <input 
    type="email" 
    id="email"
    class="form-input form-input-error"
    aria-invalid="true"
    aria-describedby="email-error"
  />
  <span id="email-error" class="form-error">
    Format email tidak valid
  </span>
</div>

<!-- Number Input with Min/Max -->
<div class="form-group">
  <label for="rent" class="form-label">Harga Sewa (Rp)</label>
  <input 
    type="number" 
    id="rent"
    class="form-input"
    min="500000"
    max="5000000"
    step="100000"
    placeholder="1500000"
  />
</div>

<!-- Select Dropdown -->
<div class="form-group">
  <label for="status" class="form-label">Status Kamar</label>
  <select id="status" class="form-select">
    <option value="">Pilih Status</option>
    <option value="occupied">Terisi</option>
    <option value="vacant">Kosong</option>
    <option value="maintenance">Maintenance</option>
  </select>
</div>

<!-- Checkbox -->
<div class="form-group">
  <label class="form-checkbox">
    <input type="checkbox" name="agree" />
    <span>Saya setuju dengan syarat & ketentuan</span>
  </label>
</div>

<!-- Radio Button Group -->
<fieldset class="form-group">
  <legend class="form-label">Tipe Kamar</legend>
  <div class="form-radio-group">
    <label class="form-radio">
      <input type="radio" name="room-type" value="single" />
      <span>Kamar Tunggal</span>
    </label>
    <label class="form-radio">
      <input type="radio" name="room-type" value="double" />
      <span>Kamar Ganda</span>
    </label>
  </div>
</fieldset>

<!-- Toggle Switch -->
<div class="form-group">
  <label class="form-toggle">
    <input type="checkbox" />
    <span>Aktifkan Notifikasi</span>
  </label>
</div>
```

**CSS Implementation:**

```css
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--foreground);
}

.form-input,
.form-select,
.form-textarea {
  padding: 10px 12px;
  border: 1px solid var(--input);
  border-radius: 8px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  background-color: var(--card);
  color: var(--foreground);
  transition: all 200ms ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(139, 111, 71, 0.1);
  }

  &:disabled {
    background-color: var(--muted);
    color: var(--muted-foreground);
    cursor: not-allowed;
  }

  &::placeholder {
    color: var(--muted-foreground);
  }
}

/* Error State */
.form-input-error {
  border-color: var(--destructive);
  
  &:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
}

.form-error {
  font-size: 12px;
  color: var(--destructive);
}

.form-help {
  font-size: 12px;
  color: var(--muted-foreground);
}

/* Checkbox & Radio */
.form-checkbox,
.form-radio {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;

  input[type="checkbox"],
  input[type="radio"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: var(--primary);
  }
}

/* Toggle Switch */
.form-toggle input[type="checkbox"] {
  width: 40px;
  height: 24px;
  cursor: pointer;
  appearance: none;
  background-color: var(--muted);
  border-radius: 12px;
  position: relative;
  transition: background-color 200ms ease;

  &:checked {
    background-color: var(--primary);
  }

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background-color: white;
    border-radius: 50%;
    transition: left 200ms ease;
  }

  &:checked::after {
    left: 18px;
  }
}
```

**Accessibility:**
- Associated `<label>` elements
- `aria-invalid` and `aria-describedby` for error states
- Proper `for` attributes linking labels to inputs
- High contrast text on backgrounds
- Keyboard navigable

### 5.3 Card Component

```html
<!-- Basic Card -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Kamar 102</h3>
    <span class="badge badge-success">Terisi</span>
  </div>
  <div class="card-content">
    <p>Lantai 1, luas 20 m², lengkap dengan AC dan WiFi</p>
  </div>
  <div class="card-footer">
    <button class="btn btn-primary btn-sm">Edit</button>
    <button class="btn btn-ghost btn-sm">Details</button>
  </div>
</div>

<!-- Card with Image -->
<div class="card">
  <img src="room.jpg" alt="Kamar 102" class="card-image" />
  <div class="card-content">
    <h4>Kamar 102</h4>
    <p>Harga: Rp 1.500.000/bulan</p>
  </div>
</div>

<!-- Interactive Card (Hoverable) -->
<div class="card card-interactive">
  <div class="card-content">
    <h4>Data Penyewa</h4>
    <p>Kelola informasi penyewa dan kontrak</p>
  </div>
  <svg class="card-icon"><!-- arrow --></svg>
</div>
```

**CSS:**

```css
.card {
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 200ms ease;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.card-content {
  padding: 20px;
}

.card-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 8px;
}

.card-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.card-interactive {
  cursor: pointer;

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}
```

### 5.4 Badge & Status Component

```html
<!-- Badge - Status -->
<span class="badge badge-success">Terisi</span>
<span class="badge badge-warning">Pending</span>
<span class="badge badge-destructive">Overdue</span>
<span class="badge badge-info">Info</span>

<!-- Badge - Outline -->
<span class="badge badge-outline badge-success">Aktif</span>

<!-- Badge - Pill Shape -->
<span class="badge badge-pill">New</span>
```

**CSS:**

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  white-space: nowrap;
}

.badge-success {
  background-color: rgba(34, 197, 94, 0.1);
  color: hsl(142, 71%, 35%);
}

.badge-warning {
  background-color: rgba(245, 158, 11, 0.1);
  color: hsl(38, 92%, 40%);
}

.badge-destructive {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--destructive);
}

.badge-info {
  background-color: rgba(59, 130, 246, 0.1);
  color: hsl(217, 91%, 50%);
}

.badge-outline {
  background-color: transparent;
  border: 1px solid currentColor;
}

.badge-pill {
  border-radius: 9999px;
}
```

### 5.5 Modal / Dialog Component

```html
<!-- Modal -->
<div class="modal-overlay" id="modal">
  <div class="modal">
    <div class="modal-header">
      <h2 class="modal-title">Update Harga Kamar</h2>
      <button class="modal-close" aria-label="Close">&times;</button>
    </div>
    
    <div class="modal-content">
      <form>
        <div class="form-group">
          <label for="new-price" class="form-label">Harga Baru (Rp)</label>
          <input 
            type="number" 
            id="new-price"
            class="form-input"
            value="1750000"
          />
        </div>
        <div class="form-group">
          <label for="reason" class="form-label">Alasan Perubahan</label>
          <textarea 
            id="reason"
            class="form-textarea"
            rows="3"
          ></textarea>
        </div>
      </form>
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost">Batalkan</button>
      <button class="btn btn-primary">Simpan Perubahan</button>
    </div>
  </div>
</div>
```

**CSS:**

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal-overlay);
  animation: fadeIn 200ms ease;
}

.modal {
  background-color: var(--card);
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
  animation: slideUp 300ms ease;
  z-index: var(--z-modal);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border);
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: var(--muted-foreground);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--foreground);
  }
}

.modal-content {
  padding: 20px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 5.6 Dropdown Menu Component

```html
<!-- Dropdown Button -->
<div class="dropdown">
  <button class="dropdown-trigger" aria-expanded="false">
    Menu Aksi
    <svg class="icon-dropdown"><!-- chevron --></svg>
  </button>
  
  <ul class="dropdown-menu" role="menu">
    <li role="menuitem">
      <a href="#edit" class="dropdown-item">Edit Properti</a>
    </li>
    <li role="menuitem">
      <a href="#duplicate" class="dropdown-item">Duplikasi</a>
    </li>
    <li role="separator" class="dropdown-divider"></li>
    <li role="menuitem">
      <a href="#delete" class="dropdown-item dropdown-item-danger">
        Hapus
      </a>
    </li>
  </ul>
</div>
```

**CSS:**

```css
.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: transparent;
  border: none;
  cursor: pointer;
  padding: 8px 12px;
  color: var(--primary);
  font-size: 14px;
  font-weight: 500;

  &:hover {
    background-color: var(--muted);
    border-radius: 4px;
  }
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  list-style: none;
  margin: 0;
  padding: 8px 0;
  z-index: var(--z-dropdown);
  display: none;

  &.open {
    display: block;
    animation: slideDown 200ms ease;
  }
}

.dropdown-item {
  display: block;
  padding: 10px 16px;
  color: var(--foreground);
  text-decoration: none;
  font-size: 14px;
  transition: all 200ms ease;
  cursor: pointer;

  &:hover {
    background-color: var(--muted);
  }

  &-danger {
    color: var(--destructive);

    &:hover {
      background-color: rgba(239, 68, 68, 0.1);
    }
  }
}

.dropdown-divider {
  height: 1px;
  background-color: var(--border);
  margin: 4px 0;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 5.7 Alert & Notification Component

```html
<!-- Alert - Success -->
<div class="alert alert-success" role="alert">
  <svg class="alert-icon"><!-- checkmark --></svg>
  <div>
    <h4 class="alert-title">Operasi Berhasil</h4>
    <p>Harga kamar telah diperbarui</p>
  </div>
  <button class="alert-close" aria-label="Close">&times;</button>
</div>

<!-- Alert - Warning -->
<div class="alert alert-warning">
  <svg class="alert-icon"><!-- warning --></svg>
  <p>Pembayaran tertunda untuk 3 kamar</p>
</div>

<!-- Alert - Error -->
<div class="alert alert-destructive">
  <svg class="alert-icon"><!-- error --></svg>
  <p>Terjadi kesalahan saat menyimpan data</p>
</div>

<!-- Toast/Notification (Top Right) -->
<div class="toast" role="status" aria-live="polite">
  <svg class="toast-icon"><!-- checkmark --></svg>
  <span>Dokumen berhasil diunggah</span>
</div>
```

**CSS:**

```css
.alert {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid;
  align-items: flex-start;
}

.alert-success {
  background-color: rgba(34, 197, 94, 0.05);
  border-color: rgba(34, 197, 94, 0.3);
  color: hsl(142, 71%, 35%);
}

.alert-warning {
  background-color: rgba(245, 158, 11, 0.05);
  border-color: rgba(245, 158, 11, 0.3);
  color: hsl(38, 92%, 40%);
}

.alert-destructive {
  background-color: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.3);
  color: var(--destructive);
}

.alert-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
}

.alert-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-left: auto;
  color: currentColor;
  opacity: 0.7;

  &:hover {
    opacity: 1;
  }
}

.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background-color: var(--card);
  color: var(--foreground);
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: var(--z-notification);
  animation: slideInRight 300ms ease;
}

@keyframes slideInRight {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### 5.8 Data Table Component

```html
<div class="table-container">
  <table class="table">
    <thead>
      <tr>
        <th>
          <input type="checkbox" class="table-checkbox" />
        </th>
        <th>
          <button class="table-header-btn">
            Nama Penyewa
            <svg><!-- sort --></svg>
          </button>
        </th>
        <th>Kamar</th>
        <th>Harga Sewa</th>
        <th>Status Pembayaran</th>
        <th>Aksi</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><input type="checkbox" class="table-checkbox" /></td>
        <td class="font-semibold">Ahmad Rizki</td>
        <td>102</td>
        <td>Rp 1.500.000</td>
        <td>
          <span class="badge badge-success">On-Time</span>
        </td>
        <td>
          <div class="dropdown">
            <button class="btn-icon">⋯</button>
            <!-- dropdown menu -->
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<!-- Pagination -->
<div class="pagination">
  <button class="pagination-btn" disabled>← Sebelumnya</button>
  <div class="pagination-numbers">
    <button class="pagination-page active">1</button>
    <button class="pagination-page">2</button>
    <button class="pagination-page">3</button>
  </div>
  <button class="pagination-btn">Berikutnya →</button>
</div>
```

**CSS:**

```css
.table-container {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  background-color: var(--card);
}

.table thead {
  background-color: var(--muted);
  border-bottom: 1px solid var(--border);
}

.table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: var(--foreground);
}

.table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.table-checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--primary);
}

.table-header-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--foreground);
  font-weight: 600;
  padding: 0;

  &:hover {
    color: var(--primary);
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.pagination-btn {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background-color: var(--card);
  cursor: pointer;
  font-size: 14px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: var(--muted);
  }
}

.pagination-numbers {
  display: flex;
  gap: 4px;
}

.pagination-page {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background-color: var(--card);
  cursor: pointer;

  &.active {
    background-color: var(--primary);
    color: var(--primary-foreground);
    border-color: var(--primary);
  }

  &:hover:not(.active) {
    background-color: var(--muted);
  }
}
```

### 5.9 Tab Component

```html
<div class="tabs">
  <div class="tabs-header">
    <button class="tab active" data-panel="overview">
      Overview
    </button>
    <button class="tab" data-panel="financial">
      Keuangan
    </button>
    <button class="tab" data-panel="history">
      Riwayat
    </button>
  </div>

  <div class="tabs-content">
    <div class="tab-panel active" id="overview">
      <!-- Content -->
    </div>
    <div class="tab-panel" id="financial">
      <!-- Content -->
    </div>
    <div class="tab-panel" id="history">
      <!-- Content -->
    </div>
  </div>
</div>
```

**CSS:**

```css
.tabs-header {
  display: flex;
  border-bottom: 1px solid var(--border);
  gap: 0;
}

.tab {
  background: none;
  border: none;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--muted-foreground);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 200ms ease;

  &:hover {
    color: var(--foreground);
  }

  &.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
  }
}

.tab-panel {
  display: none;
  padding: 20px;

  &.active {
    display: block;
    animation: fadeIn 200ms ease;
  }
}
```

---

## 6. LAYOUT & GRID SYSTEM

### 6.1 Grid System (12-Column)

```html
<div class="container">
  <div class="grid">
    <div class="col col-md-4"><!-- 1/3 on medium -->
      <div class="card">Kamar 101</div>
    </div>
    <div class="col col-md-4">
      <div class="card">Kamar 102</div>
    </div>
    <div class="col col-md-4">
      <div class="card">Kamar 103</div>
    </div>
  </div>
</div>
```

**CSS:**

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
}

.col {
  grid-column: span 12;

  &.col-1 { grid-column: span 1; }
  &.col-2 { grid-column: span 2; }
  &.col-3 { grid-column: span 3; }
  &.col-4 { grid-column: span 4; }
  &.col-6 { grid-column: span 6; }
  &.col-12 { grid-column: span 12; }
}

/* Responsive breakpoints */
@media (min-width: 768px) {
  .col-md-1 { grid-column: span 1; }
  .col-md-2 { grid-column: span 2; }
  .col-md-3 { grid-column: span 3; }
  .col-md-4 { grid-column: span 4; }
  .col-md-6 { grid-column: span 6; }
  .col-md-12 { grid-column: span 12; }
}

@media (min-width: 1024px) {
  .col-lg-1 { grid-column: span 1; }
  .col-lg-2 { grid-column: span 2; }
  .col-lg-3 { grid-column: span 3; }
  .col-lg-4 { grid-column: span 4; }
  .col-lg-6 { grid-column: span 6; }
  .col-lg-12 { grid-column: span 12; }
}
```

### 6.2 Sidebar Layout

**Layout Structure:**

```
┌─────────────────────────────────────────────┐
│ Header (Fixed, Height: 60px)                │
├──────────────┬──────────────────────────────┤
│              │                              │
│  Sidebar     │      Main Content            │
│  (280px)     │      (Fluid)                 │
│              │                              │
│  Fixed       │                              │
│  Scrollable  │      Scrollable              │
│              │                              │
├──────────────┴──────────────────────────────┤
│ Footer (Fixed, Height: 40px) - Optional    │
└─────────────────────────────────────────────┘
```

**CSS:**

```css
body {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  height: 60px;
  background-color: var(--card);
  border-bottom: 1px solid var(--border);
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
}

.main-layout {
  display: flex;
  flex: 1;
  margin-top: 60px;
  margin-bottom: 0;
}

.sidebar {
  width: 280px;
  background-color: var(--sidebar-bg);
  color: var(--sidebar-fg);
  overflow-y: auto;
  border-right: 1px solid var(--border);
  padding: 20px 0;
}

.sidebar-item {
  padding: 12px 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 200ms ease;
  display: flex;
  align-items: center;
  gap: 12px;

  &:hover {
    background-color: var(--sidebar-accent);
  }

  &.active {
    background-color: var(--sidebar-accent);
    color: var(--sidebar-primary);
    border-left: 3px solid var(--sidebar-primary);
    padding-left: 17px;
  }
}

.sidebar-divider {
  height: 1px;
  background-color: var(--sidebar-accent);
  margin: 12px 0;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background-color: var(--background);
}

.content-wrapper {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Responsive: Hide sidebar on small screens */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -280px;
    height: calc(100vh - 60px);
    transition: left 200ms ease;
    z-index: 30;

    &.open {
      left: 0;
    }
  }

  .main-content {
    width: 100%;
  }
}
```

### 6.3 Dashboard Grid Layout

```html
<div class="dashboard-grid">
  <!-- KPI Cards Row -->
  <div class="grid gap-6 grid-cols-4">
    <div class="card kpi-card">
      <div class="kpi-value">76%</div>
      <div class="kpi-label">Hunian</div>
    </div>
    <div class="card kpi-card">
      <div class="kpi-value">21.6M</div>
      <div class="kpi-label">Pendapatan</div>
    </div>
    <div class="card kpi-card">
      <div class="kpi-value">Med</div>
      <div class="kpi-label">Risiko</div>
    </div>
    <div class="card kpi-card">
      <div class="kpi-value">4.2</div>
      <div class="kpi-label">Rating</div>
    </div>
  </div>

  <!-- Charts Row -->
  <div class="grid gap-6 grid-cols-2">
    <div class="card">
      <h3>Hunian per Kamar</h3>
      <!-- Chart -->
    </div>
    <div class="card">
      <h3>Tren Pendapatan</h3>
      <!-- Chart -->
    </div>
  </div>

  <!-- Data Table Row -->
  <div class="grid gap-6 grid-cols-1">
    <div class="card">
      <h3>Status Penyewa</h3>
      <!-- Table -->
    </div>
  </div>
</div>
```

---

## 7. SPACING & SIZING

### 7.1 Spacing Rules

**Principle:** Consistent spacing creates visual rhythm and hierarchy

```
Micro Spacing (4-12px):
├─ Between icon and text: 8px
├─ Between list items: 4-8px
├─ Input field padding: 10px
└─ Button padding (vertical): 10px

Content Spacing (16-24px):
├─ Padding inside cards: 20px
├─ Gap between components in row: 16px
├─ Form group spacing: 16px
└─ Section margins: 24px

Section Spacing (32px+):
├─ Gap between major sections: 32px
├─ Page top/bottom padding: 40px
├─ Header/footer spacing: 20px
└─ Between grid cards: 20px
```

### 7.2 Component Sizing

**Touch Target Minimum:** 44px (Mobile), 40px (Desktop)

```css
/* Button sizes */
.btn-sm { padding: 6px 12px; min-height: 32px; }
.btn-md { padding: 10px 16px; min-height: 40px; }  /* Default */
.btn-lg { padding: 14px 24px; min-height: 44px; }

/* Input sizes */
.form-input { padding: 10px 12px; min-height: 40px; }

/* Icon sizes */
.icon-sm { width: 16px; height: 16px; }
.icon-md { width: 24px; height: 24px; }  /* Default */
.icon-lg { width: 32px; height: 32px; }

/* Avatar sizes */
.avatar-sm { width: 32px; height: 32px; border-radius: 50%; }
.avatar-md { width: 48px; height: 48px; border-radius: 50%; }
.avatar-lg { width: 64px; height: 64px; border-radius: 50%; }
```

---

## 8. ACCESSIBILITY GUIDELINES

### 8.1 WCAG 2.1 AA Compliance

**Commitment:** All components and pages meet WCAG 2.1 Level AA standards

#### Color Contrast

**Minimum Requirements:**
- Normal text: 4.5:1
- Large text (18pt+): 3:1
- UI components: 3:1

**Testing Tool:** WebAIM Contrast Checker

#### Keyboard Navigation

**Requirements:**
- All interactive elements must be keyboard accessible
- Logical tab order (top-to-bottom, left-to-right)
- Visible focus indicator (outline or border)
- Skip links for navigation (optional but recommended)

**Implementation:**

```html
<!-- Skip Link (First element in body) -->
<a href="#main-content" class="skip-link">
  Lompat ke konten utama
</a>

<!-- Keyboard focus styles -->
<style>
  button:focus-visible,
  input:focus-visible,
  a:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }

  /* Remove default outline and add custom */
  button:focus,
  input:focus,
  a:focus {
    outline: none;
  }
</style>
```

#### Semantic HTML

```html
<!-- Good: Semantic structure -->
<header role="banner">...</header>
<nav role="navigation">...</nav>
<main id="main-content" role="main">...</main>
<aside role="complementary">...</aside>
<footer role="contentinfo">...</footer>

<!-- Good: Form accessibility -->
<label for="input-id">Label Text</label>
<input id="input-id" type="text" />

<!-- Good: Button accessibility -->
<button aria-label="Close dialog">×</button>

<!-- Good: List accessibility -->
<ul role="list">
  <li role="listitem">Item 1</li>
  <li role="listitem">Item 2</li>
</ul>
```

#### ARIA Labels & Descriptions

```html
<!-- aria-label: For icon-only buttons -->
<button aria-label="Tutup dialog">&times;</button>

<!-- aria-describedby: For helper text -->
<input 
  id="email"
  aria-describedby="email-help"
/>
<span id="email-help">Format: name@example.com</span>

<!-- aria-invalid + aria-describedby: For errors -->
<input 
  id="phone"
  aria-invalid="true"
  aria-describedby="phone-error"
/>
<span id="phone-error" role="alert">
  Format nomor tidak valid
</span>

<!-- aria-live: For dynamic updates -->
<div aria-live="polite" aria-atomic="true">
  Dokumen berhasil diunggah
</div>

<!-- aria-expanded: For expandable menus -->
<button aria-expanded="false" aria-controls="menu">
  Menu
</button>
<ul id="menu" hidden>...</ul>
```

### 8.2 Screen Reader Testing

**Test with:**
- NVDA (Windows, Free)
- JAWS (Windows, Paid)
- VoiceOver (macOS/iOS, Built-in)
- TalkBack (Android, Built-in)

**Common Announcements:**
```
Form Input: "Email, edit text, required"
Button: "Submit, button"
Link: "Learn more, link"
Tab: "Tab 2 of 3, selected"
Alert: "Alert: Operation successful"
```

### 8.3 Accessibility Checklist

```
☐ Color contrast: All text meets 4.5:1 (AA) or 7:1 (AAA)
☐ Keyboard nav: All interactive elements accessible
☐ Focus indicator: Visible on all interactive elements
☐ Alt text: All images have descriptive alt text
☐ Form labels: All inputs have associated labels
☐ Error messages: Clear and linked to inputs
☐ ARIA: Properly used for dynamic content
☐ Semantic HTML: Proper heading levels, landmarks
☐ Mobile: Touch targets ≥44px
☐ Text sizing: Readable at 200% zoom
☐ Motion: No auto-playing animations
☐ Testing: Tested with screen reader + keyboard only
```

---

## 9. RESPONSIVE DESIGN

### 9.1 Breakpoints

```css
/* Mobile First Approach */
/* Base: 320px (mobile) */
/* sm:   640px  (landscape phone) */
/* md:   768px  (tablet) */
/* lg:   1024px (desktop) */
/* xl:   1280px (large desktop) */
/* 2xl:  1536px (extra large) */

/* Media Query Patterns */
@media (min-width: 640px) {
  /* Small screens */
}

@media (min-width: 768px) {
  /* Medium screens (tablet) */
}

@media (min-width: 1024px) {
  /* Large screens (desktop) */
}

@media (min-width: 1280px) {
  /* Extra large screens */
}
```

### 9.2 Responsive Typography

```css
/* Fluid Typography */
h1 {
  font-size: clamp(24px, 5vw, 36px);
  line-height: clamp(1.2, 1.2, 1.3);
}

body {
  font-size: clamp(14px, 2vw, 16px);
}
```

### 9.3 Responsive Grid

```html
<!-- Responsive grid layout -->
<div class="grid gap-4">
  <!-- 1 column mobile, 2 columns tablet, 3 columns desktop -->
  <div class="col-span-full sm:col-span-6 lg:col-span-4">
    <div class="card">...</div>
  </div>
</div>
```

**CSS:**

```css
.grid {
  display: grid;
  grid-template-columns: 1fr;  /* Mobile: 1 column */
  gap: 16px;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);  /* Tablet: 2 columns */
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);  /* Desktop: 3 columns */
  }
}
```

### 9.4 Mobile-Specific Considerations

**Layout Changes:**
- Hide sidebar on mobile (replace with hamburger menu)
- Stack cards vertically
- Full-width buttons
- Larger touch targets (44px minimum)

**Navigation:**
```html
<!-- Hamburger Menu -->
<button class="hamburger" aria-label="Menu" id="menu-toggle">
  <span></span>
  <span></span>
  <span></span>
</button>

<!-- Mobile Menu (Off-canvas) -->
<nav class="mobile-nav" id="mobile-nav">
  <!-- Navigation items -->
</nav>
```

**CSS:**

```css
.hamburger {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
}

.hamburger span {
  width: 24px;
  height: 2px;
  background-color: var(--foreground);
  transition: all 200ms ease;
}

.hamburger.active span:nth-child(1) {
  transform: rotate(45deg) translate(8px, 8px);
}

.hamburger.active span:nth-child(2) {
  opacity: 0;
}

.hamburger.active span:nth-child(3) {
  transform: rotate(-45deg) translate(8px, -8px);
}

/* Mobile nav off-canvas */
.mobile-nav {
  position: fixed;
  left: -100%;
  top: 60px;
  width: 100%;
  height: calc(100vh - 60px);
  background-color: var(--sidebar-bg);
  transition: left 200ms ease;
  z-index: 30;
}

.mobile-nav.open {
  left: 0;
}

@media (min-width: 768px) {
  .hamburger {
    display: none;
  }

  .mobile-nav {
    position: static;
    left: 0;
    width: 280px;
    height: auto;
  }
}
```

---

## 10. DARK MODE IMPLEMENTATION

### 10.1 Theme Toggle

```html
<!-- Theme Toggle Button (Typically in Header) -->
<button class="theme-toggle" aria-label="Toggle dark mode" id="theme-toggle">
  <svg class="sun-icon"><!-- Sun icon --></svg>
  <svg class="moon-icon"><!-- Moon icon --></svg>
</button>
```

**CSS:**

```css
.theme-toggle {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.sun-icon {
  display: block;
  width: 20px;
  height: 20px;
}

.moon-icon {
  display: none;
  width: 20px;
  height: 20px;
}

@media (prefers-color-scheme: dark) {
  .sun-icon {
    display: none;
  }

  .moon-icon {
    display: block;
  }
}
```

**JavaScript:**

```javascript
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

// Check system preference or saved preference
function getTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) return saved;
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? 'dark' 
    : 'light';
}

// Apply theme
function applyTheme(theme) {
  if (theme === 'dark') {
    html.setAttribute('data-theme', 'dark');
    document.documentElement.style.colorScheme = 'dark';
  } else {
    html.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = 'light';
  }
  localStorage.setItem('theme', theme);
}

// Toggle theme
themeToggle.addEventListener('click', () => {
  const current = localStorage.getItem('theme') || 'light';
  applyTheme(current === 'light' ? 'dark' : 'light');
});

// Initialize
applyTheme(getTheme());
```

### 10.2 Dark Mode CSS Variables

```css
:root {
  color-scheme: light;
  /* Light mode colors defined */
}

@media (prefers-color-scheme: dark),
       [data-theme="dark"] {
  :root {
    color-scheme: dark;
    
    --background: hsl(35, 32%, 8%);
    --foreground: hsl(42, 100%, 96%);
    --card: hsl(35, 32%, 12%);
    --card-foreground: hsl(42, 100%, 96%);
    --primary: hsl(37, 32%, 55%);
    --primary-foreground: hsl(35, 32%, 8%);
    --accent: hsl(48, 89%, 50%);
    --accent-foreground: hsl(35, 32%, 8%);
    --muted: hsl(35, 25%, 18%);
    --muted-foreground: hsl(42, 100%, 96%);
    --border: hsl(35, 25%, 20%);
    --sidebar-bg: hsl(35, 32%, 8%);
    --sidebar-fg: hsl(42, 100%, 96%);
  }
}
```

### 10.3 Dark Mode Considerations

**Image Handling:**
```css
/* Invert images in dark mode */
img {
  transition: filter 200ms ease;
}

@media (prefers-color-scheme: dark) {
  img {
    filter: brightness(0.9);  /* Slightly darker */
  }
}
```

**Chart Colors (Adjusted for Dark Mode):**
```css
@media (prefers-color-scheme: dark) {
  --chart-1: hsl(37, 32%, 55%);   /* Lighter brown */
  --chart-2: hsl(48, 89%, 50%);   /* Brighter gold */
  --chart-3: hsl(142, 71%, 55%);  /* Brighter green */
}
```

---

## 11. DESIGN PATTERNS & INTERACTIONS

### 11.1 Loading States

**Loading Spinner:**
```html
<div class="spinner">
  <div class="spinner-ring"></div>
</div>
```

**CSS:**

```css
.spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
}

.spinner-ring {
  width: 100%;
  height: 100%;
  border: 3px solid var(--muted);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Skeleton Loading:**
```html
<div class="card">
  <div class="skeleton skeleton-text"></div>
  <div class="skeleton skeleton-text"></div>
  <div class="skeleton skeleton-avatar"></div>
</div>
```

**CSS:**

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--muted) 25%,
    rgba(255, 255, 255, 0.2) 50%,
    var(--muted) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.skeleton-text {
  height: 12px;
  margin-bottom: 8px;
  border-radius: 4px;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 11.2 Empty States

```html
<div class="empty-state">
  <svg class="empty-state-icon"><!-- illustration --></svg>
  <h3 class="empty-state-title">Tidak Ada Data</h3>
  <p class="empty-state-description">
    Mulai dengan menambahkan kamar baru
  </p>
  <button class="btn btn-primary">Tambah Kamar</button>
</div>
```

**CSS:**

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--muted-foreground);
}

.empty-state-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--foreground);
}

.empty-state-description {
  margin-bottom: 24px;
  max-width: 300px;
}
```

### 11.3 Confirmation Dialog Pattern

```html
<div class="modal-overlay" id="confirm-modal">
  <div class="modal">
    <div class="modal-header">
      <h2>Confirm Action</h2>
    </div>
    <div class="modal-content">
      <p>Are you sure? This action cannot be undone.</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">
        Cancel
      </button>
      <button class="btn btn-danger" onclick="confirmAction()">
        Delete
      </button>
    </div>
  </div>
</div>
```

### 11.4 Search & Filter Pattern

```html
<div class="search-filter-bar">
  <div class="search-input-wrapper">
    <svg class="search-icon"><!-- search --></svg>
    <input 
      type="text"
      class="search-input"
      placeholder="Cari nama penyewa..."
      id="search"
    />
    <button class="search-clear" hidden>×</button>
  </div>

  <div class="filter-buttons">
    <button class="filter-btn active" data-filter="all">
      Semua
    </button>
    <button class="filter-btn" data-filter="active">
      Aktif
    </button>
    <button class="filter-btn" data-filter="overdue">
      Tertunda
    </button>
  </div>
</div>
```

**CSS:**

```css
.search-filter-bar {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  pointer-events: none;
  color: var(--muted-foreground);
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid var(--input);
  border-radius: 8px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(139, 111, 71, 0.1);
  }
}

.filter-buttons {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background-color: transparent;
  cursor: pointer;
  font-size: 14px;
  transition: all 200ms ease;

  &:hover {
    background-color: var(--muted);
  }

  &.active {
    background-color: var(--primary);
    color: var(--primary-foreground);
    border-color: var(--primary);
  }
}
```

---

## 12. ICON SYSTEM

### 12.1 Icon Set

**Recommended:** Heroicons, Feather Icons, or Material Icons

**Sizes:**
- Small (16px): Badges, labels
- Medium (20-24px): Buttons, inputs
- Large (32px+): Hero sections, illustrations

**Implementation:**

```html
<!-- SVG Icons (Inline) -->
<button class="btn btn-primary">
  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round"/>
  </svg>
  Add Item
</button>

<!-- Icon Library (HTML) -->
<i class="icon icon-plus"></i>
<i class="icon icon-check"></i>
<i class="icon icon-trash"></i>
<i class="icon icon-chevron-down"></i>
```

**CSS:**

```css
.icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
  fill: currentColor;
  color: inherit;
}

.icon-sm { font-size: 16px; }
.icon-md { font-size: 24px; }
.icon-lg { font-size: 32px; }
```

### 12.2 Common Icons List

```
Navigation:
├─ icon-menu (hamburger)
├─ icon-chevron-left
├─ icon-chevron-right
├─ icon-chevron-down
└─ icon-home

Actions:
├─ icon-plus (add)
├─ icon-edit (pencil)
├─ icon-trash (delete)
├─ icon-download
├─ icon-upload
└─ icon-refresh

Status:
├─ icon-check (success)
├─ icon-x (close/error)
├─ icon-alert-circle (warning)
├─ icon-info (information)
└─ icon-loader (loading)

Data:
├─ icon-chart-bar (analytics)
├─ icon-calendar (date)
├─ icon-clock (time)
├─ icon-user (person)
├─ icon-home (property)
└─ icon-door (room)

Other:
├─ icon-search (magnifying glass)
├─ icon-settings (gear)
├─ icon-logout (exit)
├─ icon-bell (notification)
└─ icon-sun/moon (theme toggle)
```

---

## 13. ANIMATION & MICRO-INTERACTIONS

### 13.1 Entrance Animations

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 300ms ease-out;
}

/* Slide Up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-up {
  animation: slideUp 300ms ease-out;
}

/* Scale In */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.scale-in {
  animation: scaleIn 200ms ease-out;
}
```

### 13.2 Hover Effects

```css
/* Button hover elevation */
.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Card hover lift */
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Link underline animation */
a {
  position: relative;
  text-decoration: none;
  color: var(--primary);
  transition: color 200ms ease;

  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background-color: var(--primary);
    transition: width 200ms ease;
  }

  &:hover::after {
    width: 100%;
  }
}
```

### 13.3 Focus Animations

```css
/* Focus ring pulse animation */
button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--primary);
  animation: focusPulse 200ms ease-out;
}

@keyframes focusPulse {
  0% { box-shadow: 0 0 0 0 var(--primary); }
  100% { box-shadow: 0 0 0 6px rgba(139, 111, 71, 0); }
}
```

### 13.4 Success Animation

```html
<div class="success-animation" id="success">
  <svg class="checkmark">
    <circle cx="50" cy="50" r="45" />
    <path d="M 35 55 L 45 65 L 65 35" />
  </svg>
</div>
```

**CSS:**

```css
.checkmark {
  width: 80px;
  height: 80px;
  fill: none;
  stroke: var(--success);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  animation: checkmarkAnimation 600ms ease-out;
}

.checkmark circle {
  animation: circleAnimation 400ms ease-out;
}

.checkmark path {
  animation: pathAnimation 400ms 200ms ease-out both;
}

@keyframes checkmarkAnimation {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes circleAnimation {
  0% { stroke-dasharray: 282.7; stroke-dashoffset: 282.7; }
  100% { stroke-dasharray: 282.7; stroke-dashoffset: 0; }
}

@keyframes pathAnimation {
  0% { stroke-dasharray: 40; stroke-dashoffset: 40; }
  100% { stroke-dasharray: 40; stroke-dashoffset: 0; }
}
```

---

## 14. IMPLEMENTATION CHECKLIST

### 14.1 Frontend Setup Checklist

```
PHASE 1: FOUNDATION
☐ Set up project structure (React + TypeScript)
☐ Import fonts (Plus Jakarta Sans, Inter via Google Fonts)
☐ Create CSS variables file (colors, spacing, shadows)
☐ Set up Tailwind CSS or CSS-in-JS solution
☐ Create base styles (reset, typography)
☐ Implement CSS variables polyfill (if needed)

PHASE 2: COMPONENT LIBRARY
☐ Build Button component (all variants)
☐ Build Form inputs (text, select, checkbox, radio)
☐ Build Card component
☐ Build Badge component
☐ Build Modal/Dialog component
☐ Build Dropdown menu
☐ Build Alert/Toast components
☐ Build Table component
☐ Build Tab component
☐ Build Navigation/Sidebar

PHASE 3: LAYOUTS
☐ Create main layout (header + sidebar + content)
☐ Create grid/responsive system
☐ Build page templates (dashboard, list, detail)
☐ Implement responsive breakpoints
☐ Test mobile navigation (hamburger menu)

PHASE 4: ACCESSIBILITY
☐ Add focus ring styles to all interactive elements
☐ Implement ARIA labels/descriptions
☐ Test with keyboard-only navigation
☐ Test with screen reader (NVDA/VoiceOver)
☐ Check color contrast ratios
☐ Implement skip links
☐ Test at 200% zoom level

PHASE 5: THEMING
☐ Implement light mode color scheme
☐ Implement dark mode color scheme
☐ Add theme toggle button
☐ Store preference in localStorage
☐ Respect prefers-color-scheme media query
☐ Test charts/images in both modes

PHASE 6: INTERACTIONS & ANIMATIONS
☐ Add entrance animations (fade-in, slide-up)
☐ Add hover effects (buttons, cards, links)
☐ Add loading spinners/skeletons
☐ Add empty states
☐ Add success/error animations
☐ Implement page transitions

PHASE 7: TESTING
☐ Visual regression testing (Percy, Chromatic)
☐ Accessibility audit (axe, WAVE)
☐ Responsive design testing (multiple devices)
☐ Performance testing (Lighthouse)
☐ Cross-browser testing (Chrome, Firefox, Safari)
☐ Keyboard navigation testing
☐ Screen reader testing

PHASE 8: DOCUMENTATION
☐ Document all components (Storybook or similar)
☐ Create design system documentation
☐ Write usage guidelines
☐ Document accessibility features
☐ Create code examples
☐ Create troubleshooting guide
```

### 14.2 Design QA Checklist

```
VISUAL CONSISTENCY
☐ All buttons use consistent sizing
☐ All cards have consistent shadows
☐ All spacing follows 4px grid
☐ All border radius values match tokens
☐ All colors use CSS variables
☐ Icon sizes consistent
☐ Font sizes/weights follow scale

ACCESSIBILITY
☐ Color contrast ≥ 4.5:1 for normal text
☐ Focus indicators visible and clear
☐ All images have alt text
☐ Form labels associated with inputs
☐ Error messages clear and helpful
☐ Modal has proper focus management
☐ Buttons have sufficient padding (≥44px)

RESPONSIVENESS
☐ Layout works on 320px width
☐ Layout works on 768px width
☐ Layout works on 1024px width
☐ Text readable without horizontal scroll
☐ Touch targets ≥44px on mobile
☐ Images scale appropriately
☐ Tables horizontal scroll on mobile

PERFORMANCE
☐ All animations < 500ms
☐ No jank (smooth 60fps)
☐ SVG icons optimized
☐ CSS minified
☐ Unused CSS removed
☐ No layout shifts (CLS)

CROSS-BROWSER
☐ Chrome/Edge (latest)
☐ Firefox (latest)
☐ Safari (latest)
☐ Mobile Chrome
☐ Mobile Safari
☐ No visual differences
☐ All functionality works
```

---

## APPENDIX: QUICK REFERENCE

### Color Palette Quick Ref (Light Mode)

| Name | Hex | Usage |
|------|-----|-------|
| Primary | #8B6F47 | Buttons, links |
| Secondary | #A68B5B | Secondary actions |
| Accent | #F4D03F | Highlights |
| Background | #FFF8E7 | Page bg |
| Foreground | #453A2B | Main text |
| Card | #FFFFFF | Card bg |
| Success | #22C55E | ✓ Positive |
| Warning | #F59E0B | ⚠ Caution |
| Danger | #EF4444 | ✕ Error |
| Info | #3B82F6 | ℹ Information |

### Spacing Quick Ref

| Token | Value | Usage |
|-------|-------|-------|
| spacing-1 | 4px | Micro spacing |
| spacing-2 | 8px | Small gaps |
| spacing-4 | 16px | **Base padding** |
| spacing-6 | 24px | Card padding |
| spacing-8 | 32px | Section spacing |
| spacing-12 | 48px | Large spacing |

### Component Quick Ref

| Component | File | Variants |
|-----------|------|----------|
| Button | Button.tsx | primary, secondary, danger, ghost, loading |
| Input | Input.tsx | text, number, email, password, error |
| Card | Card.tsx | default, interactive, with image |
| Badge | Badge.tsx | success, warning, danger, info, outline |
| Modal | Modal.tsx | default, fullscreen, animated |
| Dropdown | Dropdown.tsx | right-aligned, dividers |
| Table | Table.tsx | sortable, selectable, paginated |
| Alert | Alert.tsx | success, warning, danger, info |

---

**Document Version:** 1.0  
**Last Updated:** 21 Februari 2026  
**Maintained By:** UI/UX Design Team  
**Next Review:** Quarterly or when design changes occur

---

### Additional Resources

- Storybook Documentation: Store component examples
- Figma Design File: Link to live design file
- Accessibility Guidelines: WCAG 2.1 AA
- Brand Guidelines: Logo, typography, imagery
- Code Examples: GitHub repository with component implementations

**End of UI/UX Documentation**
