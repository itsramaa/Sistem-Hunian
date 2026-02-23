
# Redesign Invoices, Payments, Contract Details (Page) + Seed Data

Mengubah Invoice Details dan Payment Details dari dialog menjadi page, membuat Contract Details page (bukan dialog), menerapkan "Warm Luxury Futurism" ke seluruh komponen terkait, dan seeding dummy data.

---

## BAGIAN A: Perubahan Arsitektur -- Detail sebagai Page

Saat ini Invoice Details, Payment Details, dan Contract Details menggunakan Dialog. User meminta ini menjadi dedicated page.

### 1. Contract Details Page (BARU)
- **File baru**: `src/pages/merchant/ContractDetail.tsx`
- Route baru: `/merchant/contracts/:contractId`
- Fetch contract by ID dari database
- Layout: full page dengan glassmorphic sections
- Sections: Contract Info, Tenant Info, Signatures, Documents, Terms, Payment History
- Tombol actions: Sign, Edit Terms, Upload Document, Delete
- Back button ke `/merchant/contracts`
- Design: `bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40` per section

### 2. Invoice Details Page (BARU)
- **File baru**: `src/pages/merchant/InvoiceDetail.tsx`
- Route baru: `/merchant/invoices/:invoiceId`
- Fetch invoice by ID dari database
- Layout: full page with glassmorphic sections
- Sections: Invoice Header (number, status), Amounts breakdown, Tenant/Contract info, Actions (Send, Remind, Mark Paid), Payment History
- Design konsisten dengan Contract Detail page

### 3. Payment Details Page (BARU)
- **File baru**: `src/pages/merchant/PaymentDetail.tsx`
- Route baru: `/merchant/payments/:paymentId`
- Fetch payment by ID + related invoice/contract
- Layout: full page with payment timeline, amount, method, reference
- Actions: Mark Paid (jika pending), Send Reminder

### 4. Tenant Invoice Detail Page (BARU)
- **File baru**: `src/pages/tenant/InvoiceDetail.tsx`
- Route: `/tenant/invoices/:invoiceId`
- Fetch invoice by ID, validate tenant ownership
- Sections: Invoice info, Amount breakdown (termasuk late fee), Pay Now button, Download PDF
- Glass cards styling

### 5. Tenant Contract Detail Page (BARU)
- **File baru**: `src/pages/tenant/ContractDetail.tsx`
- Route: `/tenant/contracts/:contractId`
- Sections: Contract info, Property/Unit info, Signatures, Terms, Documents

### 6. Route Updates
- Update `App.tsx` untuk menambahkan 5 route baru
- Update tables (ContractsTable, InvoicesTable, PaymentsTable) agar klik row navigate ke detail page (bukan open dialog)
- Tenant tables juga navigate ke detail pages

---

## BAGIAN B: Redesign Merchant Invoices Page + Components

### 7. Invoices.tsx (Merchant)
- PageHeader: `gradient-icon-box` + `gradient-cta` Create button
- Pill tabs jika ada tab view

### 8. InvoicesFilters.tsx
- Wrapper: `glass-filter-bar`
- Search: `rounded-xl bg-background/60 border-border/50 pl-10`
- Select: `rounded-xl bg-background/60`

### 9. InvoicesTable.tsx
- Wrapper: `glass-table`
- Header: `bg-gradient-to-r from-muted/80 to-muted/40`, uppercase tracking
- Row hover: `hover:bg-primary/5 cursor-pointer`
- Row click: navigate to detail page
- Status badges: `rounded-full`
- Remove dialog-based view, replace with navigation

### 10. CreateInvoiceDialog.tsx
- DialogContent: `rounded-2xl`
- Inputs: `rounded-xl bg-background/60 border-border/50`
- Contract info box: `rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30`
- Total box: `rounded-2xl bg-primary/10`
- CTA: `gradient-cta`

### 11. InvoicesStats.tsx
- Already uses StatCard -- verify glass style applied

---

## BAGIAN C: Redesign Merchant Payments Page + Components

### 12. Payments.tsx (Merchant)
- PageHeader: `gradient-icon-box` + buttons styled
- Tabs: pill-style `rounded-full`
- Overdue badge: `rounded-full`

### 13. PaymentsFilters.tsx
- `glass-filter-bar`
- Search/Select: `rounded-xl bg-background/60`

### 14. PaymentsTable.tsx
- `glass-table`
- Gradient header
- Row click: navigate to detail page
- Status badges with icons: `rounded-full`
- Actions: `rounded-xl` buttons

### 15. PaymentsStats.tsx
- Already uses StatCard -- verify glass

### 16. OverdueInvoicesTable.tsx
- `glass-table` treatment
- Gradient header
- Days overdue badge: `rounded-full` dengan color coding
- Payment Plan button: `rounded-xl`

### 17. MarkPaidDialog.tsx
- DialogContent: `rounded-2xl`
- Select: `rounded-xl`
- Input: `rounded-xl`
- CTA: `gradient-cta`

### 18. PaymentPlanDialog.tsx
- DialogContent: `rounded-2xl`
- Invoice summary: `rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30`
- Selects: `rounded-xl`
- Schedule items: `rounded-xl bg-card/80`
- CTA: `gradient-cta`

---

## BAGIAN D: Redesign Tenant Invoices & Payments Pages

### 19. tenant/Invoices.tsx
- Summary cards: `glass-stat-card` style -- `bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40`
- Icon containers: `gradient-icon-box` treatment
- Status filter: `rounded-xl bg-background/60`
- Tables: `glass-table` style
- Mobile cards: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- Pay Now button: `gradient-cta`
- Row click navigates to detail page

### 20. tenant/Payments.tsx
- Summary cards: glass style
- Tabs: pill-style `rounded-full`
- Due payment cards: `rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40`
- History cards: glass treatment
- Export button: `rounded-xl`

### 21. PaymentPlanCard.tsx
- Card: `rounded-2xl bg-card/90 backdrop-blur-sm border border-primary/20`
- Stats grid: `rounded-xl bg-card/80`
- Fee waived box: `rounded-xl`
- Schedule items: `rounded-xl`
- CTA buttons: `gradient-cta`

### 22. XenditPaymentModal.tsx
- DialogContent: `rounded-2xl`
- Payment method cards: `rounded-xl bg-card/80 backdrop-blur-sm border border-border/40`
- Selected: `border-primary bg-primary/5`
- Summary: `rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30`
- Expiry countdown: `rounded-xl`
- CTA: `gradient-cta`

### 23. PaymentConfirmationDialog.tsx
- Content: `rounded-2xl`
- Details card: `rounded-2xl bg-card/80 backdrop-blur-sm`
- Info notice: `rounded-xl`
- CTA: `gradient-cta`

### 24. PaymentHistoryExport.tsx
- Button: `rounded-xl`
- Dropdown: `rounded-xl`

---

## BAGIAN E: Remaining Payment Components

### 25. BulkInvoiceGenerator.tsx
- DialogContent: `rounded-2xl`
- Filters: `rounded-xl` inputs/selects
- Contract cards: `rounded-xl bg-card/80 backdrop-blur-sm border border-border/40`
- Selected: `border-primary bg-primary/5`
- Total card: `rounded-xl bg-primary/10`
- Progress: gradient fill
- CTA: `gradient-cta`

### 26. AutoPayWizard.tsx
- Card: `rounded-2xl bg-card/90 backdrop-blur-sm`
- Step dots: gradient fill
- Method cards: `rounded-xl bg-card/80 backdrop-blur-sm border border-border/40`
- Auto-pay toggle card: `rounded-xl`
- Benefits: modern list style
- CTA: `gradient-cta`

### 27. BankAccountManager.tsx
- Card: `rounded-2xl bg-card/90 backdrop-blur-sm`
- Account items: `rounded-xl bg-card/80 border border-border/40 hover:border-primary/30`
- Icon container: `gradient-icon-box`
- Dialog: `rounded-2xl`
- Inputs: `rounded-xl`
- CTA: `gradient-cta`

### 28. DisbursementCalendar.tsx
- Card: `rounded-2xl bg-card/90 backdrop-blur-sm`
- Summary stats: glass cards
- Calendar cells: `rounded-xl`
- Selected date card: glass treatment
- Legend: `rounded-full` pills

### 29. DisbursementScheduleSettings.tsx
- Card: `rounded-2xl bg-card/90 backdrop-blur-sm`
- Selects: `rounded-xl`
- Inputs: `rounded-xl`
- Info box: `rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30`
- CTA: `gradient-cta`

### 30. DisbursementSettings.tsx (vendor)
- Card: `rounded-2xl`
- Selects/Inputs: `rounded-xl`
- Table: `glass-table`
- CTA: `gradient-cta`

---

## BAGIAN F: Seed Dummy Data

Menggunakan contract IDs yang sudah ada:
- Contract 1: `dff3fd8a-68b6-4484-aba2-74956be67735` (tenant: `c6335a8d`, rent: 2.5M)
- Contract 2: `2af5f956-ca52-4d04-93c4-b99f77ceb5a9` (tenant: `b030ae7f`, rent: 3M)
- Merchant: `ed59d094-ba2e-4520-bf97-d76444ae45d1`

### Data yang di-seed:
1. **6 invoices** -- variasi status (draft, sent, paid, overdue)
2. **4 payments** -- variasi status (pending, paid, overdue)
3. Invoices terhubung ke contracts yang existing
4. Dates realistis (bulan lalu sampai bulan depan)

---

## Ringkasan File yang Diubah/Dibuat

| No | File | Tipe | Perubahan |
|----|------|------|-----------|
| 1 | `pages/merchant/ContractDetail.tsx` | BARU | Full-page contract detail |
| 2 | `pages/merchant/InvoiceDetail.tsx` | BARU | Full-page invoice detail |
| 3 | `pages/merchant/PaymentDetail.tsx` | BARU | Full-page payment detail |
| 4 | `pages/tenant/InvoiceDetail.tsx` | BARU | Tenant invoice detail page |
| 5 | `pages/tenant/ContractDetail.tsx` | BARU | Tenant contract detail page |
| 6 | `App.tsx` | EDIT | Add 5 new routes |
| 7 | `InvoicesFilters.tsx` | EDIT | glass-filter-bar |
| 8 | `InvoicesTable.tsx` | EDIT | glass-table, row click navigate |
| 9 | `CreateInvoiceDialog.tsx` | EDIT | rounded-2xl, gradient CTA |
| 10 | `Invoices.tsx` (merchant) | EDIT | gradient-cta, navigate to detail |
| 11 | `PaymentsFilters.tsx` | EDIT | glass-filter-bar |
| 12 | `PaymentsTable.tsx` | EDIT | glass-table, row click navigate |
| 13 | `Payments.tsx` (merchant) | EDIT | pill tabs, gradient CTA |
| 14 | `OverdueInvoicesTable.tsx` | EDIT | glass-table |
| 15 | `MarkPaidDialog.tsx` | EDIT | rounded-2xl, gradient CTA |
| 16 | `PaymentPlanDialog.tsx` | EDIT | rounded-2xl, glass cards |
| 17 | `tenant/Invoices.tsx` | EDIT | glass cards, navigate to detail |
| 18 | `tenant/Payments.tsx` | EDIT | glass cards, pill tabs |
| 19 | `PaymentPlanCard.tsx` | EDIT | glassmorphic card |
| 20 | `XenditPaymentModal.tsx` | EDIT | rounded-2xl, glass methods |
| 21 | `PaymentConfirmationDialog.tsx` | EDIT | glass details card |
| 22 | `PaymentHistoryExport.tsx` | EDIT | rounded-xl |
| 23 | `BulkInvoiceGenerator.tsx` | EDIT | glass cards, gradient CTA |
| 24 | `AutoPayWizard.tsx` | EDIT | glass method cards |
| 25 | `BankAccountManager.tsx` | EDIT | glass account items |
| 26 | `DisbursementCalendar.tsx` | EDIT | glass calendar |
| 27 | `DisbursementScheduleSettings.tsx` | EDIT | rounded-xl, gradient CTA |
| 28 | `DisbursementSettings.tsx` | EDIT | glass-table |
| 29 | `ContractsTable.tsx` | EDIT | Row click navigate to detail |
| 30 | `Contracts.tsx` (merchant) | EDIT | Remove dialog, navigate |
| 31 | DB Migration | SQL | Seed invoices + payments |

## Urutan Implementasi

1. Seed data (DB migration) -- data dulu supaya halaman bisa menampilkan konten
2. Detail pages (ContractDetail, InvoiceDetail, PaymentDetail -- merchant + tenant)
3. Route updates di App.tsx
4. Update tables agar row click navigate ke detail pages
5. Redesign filter + table components (glass styling)
6. Redesign dialog components
7. Redesign tenant pages
8. Redesign remaining payment components (AutoPay, BankAccount, Disbursement, dll)
