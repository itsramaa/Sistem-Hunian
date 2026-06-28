# 11 — Profile & Settings

**Pages**: `/dashboard/profile`, `/dashboard/settings`  
**Components**: `Profile.tsx`, `Settings.tsx`

---

## Current Issues

- Profile page mungkin terlalu sederhana / kurang structure
- Ganti password form mungkin tidak ada konfirmasi password
- Settings halaman mungkin kurang context

---

## Enhancement Specification

### Profile Page

#### Page Header
```
Profil Saya
Kelola informasi akun Anda
```

#### Profile Card (atas)
```
[Avatar/initials besar: bg-primary text-primary-foreground rounded-full]
[Nama User]
[Role Badge: Operator / Manager / Viewer]
[Email]
```

#### Edit Profil Section
- Sheet/Form: Nama*
- Submit: "Simpan Perubahan"
- Toast success: "Profil berhasil diperbarui"

#### Ganti Password Section
- Card terpisah dari edit profil
- Fields: Password Baru* (min 6), Konfirmasi Password*
- Validation: konfirmasi harus sama dengan password baru
- Submit: "Ganti Password"
- Toast success: "Password berhasil diubah"

#### Info Section (read-only)
- Email (tidak bisa diubah, dengan label "(tidak dapat diubah)")
- Role (badge)
- Bergabung sejak (created_at)

### Settings Page (Operator only)

#### Page Header
```
Pengaturan
Konfigurasi sistem SiHuni
```

#### WA Config Card
```
[Card: WhatsApp Notifikasi]
  Toggle: Aktifkan Notifikasi WA  [switch]
  Nomor Penerima:
  [Textarea: comma-separated numbers]
  [Simpan]
```

- Toggle menggunakan Shadcn `<Switch>`
- Nomor penerima: placeholder "08123..., 08456..."
- Info text: "Pisahkan beberapa nomor dengan koma"

#### Acceptance Criteria
- [ ] Avatar dengan initials dari nama user
- [ ] Role badge tampil di profil
- [ ] Edit nama berfungsi
- [ ] Password konfirmasi validation
- [ ] Settings hanya tampil untuk operator
- [ ] WA config menggunakan Switch toggle
- [ ] Toast untuk setiap aksi berhasil
