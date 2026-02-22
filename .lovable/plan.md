

# Reorganisasi Sidebar Merchant Portal

## Masalah Saat Ini

Sidebar merchant saat ini punya **13 menu item** dalam 2 grup, tapi pengelompokannya kurang logis:

```text
Menu (11 item -- terlalu banyak, campur aduk):
  Dashboard, Properties, Units, Tenants, Contracts,
  Invoices, Payments, Maintenance, Move-Outs, Reports, OCR Tutorial

DSS Intelligence (2 item):
  ML Analytics, DSS Advisor
```

Masalahnya:
- Grup "Menu" berisi 11 item tanpa struktur -- user harus scan semua untuk cari yang dibutuhkan
- Properties, Units, Tenants adalah **pengelolaan aset**, tapi dicampur dengan Invoices, Payments yang merupakan **keuangan**
- OCR Tutorial nyasar di antara menu operasional
- Move-Outs seharusnya dekat dengan Contracts dan Tenants (siklus tenant lifecycle)
- Tidak ada pemisahan antara **daily tasks** vs **monitoring/analytics**

## Solusi: Pengelompokan Berdasarkan Domain Bisnis

Berdasarkan best practice Information Architecture (dari UI/UX Designer skill: "Site mapping and navigation hierarchy optimization", "Mental model alignment and cognitive load reduction") dan business process documentation, menu dikelompokkan berdasarkan **aktivitas kerja sehari-hari** merchant:

```text
Utama
  Dashboard

Properti                        (Kelola aset fisik)
  Properties
  Units
  Tenants

Keuangan                        (Arus uang masuk/keluar)
  Contracts
  Invoices
  Payments

Operasional                     (Tugas harian)
  Maintenance
  Move-Outs

Analitik                        (Monitoring & keputusan)
  Reports
  ML Analytics
  DSS Advisor

Bantuan                         (Edukasi)
  OCR Tutorial
```

## Kenapa Pengelompokan Ini?

| Grup | Alasan | Frekuensi Akses |
|------|--------|-----------------|
| Utama | Dashboard selalu di atas, entry point utama | Tinggi (harian) |
| Properti | Asset management -- saling terkait erat | Sedang (mingguan) |
| Keuangan | Money flow -- contracts memicu invoices memicu payments | Tinggi (harian) |
| Operasional | Task-based -- maintenance requests & tenant move-outs | Sedang (per event) |
| Analitik | Decision support -- semua reporting & AI di satu tempat | Rendah (mingguan/bulanan) |
| Bantuan | Edukasi fitur, bukan menu operasional | Rendah (sekali pakai) |

## Perubahan Teknis

### File yang diubah: `src/shared/components/layouts/navigation-config.ts`

Hanya mengubah bagian `merchant.mainNav` -- menata ulang dari 2 grup menjadi 6 grup yang lebih terstruktur. Tidak ada perubahan pada halaman, routing, atau komponen lain.

### Icon yang diperbaiki:
- Contracts: `FileText` (duplikat dengan Invoices) -> `ClipboardList` (lebih spesifik)
- Move-Outs: `LogOut` (membingungkan, terlihat seperti logout) -> `UserMinus` atau tetap `LogOut` tapi dipisah ke grup yang jelas

### Perubahan data structure:

```typescript
merchant: {
  mainNav: [
    {
      label: "Utama",
      items: [
        { path: "/merchant", icon: LayoutDashboard, label: "Dashboard" },
      ],
    },
    {
      label: "Properti",
      items: [
        { path: "/merchant/properties", icon: Building2, label: "Properties" },
        { path: "/merchant/units", icon: Home, label: "Units" },
        { path: "/merchant/tenants", icon: Users, label: "Tenants" },
      ],
    },
    {
      label: "Keuangan",
      items: [
        { path: "/merchant/contracts", icon: ClipboardList, label: "Contracts" },
        { path: "/merchant/invoices", icon: FileText, label: "Invoices" },
        { path: "/merchant/payments", icon: Wallet, label: "Payments" },
      ],
    },
    {
      label: "Operasional",
      items: [
        { path: "/merchant/maintenance", icon: Wrench, label: "Maintenance" },
        { path: "/merchant/move-outs", icon: LogOut, label: "Move-Outs" },
      ],
    },
    {
      label: "Analitik",
      items: [
        { path: "/merchant/reports", icon: BarChart3, label: "Reports" },
        { path: "/merchant/ml-analytics", icon: Brain, label: "ML Analytics" },
        { path: "/merchant/dss-advisor", icon: Lightbulb, label: "DSS Advisor" },
      ],
    },
    {
      label: "Bantuan",
      items: [
        { path: "/merchant/ocr-tutorial", icon: ScanText, label: "OCR Tutorial" },
      ],
    },
  ],
}
```

## Dampak

- **Hanya 1 file yang berubah** (`navigation-config.ts`)
- **Tidak ada breaking change** -- semua route dan halaman tetap sama
- **Cognitive load berkurang** -- dari scan 11 item flat menjadi grup 1-3 item yang jelas konteksnya
- Sesuai dengan prinsip desain SiHuni: "Information hierarchy clear; users understand at a glance"
