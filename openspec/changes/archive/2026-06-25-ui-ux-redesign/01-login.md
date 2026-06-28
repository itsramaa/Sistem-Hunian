# 01 — Login & Auth Pages

**Pages**: `/login`, `/reset-password`, `/update-password`  
**Components**: `AuthForm.tsx`, `Auth.tsx`, `ResetPassword.tsx`, `UpdatePassword.tsx`

---

## Current Issues

- Form card tidak punya visual hierarchy yang jelas
- Logo/brand area terlalu polos
- Error message styling tidak konsisten
- Input field terlalu besar atau terlalu kecil
- Tidak ada visual divider antara form dan branding

---

## Enhancement Specification

### Layout
```
[Full screen split — kiri brand panel, kanan form]
Kiri: bg-primary, logo, tagline, dekoratif
Kanan: bg-background, form card centered
Mobile: hanya form, brand panel disembunyikan
```

### Brand Panel (kiri, hidden di mobile)
- Background: `bg-primary` (cokelat gelap)
- Logo besar di tengah atas
- Tagline: "Kelola kos Anda dengan lebih cerdas"
- Deskripsi singkat 1–2 kalimat
- Dekoratif: pattern subtle atau ilustrasi sederhana

### Form Card (kanan)
- Max width: `max-w-sm` centered
- Padding: `p-8`
- Shadow: `shadow-md`
- Border: `border border-border`
- Border radius: `rounded-xl`

### Form Fields
- Label: `text-sm font-medium` di atas input, selalu visible
- Input: tinggi `h-10`, border `border-input`, focus ring `ring-primary`
- Password field: toggle show/hide icon di kanan
- Error: `text-xs text-destructive` di bawah field, dengan icon `AlertCircle`

### Buttons
- Submit: `w-full` + `bg-primary` + loading state dengan `Loader2 animate-spin`
- Secondary link: `text-primary underline-offset-4 hover:underline`

### Acceptance Criteria
- [ ] Split layout tampil di desktop (≥768px), single column di mobile
- [ ] Label selalu visible (bukan placeholder-only)
- [ ] Password show/hide toggle berfungsi
- [ ] Error message tampil di bawah field yang salah
- [ ] Submit button disabled + spinner saat loading
- [ ] Tidak ada console error
