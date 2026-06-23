# Proposal: Profile — Edit Email

## Problem
User tidak bisa mengubah email mereka sendiri dari halaman Profile. Saat ini hanya nomor telepon yang bisa diedit inline. Email hanya ditampilkan sebagai read-only.

## Solution
Tambah inline edit untuk email di Profile page, dengan validasi format email dan konfirmasi password sebelum ganti email (security requirement).

## Scope
- **Frontend** — `src/features/profile/pages/Profile.tsx`
- **Backend** — perlu endpoint `PATCH /api/v1/auth/me` yang support update `email` dengan verifikasi `current_password`

## Backend Requirement
```
PATCH /api/v1/auth/me
Body: { email: string, current_password: string }
Response: { success: true, data: UserProfile }
```

## Frontend Implementation Plan

### Profile.tsx — tambah edit email section
```tsx
const [emailEdit, setEmailEdit] = useState(false);
const [newEmail, setNewEmail] = useState(profile?.email ?? "");
const [emailPassword, setEmailPassword] = useState("");

const handleUpdateEmail = async () => {
  // validasi format email
  // panggil PATCH /auth/me dengan { email: newEmail, current_password: emailPassword }
  // refresh profile
};
```

### UI
- Tampilkan email dengan tombol edit (pensil) di sampingnya
- Saat edit mode: input email baru + input password konfirmasi
- Validasi: format email valid, password tidak kosong
- Success: toast + refresh profile, kembali ke read mode

## Acceptance Criteria
- [ ] Email ditampilkan dengan tombol edit di Profile page
- [ ] Klik edit → muncul input email baru + konfirmasi password
- [ ] Validasi format email real-time
- [ ] Submit memerlukan password konfirmasi
- [ ] Backend verifikasi password sebelum update email
- [ ] Success toast + profile refresh
- [ ] Error handling (email sudah dipakai, password salah)
