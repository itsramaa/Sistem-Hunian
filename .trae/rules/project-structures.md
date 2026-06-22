# Project Structure — Sistem Hunian V2 (Frontend)

```
Sistem-Hunian-V2/
├── src/
│   ├── app/                        # Application shell
│   │   ├── layouts/                # Layout wrappers (DashboardLayout, MobileLayout, dll)
│   │   ├── pages/                  # Top-level pages (HomePage, NotFoundPage, UnauthorizedPage)
│   │   ├── providers/              # React context providers (theme, query client, dll)
│   │   └── router/                 # Route definitions
│   │
│   ├── assets/
│   │   └── styles/                 # Global CSS
│   │
│   ├── config/                     # Typed env vars dari import.meta.env (VITE_*)
│   │
│   ├── features/                   # Feature modules (domain-first grouping)
│   │   ├── audit/                  # Audit trail modul
│   │   ├── auth/                   # Autentikasi, proteksi route, inactivity monitor
│   │   ├── confirmations/          # Konfirmasi DP / booking
│   │   ├── dashboard/              # Statistik & ringkasan dashboard
│   │   ├── maintenance/            # Pengajuan & manajemen maintenance
│   │   ├── notifications/          # Notifikasi real-time & histori
│   │   ├── payments/               # Manajemen pembayaran & invoicing
│   │   ├── profile/                # Profil pengguna & pengaturan
│   │   ├── properties/             # Manajemen properti
│   │   ├── rooms/                  # Manajemen kamar
│   │   ├── tenant/                 # Manajemen penghuni (aktif & histori)
│   │   ├── viewer-requests/        # Permintaan akses viewer
│   │   └── whatsapp/               # Integrasi WhatsMeOn (QR, status, disconnect)
│   │
│   └── shared/                     # Shared code lintas fitur
│       ├── components/
│       │   ├── sidebar/            # App sidebar & navigasi
│       │   └── ui/                 # Shadcn UI primitives + custom UI atoms
│       ├── hooks/                  # Shared hooks (useDebounce, useBreakpoint, dll)
│       ├── lib/                    # Library setup (axios, query-client, providers)
│       ├── types/                  # Shared TypeScript types & interfaces
│       └── utils/                  # Utility functions (currency, date, status, dll)
│
├── docs/                           # Dokumentasi proyek (SRS, testing, evidence)
├── openspec/                       # OpenSpec workflow (proposal, specs, changes)
├── public/                         # Static assets
└── .trae/                          # Trae IDE configuration
    ├── rules/                      # AI agent steering rules
    └── skills/                     # Installed AI skills
```

## Architecture Pattern

Proyek ini mengikuti **Feature-Sliced Design** yang disederhanakan:

```
app/ (shell) → features/ (domain logic) → shared/ (primitives)
```

| Layer         | Directory                | Tanggung Jawab                                              |
| ------------- | ------------------------ | ----------------------------------------------------------- |
| **App Shell** | `src/app/`               | Layout, routing, providers, halaman top-level               |
| **Feature**   | `src/features/<domain>/` | UI, data fetching, state, dan logic per domain              |
| **Shared**    | `src/shared/`            | Komponen, hooks, utils, dan types yang dipakai lintas fitur |
| **Config**    | `src/config/`            | Environment variables yang sudah di-type                    |

## Feature Module Convention

Setiap folder di `features/<domain>/` mengikuti struktur ini:

```
features/<domain>/
├── api/          # Service functions (HTTP calls via apiClient)
├── components/   # UI components spesifik domain (form, card, dll)
├── hooks/        # React Query hooks (useQuery, useMutation)
├── pages/        # Page-level components (di-mount oleh router)
└── types/        # TypeScript types & interfaces domain ini
```

- **api/** — pure functions, tidak ada React, tidak ada state
- **hooks/** — data fetching dan mutation via `@tanstack/react-query`
- **pages/** — orchestrate hooks + components, tidak ada business logic langsung
- **components/** — stateless atau lokal state, tidak fetch data sendiri

## Key Conventions

- **Env vars** — semua akses lewat `src/config/env.ts`, bukan `import.meta.env` langsung
- **HTTP client** — semua request via `shared/lib/axios.ts` (apiClient)
- **Error messages** — semua catch block pakai `getApiErrorMessage(err)` dari `shared/utils/api-errors.ts`
- **Styling** — Tailwind CSS + Shadcn UI primitives (`shared/components/ui/`)
- **State management** — server state via React Query, UI state via `useState` lokal
- **RBAC** — cek `profile?.role` dari `useAuth()` untuk fitur operator-only
- **Mock data** — dikontrol via env (`VITE_WA_MOCK`, dll), bukan hardcoded boolean
