

# Fix: Login Tidak Tersimpan (Session Persistence Bug)

## Akar Masalah

Di `useAuth.tsx`, saat `onAuthStateChange` dipanggil:

```text
1. setUser(session.user)         -- user ada
2. setIsLoading(false)           -- loading selesai
3. setTimeout(() => {            -- DITUNDA ke tick berikutnya
     fetchUserData(...)          -- isProfileLoading baru true di sini
   }, 0)
```

Antara langkah 2 dan 3, ada **satu render cycle** di mana:
- `isLoading = false`
- `isProfileLoading = false` (belum dimulai karena setTimeout)
- `contextIsLoading = false` (loading dianggap selesai)
- `user` ada tapi `role = null`

`ProtectedRoute` melihat: loading selesai, user ada, tapi role null -- langsung redirect ke `/unauthorized` atau `/auth`.

## Solusi

### 1. Fix race condition di `useAuth.tsx`

Tambahkan `setIsProfileLoading(true)` **sebelum** `setTimeout` di `onAuthStateChange`, supaya tidak ada gap di mana loading dianggap selesai tapi profile belum di-fetch:

```typescript
// BEFORE (buggy)
if (session?.user) {
  setTimeout(() => {
    fetchUserData(session.user.id);
  }, 0);
}

// AFTER (fixed)
if (session?.user) {
  setIsProfileLoading(true);  // <-- block rendering sebelum fetch dimulai
  setTimeout(() => {
    fetchUserData(session.user.id);
  }, 0);
}
```

### 2. Naikkan inactivity timeout (opsional tapi disarankan)

File `useInactivityLogout.ts` saat ini set timeout **15 menit**. Ini cukup agresif dan mungkin berkontribusi pada keluhan "harus login terus-terusan". Akan dinaikkan ke **30 menit** dengan warning di menit ke-29.

## File yang Diubah

| File | Perubahan |
|------|-----------|
| `src/features/auth/hooks/useAuth.tsx` | Tambah `setIsProfileLoading(true)` sebelum setTimeout di onAuthStateChange |
| `src/features/auth/hooks/useInactivityLogout.ts` | Naikkan timeout dari 15 menit ke 30 menit |

## Dampak

- Login session akan bertahan dengan benar saat refresh/navigasi
- User tidak akan di-logout otomatis setelah 15 menit idle (dinaikkan ke 30 menit)
- Tidak ada breaking change pada routing atau komponen lain

