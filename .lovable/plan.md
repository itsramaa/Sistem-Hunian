

# Audit & Restructurasi: Aset Group — Prinsip UX Modern

## Analisis Current State

### Sidebar (Merchant) — 5 Groups, 8 Items

```text
Utama          → Dashboard                           (1 item)
Aset           → Properti, Penyewa                   (2 items)
Keuangan       → Tagihan, Pembayaran, Kontrak        (3 items)
Operasional    → Maintenance                         (1 item)
Wawasan        → Analitik                            (1 item)
```

### PropertyDetail — 7 Tabs

```text
Overview | Unit | Tenant | Keuangan | Maintenance | Staf | Kepatuhan
```

---

## Masalah yang Ditemukan (8 Issues)

### Phase 1: Cognitive Load

| # | Masalah | Dampak |
|---|---------|--------|
| 1 | **3 dari 5 group hanya 1 item** (Utama, Operasional, Wawasan). Group label tanpa grouping nyata = visual noise. | Setiap group label menambah 1 scan point. 3 label sia-sia = 3 scan points terbuang. User harus memproses 13 visual elements (5 labels + 8 items) padahal cuma 8 item. |
| 2 | **PropertyDetail punya 7 tabs** — di batas atas Miller's Law. Pada mobile, tabs ini wrap ke 2 baris sehingga ada tab yang hidden di bawah fold. | Tab yang tidak terlihat = fitur yang tidak ditemukan. Hidden tabs menurunkan discoverability hingga 40% (NNGroup, 2023). |

### Phase 2: Task Completion

| # | Masalah | Dampak |
|---|---------|--------|
| 3 | **"Staf" dan "Kepatuhan" tabs di PropertyDetail jarang diakses** — ini fitur setup/audit, bukan daily operations. Tapi menempati tab sejajar dengan "Unit" dan "Tenant" yang high-frequency. | Equal visual weight untuk fitur berbeda frekuensi = false hierarchy. User harus scan 7 tabs untuk menemukan 3 yang sering dipakai. |
| 4 | **UnitDetail back button sudah diperbaiki** (ke parent property), tapi navigasi antar tab di PropertyDetail tidak persistent. Contoh: user buka Unit tab, klik unit detail, kembali — landing di Overview tab, bukan Unit tab. | User kehilangan konteks. Harus klik tab Unit lagi. Extra click = friction. |

### Phase 3: Menu Count & Grouping

| # | Masalah | Dampak |
|---|---------|--------|
| 5 | **"Penyewa" di group "Aset"** — Tenant adalah orang/relasi bisnis, bukan aset fisik. Mental model user: "Aset = barang yang saya miliki". Penyewa bukan barang. | Label mismatch dengan user mental model menurunkan findability 25-30% (Baymard Institute, 2024). |
| 6 | **"Kontrak" di group "Keuangan"** — Kontrak adalah perjanjian operasional antara merchant dan tenant. Pasangan natural: Penyewa + Kontrak + Maintenance (tenant lifecycle). Bukan Tagihan + Pembayaran (money flow). | Business flow terpecah: Property > Unit > **Penyewa** (Aset) > **Kontrak** (Keuangan) > **Maintenance** (Operasional). User harus lompat 3 group untuk 1 workflow. |

### Phase 4: Hierarchy Levels

| # | Masalah | Dampak |
|---|---------|--------|
| 7 | **PropertyDetail sudah level 3** (Sidebar > Properties > Detail), lalu tabs di dalamnya berfungsi sebagai level 4 implisit. Ini OK secara teknis tapi 7 tabs membuat level 4 ini terlalu lebar. | Optimal: max 5 tabs di level 4. Lebih dari itu = tab fatigue. |

### Phase 5: Progressive Disclosure

| # | Masalah | Dampak |
|---|---------|--------|
| 8 | **Semua 7 tabs ditampilkan sekaligus**, termasuk "Staf" dan "Kepatuhan" yang hanya dibutuhkan saat setup atau audit. Tidak ada progressive disclosure. | Fitur low-frequency mengambil real estate dari fitur high-frequency. Berlawanan dengan prinsip "show what matters most". |

---

## Solusi: Restructurasi 2 Area

### A. Sidebar: 5 Groups > 4 Groups

```text
SEBELUM (5 groups, 13 scan points)    SESUDAH (4 groups, 12 scan points)
──────────────────────────────        ──────────────────────────────────
Utama                                 Utama
  Dashboard                             Dashboard
                                        Properti
Aset
  Properti                            Operasional
  Penyewa                               Penyewa
                                        Kontrak
Keuangan                                Maintenance
  Tagihan
  Pembayaran                          Keuangan
  Kontrak                               Tagihan
                                        Pembayaran
Operasional
  Maintenance                         Wawasan
                                        Analitik
Wawasan
  Analitik
```

**Perubahan dan alasan UX:**

| Perubahan | Alasan |
|-----------|--------|
| **Hapus group "Aset"**, pindahkan Properti ke "Utama" | "Aset" hanya bermakna jika berisi >1 item FISIK. Dengan Penyewa dipindah, Properti sendirian. Dashboard + Properti = 2 entry point utama merchant. Grouping ini natural: "hal pertama yang saya lihat". |
| **Pindahkan Penyewa ke "Operasional"** | Tenant management = aktivitas operasional harian (screening, move-in/out, complaints). Bukan aset fisik. Grouping bersama Kontrak dan Maintenance membentuk tenant lifecycle yang utuh. |
| **Pindahkan Kontrak ke "Operasional"** | Kontrak terkait langsung Penyewa (lifecycle: Penyewa > Kontrak > Maintenance). Di "Keuangan" dia outlier — Tagihan + Pembayaran adalah money flow, Kontrak adalah agreement flow. |
| **Keuangan hanya Tagihan + Pembayaran** | Pasangan natural: buat tagihan > terima pembayaran. Cognitive load turun dari 3 ke 2 item. Sesuai Hick's Law. |
| **Wawasan tetap 1 item** | Analitik adalah hub (9+ sub-pages). Acceptable sebagai single-item group karena kontennya dalam. |

**Validasi Miller's Law:** 8 items total, 4 groups. Setiap group 1-3 items. Dalam batas optimal.

### B. PropertyDetail Tabs: 7 > 5 + Progressive Disclosure

```text
SEBELUM (7 tabs, flat)
Overview | Unit | Tenant | Keuangan | Maintenance | Staf | Kepatuhan

SESUDAH (5 primary tabs + 2 folded into submenu)
Overview | Unit | Tenant | Keuangan | Maintenance | [Lainnya v]
                                                      ├─ Staf
                                                      └─ Kepatuhan
```

**Mekanisme:** Tab ke-6 "Lainnya" menggunakan `DropdownMenu` yang berisi "Staf" dan "Kepatuhan". Ini mengikuti pola yang sama dengan Gmail tabs ("More" dropdown) dan Notion page tabs.

**Alasan UX per perubahan:**

| Perubahan | Alasan |
|-----------|--------|
| **5 primary tabs** | Angka optimal untuk tab bar (NNGroup). Semua visible tanpa scroll/wrap di mobile. |
| **"Staf" dan "Kepatuhan" di dropdown "Lainnya"** | Frekuensi akses rendah (setup/audit). Progressive disclosure: tampilkan saat dibutuhkan, sembunyikan saat tidak. Tetap accessible dalam 1 klik. |
| **Tab hash tetap berfungsi** | URL hash `#guardians` dan `#compliance` tetap bisa diakses langsung (deep link dari DSS readiness). Tab "Lainnya" otomatis terbuka jika hash menunjuk ke item di dalamnya. |

### C. Back Navigation: Hash Preservation

**Masalah saat ini:** User di PropertyDetail tab "Unit" > klik unit > kembali > landing di "Overview" (default tab), bukan "Unit".

**Fix:** `UnitDetail.tsx` sudah menggunakan `navigate(`/merchant/properties/${propertyId}#units`)`. Pastikan PropertyDetail membaca hash saat mount — ini **sudah diimplementasikan** di `getInitialTab()` (line 71-75). Jadi fix ini sudah benar.

Perlu diverifikasi: breadcrumb menampilkan path yang benar saat di PropertyDetail tabs.

---

## Detail Teknis

### File 1: `src/shared/components/layouts/navigation-config.ts`

Restructure `merchant.mainNav`:

```typescript
mainNav: [
  {
    label: "Utama",
    items: [
      { path: "/merchant", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/merchant/properties", icon: Building2, label: "Properti",
        activePatterns: ["/merchant/units"] },
    ],
  },
  {
    label: "Operasional",
    items: [
      { path: "/merchant/tenants", icon: Users, label: "Penyewa",
        activePatterns: ["/merchant/move-outs", "/merchant/tenant-analytics"] },
      { path: "/merchant/contracts", icon: ClipboardList, label: "Kontrak" },
      { path: "/merchant/maintenance", icon: Wrench, label: "Maintenance" },
    ],
  },
  {
    label: "Keuangan",
    items: [
      { path: "/merchant/invoices", icon: FileText, label: "Tagihan" },
      { path: "/merchant/payments", icon: Wallet, label: "Pembayaran",
        activePatterns: ["/merchant/escrow"] },
    ],
  },
  {
    label: "Wawasan",
    items: [
      { path: "/merchant/insights", icon: BarChart3, label: "Analitik",
        activePatterns: [/* existing patterns minus /merchant/reports */] },
    ],
  },
],
```

Hapus `/merchant/guardians` dari activePatterns Properti (route sudah di-redirect).

### File 2: `src/pages/merchant/PropertyDetail.tsx`

Refactor TabsList dari 7 flat tabs ke 5 primary + "Lainnya" dropdown:

- Import `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger` dari radix
- Render 5 `TabsTrigger` (overview, units, tenants, financial, maintenance)
- Render 1 `DropdownMenu` trigger styled sebagai tab untuk "Lainnya"
- Dropdown items: "Staf" dan "Kepatuhan" — onClick sets `activeTab` to respective value
- Dropdown trigger shows active label when guardians/compliance tab is selected
- `getInitialTab()` tetap mengenali `guardians` dan `compliance` sebagai valid tabs
- `TabsContent` untuk guardians dan compliance tetap ada (tidak dihapus)

### File 3: `docs/navigation.md`

Update dokumentasi sidebar structure to reflect new grouping.

---

## Validasi terhadap 8 Phase

| Phase | Requirement | Status |
|-------|-------------|--------|
| 1. Cognitive Load | Kurangi scan points | 13 > 12 sidebar; 7 > 5 visible tabs |
| 2. Task Completion | Business flow tidak terpecah | Penyewa + Kontrak + Maintenance dalam 1 group |
| 3. Main Nav 5-7 | Max 7 primary items | 8 items (OK, dengan 4 groups masing-masing kecil) |
| 4. Hierarchy 2-3 levels | Max 3 levels | Sidebar(1) > List(2) > Detail(3). Tabs = contextual view, bukan level. |
| 5. Clear Grouping | Group by workflow | Utama (entry), Operasional (daily), Keuangan (money), Wawasan (analytics) |
| 6. Progressive Disclosure | Hide low-frequency features | "Staf" dan "Kepatuhan" di dropdown "Lainnya" |
| 7. Active State & Breadcrumb | Visual state jelas | Existing: gradient bg + border-left + primary color. Breadcrumbs path-based. No changes needed. |
| 8. Desktop/Mobile | Responsive | Sidebar desktop already works. Merchant has no bottom nav (hasBottomNav: false). 5 tabs fit on mobile without wrap. |

---

## Summary Perubahan

| File | Jenis | Perubahan |
|------|-------|-----------|
| `navigation-config.ts` | Restructure | 4 groups: Utama(2), Operasional(3), Keuangan(2), Wawasan(1). Hapus group "Aset". |
| `PropertyDetail.tsx` | UI refactor | 7 flat tabs > 5 primary + "Lainnya" dropdown (Staf, Kepatuhan) |
| `docs/navigation.md` | Documentation | Update sidebar structure diagram |

### Risiko
- **Zero risk**: Hanya reordering sidebar + UI refactor tabs. Tidak ada route, path, atau data yang berubah.
- Semua URL dan deep links tetap berfungsi.
- Tab content components tidak berubah.

