

# Redesign Total: Login, Register & Onboarding -- Modern Futuristik

## Arah Desain

**Aesthetic**: "Warm Luxury Futurism" -- perpaduan warna earthy SiHuni (cokelat/emas/krem) dengan elemen modern/futuristik: glassmorphism, gradient mesh halus, floating decorative shapes, dan depth layering.

**Differentiation Anchor**: Split-screen layout (desktop) dengan panel kiri berisi brand storytelling/visual dan panel kanan berisi form -- bukan generic centered card. Di mobile, visual hero di atas lalu form di bawah.

**Visual Memorability**: Animated gradient orbs/shapes di background yang bergerak perlahan, memberi kesan hidup dan premium.

---

## 1. Layout Baru -- Split Screen Auth

### Desktop (md+)
```text
+---------------------------+---------------------------+
|                           |                           |
|   BRAND PANEL             |   FORM PANEL              |
|                           |                           |
|   Logo + Tagline          |   Tabs: Masuk / Daftar    |
|   Animated gradient orbs  |   Form fields              |
|   Social proof stats      |   CTA button              |
|   "500+ properti dikelola"|   Trust elements          |
|                           |                           |
+---------------------------+---------------------------+
```

### Mobile
```text
+---------------------------+
|   Mini brand header       |
|   Logo + tagline compact  |
+---------------------------+
|   Form card (glassmorphic)|
|   Full width              |
+---------------------------+
```

### Perubahan Utama di AuthForm.tsx

**Struktur baru**:
- Outer container: `min-h-screen grid grid-cols-1 md:grid-cols-2`
- Panel kiri (brand): hidden di mobile, tampil di desktop dengan background gradient mesh, animated floating orbs (pure CSS), logo besar, tagline, social proof stats
- Panel kanan (form): form card dengan glassmorphic effect (`bg-card/80 backdrop-blur-xl border border-border/50`), shadow elevated

**Background Elements** (CSS-only, no library):
- 2-3 gradient orbs dengan `position: absolute`, `border-radius: 50%`, `filter: blur(80px)`, dan CSS animation `float` yang bergerak perlahan (10-15s duration)
- Warna orbs: primary (cokelat), accent (emas), secondary (krem)
- `overflow: hidden` pada container

**Brand Panel Content**:
- Logo SiHuni besar (Building2 icon dalam container gradient 64x64)
- Headline: "Kelola Properti Lebih Cerdas" dengan `text-4xl font-display font-bold`
- Subtext: "Platform manajemen properti terpercaya di Indonesia"
- Social proof stats: 3 mini-stats dalam row -- "500+ Properti", "1000+ Tenant", "99.9% Uptime"
- Testimonial mini quote (opsional)

---

## 2. Form Card -- Glassmorphic Modern

### Styling Baru

Card form menggunakan glass effect:
```
bg-card/80 backdrop-blur-xl 
border border-border/50 
shadow-[0_8px_32px_rgba(0,0,0,0.12)] 
rounded-2xl
```

### Input Fields -- Elevated Style

Input fields mendapat update visual:
- Border lebih halus: `border-border/60`  
- Focus state: `focus:border-primary focus:ring-1 focus:ring-primary/30` (lebih halus dari ring-2)
- Background: `bg-background/60` (sedikit transparan)
- Rounded lebih besar: `rounded-xl` (bukan `rounded-md`)
- Icon prefix terintegrasi (email icon, lock icon) di dalam input field -- bukan di label

### Tab Triggers -- Pill Style

Ubah tabs dari generic rectangle ke pill/capsule:
- TabsList: `bg-muted/50 rounded-full p-1`
- TabsTrigger active: `rounded-full bg-primary text-primary-foreground shadow-sm`
- TabsTrigger inactive: `rounded-full text-muted-foreground hover:text-foreground`
- Transition: `transition-all duration-300`

### CTA Button -- Gradient + Glow

Submit button mendapat treatment premium:
- Background: `bg-gradient-to-r from-primary to-secondary` 
- Hover: `hover:shadow-[0_4px_20px_rgba(139,111,71,0.4)]` (glow effect warna primary)
- Active: `active:scale-[0.98]`
- Rounded: `rounded-xl`
- Height: `h-12` (lebih besar, lebih prominent)

---

## 3. Form Fields -- Integrated Icons

Ubah input fields agar memiliki icon prefix terintegrasi (modern pattern):

```text
+---------------------------------------+
| [icon]  placeholder text              |
+---------------------------------------+
```

- Email field: Mail icon di kiri
- Password field: Lock icon di kiri, Eye toggle di kanan
- Name field: User icon di kiri
- Phone field: Phone icon di kiri

Implementasi: wrapper `relative` dengan icon `absolute left-3` dan input `pl-10`

---

## 4. Animasi & Micro-interactions

### Background Orbs (CSS Keyframes -- tambah di index.css)

```css
@keyframes float-slow {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}
```

3 orb divs dengan:
- Orb 1: `w-72 h-72 bg-primary/20 blur-[80px]` -- top-left
- Orb 2: `w-96 h-96 bg-accent/15 blur-[100px]` -- bottom-right  
- Orb 3: `w-64 h-64 bg-secondary/20 blur-[60px]` -- center

### Tab Switch Animation
- Content area: tambah `animate-fade-in` saat tab berubah menggunakan key prop

### Form Field Focus
- Label: saat focused, label mendapat `text-primary` transition

### Success State
- Setelah login/register berhasil: button berubah ke checkmark icon dengan `bg-success` selama 500ms sebelum redirect

---

## 5. Onboarding Page -- Redesign

### Layout
Sama seperti auth -- split screen di desktop:
- Panel kiri: ilustrasi/branding dengan animated orbs
- Panel kanan: onboarding steps

### Role Selection Cards -- Premium Treatment
- Ukuran lebih besar dengan icon/emoji prominent
- Hover: `hover:shadow-card-hover hover:scale-[1.02] hover:-translate-y-1`
- Selected: `border-primary bg-primary/10 shadow-[0_0_0_2px_hsl(var(--primary))]` -- double border effect
- Transition smooth: `transition-all duration-300`

### Step Indicator -- Modern Dots
Ubah dari circles + text ke connected dots:
- Active dot: `w-3 h-3 bg-primary rounded-full shadow-[0_0_8px_rgba(139,111,71,0.5)]` (glowing)
- Completed: `w-3 h-3 bg-primary rounded-full`
- Upcoming: `w-3 h-3 bg-muted rounded-full`
- Connector: `h-0.5 w-12 bg-gradient-to-r from-primary to-muted` (gradient transition)

### Business Name Input
- Same glassmorphic + icon prefix style
- Character counter dengan progress ring mini (bukan text counter)

---

## 6. AuthLoadingSkeleton -- Modern

- Tambah animated gradient orbs di background
- Card skeleton dengan glassmorphic effect
- Pulse animation yang lebih halus: `animate-pulse-subtle`

---

## 7. Password Strength Meter -- Visual Upgrade

### Strength Bar
- Ubah dari single bar ke **segmented bar** (4 segments):
  - Setiap segment mewakili level (weak/fair/good/strong)
  - Segment active: filled dengan warna yang sesuai
  - Segment inactive: `bg-muted/50`
  - Gap antar segment: `gap-1`
  - Rounded individual: `rounded-full`

### Requirements
- Tetap grid layout, tapi dengan subtle background saat terpenuhi:
  - Met: `text-success bg-success/10 rounded-md px-2 py-0.5`
  - Unmet: `text-muted-foreground`

---

## Ringkasan File yang Diubah

| File | Perubahan |
|------|-----------|
| `src/index.css` | Tambah keyframes float-slow, utility classes `.glass-card`, `.gradient-orb`, animasi background |
| `src/features/auth/components/AuthForm.tsx` | Redesign total: split-screen layout, glassmorphic card, integrated icons, pill tabs, gradient CTA, animated orbs, success state |
| `src/features/auth/components/PasswordStrengthMeter.tsx` | Segmented strength bar, visual requirement badges |
| `src/features/auth/components/AuthLoadingSkeleton.tsx` | Glassmorphic card, animated orbs background |
| `src/pages/Onboarding.tsx` | Split-screen layout, premium role cards, modern step indicator, glassmorphic styling |

## Urutan Implementasi

1. `index.css` -- CSS utilities dan keyframes baru
2. `AuthForm.tsx` -- Redesign layout dan visual (file terbesar)
3. `PasswordStrengthMeter.tsx` -- Visual upgrade
4. `Onboarding.tsx` -- Redesign layout dan visual
5. `AuthLoadingSkeleton.tsx` -- Update styling

