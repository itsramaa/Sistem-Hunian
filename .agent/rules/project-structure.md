src/
├── constants/ (Konfigurasi global dan nilai statis)
├── features/ (Modul fungsional berbasis domain)
│   └── [Feature-Name]/ (e.g., analytics, auth, chatbot, properties, users)
│       ├── components/ (Komponen UI fitur)
│       ├── constants/ (Konstanta spesifik fitur - opsional)
│       ├── hooks/ (Logika bisnis dan state fitur)
│       ├── services/ (Integrasi API dan layanan eksternal)
│       ├── types/ (Definisi tipe data TypeScript)
│       └── utils/ (Fungsi helper spesifik fitur - opsional)
│
├── lib/ (Konfigurasi pustaka pihak ketiga)
│   └── integrations/
│       └── supabase/ (Konfigurasi klien Supabase dan tipe database)
│
├── pages/ (Halaman utama/routing aplikasi)
│   ├── admin/ (Dashboard dan fitur administrator)
│   ├── merchant/ (Dashboard dan fitur pemilik properti)
│   ├── payment/ (Halaman status pembayaran)
│   ├── tenant/ (Dashboard dan fitur penyewa)
│   ├── vendor/ (Dashboard dan fitur penyedia jasa)
│   └── [Root Pages] (Auth.tsx, Index.tsx, Invite.tsx, NotFound.tsx, dll.)
│
├── shared/ (Kode reusable lintas fitur)
│   ├── components/
│   │   ├── layouts/ (Layout utama: Admin, Merchant, Tenant, Vendor)
│   │   └── ui/ (Komponen UI atomik/dasar seperti Button, Card, Input)
│   ├── context/ (React Context global, misal: ThemeContext)
│   ├── hooks/ (Custom hooks umum yang dapat digunakan di mana saja)
│   ├── services/ (Layanan infrastruktur umum, misal: locationService)
│   ├── types/ (Definisi tipe data yang digunakan secara global)
│   └── utils/ (Fungsi utilitas umum: formatting, validasi, dll.)
│
├── store/ (State management global aplikasi)
│   └── useStore.ts (Zustand store utama)
│
└── [Root Files]
    ├── App.tsx (Komponen utama dan routing)
    ├── main.tsx (Entry point aplikasi)
    ├── index.css (Global styles dan Tailwind imports)
    └── App.css (Styles tambahan)
