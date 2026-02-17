src/
├── constants/ (Konfigurasi global dan nilai statis)
│   └── __tests__/ (Unit test spesifik konstanta)
│
├── features/ (Modul fungsional berbasis domain)
│   └── [Feature-Name]/
│       ├── components/ (Komponen UI fitur)
│       ├── context/ (State management lokal)
│       ├── hooks/ (Logika bisnis fitur)
│       ├── services/ (Layanan eksternal fitur)
│       ├── store/ (State store fitur spesifik)
│       ├── types/ (Definisi tipe data)
│       └── utils/ (Fungsi helper fitur)
│
├── lib/ (Konfigurasi pustaka pihak ketiga)
│
├── pages/ (Halaman utama/routing aplikasi)
│   └── [Sub-Pages]/ (Halaman bersarang)
│
├── shared/ (Kode reusable lintas fitur)
│   ├── components/ (UI kit dasar dan layout)
│   ├── hooks/ (Hook global umum)
│   ├── services/ (Layanan infrastruktur umum)
│   └── utils/ (Fungsi utilitas umum)
│
├── store/ (State management global aplikasi)
│
├── tests/ (Pengujian terpusat)
│   ├── contracts/ (Contract testing API)
│   ├── e2e/ (End-to-end testing)
│   ├── integration/ (Integration testing)
│   ├── mocks/ (Mock data dan handlers)
│   ├── observability/ (Testing monitoring/events)
│   └── state/ (Testing state management)
│
└── [Root Files]