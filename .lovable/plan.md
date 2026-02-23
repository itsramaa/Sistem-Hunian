
# Redesign Sidebar, NavUser, Navbar (Search + Theme Toggle) & Support Page

Menerapkan "Warm Luxury Futurism" ke seluruh navigation shell (Sidebar, NavUser, Navbar header) serta membuat halaman Support baru yang fungsional dan cantik.

---

## BAGIAN A: Sidebar Redesign

### 1. AppSidebar.tsx
- Sidebar tetap `variant="inset" collapsible="icon"`
- Update secondary nav: "Support" link mengarah ke `/${role}/support` (bukan settings)
- Tambahkan glassmorphic separator antara NavMain dan NavSecondary

### 2. TeamSwitcher.tsx -- Glassmorphic Redesign
- Icon box: `rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20` (replace plain `iconBgClass`)
- Brand text: improved typography weight
- Hover: `hover:bg-sidebar-accent/50 transition-all duration-200`
- Add subtle shimmer/glow on hover

### 3. NavMain.tsx -- Enhanced Styling
- SidebarGroupLabel: `uppercase text-[10px] tracking-widest font-semibold text-sidebar-foreground/50`
- Active item: `data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/15 data-[active=true]:to-primary/5 data-[active=true]:border-l-2 data-[active=true]:border-primary`
- Hover: `hover:bg-sidebar-accent/60 transition-all duration-150`
- Icon: active = `text-primary`, inactive = `text-sidebar-foreground/60`
- rounded-lg items

### 4. NavSecondary.tsx -- Enhanced Styling
- Items: same glass hover treatment as NavMain
- Separator above via `className="mt-auto"` (push to bottom)

---

## BAGIAN B: NavUser Redesign

### 5. NavUser.tsx -- Full Glassmorphic Redesign
- Avatar: `rounded-xl` (from `rounded-lg`) with gradient ring `ring-2 ring-primary/20`
- Trigger hover: `hover:bg-sidebar-accent/60`
- DropdownMenuContent: `rounded-2xl backdrop-blur-xl bg-popover/95 border border-border/40 shadow-xl`
- User info section: glassmorphic treatment
- Tier badges: `rounded-full` (already done but verify)
- Menu items: `rounded-xl` hover, icon gradient treatment
- "Upgrade to Pro": `gradient-cta rounded-xl` styling in dropdown
- Logout: `text-destructive hover:bg-destructive/10 rounded-xl`
- Separator: `bg-border/30`

---

## BAGIAN C: Navbar Header Redesign (DashboardLayout + MobileHeader)

### 6. DashboardLayout.tsx -- Add Theme Toggle + Search Command
- Header area: add glassmorphic treatment `bg-background/80 backdrop-blur-sm border-b border-border/30`
- Right side actions (before NotificationsDropdown): add `ThemeToggle` component and `SearchCommand` trigger button
- Layout: `[SidebarTrigger | Separator | Breadcrumb] ... [SearchTrigger | ThemeToggle | Notifications]`
- Search trigger: `rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 px-3 py-1.5` with Search icon + "Search..." text + `Ctrl+K` shortcut badge

### 7. ThemeToggle.tsx -- BARU (`src/shared/components/ui/ThemeToggle.tsx`)
- Menggunakan `useTheme` dari `src/shared/context/theme-context.tsx`
- DropdownMenu with 3 options: Light (Sun icon), Dark (Moon icon), System (Monitor icon)
- Trigger: `Button variant="ghost" size="icon"` with `rounded-xl`
- Animated icon transition (Sun/Moon rotate)
- DropdownMenuContent: `rounded-xl backdrop-blur-xl`
- Items: `rounded-lg` with active check indicator

### 8. SearchCommand.tsx -- BARU (`src/shared/components/layouts/SearchCommand.tsx`)
- Menggunakan shadcn `CommandDialog` (already available in `command.tsx`)
- Trigger via `Ctrl+K` / `Cmd+K` keyboard shortcut
- Groups: "Navigation" (all nav items from role config), "Quick Actions" (create contract, add property, etc.)
- Each item shows icon + label + path
- Clicking navigates to the path
- Search filters across all items
- Glass treatment on dialog: `rounded-2xl`

### 9. MobileHeader.tsx -- Add Theme Toggle
- Right side: add `ThemeToggle` before notifications
- Keep compact sizing

---

## BAGIAN D: Support Page -- BARU

### 10. Support.tsx -- BARU untuk tiap role
Buat `src/pages/merchant/Support.tsx` (dan shared untuk semua role):

**Layout:**
- PageHeader: `gradient-icon-box` with LifeBuoy icon, title "Pusat Bantuan"
- 2-column grid (main + sidebar)

**Main Content:**
- **FAQ Accordion** -- glassmorphic accordion items
  - `bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40`
  - AccordionTrigger: `rounded-xl hover:bg-primary/5`
  - AccordionContent: `rounded-b-xl`
  - 6-8 FAQ items (billing, contracts, maintenance, payments, etc.)

- **Contact Form** -- glassmorphic card
  - Subject select: `rounded-xl bg-background/60`
  - Message textarea: `rounded-xl bg-background/60`
  - Attachments: upload area with glass treatment
  - Submit: `gradient-cta rounded-xl`
  - Success state: glassmorphic success card

**Sidebar:**
- **Quick Contact** card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
  - Email: support@sihuni.com (clickable)
  - WhatsApp link
  - Business hours info
- **Useful Links** card: links to docs, billing, settings
- **System Status** card: mock status indicators (API, Database, Payments -- all green)

### 11. Route Registration -- App.tsx
- Add lazy import: `const MerchantSupport = lazy(() => import("@/pages/merchant/Support"))`
- Add route: `/merchant/support` -> MerchantSupport
- Repeat for tenant, vendor, admin (or create shared Support page with role prop)

### 12. Navigation Config Update
- Sidebar secondary "Support" url update to `/${role}/support`

---

## BAGIAN E: ContractDetail -- Already a Page (Verify)

ContractDetail.tsx sudah merupakan page (bukan dialog) berdasarkan review. Sudah memiliki glassmorphic styling. Tidak perlu refactor -- hanya perlu verify bahwa routing dari ContractsTable navigate ke sana (sudah dilakukan di message sebelumnya).

---

## Ringkasan File yang Diubah/Dibuat

| No | File | Tipe | Perubahan |
|----|------|------|-----------|
| 1 | `app-sidebar.tsx` | EDIT | Support link update |
| 2 | `team-switcher.tsx` | EDIT | Glassmorphic icon box, hover effects |
| 3 | `nav-main.tsx` | EDIT | Active gradient, label styling |
| 4 | `nav-secondary.tsx` | EDIT | Enhanced hover, mt-auto |
| 5 | `nav-user.tsx` | EDIT | Glass dropdown, rounded-2xl, gradient CTA |
| 6 | `DashboardLayout.tsx` | EDIT | Add ThemeToggle + SearchCommand to header |
| 7 | `MobileHeader.tsx` | EDIT | Add ThemeToggle |
| 8 | `ThemeToggle.tsx` | BARU | Theme switcher dropdown component |
| 9 | `SearchCommand.tsx` | BARU | Ctrl+K command palette with nav items |
| 10 | `Support.tsx` (merchant) | BARU | Full support page with FAQ, contact form, sidebar |
| 11 | `App.tsx` | EDIT | Add support route |
| 12 | `navigation-config.ts` | EDIT | (no change needed -- secondary nav handled in app-sidebar) |

## Urutan Implementasi

1. ThemeToggle component (new, no dependencies)
2. SearchCommand component (new, depends on navigation-config)
3. Sidebar components (TeamSwitcher, NavMain, NavSecondary, NavUser)
4. AppSidebar update (Support link)
5. DashboardLayout + MobileHeader (integrate ThemeToggle + SearchCommand)
6. Support page (new)
7. App.tsx route registration
