
# Perbaikan: Add Payment, Detail Payment/Invoice Lengkap, Laporan, dan Seed Data

---

## 1. Merchant Bisa Add Payment (Fitur Baru)

**Masalah:** Saat ini merchant hanya bisa menandai pembayaran sebagai "paid" (MarkPaidDialog), tetapi tidak bisa membuat pembayaran baru secara manual.

**Buat `CreatePaymentDialog.tsx`:**
- File baru: `src/features/payments/components/CreatePaymentDialog.tsx`
- Form fields:
  - Kontrak (dropdown dari active contracts, menampilkan unit + tenant)
  - Jumlah (Rp)
  - Tipe Pembayaran (rent, deposit, utility, other)
  - Metode Pembayaran (bank_transfer, cash, card, eft, other)
  - Referensi (opsional)
  - Tanggal Jatuh Tempo
  - Bukti Pembayaran (file upload opsional ke bucket `payment-proofs`)
- Submit: insert ke tabel `payments` dengan status `pending` (atau `paid` jika bukti & metode disertakan)
- Auto-fill `merchant_id`, `tenant_user_id`, `contract_id` dari kontrak yang dipilih

**Update `useMerchantPayments.ts`:**
- Tambah mutation `createPayment` untuk insert payment baru

**Update `Payments.tsx`:**
- Tambah tombol "Tambah Pembayaran" (Plus icon) di header sebelah Refresh
- onClick: buka `CreatePaymentDialog`

---

## 2. Detail Pembayaran Lebih Lengkap + Bukti Foto

**Masalah:** `PaymentDetail.tsx` hanya menampilkan amount, type, due date, method, reference. Tidak ada info tenant, kontrak, unit, atau bukti pembayaran.

**Perbaikan di `PaymentDetail.tsx`:**
- Fetch data relasi: join payments dengan contracts (untuk unit info), profiles (untuk tenant name/email)
- Tambah query terpisah atau update query payments dengan select relasi

**Konten tambahan yang ditampilkan:**
- **Info Penyewa:** Nama, email, phone (dari profiles via tenant_user_id)
- **Info Kontrak:** Nomor kontrak, unit, property (dari contracts via contract_id)
- **Bukti Pembayaran:** Jika `proof_photo_url` ada, tampilkan gambar dalam card dengan lightbox zoom
- **Timeline:** Created at, Due date, Paid at dalam visual timeline
- **Rincian Lengkap:** Semua field yang ada di DB (created_at, updated_at)

**Update `useMerchantPayments.ts`:**
- Update query payments untuk join: `select('*, contracts(unit_id, units(unit_number, properties(name))), profiles:tenant_user_id(full_name, email, phone)')` -- atau buat query terpisah di detail page

**Alternatif:** Buat hook `usePaymentDetail(paymentId)` khusus untuk detail page agar bisa fetch relasi tanpa mengubah list query.

---

## 3. Detail Invoice Lebih Lengkap

**Masalah:** `InvoiceDetail.tsx` tidak menampilkan info tenant, kontrak, unit, atau line items.

**Perbaikan di `InvoiceDetail.tsx`:**
- Fetch relasi: tenant profile (nama, email), contract info (unit, property)
- Tampilkan `line_items` (JSONB column) jika ada, sebagai tabel item baris

**Konten tambahan:**
- **Info Penyewa:** Card dengan nama, email tenant
- **Info Kontrak & Unit:** Property name, unit number
- **Line Items:** Tabel dengan item, qty, harga jika `line_items` tersedia
- **Timeline Visual:** Created -> Issued -> Due -> Paid (dengan tanggal masing-masing)
- **Grace Period Info:** Jika `grace_period_active`, tampilkan badge
- **Overdue Info:** Jika `overdue_since`, tampilkan durasi overdue
- **Original Amount vs Current:** Jika `original_amount` berbeda dari `amount`, tampilkan perubahan (biasanya karena late fee)

---

## 4. Ringkasan Analitik Dipindahkan ke Page Laporan

**Masalah:** User menginginkan ringkasan analitik (ROI, revenue summary, occupancy) yang sebelumnya ada di InsightsHub sekarang ada di page Laporan.

**Perbaikan di `Reports.tsx`:**
- Tambah tab baru "ROI & Ringkasan" atau masukkan ke tab "Overview"
- Hitung dan tampilkan:
  - **ROI per properti**: (revenue - costs) / costs * 100
  - **Total Revenue vs Target**
  - **Average Occupancy Rate**
  - **Average Payment Collection Time**
  - **Maintenance Cost Ratio**
- Data sudah tersedia dari `useReportsData` hook yang sudah digunakan

**Konten ROI:**
- Card ROI per properti (jika ada data renovation_cost / purchase_price)
- Yield analysis: annual revenue / property value
- Net Operating Income summary

---

## 5. Seed Data: Maintenance, Penjaga, dan Data Pelengkap

**Masalah:** Data maintenance hanya 4 records, property_guardians kosong (0 records), dan beberapa data pelengkap perlu ditambah.

**Seed data via SQL INSERT (menggunakan insert tool):**

**Property Guardians (4-6 records):**
- 3 penjaga untuk property `ee91fa84-fcb4-4a01-a9d6-b26afc30e75e`
- Variasi: aktif, pensiun
- Data: nama, phone, alamat, ID number, gaji, frekuensi gaji, tanggal mulai

**Maintenance Requests tambahan (4-6 records baru):**
- Variasi kategori: plumbing, electrical, structural, cleaning, pest_control
- Variasi priority: urgent, high, medium, low
- Variasi status: pending, in_progress, completed
- Beberapa dengan vendor assigned, beberapa tanpa

**Maintenance Timeline Entries:**
- Entries untuk setiap maintenance request baru

**Payments tambahan (jika kurang):**
- Pastikan ada payments dengan proof_photo_url untuk testing

---

## Daftar File yang Diubah/Dibuat

| File | Perubahan |
|------|-----------|
| `CreatePaymentDialog.tsx` (baru) | Dialog form tambah pembayaran |
| `useMerchantPayments.ts` | Tambah createPayment mutation |
| `Payments.tsx` | Tambah tombol "Tambah Pembayaran" |
| `PaymentDetail.tsx` | Redesign lengkap dengan relasi + bukti foto |
| `InvoiceDetail.tsx` | Redesign lengkap dengan relasi + line items + timeline |
| `Reports.tsx` | Tambah section ROI & ringkasan analitik |
| **Seed SQL** | Insert guardians, maintenance, timeline entries |

---

## Catatan Teknis

- Untuk detail payment/invoice yang join relasi, buat hook terpisah `usePaymentDetail` dan `useInvoiceDetail` agar tidak mempengaruhi performa list query
- Bukti pembayaran ditampilkan dengan click-to-zoom menggunakan Dialog + img fullscreen
- Seed data menggunakan ID merchant dan property yang sudah ada di database
- ROI calculation memerlukan data `purchase_price` atau `renovation_cost` dari properties -- jika tidak tersedia, tampilkan yield berdasarkan revenue saja
