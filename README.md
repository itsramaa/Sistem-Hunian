# Sistem Hunian V2

Aplikasi manajemen properti hunian berbasis web, dibangun dengan React + TypeScript + Vite. Mendukung pengelolaan properti, kamar, penghuni, pembayaran, maintenance, dan audit trail — dengan tampilan responsif untuk desktop dan mobile.

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** (bundler)
- **React Router v6** (routing)
- **TanStack Query v5** (server state & caching)
- **Zustand** (client state)
- **Tailwind CSS** + **shadcn/ui** + **Radix UI** (UI components)
- **React Hook Form** + **Zod** (form & validasi)
- **Axios** (HTTP client)
- **Recharts** (charts)
- **React Leaflet** (peta lokasi)
- **Playwright** (E2E testing)
- **Sonner** (toast notifications)

## Fitur Utama

- **Autentikasi** — login, reset password, update password, inactivity logout, 2FA admin
- **RBAC** — role: Operator, Manager, Viewer dengan akses berbeda per halaman
- **Properti** — daftar, detail, form tambah/edit properti
- **Kamar** — daftar, detail kamar per properti
- **Penghuni** — daftar, detail, form checkout penghuni
- **Pembayaran** — daftar invoice, detail pembayaran, integrasi Xendit
- **Konfirmasi DP** — form konfirmasi deposit
- **Maintenance** — daftar, detail, filter, akses berbasis role
- **Audit Trail** — log aktivitas sistem
- **Notifikasi** — dropdown + halaman riwayat notifikasi
- **Profil & Pengaturan** — update profil, pengaturan akun
- **Mobile UI** — layout mobile dengan bottom nav, pull-to-refresh, haptic feedback
- **Dark/Light Mode** — theme toggle

## Struktur Folder

```
src/
├── app/           # Router, layouts, providers
├── features/      # Fitur per domain (auth, properties, rooms, dst)
├── shared/        # Komponen, hooks, utils, tipe global
└── store/         # Zustand stores
```

## Cara Menjalankan

```sh
# Install dependencies
npm install

# Development
npm run dev

# Build production
npm run build

# Preview build
npm run preview
```

## Environment Variables

Buat file `.env.local` di root:

```env
VITE_API_BASE_URL=https://your-api-url/api/v1
```

## Testing

E2E test menggunakan Playwright:

```sh
npx playwright test
```

Report tersedia di `playwright-report/index.html`.

## Deployment

Build output ada di folder `dist/`. Deploy ke static hosting (Vercel, Nginx, dll).

Backend API: [Sistem-Hunian-Go](https://github.com/your-org/Sistem-Hunian-Go)
