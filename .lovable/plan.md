

# Maksimalkan Login, Register & Onboarding Pages

Berdasarkan audit menyeluruh menggunakan skills: `signup-flow-cro`, `onboarding-cro`, `form-cro`, `responsive-design`, `accessibility-compliance`, `interaction-design`, `visual-design-foundations`, `ui-ux-designer`, `frontend-security-coder`, dan `auth-implementation-patterns`.

---

## 1. AuthForm (Login & Register) -- `src/features/auth/components/AuthForm.tsx`

### A. Signup Flow CRO -- Kurangi Friction

**Masalah**: Form register punya 6 field (nama, phone, email, password, confirm password, merchant code). Ini terlalu banyak -- setiap field mengurangi conversion rate 10-25%.

**Perbaikan**:
- **Pindahkan field "Nama Lengkap" ke atas email** -- field termudah duluan (progressive commitment pattern)
- Urutan baru: Nama > Email > Phone > Password > Confirm Password
- **Tambah trust element** di bawah form: "Data Anda aman dan terenkripsi" dengan ikon Lock
- **Ubah CTA "Daftar"** menjadi lebih action-oriented: **"Mulai Sekarang"** (bukan generic "Daftar")
- **Tambah social proof** di bawah card: jumlah user atau tagline singkat

### B. Form CRO -- Error Handling & Microcopy

**Masalah**: Placeholder "John Doe" tidak sesuai target market Indonesia.

**Perbaikan**:
- Ubah placeholder nama: `"John Doe"` menjadi `"Budi Santoso"`
- Tambah **inline email typo detection**: jika user ketik `@gmial.com`, tampilkan suggestion `"Mungkin maksud Anda @gmail.com?"`
- Error message pada submit harus **focus ke field pertama yang error** (auto-scroll + focus)
- Tambah **"Sudah punya akun? Masuk"** link di bawah form register (dan sebaliknya di login)

### C. Responsive Design -- Mobile-First Fixes

**Masalah**: Card `max-w-md` tanpa `w-[95vw]` bisa terlalu lebar/sempit di beberapa device.

**Perbaikan**:
- Ubah container: `max-w-md` ke `max-w-md w-[95vw] sm:w-full`
- Tambah `safe-area-inset` padding untuk notch devices: `pb-safe`
- Password strength meter grid: pastikan tidak overflow di mobile kecil
- Tab triggers: tambah `text-sm sm:text-base` untuk readability di mobile

### D. Accessibility Compliance

**Yang sudah bagus**: skip links, aria-describedby, aria-invalid, role="alert", live region -- sudah sangat baik.

**Tambahan**:
- Tambah `aria-required="true"` pada semua required fields di register
- Password requirements checklist: tambah `role="list"` pada container dan `role="listitem"` pada setiap item
- Form error summary: saat submit gagal, tampilkan **error summary di atas form** dengan link ke field yang error (pattern dari accessibility-compliance skill)
- Tambah `autocomplete="tel-national"` pada phone field (lebih spesifik dari `tel`)

### E. Interaction Design -- Micro-interactions

**Perbaikan**:
- Tambah **smooth transition** saat switch tab login/register: `transition-all duration-200`
- Button submit: tambah **success animation** (checkmark) setelah berhasil, sebelum redirect
- Password visibility toggle: tambah subtle transition pada icon change
- Tambah **loading skeleton** pada tab content saat switching (prevent layout shift)

### F. Frontend Security

**Yang sudah bagus**: password toggle, merchantCode sanitization, error message mapping.

**Tambahan**:
- Tambah **rate limiting indicator**: setelah 3 failed login attempts, tampilkan countdown timer dan pesan "Terlalu banyak percobaan. Coba lagi dalam X detik"
- Pastikan `autocomplete="current-password"` (login) dan `autocomplete="new-password"` (register) sudah benar -- sudah OK
- Tambah `rel="noopener noreferrer"` jika ada external links

### G. Visual Design -- Polish

**Perbaikan**:
- Tambah **divider** antara social/biometric login dan form: "atau masuk dengan email"
- Tambah subtle **gradient background** yang lebih menarik daripada plain `bg-muted/30`
- Card shadow: tambah `hover:shadow-lg transition-shadow` untuk depth perception
- Logo icon container: tambah subtle pulse animation saat loading

---

## 2. PasswordStrengthMeter -- `src/features/auth/components/PasswordStrengthMeter.tsx`

### Masalah
- Requirements menampilkan "Minimal 8 karakter" tapi schema requires 12 -- **inkonsistensi**
- Grid `grid-cols-1` OK tapi bisa lebih compact

### Perbaikan
- **Fix requirement mismatch**: ubah regex dari `/.{8,}/` ke `/.{12,}/` dan label ke "Minimal 12 karakter"
- Tambah **aria-label** pada strength bar untuk screen reader: `"Kekuatan password: {strength}"`
- Tambah `role="progressbar"` dengan `aria-valuenow` dan `aria-valuemax` pada bar
- Requirements: ubah ke `grid-cols-2 sm:grid-cols-1` agar di desktop lebih compact (2 kolom)

---

## 3. Onboarding Page -- `src/pages/Onboarding.tsx`

### A. Onboarding CRO -- Time-to-Value

**Masalah**: Onboarding hanya 2 step (pilih role + nama bisnis), tapi UX bisa lebih engaging.

**Perbaikan**:
- **Tambah welcome message personalized**: "Hai, {full_name}! Mari setup akun Anda"
- Step 1 role cards: tambah **ilustrasi/emoji** yang lebih besar dan deskripsi benefit yang lebih jelas:
  - Merchant: "Kelola properti, tenant, tagihan, dan laporan dalam satu platform"
  - Vendor: "Terima order jasa dari pemilik properti dan kelola penghasilan"
- **Tambah "Memakan waktu kurang dari 30 detik"** di bawah judul (reduce perceived effort)
- Success state setelah submit: tambah **celebration animation** (confetti atau checkmark animation) sebelum redirect

### B. Responsive Design

**Masalah**: 
- Back button `absolute left-4 top-4` bisa overlap dengan card content di mobile kecil
- Role selection `grid-cols-2` terlalu sempit di mobile kecil (< 360px width)
- Step indicator `gap-4` dengan separator `w-12 mx-4` terlalu lebar di mobile

**Perbaikan**:
- Back button: ubah dari `absolute` ke relative positioning di dalam CardHeader flow
- Role selection: `grid-cols-1 sm:grid-cols-2` -- di mobile stack vertically agar deskripsi terbaca
- Step indicator: separator `w-8 sm:w-12 mx-2 sm:mx-4`, label `hidden sm:inline`
- Container: tambah `w-[95vw] sm:w-full` pada `max-w-md`
- AlertDialogFooter: tambah `flex-col-reverse sm:flex-row` untuk mobile button stacking

### C. Accessibility

**Perbaikan**:
- Tambah `aria-required="true"` pada business name input
- Role selection: keyboard navigation sudah ada (ArrowLeft/Right) -- bagus
- Confirmation dialog: tambah `autoFocus` pada cancel button (safer default)
- Step indicator: tambah `aria-label="Langkah {n} dari 2: {label}"` pada setiap step circle

### D. Interaction Design

**Perbaikan**:
- Role card hover: tambah `scale-[1.02] transition-transform` untuk tactile feedback
- Step transition: tambah slide animation saat pindah step 1 ke 2 (slide-left)
- Business name input: tambah character counter "X/100 karakter"
- Submit button: tambah loading state yang lebih descriptive "Membuat akun..." bukan hanya spinner

---

## 4. AuthLoadingSkeleton -- `src/features/auth/components/AuthLoadingSkeleton.tsx`

### Perbaikan
- Tambah `aria-live="polite"` dan `role="status"` pada loading container
- Tambah `aria-label="Memuat halaman autentikasi"` pada root div
- Pulse animation pada skeleton: pastikan `prefers-reduced-motion` dihormati

---

## Ringkasan File yang Diubah

| File | Perubahan |
|------|-----------|
| `AuthForm.tsx` | Field order, CTA copy, trust elements, error summary, responsive width, email typo detection, rate limit indicator, divider, placeholder Indonesia, cross-link login/register |
| `PasswordStrengthMeter.tsx` | Fix 8 vs 12 char mismatch, aria progressbar, responsive grid |
| `Onboarding.tsx` | Welcome personalization, role card improvements, responsive fixes (grid, back button, step indicator), celebration animation, character counter, time estimate copy |
| `AuthLoadingSkeleton.tsx` | Accessibility: aria-live, role="status", aria-label |

## Urutan Implementasi

1. PasswordStrengthMeter fix (requirement mismatch -- critical bug)
2. AuthForm improvements (responsive, CRO, accessibility)
3. Onboarding improvements (responsive, CRO, interaction)
4. AuthLoadingSkeleton accessibility

