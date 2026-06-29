# Test Report

**Generated:** 29/6/2026, 12.45.17

## Summary

| Metric | Value |
|--------|-------|
| **Total Tests** | 112 |
| **Passed** | 110 |
| **Failed** | 0 |
| **Skipped** | 2 |
| **Duration** | 247.66s |
| **Status** | PASSED |

## KF-01-autentikasi.spec.ts

### ✅ KF-01-01: Login dengan kredensial valid (Operator)

**Status:** PASSED | **Duration:** 3.27s

- 🪝 Before Hooks (273ms)
  - ⚙️ Fixture "browser" (153ms)
    - 📝 Launch browser (149ms)
  - ⚙️ Fixture "context" (11ms)
    - 📝 Create context (7ms)
  - ⚙️ Fixture "page" (95ms)
    - 📝 Create page (93ms)
- 📝 Navigate to "/login" (1.25s)
- 📝 Wait for load state "networkidle" (750ms)
- 📝 Fill "operator@sihuni.dev" locator('#email') (75ms)
- 📝 Fill "sihuni123" locator('#password') (36ms)
- 📝 Screenshot (392ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (108ms)
- 📝 Wait for navigation (107ms)
- 📝 Screenshot (146ms)
- 📝 Expect "toContain" (1ms)
- 🪝 After Hooks (246ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (11ms)
    - 📝 Close context (6ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/3b9e59df-21da-45ff-82b8-55fa5a52dca2.png)

### ✅ KF-01-02: Login dengan kredensial valid (Viewer)

**Status:** PASSED | **Duration:** 2.84s

- 🪝 Before Hooks (66ms)
  - ⚙️ Fixture "context" (5ms)
    - 📝 Create context (4ms)
  - ⚙️ Fixture "page" (55ms)
    - 📝 Create page (54ms)
- 📝 Navigate to "/login" (961ms)
- 📝 Wait for load state "networkidle" (736ms)
- 📝 Fill "viewer@sihuni.dev" locator('#email') (54ms)
- 📝 Fill "sihuni123" locator('#password') (31ms)
- 📝 Screenshot (400ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (83ms)
- 📝 Wait for navigation (112ms)
- 📝 Screenshot (157ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (234ms)
  - ⚙️ Fixture "page" (1ms)
  - ⚙️ Fixture "context" (12ms)
    - 📝 Close context (9ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/a1ed3eaa-9c74-46fc-9ca9-a212d30b1f58.png)

### ✅ KF-01-03: Login dengan password salah — muncul pesan kesalahan

**Status:** PASSED | **Duration:** 3.01s

- 🪝 Before Hooks (97ms)
  - ⚙️ Fixture "context" (4ms)
    - 📝 Create context (4ms)
  - ⚙️ Fixture "page" (85ms)
    - 📝 Create page (84ms)
- 📝 Navigate to "/login" (1.26s)
- 📝 Wait for load state "networkidle" (717ms)
- 📝 Fill "operator@sihuni.dev" locator('#email') (70ms)
- 📝 Fill "wrongpassword" locator('#password') (24ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (107ms)
- 📝 Wait for load state "networkidle"
- 📝 Screenshot (357ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (371ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (7ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/015cc065-02bb-4feb-83c2-5ae85b24b8c2.png)

### ✅ KF-01-04: Login dengan email tidak terdaftar — muncul pesan kesalahan

**Status:** PASSED | **Duration:** 3.91s

- 🪝 Before Hooks (80ms)
  - ⚙️ Fixture "context" (4ms)
    - 📝 Create context (4ms)
  - ⚙️ Fixture "page" (70ms)
    - 📝 Create page (69ms)
- 📝 Navigate to "/login" (2.17s)
- 📝 Wait for load state "networkidle" (719ms)
- 📝 Fill "tidakterdaftar@example.com" locator('#email') (78ms)
- 📝 Fill "password123" locator('#password') (23ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (87ms)
- 📝 Wait for load state "networkidle"
- 📝 Screenshot (374ms)
- 📝 Expect "toContain" (1ms)
- 🪝 After Hooks (370ms)
  - ⚙️ Fixture "page" (1ms)
  - ⚙️ Fixture "context" (7ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/5db032c2-6114-41d2-a15d-6f098b7d9db3.png)

### ✅ KF-01-05: Login dengan form kosong — validasi mencegah pengiriman

**Status:** PASSED | **Duration:** 3.42s

- 🪝 Before Hooks (69ms)
  - ⚙️ Fixture "context" (4ms)
    - 📝 Create context (2ms)
  - ⚙️ Fixture "page" (59ms)
    - 📝 Create page (58ms)
- 📝 Navigate to "/login" (1.24s)
- 📝 Wait for load state "networkidle" (728ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (125ms)
- 📝 Wait for timeout (516ms)
- 📝 Screenshot (348ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (393ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (10ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/88614bea-be18-4a8d-88f1-ee86cfe4c323.png)

### ✅ KF-01-06: Logout — token dihapus, diarahkan ke halaman login

**Status:** PASSED | **Duration:** 5.19s

- 🪝 Before Hooks (138ms)
  - ⚙️ Fixture "context" (12ms)
    - 📝 Create context (8ms)
  - ⚙️ Fixture "page" (117ms)
    - 📝 Create page (115ms)
- 📝 Navigate to "/login" (1.83s)
- 📝 Wait for load state "networkidle" (696ms)
- 📝 Fill "operator@sihuni.dev" locator('#email') (46ms)
- 📝 Fill "sihuni123" locator('#password') (23ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (87ms)
- 📝 Wait for navigation (93ms)
- 📝 Wait for load state "load"
- 📝 Wait for load state "networkidle" (1ms)
- 📝 Screenshot (159ms)
- 📝 Click locator('header button').last() (134ms)
- 📝 Wait for timeout (311ms)
- 📝 Evaluate (7ms)
- 📝 Navigate to "/login" (208ms)
- 📝 Wait for load state "networkidle" (600ms)
- 📝 Screenshot (412ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (397ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (31ms)
    - 📝 Close context (24ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/f657242c-57f3-42e1-89df-8f32c40f9266.png)

### ⏭️ KF-01-07: Akses halaman terproteksi tanpa login — diarahkan ke login

**Status:** SKIPPED | **Duration:** 132ms

- 🪝 Before Hooks (70ms)
  - ⚙️ Fixture "context" (9ms)
    - 📝 Create context (8ms)
  - ⚙️ Fixture "page" (54ms)
    - 📝 Create page (53ms)
- 🪝 After Hooks (75ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (6ms)
    - 📝 Close context (2ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/4cb5e3ac-b79c-4ef4-84cc-b3ab48dc9d27.png)

### ✅ KF-01-08: Inactivity logout — sesi masih aktif saat navigasi normal

**Status:** PASSED | **Duration:** 10.44s

- 🪝 Before Hooks (64ms)
  - ⚙️ Fixture "context" (7ms)
    - 📝 Create context (5ms)
  - ⚙️ Fixture "page" (49ms)
    - 📝 Create page (48ms)
- 📝 Navigate to "/login" (1.57s)
- 📝 Wait for load state "networkidle" (521ms)
- 📝 Fill "operator@sihuni.dev" locator('#email') (75ms)
- 📝 Fill "sihuni123" locator('#password') (48ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (171ms)
- 📝 Wait for navigation (199ms)
- 📝 Navigate to "/dashboard/properties" (1.61s)
- 📝 Wait for load state "networkidle" (725ms)
- 📝 Navigate to "/dashboard/rooms" (1.53s)
- 📝 Wait for load state "networkidle" (644ms)
- 📝 Navigate to "/dashboard" (1.86s)
- 📝 Wait for load state "networkidle" (613ms)
- 📝 Screenshot (478ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (312ms)
  - ⚙️ Fixture "page" (1ms)
  - ⚙️ Fixture "context" (14ms)
    - 📝 Close context (11ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/4b6b3ac0-9149-40ac-a547-5f6200730b13.png)

### ✅ KF-01-09: Ganti password — halaman update-password tersedia dan form ada

**Status:** PASSED | **Duration:** 1.78s

- 🪝 Before Hooks (99ms)
  - ⚙️ Fixture "context" (8ms)
    - 📝 Create context (6ms)
  - ⚙️ Fixture "page" (80ms)
    - 📝 Create page (79ms)
- 📝 Navigate to "/update-password" (1.05s)
- 📝 Wait for load state "networkidle" (498ms)
- 📝 Screenshot (79ms)
- 📝 Expect "toBeTruthy" (1ms)
- 🪝 After Hooks (56ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/1f63fbc5-e403-445c-a870-33ca9aec7e33.png)

## KF-02-properti.spec.ts

### ✅ KF-02-01: Tambah properti dengan data lengkap — properti tersimpan

**Status:** PASSED | **Duration:** 6.33s

- 🪝 Before Hooks (2.66s)
  - 🪝 beforeEach hook (2.66s)
    - ⚙️ Fixture "browser" (143ms)
      - 📝 Launch browser (137ms)
    - ⚙️ Fixture "context" (11ms)
      - 📝 Create context (9ms)
    - ⚙️ Fixture "page" (105ms)
      - 📝 Create page (103ms)
    - 📝 Navigate to "/login" (1.27s)
    - 📝 Wait for load state "networkidle" (736ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (82ms)
    - 📝 Fill "sihuni123" locator('#password') (25ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (120ms)
    - 📝 Wait for navigation (112ms)
- 📝 Navigate to "/dashboard/properties" (1.57s)
- 📝 Wait for load state "networkidle" (746ms)
- 📝 Click getByRole('button', { name: /tambah|add|baru/i }).first() (397ms)
- 📝 Wait for timeout (512ms)
- 📝 Fill "Kos Demo Test E2E" locator('input[name=\'name\'], input[id*=\'name\'], input[placeholder*=\'nama\']').first() (15ms)
- 📝 Fill "Jl. Demo Test No. 1, Ciputat" locator('input[name=\'address\'], textarea[name=\'address\'], input[placeholder*=\'alamat\'], input[id*=\'address\']').first() (22ms)
- 📝 Screenshot (92ms)
- 📝 Click getByRole('button', { name: /simpan|tambah|submit|ok/i }).first() (105ms)
- 📝 Wait for load state "networkidle" (1ms)
- 📝 Screenshot (130ms)
- 📝 Expect "toBeTruthy"
- 🪝 After Hooks (115ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (9ms)
    - 📝 Close context (6ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/30d55dc3-69b6-4b28-838d-4cd3596c0f5b.png)

### ✅ KF-02-02: Tambah properti dengan nama kosong — validasi mencegah penyimpanan

**Status:** PASSED | **Duration:** 5.45s

- 🪝 Before Hooks (2.21s)
  - 🪝 beforeEach hook (2.21s)
    - ⚙️ Fixture "context" (9ms)
      - 📝 Create context (8ms)
    - ⚙️ Fixture "page" (124ms)
      - 📝 Create page (123ms)
    - 📝 Navigate to "/login" (1.04s)
    - 📝 Wait for load state "networkidle" (735ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (54ms)
    - 📝 Fill "sihuni123" locator('#password') (24ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (110ms)
    - 📝 Wait for navigation (101ms)
- 📝 Navigate to "/dashboard/properties" (775ms)
- 📝 Wait for load state "networkidle" (690ms)
- 📝 Click getByRole('button', { name: /tambah|add|baru/i }).first() (374ms)
- 📝 Wait for timeout (504ms)
- 📝 Click getByRole('button', { name: /simpan|tambah|submit|ok/i }).first() (49ms)
- 📝 Wait for timeout (507ms)
- 📝 Screenshot (103ms)
- 📝 Expect "toContain" (1ms)
- 🪝 After Hooks (134ms)
  - ⚙️ Fixture "page" (1ms)
  - ⚙️ Fixture "context" (9ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/09444f22-7214-4667-8556-dd210f3b442c.png)

### ✅ KF-02-03: Ubah data properti — data berhasil diperbarui

**Status:** PASSED | **Duration:** 5.56s

- 🪝 Before Hooks (2.74s)
  - 🪝 beforeEach hook (2.74s)
    - ⚙️ Fixture "context" (5ms)
      - 📝 Create context (4ms)
    - ⚙️ Fixture "page" (70ms)
      - 📝 Create page (69ms)
    - 📝 Navigate to "/login" (1.67s)
    - 📝 Wait for load state "networkidle" (698ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (46ms)
    - 📝 Fill "sihuni123" locator('#password') (20ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (106ms)
    - 📝 Wait for navigation (113ms)
- 📝 Navigate to "/dashboard/properties" (1.63s)
- 📝 Wait for load state "networkidle" (731ms)
- 📝 Screenshot (317ms)
- 📝 Expect "toContain" (1ms)
- 🪝 After Hooks (132ms)
  - ⚙️ Fixture "page" (1ms)
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/3f388b07-43d1-4aea-bfc9-41f48f3d15b0.png)

### ✅ KF-02-04: Hapus properti tanpa kamar — properti berhasil dihapus

**Status:** PASSED | **Duration:** 4.13s

- 🪝 Before Hooks (2.07s)
  - 🪝 beforeEach hook (2.07s)
    - ⚙️ Fixture "context" (34ms)
      - 📝 Create context (32ms)
    - ⚙️ Fixture "page" (53ms)
      - 📝 Create page (51ms)
    - 📝 Navigate to "/login" (976ms)
    - 📝 Wait for load state "networkidle" (718ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (59ms)
    - 📝 Fill "sihuni123" locator('#password') (19ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (83ms)
    - 📝 Wait for navigation (105ms)
- 📝 Navigate to "/dashboard/properties" (839ms)
- 📝 Wait for load state "networkidle" (721ms)
- 📝 Screenshot (308ms)
- 📝 Expect "toBeTruthy" (1ms)
- 🪝 After Hooks (196ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (10ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/e46c1507-e617-4d90-8c9a-cc82c70d220d.png)

### ✅ KF-02-05: Hapus properti dengan kamar terdaftar — sistem menolak

**Status:** PASSED | **Duration:** 5.66s

- 🪝 Before Hooks (2.86s)
  - 🪝 beforeEach hook (2.86s)
    - ⚙️ Fixture "context" (5ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (53ms)
      - 📝 Create page (52ms)
    - 📝 Navigate to "/login" (1.65s)
    - 📝 Wait for load state "networkidle" (701ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (78ms)
    - 📝 Fill "sihuni123" locator('#password') (73ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (129ms)
    - 📝 Wait for navigation (145ms)
- 📝 Navigate to "/dashboard/properties" (1.74s)
- 📝 Wait for load state "networkidle" (719ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (249ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (15ms)
    - 📝 Close context (10ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/7821082f-7987-4579-a596-15099709923f.png)

### ✅ KF-02-06: Akses manajemen properti sebagai Viewer — hanya baca

**Status:** PASSED | **Duration:** 6.31s

- 🪝 Before Hooks (95ms)
  - ⚙️ Fixture "context" (7ms)
    - 📝 Create context (5ms)
  - ⚙️ Fixture "page" (81ms)
    - 📝 Create page (80ms)
- 📝 Navigate to "/login" (1.31s)
- 📝 Wait for load state "networkidle" (738ms)
- 📝 Fill "viewer@sihuni.dev" locator('#email') (54ms)
- 📝 Fill "sihuni123" locator('#password') (23ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (100ms)
- 📝 Wait for navigation (98ms)
- 📝 Wait for timeout (515ms)
- 📝 Navigate to "/dashboard/properties" (956ms)
- 📝 Wait for load state "networkidle" (709ms)
- 📝 Wait for timeout (1.50s)
- 📝 Screenshot (93ms)
- 📝 Expect "toBe" (1ms)
- 🪝 After Hooks (100ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (7ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/2942dff8-371d-41e1-b9ec-6d0c3ae96549.png)

## KF-03-kamar.spec.ts

### ✅ KF-03-01: Tambah kamar dengan data lengkap — kamar tersimpan status available

**Status:** PASSED | **Duration:** 8.14s

- 🪝 Before Hooks (2.61s)
  - 🪝 beforeEach hook (2.61s)
    - ⚙️ Fixture "browser" (147ms)
      - 📝 Launch browser (143ms)
    - ⚙️ Fixture "context" (11ms)
      - 📝 Create context (7ms)
    - ⚙️ Fixture "page" (108ms)
      - 📝 Create page (105ms)
    - 📝 Navigate to "/login" (1.24s)
    - 📝 Wait for load state "networkidle" (758ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (80ms)
    - 📝 Fill "sihuni123" locator('#password') (27ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (103ms)
    - 📝 Wait for navigation (96ms)
- 📝 Navigate to "/dashboard/rooms" (1.65s)
- 📝 Wait for load state "networkidle" (721ms)
- 📝 Click getByRole('button', { name: /tambah|add|baru/i }).first() (1.12s)
- 📝 Wait for timeout (515ms)
- 📝 Fill "Z99" locator('input[name=\'number\'], input[name=\'room_number\'], input[placeholder*=\'nomor\'], input[id*=\'number\']').first() (23ms)
- 📝 Click locator('[role=\'combobox\']').first() (123ms)
- 📝 Wait for timeout (315ms)
- 📝 Click locator('[role=\'option\']').first() (75ms)
- 📝 Fill "1200000" locator('input[name=\'price\'], input[name=\'rent_price\'], input[placeholder*=\'harga\'], input[id*=\'price\']').first() (18ms)
- 📝 Screenshot (306ms)
- 📝 Click getByRole('button', { name: /simpan|tambah|submit|ok/i }).first() (113ms)
- 📝 Wait for load state "networkidle"
- 📝 Screenshot (400ms)
- 📝 Expect "toBeTruthy"
- 🪝 After Hooks (179ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (24ms)
    - 📝 Close context (19ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/d8ebdead-758d-4511-80b1-f6596bb93e89.png)

### ✅ KF-03-02: Ubah data kamar — data berhasil diperbarui

**Status:** PASSED | **Duration:** 5.05s

- 🪝 Before Hooks (2.37s)
  - 🪝 beforeEach hook (2.37s)
    - ⚙️ Fixture "context" (5ms)
      - 📝 Create context (4ms)
    - ⚙️ Fixture "page" (82ms)
      - 📝 Create page (80ms)
    - 📝 Navigate to "/login" (1.29s)
    - 📝 Wait for load state "networkidle" (715ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (52ms)
    - 📝 Fill "sihuni123" locator('#password') (31ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (87ms)
    - 📝 Wait for navigation (91ms)
- 📝 Navigate to "/dashboard/rooms" (783ms)
- 📝 Wait for load state "networkidle" (683ms)
- 📝 Screenshot (949ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (235ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (6ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/35a888b1-cdc5-43c4-b2d8-468f54813367.png)

### ✅ KF-03-03: Hapus kamar available tanpa histori — berhasil dihapus

**Status:** PASSED | **Duration:** 4.86s

- 🪝 Before Hooks (2.19s)
  - 🪝 beforeEach hook (2.19s)
    - ⚙️ Fixture "context" (3ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (54ms)
      - 📝 Create page (53ms)
    - 📝 Navigate to "/login" (1.11s)
    - 📝 Wait for load state "networkidle" (760ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (54ms)
    - 📝 Fill "sihuni123" locator('#password') (30ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (74ms)
    - 📝 Wait for navigation (87ms)
- 📝 Navigate to "/dashboard/rooms" (778ms)
- 📝 Wait for load state "networkidle" (719ms)
- 📝 Screenshot (944ms)
- 📝 Expect "toBeTruthy"
- 🪝 After Hooks (214ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (9ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/a3835390-1172-4012-ae1e-8372d8bbe773.png)

### ✅ KF-03-04: Hapus kamar berstatus occupied — sistem menolak

**Status:** PASSED | **Duration:** 6.50s

- 🪝 Before Hooks (3.19s)
  - 🪝 beforeEach hook (3.19s)
    - ⚙️ Fixture "context" (9ms)
      - 📝 Create context (7ms)
    - ⚙️ Fixture "page" (118ms)
      - 📝 Create page (117ms)
    - 📝 Navigate to "/login" (2.04s)
    - 📝 Wait for load state "networkidle" (743ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (53ms)
    - 📝 Fill "sihuni123" locator('#password') (23ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (81ms)
    - 📝 Wait for navigation (104ms)
- 📝 Navigate to "/dashboard/rooms" (1.46s)
- 📝 Wait for load state "networkidle" (690ms)
- 📝 Screenshot (991ms)
- 📝 Expect "toBeTruthy"
- 🪝 After Hooks (142ms)
  - ⚙️ Fixture "page" (1ms)
  - ⚙️ Fixture "context" (11ms)
    - 📝 Close context (6ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/99563f2d-4c36-4446-9cef-c2655d716ee3.png)

### ✅ KF-03-05: Hapus kamar berstatus dp_confirmation — sistem menolak

**Status:** PASSED | **Duration:** 5.62s

- 🪝 Before Hooks (2.82s)
  - 🪝 beforeEach hook (2.82s)
    - ⚙️ Fixture "context" (4ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (77ms)
      - 📝 Create page (76ms)
    - 📝 Navigate to "/login" (1.66s)
    - 📝 Wait for load state "networkidle" (775ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (63ms)
    - 📝 Fill "sihuni123" locator('#password') (35ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (107ms)
    - 📝 Wait for navigation (84ms)
- 📝 Navigate to "/dashboard/rooms" (975ms)
- 📝 Wait for load state "networkidle" (700ms)
- 📝 Screenshot (934ms)
- 📝 Expect "toBeTruthy"
- 🪝 After Hooks (190ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (7ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/611ca167-0baa-41f7-8518-53a4b5188ed8.png)

### ✅ KF-03-06: Hapus kamar available dengan histori terhubung — sistem menolak

**Status:** PASSED | **Duration:** 4.68s

- 🪝 Before Hooks (2.14s)
  - 🪝 beforeEach hook (2.14s)
    - ⚙️ Fixture "context" (9ms)
      - 📝 Create context (7ms)
    - ⚙️ Fixture "page" (60ms)
      - 📝 Create page (59ms)
    - 📝 Navigate to "/login" (1.05s)
    - 📝 Wait for load state "networkidle" (709ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (56ms)
    - 📝 Fill "sihuni123" locator('#password') (25ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (104ms)
    - 📝 Wait for navigation (109ms)
- 📝 Navigate to "/dashboard/rooms" (748ms)
- 📝 Wait for load state "networkidle" (654ms)
- 📝 Screenshot (798ms)
- 📝 Expect "toBeTruthy"
- 🪝 After Hooks (302ms)
  - ⚙️ Fixture "page" (1ms)
  - ⚙️ Fixture "context" (6ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/2304a77b-92fb-459d-9e04-2b03bfdbfab8.png)

### ✅ KF-03-07: Filter kamar berdasarkan properti — hanya kamar properti tersebut tampil

**Status:** PASSED | **Duration:** 5.21s

- 🪝 Before Hooks (2.56s)
  - 🪝 beforeEach hook (2.56s)
    - ⚙️ Fixture "context" (13ms)
      - 📝 Create context (13ms)
    - ⚙️ Fixture "page" (57ms)
      - 📝 Create page (56ms)
    - 📝 Navigate to "/login" (1.47s)
    - 📝 Wait for load state "networkidle" (746ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (54ms)
    - 📝 Fill "sihuni123" locator('#password') (29ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (90ms)
    - 📝 Wait for navigation (81ms)
- 📝 Navigate to "/dashboard/rooms" (802ms)
- 📝 Wait for load state "networkidle" (744ms)
- 📝 Screenshot (948ms)
- 📝 Expect "toContain" (1ms)
- 🪝 After Hooks (161ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (15ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/4bda1ae8-345a-43c1-931c-588ffa05df9e.png)

## KF-04-dashboard.spec.ts

### ✅ KF-04-01: Tampil dashboard sebagai Operator — statistik dan panel lengkap

**Status:** PASSED | **Duration:** 4.79s

- 🪝 Before Hooks (69ms)
  - ⚙️ Fixture "context" (5ms)
    - 📝 Create context (3ms)
  - ⚙️ Fixture "page" (58ms)
    - 📝 Create page (56ms)
- 📝 Navigate to "/login" (639ms)
- 📝 Wait for load state "networkidle" (708ms)
- 📝 Fill "operator@sihuni.dev" locator('#email') (61ms)
- 📝 Fill "sihuni123" locator('#password') (25ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (111ms)
- 📝 Wait for navigation (110ms)
- 📝 Navigate to "/dashboard" (959ms)
- 📝 Wait for load state "networkidle" (709ms)
- 📝 Wait for timeout (1.00s)
- 📝 Screenshot (208ms)
- 📝 Expect "toContain"
- 📝 Expect "toBeGreaterThan" (1ms)
- 🪝 After Hooks (181ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (10ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/a5529781-f05f-4fb7-8958-89c33f2112b0.png)

### ✅ KF-04-02: Tampil dashboard sebagai Viewer — statistik dan panel Viewer Request

**Status:** PASSED | **Duration:** 3.53s

- 🪝 Before Hooks (102ms)
  - ⚙️ Fixture "context" (9ms)
    - 📝 Create context (7ms)
  - ⚙️ Fixture "page" (87ms)
    - 📝 Create page (85ms)
- 📝 Navigate to "/login" (1.06s)
- 📝 Wait for load state "networkidle" (722ms)
- 📝 Fill "viewer@sihuni.dev" locator('#email') (66ms)
- 📝 Fill "sihuni123" locator('#password') (16ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (110ms)
- 📝 Wait for navigation (92ms)
- 📝 Wait for load state "load" (1ms)
- 📝 Wait for load state "networkidle" (1ms)
- 📝 Wait for timeout (1.00s)
- 📝 Screenshot (181ms)
- 📝 Expect "toContain"
- 📝 Expect "toBeGreaterThan"
- 🪝 After Hooks (159ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/d3280265-61d6-4da7-adec-6ece5991606e.png)

### ✅ KF-04-03: Panel peringatan konfirmasi DP mendekati batas tanggal — muncul di dashboard

**Status:** PASSED | **Duration:** 5.33s

- 🪝 Before Hooks (69ms)
  - ⚙️ Fixture "context" (8ms)
    - 📝 Create context (6ms)
  - ⚙️ Fixture "page" (56ms)
    - 📝 Create page (55ms)
- 📝 Navigate to "/login" (466ms)
- 📝 Wait for load state "networkidle" (720ms)
- 📝 Fill "operator@sihuni.dev" locator('#email') (41ms)
- 📝 Fill "sihuni123" locator('#password') (20ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (91ms)
- 📝 Wait for navigation (71ms)
- 📝 Navigate to "/dashboard" (732ms)
- 📝 Wait for load state "networkidle" (688ms)
- 📝 Wait for timeout (2.00s)
- 📝 Screenshot (251ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (179ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/ecb9c63c-be61-4e66-8d58-730efe760418.png)

### ✅ KF-04-04: Panel peringatan pembayaran mendekati jatuh tempo — muncul di dashboard

**Status:** PASSED | **Duration:** 6.22s

- 🪝 Before Hooks (70ms)
  - ⚙️ Fixture "context" (5ms)
    - 📝 Create context (3ms)
  - ⚙️ Fixture "page" (59ms)
    - 📝 Create page (58ms)
- 📝 Navigate to "/login" (1.14s)
- 📝 Wait for load state "networkidle" (741ms)
- 📝 Fill "operator@sihuni.dev" locator('#email') (64ms)
- 📝 Fill "sihuni123" locator('#password') (33ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (86ms)
- 📝 Wait for navigation (92ms)
- 📝 Navigate to "/dashboard" (823ms)
- 📝 Wait for load state "networkidle" (702ms)
- 📝 Wait for timeout (2.01s)
- 📝 Screenshot (266ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (183ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (10ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/58f77025-21b5-479c-8a69-0ce477ffa2ef.png)

## KF-05-penghuni.spec.ts

### ✅ KF-05-01: Tambah penghuni baru ke kamar available — penghuni tersimpan, status kamar berubah occupied

**Status:** PASSED | **Duration:** 8.88s

- 🪝 Before Hooks (2.33s)
  - 🪝 beforeEach hook (2.33s)
    - ⚙️ Fixture "context" (4ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (53ms)
      - 📝 Create page (52ms)
    - 📝 Navigate to "/login" (1.17s)
    - 📝 Wait for load state "networkidle" (738ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (81ms)
    - 📝 Fill "sihuni123" locator('#password') (57ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (104ms)
    - 📝 Wait for navigation (103ms)
- 📝 Navigate to "/dashboard/tenants" (1.84s)
- 📝 Wait for load state "networkidle" (786ms)
- 📝 Wait for timeout (2.01s)
- 📝 Click getByRole('button', { name: /tambah|add|baru/i }).first() (322ms)
- 📝 Wait for timeout (503ms)
- 📝 Screenshot (266ms)
- 📝 Fill "Penghuni Demo E2E" locator('input[name=\'name\'], input[placeholder*=\'nama\'], input[id*=\'name\']').first() (11ms)
- 📝 Fill "3271010101010099" locator('input[name=\'identity_number\'], input[placeholder*=\'nik\'], input[placeholder*=\'identitas\']').first() (15ms)
- 📝 Fill "081299990099" locator('input[name=\'phone_number\'], input[placeholder*=\'telepon\'], input[placeholder*=\'hp\']').first() (12ms)
- 📝 Screenshot (249ms)
- 📝 Screenshot (292ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (175ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (19ms)
    - 📝 Close context (13ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/4508a1a0-a02d-4e93-8cbd-b59a992f27ec.png)

### ✅ KF-05-02: Tambah penghuni ke kamar berstatus terisi — sistem menolak

**Status:** PASSED | **Duration:** 6.23s

- 🪝 Before Hooks (2.34s)
  - 🪝 beforeEach hook (2.34s)
    - ⚙️ Fixture "context" (5ms)
      - 📝 Create context (4ms)
    - ⚙️ Fixture "page" (78ms)
      - 📝 Create page (77ms)
    - 📝 Navigate to "/login" (1.22s)
    - 📝 Wait for load state "networkidle" (724ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (90ms)
    - 📝 Fill "sihuni123" locator('#password') (18ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (90ms)
    - 📝 Wait for navigation (89ms)
- 📝 Navigate to "/dashboard/tenants" (749ms)
- 📝 Wait for load state "networkidle" (708ms)
- 📝 Wait for timeout (2.00s)
- 📝 Screenshot (289ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (151ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (7ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/a7d0d43d-112a-48ba-a551-df7dd3f39e0c.png)

### ✅ KF-05-03: Proses checkout penghuni tanpa tunggakan — status kamar berubah available

**Status:** PASSED | **Duration:** 6.90s

- 🪝 Before Hooks (2.31s)
  - 🪝 beforeEach hook (2.31s)
    - ⚙️ Fixture "context" (5ms)
      - 📝 Create context (4ms)
    - ⚙️ Fixture "page" (77ms)
      - 📝 Create page (75ms)
    - 📝 Navigate to "/login" (1.19s)
    - 📝 Wait for load state "networkidle" (724ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (71ms)
    - 📝 Fill "sihuni123" locator('#password') (25ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (109ms)
    - 📝 Wait for navigation (80ms)
- 📝 Navigate to "/dashboard/tenants" (1.26s)
- 📝 Wait for load state "networkidle" (730ms)
- 📝 Wait for timeout (2.01s)
- 📝 Screenshot (449ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (144ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (10ms)
    - 📝 Close context (6ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/85ce4235-721e-46ca-bf34-8d39e557bae6.png)

### ✅ KF-05-04: Proses checkout penghuni dengan tunggakan — sistem menolak checkout

**Status:** PASSED | **Duration:** 7.39s

- 🪝 Before Hooks (2.10s)
  - 🪝 beforeEach hook (2.10s)
    - ⚙️ Fixture "context" (16ms)
      - 📝 Create context (15ms)
    - ⚙️ Fixture "page" (61ms)
      - 📝 Create page (60ms)
    - 📝 Navigate to "/login" (963ms)
    - 📝 Wait for load state "networkidle" (751ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (57ms)
    - 📝 Fill "sihuni123" locator('#password') (28ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (85ms)
    - 📝 Wait for navigation (119ms)
- 📝 Navigate to "/dashboard/tenants" (1.87s)
- 📝 Wait for load state "networkidle" (759ms)
- 📝 Wait for timeout (2.01s)
- 📝 Screenshot (491ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (170ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (12ms)
    - 📝 Close context (7ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/4bd78bd5-ba68-4e46-bfdb-137ed84477cb.png)

### ✅ KF-05-05: Lihat histori penghuni per kamar — daftar checked_out ditampilkan

**Status:** PASSED | **Duration:** 7.70s

- 🪝 Before Hooks (2.85s)
  - 🪝 beforeEach hook (2.85s)
    - ⚙️ Fixture "context" (7ms)
      - 📝 Create context (5ms)
    - ⚙️ Fixture "page" (59ms)
      - 📝 Create page (57ms)
    - 📝 Navigate to "/login" (1.68s)
    - 📝 Wait for load state "networkidle" (749ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (70ms)
    - 📝 Fill "sihuni123" locator('#password') (32ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (99ms)
    - 📝 Wait for navigation (132ms)
- 📝 Navigate to "/dashboard/tenants" (1.45s)
- 📝 Wait for load state "networkidle" (791ms)
- 📝 Wait for timeout (2.00s)
- 📝 Screenshot (260ms)
- 📝 Click getByRole('tab', { name: /histori|riwayat|checkout/i }) (101ms)
- 📝 Wait for load state "networkidle" (1ms)
- 📝 Screenshot (111ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (127ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/c1087a83-7912-48da-94b6-ed9dde9667e0.png)

### ✅ KF-05-06: Ubah data penghuni aktif — data berhasil diperbarui

**Status:** PASSED | **Duration:** 7.08s

- 🪝 Before Hooks (2.38s)
  - 🪝 beforeEach hook (2.38s)
    - ⚙️ Fixture "context" (6ms)
      - 📝 Create context (4ms)
    - ⚙️ Fixture "page" (67ms)
      - 📝 Create page (65ms)
    - 📝 Navigate to "/login" (1.35s)
    - 📝 Wait for load state "networkidle" (716ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (46ms)
    - 📝 Fill "sihuni123" locator('#password') (12ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (91ms)
    - 📝 Wait for navigation (86ms)
- 📝 Navigate to "/dashboard/tenants" (408ms)
- 📝 Wait for load state "networkidle" (807ms)
- 📝 Wait for timeout (2.01s)
- 📝 Screenshot (287ms)
- 📝 Click getByRole('button', { name: /edit|ubah/i }).first() (231ms)
- 📝 Wait for timeout (505ms)
- 📝 Screenshot (286ms)
- 📝 Expect "toContain" (1ms)
- 🪝 After Hooks (158ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (10ms)
    - 📝 Close context (6ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/7ddc2441-e260-4425-83fd-49ed332871f9.png)

## KF-06-pembayaran.spec.ts

### ✅ KF-06-01: Rekaman pembayaran otomatis H-3 — rekaman unpaid tersimpan oleh worker

**Status:** PASSED | **Duration:** 6.14s

- 🪝 Before Hooks (2.27s)
  - 🪝 beforeEach hook (2.27s)
    - ⚙️ Fixture "context" (7ms)
      - 📝 Create context (5ms)
    - ⚙️ Fixture "page" (71ms)
      - 📝 Create page (70ms)
    - 📝 Navigate to "/login" (1.19s)
    - 📝 Wait for load state "networkidle" (694ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (55ms)
    - 📝 Fill "sihuni123" locator('#password') (27ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (110ms)
    - 📝 Wait for navigation (100ms)
- 📝 Navigate to "/dashboard/payments" (1.68s)
- 📝 Wait for load state "networkidle" (770ms)
- 📝 Wait for timeout (1.01s)
- 📝 Screenshot (268ms)
- 📝 Expect "toContain"
- 📝 Expect "toBeGreaterThan" (1ms)
- 🪝 After Hooks (143ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (6ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/17c0496b-2c2b-4c6e-82fd-c4154fd48f57.png)

### ✅ KF-06-02: Rekaman overdue otomatis saat jatuh tempo terlewati — status berubah overdue

**Status:** PASSED | **Duration:** 4.88s

- 🪝 Before Hooks (1.81s)
  - 🪝 beforeEach hook (1.81s)
    - ⚙️ Fixture "context" (11ms)
      - 📝 Create context (10ms)
    - ⚙️ Fixture "page" (50ms)
      - 📝 Create page (48ms)
    - 📝 Navigate to "/login" (739ms)
    - 📝 Wait for load state "networkidle" (723ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (56ms)
    - 📝 Fill "sihuni123" locator('#password') (12ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (102ms)
    - 📝 Wait for navigation (106ms)
- 📝 Navigate to "/dashboard/payments" (1.05s)
- 📝 Wait for load state "networkidle" (782ms)
- 📝 Screenshot (1.07s)
- 📝 Expect "toContain"
- 🪝 After Hooks (156ms)
  - ⚙️ Fixture "page" (1ms)
  - ⚙️ Fixture "context" (11ms)
    - 📝 Close context (8ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/2756493b-875c-42a0-a08e-9d6b42a5556b.png)

### ✅ KF-06-03: Nominal terisi otomatis dari harga sewa saat pilih kamar

**Status:** PASSED | **Duration:** 5.26s

- 🪝 Before Hooks (2.75s)
  - 🪝 beforeEach hook (2.75s)
    - ⚙️ Fixture "context" (6ms)
      - 📝 Create context (5ms)
    - ⚙️ Fixture "page" (70ms)
      - 📝 Create page (69ms)
    - 📝 Navigate to "/login" (1.70s)
    - 📝 Wait for load state "networkidle" (722ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (59ms)
    - 📝 Fill "sihuni123" locator('#password') (14ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (76ms)
    - 📝 Wait for navigation (86ms)
- 📝 Navigate to "/dashboard/payments" (359ms)
- 📝 Wait for load state "networkidle" (808ms)
- 📝 Click getByRole('button', { name: /catat|tambah|add|baru/i }).first() (549ms)
- 📝 Wait for timeout (513ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (109ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (5ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/645cd141-76bd-456c-a342-a4654439ee8b.png)

### ✅ KF-06-04: Tandai pembayaran lunas — status berubah paid

**Status:** PASSED | **Duration:** 6.85s

- 🪝 Before Hooks (2.08s)
  - 🪝 beforeEach hook (2.08s)
    - ⚙️ Fixture "context" (4ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (53ms)
      - 📝 Create page (52ms)
    - 📝 Navigate to "/login" (884ms)
    - 📝 Wait for load state "networkidle" (727ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (73ms)
    - 📝 Fill "sihuni123" locator('#password') (36ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (140ms)
    - 📝 Wait for navigation (137ms)
- 📝 Navigate to "/dashboard/payments" (1.57s)
- 📝 Wait for load state "networkidle" (768ms)
- 📝 Screenshot (879ms)
- 📝 Click getByRole('button', { name: /lunas|paid|tandai/i }).first() (93ms)
- 📝 Wait for timeout (509ms)
- 📝 Click getByRole('button', { name: /ya|konfirmasi|lanjut/i }).first() (341ms)
- 📝 Wait for load state "networkidle" (1ms)
- 📝 Screenshot (411ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (173ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (9ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/0286e215-f05c-4853-99cd-ac1d4784a2e8.png)

### ✅ KF-06-05: Catat pembayaran manual — pembayaran tersimpan status paid

**Status:** PASSED | **Duration:** 7.13s

- 🪝 Before Hooks (2.94s)
  - 🪝 beforeEach hook (2.94s)
    - ⚙️ Fixture "context" (18ms)
      - 📝 Create context (16ms)
    - ⚙️ Fixture "page" (62ms)
      - 📝 Create page (60ms)
    - 📝 Navigate to "/login" (1.84s)
    - 📝 Wait for load state "networkidle" (720ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (59ms)
    - 📝 Fill "sihuni123" locator('#password') (17ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (117ms)
    - 📝 Wait for navigation (84ms)
- 📝 Navigate to "/dashboard/payments" (1.55s)
- 📝 Wait for load state "networkidle" (824ms)
- 📝 Click getByRole('button', { name: /tambah|add|baru|catat/i }).first() (720ms)
- 📝 Wait for timeout (509ms)
- 📝 Screenshot (269ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (152ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (7ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/4d745d0b-66f6-4de3-b85d-fecca9bdeb98.png)

### ✅ KF-06-06: Unggah bukti transfer — bukti tersimpan di MinIO

**Status:** PASSED | **Duration:** 4.98s

- 🪝 Before Hooks (1.79s)
  - 🪝 beforeEach hook (1.79s)
    - ⚙️ Fixture "context" (4ms)
      - 📝 Create context (2ms)
    - ⚙️ Fixture "page" (51ms)
      - 📝 Create page (49ms)
    - 📝 Navigate to "/login" (728ms)
    - 📝 Wait for load state "networkidle" (717ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (56ms)
    - 📝 Fill "sihuni123" locator('#password') (26ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (103ms)
    - 📝 Wait for navigation (89ms)
- 📝 Navigate to "/dashboard/payments" (1.73s)
- 📝 Wait for load state "networkidle" (867ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (466ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (7ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/09460759-9d63-4da5-a84d-1cc7a8b7cb8f.png)

### ✅ KF-06-07: Lihat riwayat pembayaran per kamar — histori ditampilkan kronologis

**Status:** PASSED | **Duration:** 5.42s

- 🪝 Before Hooks (2.81s)
  - 🪝 beforeEach hook (2.81s)
    - ⚙️ Fixture "context" (4ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (53ms)
      - 📝 Create page (51ms)
    - 📝 Navigate to "/login" (1.72s)
    - 📝 Wait for load state "networkidle" (710ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (67ms)
    - 📝 Fill "sihuni123" locator('#password') (34ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (103ms)
    - 📝 Wait for navigation (97ms)
- 📝 Navigate to "/dashboard/rooms" (1.48s)
- 📝 Wait for load state "networkidle" (701ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (390ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (11ms)
    - 📝 Close context (6ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/858fa481-bf71-4e46-a5e8-7a7d3fccde9f.png)

### ✅ KF-06-08: Tampil indikator pembayaran jatuh tempo di dashboard

**Status:** PASSED | **Duration:** 7.42s

- 🪝 Before Hooks (2.50s)
  - 🪝 beforeEach hook (2.50s)
    - ⚙️ Fixture "context" (5ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (87ms)
      - 📝 Create page (85ms)
    - 📝 Navigate to "/login" (1.36s)
    - 📝 Wait for load state "networkidle" (734ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (48ms)
    - 📝 Fill "sihuni123" locator('#password') (23ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (96ms)
    - 📝 Wait for navigation (124ms)
- 📝 Navigate to "/dashboard" (1.69s)
- 📝 Wait for load state "networkidle" (680ms)
- 📝 Wait for timeout (2.00s)
- 📝 Screenshot (370ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (190ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (9ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/8f596202-230f-47a3-88eb-088a8d432249.png)

## KF-07-konfirmasi-dp.spec.ts

### ✅ KF-07-01: Nominal DP terisi otomatis 10% dari harga sewa saat pilih kamar

**Status:** PASSED | **Duration:** 4.87s

- 🪝 Before Hooks (2.01s)
  - 🪝 beforeEach hook (2.01s)
    - ⚙️ Fixture "context" (12ms)
      - 📝 Create context (11ms)
    - ⚙️ Fixture "page" (61ms)
      - 📝 Create page (60ms)
    - 📝 Navigate to "/login" (954ms)
    - 📝 Wait for load state "networkidle" (726ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (41ms)
    - 📝 Fill "sihuni123" locator('#password') (19ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (98ms)
    - 📝 Wait for navigation (84ms)
- 📝 Navigate to "/dashboard/confirmations" (683ms)
- 📝 Wait for load state "networkidle" (719ms)
- 📝 Click getByRole('button', { name: /tambah|add|baru|catat/i }).first() (539ms)
- 📝 Wait for timeout (505ms)
- 📝 Click getByRole('button', { name: /batal|cancel|tutup/i }) (69ms)
- 📝 Expect "toContain" (1ms)
- 🪝 After Hooks (232ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (19ms)
    - 📝 Close context (15ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/9382447f-d72d-4a21-9e1d-3cd3662270a9.png)

### ✅ KF-07-02: Batas tanggal konfirmasi default H+7 saat buka form

**Status:** PASSED | **Duration:** 5.90s

- 🪝 Before Hooks (2.97s)
  - 🪝 beforeEach hook (2.97s)
    - ⚙️ Fixture "context" (9ms)
      - 📝 Create context (8ms)
    - ⚙️ Fixture "page" (98ms)
      - 📝 Create page (97ms)
    - 📝 Navigate to "/login" (1.83s)
    - 📝 Wait for load state "networkidle" (741ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (58ms)
    - 📝 Fill "sihuni123" locator('#password') (21ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (104ms)
    - 📝 Wait for navigation (89ms)
- 📝 Navigate to "/dashboard/confirmations" (903ms)
- 📝 Wait for load state "networkidle" (777ms)
- 📝 Click getByRole('button', { name: /tambah|add|baru|konfirmasi/i }).first() (459ms)
- 📝 Wait for timeout (508ms)
- 📝 Screenshot (116ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (122ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/c24cf2fd-c853-41f6-90ed-82694611c71a.png)

### ✅ KF-07-03: Catat konfirmasi DP untuk kamar available — status kamar berubah dp_confirmation

**Status:** PASSED | **Duration:** 4.88s

- 🪝 Before Hooks (2.17s)
  - 🪝 beforeEach hook (2.17s)
    - ⚙️ Fixture "context" (5ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (50ms)
      - 📝 Create page (49ms)
    - 📝 Navigate to "/login" (1.00s)
    - 📝 Wait for load state "networkidle" (742ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (68ms)
    - 📝 Fill "sihuni123" locator('#password') (43ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (110ms)
    - 📝 Wait for navigation (126ms)
- 📝 Navigate to "/dashboard/confirmations" (1.41s)
- 📝 Wait for load state "networkidle" (770ms)
- 📝 Screenshot (242ms)
- 📝 Expect "toContain"
- 📝 Expect "toBeGreaterThan"
- 🪝 After Hooks (296ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (28ms)
    - 📝 Close context (24ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/4c916d95-8b18-4335-ad7f-29e94222677b.png)

### ✅ KF-07-04: Catat konfirmasi DP untuk kamar berstatus terisi — sistem menolak

**Status:** PASSED | **Duration:** 5.21s

- 🪝 Before Hooks (2.88s)
  - 🪝 beforeEach hook (2.88s)
    - ⚙️ Fixture "context" (5ms)
      - 📝 Create context (4ms)
    - ⚙️ Fixture "page" (75ms)
      - 📝 Create page (73ms)
    - 📝 Navigate to "/login" (1.78s)
    - 📝 Wait for load state "networkidle" (742ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (63ms)
    - 📝 Fill "sihuni123" locator('#password') (26ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (85ms)
    - 📝 Wait for navigation (81ms)
- 📝 Navigate to "/dashboard/confirmations" (1.07s)
- 📝 Wait for load state "networkidle" (678ms)
- 📝 Screenshot (370ms)
- 📝 Expect "toContain" (1ms)
- 🪝 After Hooks (213ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (14ms)
    - 📝 Close context (11ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/a99f2fb3-56db-4285-821a-784c7f674ae7.png)

### ✅ KF-07-05: Catat konfirmasi kedua untuk kamar dp_confirmation — sistem menolak

**Status:** PASSED | **Duration:** 4.20s

- 🪝 Before Hooks (2.07s)
  - 🪝 beforeEach hook (2.07s)
    - ⚙️ Fixture "context" (4ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (69ms)
      - 📝 Create page (68ms)
    - 📝 Navigate to "/login" (980ms)
    - 📝 Wait for load state "networkidle" (714ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (53ms)
    - 📝 Fill "sihuni123" locator('#password') (25ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (128ms)
    - 📝 Wait for navigation (80ms)
- 📝 Navigate to "/dashboard/confirmations" (844ms)
- 📝 Wait for load state "networkidle" (768ms)
- 📝 Screenshot (328ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (200ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/cf0e2e6e-f203-43d7-a9ec-1aa8585e5dce.png)

### ✅ KF-07-06: Konfirmasi DP — status confirmed, penghuni baru dibuat, status kamar occupied (atomik)

**Status:** PASSED | **Duration:** 5.75s

- 🪝 Before Hooks (2.77s)
  - 🪝 beforeEach hook (2.77s)
    - ⚙️ Fixture "context" (6ms)
      - 📝 Create context (5ms)
    - ⚙️ Fixture "page" (62ms)
      - 📝 Create page (60ms)
    - 📝 Navigate to "/login" (1.70s)
    - 📝 Wait for load state "networkidle" (740ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (60ms)
    - 📝 Fill "sihuni123" locator('#password') (15ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (91ms)
    - 📝 Wait for navigation (81ms)
- 📝 Navigate to "/dashboard/confirmations" (819ms)
- 📝 Wait for load state "networkidle" (761ms)
- 📝 Screenshot (335ms)
- 📝 Click getByRole('button', { name: /konfirmasi|proses|confirm/i }).first() (310ms)
- 📝 Wait for timeout (502ms)
- 📝 Screenshot (125ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (103ms)
  - ⚙️ Fixture "page" (1ms)
  - ⚙️ Fixture "context" (7ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/2d98393d-4486-4aad-9cc9-4a232af618ba.png)

### ✅ KF-07-07: Hanguskan konfirmasi secara manual — status expired, kamar kembali available

**Status:** PASSED | **Duration:** 5.09s

- 🪝 Before Hooks (2.31s)
  - 🪝 beforeEach hook (2.31s)
    - ⚙️ Fixture "context" (6ms)
      - 📝 Create context (4ms)
    - ⚙️ Fixture "page" (64ms)
      - 📝 Create page (63ms)
    - 📝 Navigate to "/login" (1.17s)
    - 📝 Wait for load state "networkidle" (754ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (65ms)
    - 📝 Fill "sihuni123" locator('#password') (27ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (116ms)
    - 📝 Wait for navigation (91ms)
- 📝 Navigate to "/dashboard/confirmations" (663ms)
- 📝 Wait for load state "networkidle" (751ms)
- 📝 Screenshot (282ms)
- 📝 Click getByRole('button', { name: /hangus|expire|batal/i }).first() (154ms)
- 📝 Wait for timeout (509ms)
- 📝 Click getByRole('button', { name: /ya|konfirmasi|lanjut/i }).first() (141ms)
- 📝 Wait for load state "networkidle" (1ms)
- 📝 Screenshot (131ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (100ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (7ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/95ce10a5-3a24-4a79-a619-331d9546a329.png)

### ✅ KF-07-08: Hangus otomatis oleh worker saat batas tanggal terlewati — status expired

**Status:** PASSED | **Duration:** 5.99s

- 🪝 Before Hooks (3.01s)
  - 🪝 beforeEach hook (3.01s)
    - ⚙️ Fixture "context" (5ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (54ms)
      - 📝 Create page (52ms)
    - 📝 Navigate to "/login" (2.15s)
    - 📝 Wait for load state "networkidle" (505ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (55ms)
    - 📝 Fill "sihuni123" locator('#password') (21ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (101ms)
    - 📝 Wait for navigation (105ms)
- 📝 Navigate to "/dashboard/confirmations" (1.61s)
- 📝 Wait for load state "networkidle" (769ms)
- 📝 Screenshot (307ms)
- 📝 Expect "toBeVisible" locator('[class*=\'badge\'], td').filter({ hasText: /expired|hangus|kadaluarsa/i }).first() (48ms)
- 📝 Expect "toContain" (1ms)
- 🪝 After Hooks (218ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (18ms)
    - 📝 Close context (13ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/6bc0bbfc-62e9-4ae1-b1dd-cb5ab7594c01.png)

### ✅ KF-07-09: Panel peringatan batas tanggal konfirmasi mendekati di dashboard

**Status:** PASSED | **Duration:** 6.82s

- 🪝 Before Hooks (2.87s)
  - 🪝 beforeEach hook (2.87s)
    - ⚙️ Fixture "context" (16ms)
      - 📝 Create context (14ms)
    - ⚙️ Fixture "page" (69ms)
      - 📝 Create page (65ms)
    - 📝 Navigate to "/login" (1.74s)
    - 📝 Wait for load state "networkidle" (736ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (79ms)
    - 📝 Fill "sihuni123" locator('#password') (25ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (98ms)
    - 📝 Wait for navigation (80ms)
- 📝 Navigate to "/dashboard" (872ms)
- 📝 Wait for load state "networkidle" (694ms)
- 📝 Wait for timeout (2.01s)
- 📝 Screenshot (203ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (183ms)
  - ⚙️ Fixture "page" (1ms)
  - ⚙️ Fixture "context" (9ms)
    - 📝 Close context (6ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/0d9665d8-ba54-4dbf-bb3e-986b256f4012.png)

## KF-08-maintenance.spec.ts

### ✅ KF-08-01: Lapor kerusakan baru — laporan tersimpan status reported

**Status:** PASSED | **Duration:** 6.00s

- 🪝 Before Hooks (2.95s)
  - 🪝 beforeEach hook (2.95s)
    - ⚙️ Fixture "context" (9ms)
      - 📝 Create context (7ms)
    - ⚙️ Fixture "page" (74ms)
      - 📝 Create page (73ms)
    - 📝 Navigate to "/login" (1.89s)
    - 📝 Wait for load state "networkidle" (728ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (56ms)
    - 📝 Fill "sihuni123" locator('#password') (16ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (90ms)
    - 📝 Wait for navigation (71ms)
- 📝 Navigate to "/dashboard/maintenance" (862ms)
- 📝 Wait for load state "networkidle" (780ms)
- 📝 Click getByRole('button', { name: /lapor|tambah|add|baru/i }).first() (444ms)
- 📝 Wait for timeout (503ms)
- 📝 Fill "Kran kamar mandi bocor, air menetes terus" locator('textarea, input[name=\'damage_description\'], input[placeholder*=\'deskripsi\']').first() (12ms)
- 📝 Screenshot (98ms)
- 📝 Click getByRole('button', { name: /simpan|lapor|submit|ok/i }).first() (67ms)
- 📝 Wait for load state "networkidle"
- 📝 Screenshot (108ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (124ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/40750de3-131c-4969-b7d5-ced112824b99.png)

### ✅ KF-08-02: Unggah foto kerusakan — foto tersimpan di MinIO

**Status:** PASSED | **Duration:** 3.96s

- 🪝 Before Hooks (2.33s)
  - 🪝 beforeEach hook (2.33s)
    - ⚙️ Fixture "context" (5ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (56ms)
      - 📝 Create page (55ms)
    - 📝 Navigate to "/login" (1.16s)
    - 📝 Wait for load state "networkidle" (771ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (54ms)
    - 📝 Fill "sihuni123" locator('#password') (35ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (140ms)
    - 📝 Wait for navigation (87ms)
- 📝 Navigate to "/dashboard/maintenance" (632ms)
- 📝 Wait for load state "networkidle" (765ms)
- 📝 Expect "toContain" (1ms)
- 🪝 After Hooks (220ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (9ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/05206c58-7d32-42c3-9656-96c0283bd180.png)

### ✅ KF-08-03: Perbarui status ke diproses — status in_progress, log tersimpan

**Status:** PASSED | **Duration:** 4.87s

- 🪝 Before Hooks (2.21s)
  - 🪝 beforeEach hook (2.21s)
    - ⚙️ Fixture "context" (4ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (70ms)
      - 📝 Create page (68ms)
    - 📝 Navigate to "/login" (1.05s)
    - 📝 Wait for load state "networkidle" (754ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (62ms)
    - 📝 Fill "sihuni123" locator('#password') (48ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (106ms)
    - 📝 Wait for navigation (101ms)
- 📝 Navigate to "/dashboard/maintenance" (1.44s)
- 📝 Wait for load state "networkidle" (754ms)
- 📝 Screenshot (300ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (168ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (6ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/f11a17d1-fe2f-4ea3-9622-6faffad5e976.png)

### ✅ KF-08-04: Perbarui status ke selesai dan unggah foto penanganan

**Status:** PASSED | **Duration:** 4.89s

- 🪝 Before Hooks (2.19s)
  - 🪝 beforeEach hook (2.19s)
    - ⚙️ Fixture "context" (4ms)
      - 📝 Create context (2ms)
    - ⚙️ Fixture "page" (51ms)
      - 📝 Create page (49ms)
    - 📝 Navigate to "/login" (1.04s)
    - 📝 Wait for load state "networkidle" (725ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (54ms)
    - 📝 Fill "sihuni123" locator('#password') (38ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (115ms)
    - 📝 Wait for navigation (141ms)
- 📝 Navigate to "/dashboard/maintenance" (1.64s)
- 📝 Wait for load state "networkidle" (782ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (262ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (10ms)
    - 📝 Close context (6ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/2ff38d62-37b9-482f-80e8-14443cb92889.png)

### ✅ KF-08-05: Lihat log progres pemeliharaan secara kronologis

**Status:** PASSED | **Duration:** 4.86s

- 🪝 Before Hooks (2.40s)
  - 🪝 beforeEach hook (2.40s)
    - ⚙️ Fixture "context" (4ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (56ms)
      - 📝 Create page (55ms)
    - 📝 Navigate to "/login" (1.23s)
    - 📝 Wait for load state "networkidle" (764ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (56ms)
    - 📝 Fill "sihuni123" locator('#password') (45ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (109ms)
    - 📝 Wait for navigation (120ms)
- 📝 Navigate to "/dashboard/maintenance" (1.50s)
- 📝 Wait for load state "networkidle" (743ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (202ms)
  - ⚙️ Fixture "page" (1ms)
  - ⚙️ Fixture "context" (29ms)
    - 📝 Close context (25ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/2cfb596d-ba8c-46c8-b6a7-2595d09e7e8b.png)

### ✅ KF-08-06: Akses manajemen pemeliharaan sebagai Viewer — hanya baca

**Status:** PASSED | **Duration:** 6.46s

- 🪝 Before Hooks (59ms)
  - ⚙️ Fixture "context" (4ms)
    - 📝 Create context (3ms)
  - ⚙️ Fixture "page" (49ms)
    - 📝 Create page (48ms)
- 📝 Navigate to "/login" (1.24s)
- 📝 Wait for load state "networkidle" (809ms)
- 📝 Fill "viewer@sihuni.dev" locator('#email') (51ms)
- 📝 Fill "sihuni123" locator('#password') (18ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (93ms)
- 📝 Wait for navigation (99ms)
- 📝 Wait for timeout (504ms)
- 📝 Navigate to "/dashboard/maintenance" (1.04s)
- 📝 Wait for load state "networkidle" (763ms)
- 📝 Wait for timeout (1.50s)
- 📝 Screenshot (154ms)
- 📝 Expect "toContain" (1ms)
- 📝 Expect "toBe" (1ms)
- 🪝 After Hooks (112ms)
  - ⚙️ Fixture "page" (1ms)
  - ⚙️ Fixture "context" (9ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/4c8fb18b-e54c-4cb7-b5e2-8008e986203f.png)

## KF-09-pengguna.spec.ts

### ✅ KF-09-01: Tambah pengguna baru — pengguna tersimpan, dapat login

**Status:** PASSED | **Duration:** 4.54s

- 🪝 Before Hooks (2.12s)
  - 🪝 beforeEach hook (2.12s)
    - ⚙️ Fixture "context" (8ms)
      - 📝 Create context (6ms)
    - ⚙️ Fixture "page" (77ms)
      - 📝 Create page (75ms)
    - 📝 Navigate to "/login" (1.01s)
    - 📝 Wait for load state "networkidle" (716ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (52ms)
    - 📝 Fill "sihuni123" locator('#password') (27ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (107ms)
    - 📝 Wait for navigation (98ms)
- 📝 Navigate to "/dashboard/settings" (1.52s)
- 📝 Wait for load state "networkidle" (692ms)
- 📝 Screenshot (98ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (106ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (9ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/cff874f2-cea8-4a91-bf8f-75badda5b1de.png)

### ✅ KF-09-02: Ubah data pengguna — data berhasil diperbarui

**Status:** PASSED | **Duration:** 5.08s

- 🪝 Before Hooks (2.47s)
  - 🪝 beforeEach hook (2.47s)
    - ⚙️ Fixture "context" (4ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (61ms)
      - 📝 Create page (60ms)
    - 📝 Navigate to "/login" (1.33s)
    - 📝 Wait for load state "networkidle" (741ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (58ms)
    - 📝 Fill "sihuni123" locator('#password') (34ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (102ms)
    - 📝 Wait for navigation (117ms)
- 📝 Navigate to "/dashboard/settings" (1.67s)
- 📝 Wait for load state "networkidle" (723ms)
- 📝 Screenshot (101ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (103ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (11ms)
    - 📝 Close context (6ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/f555cbf1-f8ab-4744-b4c2-61934e409ca3.png)

### ✅ KF-09-03: Hapus pengguna (bukan diri sendiri) — pengguna berhasil dihapus

**Status:** PASSED | **Duration:** 4.88s

- 🪝 Before Hooks (2.53s)
  - 🪝 beforeEach hook (2.53s)
    - ⚙️ Fixture "context" (8ms)
      - 📝 Create context (6ms)
    - ⚙️ Fixture "page" (92ms)
      - 📝 Create page (90ms)
    - 📝 Navigate to "/login" (1.30s)
    - 📝 Wait for load state "networkidle" (750ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (66ms)
    - 📝 Fill "sihuni123" locator('#password') (62ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (121ms)
    - 📝 Wait for navigation (112ms)
- 📝 Navigate to "/dashboard/settings" (1.51s)
- 📝 Wait for load state "networkidle" (673ms)
- 📝 Screenshot (94ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (89ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (6ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/579d9074-1332-4b44-b0db-d8fb9b32769e.png)

### ✅ KF-09-04: Akses manajemen pengguna sebagai Viewer — akses ditolak

**Status:** PASSED | **Duration:** 6.17s

- 🪝 Before Hooks (70ms)
  - ⚙️ Fixture "context" (8ms)
    - 📝 Create context (6ms)
  - ⚙️ Fixture "page" (57ms)
    - 📝 Create page (55ms)
- 📝 Navigate to "/login" (1.31s)
- 📝 Wait for load state "networkidle" (758ms)
- 📝 Fill "viewer@sihuni.dev" locator('#email') (61ms)
- 📝 Fill "sihuni123" locator('#password') (27ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (109ms)
- 📝 Wait for navigation (80ms)
- 📝 Wait for timeout (507ms)
- 📝 Navigate to "/dashboard/settings" (1.09s)
- 📝 Wait for timeout (2.00s)
- 📝 Wait for load state "networkidle"
- 📝 Screenshot (77ms)
- 📝 Expect "not toContain"
- 🪝 After Hooks (61ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (7ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/5c567a1d-17ed-46d0-8506-ddfb97b1ae6b.png)

## KF-10-hak-akses.spec.ts

### ✅ KF-10-01: Operator mengakses seluruh fitur — semua menu dapat diakses

**Status:** PASSED | **Duration:** 20.42s

- 🪝 Before Hooks (70ms)
  - ⚙️ Fixture "context" (6ms)
    - 📝 Create context (4ms)
  - ⚙️ Fixture "page" (58ms)
    - 📝 Create page (57ms)
- 📝 Navigate to "/login" (1.23s)
- 📝 Wait for load state "networkidle" (512ms)
- 📝 Fill "operator@sihuni.dev" locator('#email') (71ms)
- 📝 Fill "sihuni123" locator('#password') (19ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (109ms)
- 📝 Wait for navigation (97ms)
- 📝 Navigate to "/dashboard" (2.30s)
- 📝 Wait for load state "networkidle" (677ms)
- 📝 Screenshot (549ms)
- 📝 Expect "toBeGreaterThan"
- 📝 Navigate to "/dashboard" (142ms)
- 📝 Wait for load state "networkidle" (627ms)
- 📝 Expect "toContain"
- 📝 Navigate to "/dashboard/properties" (257ms)
- 📝 Wait for load state "networkidle" (686ms)
- 📝 Expect "toContain"
- 📝 Navigate to "/dashboard/rooms" (621ms)
- 📝 Wait for load state "networkidle" (662ms)
- 📝 Expect "toContain" (1ms)
- 📝 Navigate to "/dashboard/tenants" (1.99s)
- 📝 Wait for load state "networkidle" (705ms)
- 📝 Expect "toContain"
- 📝 Navigate to "/dashboard/payments" (429ms)
- 📝 Wait for load state "networkidle" (676ms)
- 📝 Expect "toContain"
- 📝 Navigate to "/dashboard/confirmations" (343ms)
- 📝 Wait for load state "networkidle" (639ms)
- 📝 Expect "toContain"
- 📝 Navigate to "/dashboard/maintenance" (1.43s)
- 📝 Wait for load state "networkidle" (728ms)
- 📝 Expect "toContain"
- 📝 Navigate to "/dashboard/audit" (1.28s)
- 📝 Wait for load state "networkidle" (639ms)
- 📝 Expect "toContain"
- 📝 Navigate to "/dashboard/settings" (2.08s)
- 📝 Wait for load state "networkidle" (596ms)
- 📝 Expect "toContain"
- 📝 Screenshot (94ms)
- 🪝 After Hooks (103ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/8146c5ad-323e-4d76-affd-e308d91e2a37.png)

### ✅ KF-10-02: Viewer hanya mengakses fitur baca — tombol mutasi tidak tersedia

**Status:** PASSED | **Duration:** 6.85s

- 🪝 Before Hooks (74ms)
  - ⚙️ Fixture "context" (5ms)
    - 📝 Create context (4ms)
  - ⚙️ Fixture "page" (62ms)
    - 📝 Create page (61ms)
- 📝 Navigate to "/login" (1.54s)
- 📝 Wait for load state "networkidle" (746ms)
- 📝 Fill "viewer@sihuni.dev" locator('#email') (55ms)
- 📝 Fill "sihuni123" locator('#password') (23ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (102ms)
- 📝 Wait for navigation (103ms)
- 📝 Wait for load state "load"
- 📝 Wait for load state "networkidle"
- 📝 Screenshot (178ms)
- 📝 Navigate to "/dashboard/properties" (1.58s)
- 📝 Wait for load state "networkidle" (713ms)
- 📝 Wait for timeout (1.51s)
- 📝 Screenshot (94ms)
- 📝 Expect "toBe" (1ms)
- 🪝 After Hooks (107ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (9ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/33e57805-b1ac-47e6-bc9b-ebb9ec362c0d.png)

### ✅ KF-10-03: Viewer mengakses halaman khusus Operator — akses ditolak

**Status:** PASSED | **Duration:** 6.77s

- 🪝 Before Hooks (130ms)
  - ⚙️ Fixture "context" (7ms)
    - 📝 Create context (5ms)
  - ⚙️ Fixture "page" (117ms)
    - 📝 Create page (114ms)
- 📝 Navigate to "/login" (2.26s)
- 📝 Wait for load state "networkidle" (743ms)
- 📝 Fill "viewer@sihuni.dev" locator('#email') (62ms)
- 📝 Fill "sihuni123" locator('#password') (31ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (105ms)
- 📝 Wait for navigation (101ms)
- 📝 Wait for load state "load" (1ms)
- 📝 Navigate to "/dashboard/audit" (1.20s)
- 📝 Wait for timeout (2.01s)
- 📝 Wait for load state "networkidle" (1ms)
- 📝 Screenshot (54ms)
- 📝 Expect "not toContain"
- 🪝 After Hooks (61ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/c3b66266-9bf3-4b68-8d3a-7c493b226d6b.png)

### ✅ KF-10-04: Operator mengakses fitur Viewer Request — daftar permintaan ditampilkan

**Status:** PASSED | **Duration:** 4.94s

- 🪝 Before Hooks (71ms)
  - ⚙️ Fixture "context" (5ms)
    - 📝 Create context (4ms)
  - ⚙️ Fixture "page" (61ms)
    - 📝 Create page (60ms)
- 📝 Navigate to "/login" (1.95s)
- 📝 Wait for load state "networkidle" (708ms)
- 📝 Fill "operator@sihuni.dev" locator('#email') (47ms)
- 📝 Fill "sihuni123" locator('#password') (26ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (103ms)
- 📝 Wait for navigation (87ms)
- 📝 Navigate to "/dashboard/viewer-requests" (793ms)
- 📝 Wait for load state "networkidle" (682ms)
- 📝 Screenshot (231ms)
- 📝 Expect "toContain"
- 📝 Expect "toBeGreaterThan"
- 🪝 After Hooks (234ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (7ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/b0f135c7-0d8d-4595-8ef3-d9309e43e43b.png)

## KF-11-audit-trail.spec.ts

### ✅ KF-11-01: Tampil log perubahan status kamar — daftar log kronologis

**Status:** PASSED | **Duration:** 6.05s

- 🪝 Before Hooks (2.45s)
  - 🪝 beforeEach hook (2.45s)
    - ⚙️ Fixture "context" (6ms)
      - 📝 Create context (5ms)
    - ⚙️ Fixture "page" (65ms)
      - 📝 Create page (64ms)
    - 📝 Navigate to "/login" (1.32s)
    - 📝 Wait for load state "networkidle" (771ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (55ms)
    - 📝 Fill "sihuni123" locator('#password') (26ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (95ms)
    - 📝 Wait for navigation (100ms)
- 📝 Navigate to "/dashboard/audit" (1.42s)
- 📝 Wait for load state "networkidle" (764ms)
- 📝 Wait for timeout (1.01s)
- 📝 Screenshot (264ms)
- 📝 Expect "toContain"
- 📝 Expect "toBeGreaterThan"
- 🪝 After Hooks (141ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/6e591297-d28e-415e-8c95-05a01bde004f.png)

### ✅ KF-11-02: Filter log berdasarkan properti — hanya log properti tersebut tampil

**Status:** PASSED | **Duration:** 6.85s

- 🪝 Before Hooks (3.00s)
  - 🪝 beforeEach hook (2.99s)
    - ⚙️ Fixture "context" (4ms)
      - 📝 Create context (2ms)
    - ⚙️ Fixture "page" (65ms)
      - 📝 Create page (63ms)
    - 📝 Navigate to "/login" (1.87s)
    - 📝 Wait for load state "networkidle" (740ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (61ms)
    - 📝 Fill "sihuni123" locator('#password') (27ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (112ms)
    - 📝 Wait for navigation (93ms)
- 📝 Navigate to "/dashboard/audit" (1.66s)
- 📝 Wait for load state "networkidle" (743ms)
- 📝 Screenshot (498ms)
- 📝 Click locator('[role=\'combobox\'], select').first() (142ms)
- 📝 Click locator('[role=\'option\']').first() (214ms)
- 📝 Wait for load state "networkidle"
- 📝 Screenshot (446ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (127ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/fdfbb66b-6173-4259-a4e3-15f4110d1b65.png)

### ✅ KF-11-03: Filter log berdasarkan rentang tanggal — log sesuai rentang tampil

**Status:** PASSED | **Duration:** 3.67s

- 🪝 Before Hooks (1.37s)
  - 🪝 beforeEach hook (1.37s)
    - ⚙️ Fixture "context" (5ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (58ms)
      - 📝 Create page (56ms)
    - 📝 Navigate to "/login" (358ms)
    - 📝 Wait for load state "networkidle" (690ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (63ms)
    - 📝 Fill "sihuni123" locator('#password') (23ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (81ms)
    - 📝 Wait for navigation (72ms)
- 📝 Navigate to "/dashboard/audit" (848ms)
- 📝 Wait for load state "networkidle" (734ms)
- 📝 Screenshot (503ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (216ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (12ms)
    - 📝 Close context (8ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/bd4382fd-5420-42a0-8f2f-0b18569b032e.png)

### ✅ KF-11-04: Filter log berdasarkan pengguna atau proses sistem

**Status:** PASSED | **Duration:** 5.50s

- 🪝 Before Hooks (2.65s)
  - 🪝 beforeEach hook (2.65s)
    - ⚙️ Fixture "context" (5ms)
      - 📝 Create context (4ms)
    - ⚙️ Fixture "page" (52ms)
      - 📝 Create page (51ms)
    - 📝 Navigate to "/login" (1.58s)
    - 📝 Wait for load state "networkidle" (765ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (49ms)
    - 📝 Fill "sihuni123" locator('#password') (22ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (79ms)
    - 📝 Wait for navigation (78ms)
- 📝 Navigate to "/dashboard/audit" (825ms)
- 📝 Wait for load state "networkidle" (726ms)
- 📝 Screenshot (532ms)
- 📝 Query count locator('[role=\'combobox\'], select') (5ms)
- 📝 Click locator('[role=\'combobox\'], select').nth(1) (183ms)
- 📝 Click locator('[role=\'option\']').first() (238ms)
- 📝 Wait for load state "networkidle"
- 📝 Screenshot (194ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (137ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/83755dd2-7db9-4278-9eaf-2d9d9d795815.png)

### ✅ KF-11-05: Ekspor log ke format CSV — berkas CSV terunduh

**Status:** PASSED | **Duration:** 4.62s

- 🪝 Before Hooks (2.27s)
  - 🪝 beforeEach hook (2.27s)
    - ⚙️ Fixture "context" (4ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (52ms)
      - 📝 Create page (51ms)
    - 📝 Navigate to "/login" (1.21s)
    - 📝 Wait for load state "networkidle" (736ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (50ms)
    - 📝 Fill "sihuni123" locator('#password') (28ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (96ms)
    - 📝 Wait for navigation (75ms)
- 📝 Navigate to "/dashboard/audit" (778ms)
- 📝 Wait for load state "networkidle" (740ms)
- 📝 Screenshot (421ms)
- 📝 Screenshot (215ms)
- 📝 Expect "toBeVisible" getByRole('button', { name: /ekspor|export|csv/i }) (9ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (153ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (5ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/961b33d8-47bb-4ef1-b137-ea38105454d5.png)

### ✅ KF-11-06: Akses audit trail sebagai Viewer — akses ditolak

**Status:** PASSED | **Duration:** 4.47s

- 🪝 Before Hooks (60ms)
  - ⚙️ Fixture "context" (4ms)
    - 📝 Create context (3ms)
  - ⚙️ Fixture "page" (50ms)
    - 📝 Create page (49ms)
- 📝 Navigate to "/login" (408ms)
- 📝 Wait for load state "networkidle" (706ms)
- 📝 Fill "viewer@sihuni.dev" locator('#email') (45ms)
- 📝 Fill "sihuni123" locator('#password') (30ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (109ms)
- 📝 Wait for navigation (103ms)
- 📝 Wait for timeout (506ms)
- 📝 Navigate to "/dashboard/audit" (378ms)
- 📝 Wait for timeout (2.01s)
- 📝 Wait for load state "networkidle"
- 📝 Screenshot (47ms)
- 📝 Expect "not toContain"
- 🪝 After Hooks (66ms)
  - ⚙️ Fixture "page" (1ms)
  - ⚙️ Fixture "context" (11ms)
    - 📝 Close context (6ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/52238170-c021-4012-8ca1-beeaa113fe53.png)

## KF-12-notifikasi.spec.ts

### ✅ KF-12-01: Notifikasi dp_reminder otomatis 3 hari sebelum batas tanggal

**Status:** PASSED | **Duration:** 5.25s

- 🪝 Before Hooks (2.12s)
  - 🪝 beforeEach hook (2.12s)
    - ⚙️ Fixture "context" (5ms)
      - 📝 Create context (4ms)
    - ⚙️ Fixture "page" (53ms)
      - 📝 Create page (52ms)
    - 📝 Navigate to "/login" (989ms)
    - 📝 Wait for load state "networkidle" (786ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (57ms)
    - 📝 Fill "sihuni123" locator('#password') (21ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (96ms)
    - 📝 Wait for navigation (91ms)
- 📝 Navigate to "/dashboard/notifications" (1.35s)
- 📝 Wait for load state "networkidle" (652ms)
- 📝 Wait for timeout (1.01s)
- 📝 Screenshot (54ms)
- 📝 Expect "toContain"
- 📝 Expect "toBeGreaterThan" (1ms)
- 🪝 After Hooks (62ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (6ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/5b790fe4-d640-4763-82ca-eb3d98c52efe.png)

### ✅ KF-12-02: Notifikasi payment_due otomatis mendekati jatuh tempo

**Status:** PASSED | **Duration:** 3.34s

- 🪝 Before Hooks (1.52s)
  - 🪝 beforeEach hook (1.52s)
    - ⚙️ Fixture "context" (5ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (63ms)
      - 📝 Create page (62ms)
    - 📝 Navigate to "/login" (639ms)
    - 📝 Wait for load state "networkidle" (510ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (58ms)
    - 📝 Fill "sihuni123" locator('#password') (24ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (107ms)
    - 📝 Wait for navigation (97ms)
- 📝 Navigate to "/dashboard/notifications" (933ms)
- 📝 Wait for load state "networkidle" (685ms)
- 📝 Screenshot (115ms)
- 📝 Expect "toContain" (1ms)
- 🪝 After Hooks (93ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (6ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/80b4a404-9027-42d4-af95-58a5b7b9dee3.png)

### ✅ KF-12-03: Notifikasi contract_reminder untuk kontrak berakhir 7 hari

**Status:** PASSED | **Duration:** 4.89s

- 🪝 Before Hooks (2.92s)
  - 🪝 beforeEach hook (2.92s)
    - ⚙️ Fixture "context" (7ms)
      - 📝 Create context (5ms)
    - ⚙️ Fixture "page" (71ms)
      - 📝 Create page (69ms)
    - 📝 Navigate to "/login" (1.86s)
    - 📝 Wait for load state "networkidle" (718ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (46ms)
    - 📝 Fill "sihuni123" locator('#password') (24ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (89ms)
    - 📝 Wait for navigation (89ms)
- 📝 Navigate to "/dashboard/notifications" (1.17s)
- 📝 Wait for load state "networkidle" (644ms)
- 📝 Screenshot (90ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (85ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (7ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/f546b376-828d-4c6b-b326-b81a0cdc8ad9.png)

### ✅ KF-12-04: Tandai satu notifikasi sebagai sudah dibaca — status berubah

**Status:** PASSED | **Duration:** 5.01s

- 🪝 Before Hooks (2.44s)
  - 🪝 beforeEach hook (2.44s)
    - ⚙️ Fixture "context" (4ms)
      - 📝 Create context (2ms)
    - ⚙️ Fixture "page" (56ms)
      - 📝 Create page (54ms)
    - 📝 Navigate to "/login" (1.29s)
    - 📝 Wait for load state "networkidle" (759ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (59ms)
    - 📝 Fill "sihuni123" locator('#password') (24ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (97ms)
    - 📝 Wait for navigation (129ms)
- 📝 Navigate to "/dashboard/notifications" (1.70s)
- 📝 Wait for load state "networkidle" (641ms)
- 📝 Screenshot (128ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (91ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (7ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/549d2438-b5a3-490b-823e-0b724a9e722e.png)

### ✅ KF-12-05: Tandai semua notifikasi sebagai sudah dibaca

**Status:** PASSED | **Duration:** 4.86s

- 🪝 Before Hooks (2.40s)
  - 🪝 beforeEach hook (2.40s)
    - ⚙️ Fixture "context" (12ms)
      - 📝 Create context (11ms)
    - ⚙️ Fixture "page" (63ms)
      - 📝 Create page (60ms)
    - 📝 Navigate to "/login" (1.27s)
    - 📝 Wait for load state "networkidle" (737ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (64ms)
    - 📝 Fill "sihuni123" locator('#password') (18ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (131ms)
    - 📝 Wait for navigation (90ms)
- 📝 Navigate to "/dashboard/notifications" (1.58s)
- 📝 Wait for load state "networkidle" (664ms)
- 📝 Screenshot (103ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (99ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (9ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/94836624-d830-45fc-815e-1ea280fe81ee.png)

### ✅ KF-12-06: Hapus notifikasi yang sudah dibaca — notifikasi terhapus

**Status:** PASSED | **Duration:** 3.99s

- 🪝 Before Hooks (2.50s)
  - 🪝 beforeEach hook (2.50s)
    - ⚙️ Fixture "context" (5ms)
      - 📝 Create context (4ms)
    - ⚙️ Fixture "page" (65ms)
      - 📝 Create page (63ms)
    - 📝 Navigate to "/login" (1.46s)
    - 📝 Wait for load state "networkidle" (722ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (47ms)
    - 📝 Fill "sihuni123" locator('#password') (17ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (88ms)
    - 📝 Wait for navigation (81ms)
- 📝 Navigate to "/dashboard/notifications" (664ms)
- 📝 Wait for load state "networkidle" (646ms)
- 📝 Screenshot (92ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (89ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (6ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/906e7a0b-a1b5-40e7-b074-c65e7a30965e.png)

### ✅ KF-12-07: Akses notifikasi sebagai Viewer — halaman dapat diakses read-only

**Status:** PASSED | **Duration:** 5.02s

- 🪝 Before Hooks (82ms)
  - ⚙️ Fixture "context" (8ms)
    - 📝 Create context (4ms)
  - ⚙️ Fixture "page" (66ms)
    - 📝 Create page (65ms)
- 📝 Navigate to "/login" (1.43s)
- 📝 Wait for load state "networkidle" (684ms)
- 📝 Fill "viewer@sihuni.dev" locator('#email') (54ms)
- 📝 Fill "sihuni123" locator('#password') (36ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (77ms)
- 📝 Wait for navigation (114ms)
- 📝 Wait for timeout (505ms)
- 📝 Navigate to "/dashboard/notifications" (272ms)
- 📝 Wait for load state "networkidle" (632ms)
- 📝 Wait for timeout (1.01s)
- 📝 Screenshot (54ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (65ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (7ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/265e802e-fe5b-451c-bb6e-7ca690807e0c.png)

## KF-13-viewer-request.spec.ts

### ✅ KF-13-01: Viewer ajukan permintaan laporan pembayaran — tersimpan status forwarded

**Status:** PASSED | **Duration:** 6.79s

- 🪝 Before Hooks (2.48s)
  - 🪝 beforeEach hook (2.48s)
    - ⚙️ Fixture "context" (8ms)
      - 📝 Create context (5ms)
    - ⚙️ Fixture "page" (63ms)
      - 📝 Create page (62ms)
    - 📝 Navigate to "/login" (922ms)
    - 📝 Wait for load state "networkidle" (696ms)
    - 📝 Fill "viewer@sihuni.dev" locator('#email') (60ms)
    - 📝 Fill "sihuni123" locator('#password') (36ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (81ms)
    - 📝 Wait for navigation (75ms)
    - 📝 Wait for timeout (516ms)
- 📝 Navigate to "/dashboard" (366ms)
- 📝 Wait for load state "networkidle" (658ms)
- 📝 Wait for timeout (2.00s)
- 📝 Screenshot (233ms)
- 📝 Click locator('button').filter({ hasText: /pembayaran|payment|kerusakan|damage|calon|prospect|ajukan|permintaan/i }).first() (120ms)
- 📝 Wait for timeout (504ms)
- 📝 Query count locator('input:not([type=\'hidden\'])') (2ms)
- 📝 Fill "Penghuni sudah transfer sewa" locator('textarea').first() (9ms)
- 📝 Screenshot (204ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (201ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/8042f5c0-f591-41ff-8f5e-b69366a8ac83.png)

### ✅ KF-13-02: Viewer ajukan permintaan laporan kerusakan — tersimpan status forwarded

**Status:** PASSED | **Duration:** 8.76s

- 🪝 Before Hooks (3.84s)
  - 🪝 beforeEach hook (3.84s)
    - ⚙️ Fixture "context" (4ms)
      - 📝 Create context (4ms)
    - ⚙️ Fixture "page" (60ms)
      - 📝 Create page (58ms)
    - 📝 Navigate to "/login" (2.49s)
    - 📝 Wait for load state "networkidle" (503ms)
    - 📝 Fill "viewer@sihuni.dev" locator('#email') (45ms)
    - 📝 Fill "sihuni123" locator('#password') (19ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (89ms)
    - 📝 Wait for navigation (91ms)
    - 📝 Wait for timeout (514ms)
- 📝 Navigate to "/dashboard" (1.03s)
- 📝 Wait for load state "networkidle" (668ms)
- 📝 Wait for timeout (2.01s)
- 📝 Screenshot (218ms)
- 📝 Click locator('button').filter({ hasText: /kerusakan|damage/i }).first() (64ms)
- 📝 Wait for timeout (507ms)
- 📝 Query count locator('input:not([type=\'hidden\'])') (4ms)
- 📝 Fill "Pintu kamar rusak" locator('textarea').first() (12ms)
- 📝 Screenshot (216ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (176ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/56dc09d4-85a1-4b6c-b9f6-26eee7134aeb.png)

### ✅ KF-13-03: Viewer ajukan permintaan informasi calon penghuni — tersimpan

**Status:** PASSED | **Duration:** 6.98s

- 🪝 Before Hooks (1.93s)
  - 🪝 beforeEach hook (1.93s)
    - ⚙️ Fixture "context" (5ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (59ms)
      - 📝 Create page (57ms)
    - 📝 Navigate to "/login" (409ms)
    - 📝 Wait for load state "networkidle" (704ms)
    - 📝 Fill "viewer@sihuni.dev" locator('#email') (52ms)
    - 📝 Fill "sihuni123" locator('#password') (19ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (83ms)
    - 📝 Wait for navigation (74ms)
    - 📝 Wait for timeout (509ms)
- 📝 Navigate to "/dashboard" (1.08s)
- 📝 Wait for load state "networkidle" (692ms)
- 📝 Wait for timeout (2.01s)
- 📝 Screenshot (221ms)
- 📝 Click locator('button').filter({ hasText: /calon|prospect/i }).first() (77ms)
- 📝 Wait for timeout (515ms)
- 📝 Query count locator('input:not([type=\'hidden\'])') (3ms)
- 📝 Fill "B03" locator('input:not([type=\'hidden\'])').first() (12ms)
- 📝 Screenshot (244ms)
- 📝 Expect "toContain" (1ms)
- 🪝 After Hooks (175ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/d5e6cb0f-3aaa-4f29-8529-684a1b2f5228.png)

### ✅ KF-13-04: Viewer ajukan permintaan saat WhatsApp tidak aktif — status wa_failed

**Status:** PASSED | **Duration:** 6.34s

- 🪝 Before Hooks (3.02s)
  - 🪝 beforeEach hook (3.02s)
    - ⚙️ Fixture "context" (11ms)
      - 📝 Create context (10ms)
    - ⚙️ Fixture "page" (59ms)
      - 📝 Create page (57ms)
    - 📝 Navigate to "/login" (1.49s)
    - 📝 Wait for load state "networkidle" (715ms)
    - 📝 Fill "viewer@sihuni.dev" locator('#email') (42ms)
    - 📝 Fill "sihuni123" locator('#password') (27ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (80ms)
    - 📝 Wait for navigation (73ms)
    - 📝 Wait for timeout (506ms)
- 📝 Navigate to "/dashboard" (217ms)
- 📝 Wait for load state "networkidle" (697ms)
- 📝 Wait for timeout (2.01s)
- 📝 Screenshot (224ms)
- 📝 Expect "toContain" (1ms)
- 🪝 After Hooks (181ms)
  - ⚙️ Fixture "page" (1ms)
  - ⚙️ Fixture "context" (9ms)
    - 📝 Close context (6ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/2b13f31a-2338-427b-ac46-9a2813afbabf.png)

### ✅ KF-13-05: Viewer ajukan permintaan tanpa nomor kamar — validasi aktif

**Status:** PASSED | **Duration:** 7.67s

- 🪝 Before Hooks (3.61s)
  - 🪝 beforeEach hook (3.61s)
    - ⚙️ Fixture "context" (5ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (83ms)
      - 📝 Create page (82ms)
    - 📝 Navigate to "/login" (2.00s)
    - 📝 Wait for load state "networkidle" (759ms)
    - 📝 Fill "viewer@sihuni.dev" locator('#email') (47ms)
    - 📝 Fill "sihuni123" locator('#password') (22ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (84ms)
    - 📝 Wait for navigation (86ms)
    - 📝 Wait for timeout (511ms)
- 📝 Navigate to "/dashboard" (330ms)
- 📝 Wait for load state "networkidle" (701ms)
- 📝 Wait for timeout (2.02s)
- 📝 Click locator('button').filter({ hasText: /pembayaran|kerusakan|calon|payment|damage|prospect/i }).first() (83ms)
- 📝 Wait for timeout (509ms)
- 📝 Screenshot (195ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (197ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/937f7cf6-4040-4713-806d-bad840356cfd.png)

### ✅ KF-13-06: Viewer lihat riwayat permintaan — daftar ditampilkan kronologis

**Status:** PASSED | **Duration:** 5.37s

- 🪝 Before Hooks (1.92s)
  - 🪝 beforeEach hook (1.92s)
    - ⚙️ Fixture "context" (4ms)
      - 📝 Create context (4ms)
    - ⚙️ Fixture "page" (59ms)
      - 📝 Create page (58ms)
    - 📝 Navigate to "/login" (354ms)
    - 📝 Wait for load state "networkidle" (730ms)
    - 📝 Fill "viewer@sihuni.dev" locator('#email') (55ms)
    - 📝 Fill "sihuni123" locator('#password') (30ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (74ms)
    - 📝 Wait for navigation (79ms)
    - 📝 Wait for timeout (511ms)
- 📝 Navigate to "/dashboard" (353ms)
- 📝 Wait for load state "networkidle" (674ms)
- 📝 Wait for timeout (2.00s)
- 📝 Screenshot (244ms)
- 📝 Expect "toContain"
- 📝 Expect "toBeGreaterThan" (1ms)
- 🪝 After Hooks (180ms)
  - ⚙️ Fixture "page" (1ms)
  - ⚙️ Fixture "context" (9ms)
    - 📝 Close context (6ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/99fb490d-09f7-46ce-8481-7ef90ddbdd5b.png)

### ✅ KF-13-07: Viewer filter riwayat berdasarkan status

**Status:** PASSED | **Duration:** 7.76s

- 🪝 Before Hooks (3.17s)
  - 🪝 beforeEach hook (3.17s)
    - ⚙️ Fixture "context" (4ms)
      - 📝 Create context (2ms)
    - ⚙️ Fixture "page" (58ms)
      - 📝 Create page (56ms)
    - 📝 Navigate to "/login" (1.63s)
    - 📝 Wait for load state "networkidle" (669ms)
    - 📝 Fill "viewer@sihuni.dev" locator('#email') (54ms)
    - 📝 Fill "sihuni123" locator('#password') (31ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (101ms)
    - 📝 Wait for navigation (92ms)
    - 📝 Wait for timeout (510ms)
- 📝 Navigate to "/dashboard" (1.49s)
- 📝 Wait for load state "networkidle" (686ms)
- 📝 Wait for timeout (2.01s)
- 📝 Screenshot (225ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (193ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (14ms)
    - 📝 Close context (9ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/2635649f-a5b2-47f4-bcfa-b3814036d7e4.png)

### ✅ KF-13-08: Operator lihat daftar Viewer Request yang masuk — daftar ditampilkan

**Status:** PASSED | **Duration:** 7.09s

- 🪝 Before Hooks (86ms)
  - ⚙️ Fixture "context" (5ms)
    - 📝 Create context (3ms)
  - ⚙️ Fixture "page" (75ms)
    - 📝 Create page (74ms)
- 📝 Navigate to "/login" (1.93s)
- 📝 Wait for load state "networkidle" (759ms)
- 📝 Fill "operator@sihuni.dev" locator('#email') (56ms)
- 📝 Fill "sihuni123" locator('#password') (17ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (101ms)
- 📝 Wait for navigation (90ms)
- 📝 Navigate to "/dashboard/viewer-requests" (1.90s)
- 📝 Wait for load state "networkidle" (684ms)
- 📝 Wait for timeout (1.01s)
- 📝 Screenshot (259ms)
- 📝 Expect "toContain"
- 📝 Expect "toBeGreaterThan" (1ms)
- 🪝 After Hooks (181ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (11ms)
    - 📝 Close context (7ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/fbf873b8-2160-4c6d-965f-8c92be6c4d8a.png)

## KF-14-whatsapp.spec.ts

### ✅ KF-14-01: Tampil status koneksi WhatsApp di halaman Pengaturan

**Status:** PASSED | **Duration:** 5.18s

- 🪝 Before Hooks (2.04s)
  - 🪝 beforeEach hook (2.04s)
    - ⚙️ Fixture "context" (3ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (51ms)
      - 📝 Create page (50ms)
    - 📝 Navigate to "/login" (944ms)
    - 📝 Wait for load state "networkidle" (739ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (83ms)
    - 📝 Fill "sihuni123" locator('#password') (29ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (80ms)
    - 📝 Wait for navigation (91ms)
- 📝 Navigate to "/dashboard/settings" (1.70s)
- 📝 Wait for load state "networkidle" (638ms)
- 📝 Click getByRole('tab', { name: /whatsapp|wa/i }) (91ms)
- 📝 Wait for timeout (507ms)
- 📝 Screenshot (79ms)
- 📝 Expect "toContain"
- 📝 Expect "toBeGreaterThan"
- 🪝 After Hooks (86ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (6ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/08548f6f-d8c3-4bb7-8e9d-f3e657e8cbd9.png)

### ✅ KF-14-02: Inisiasi pairing QR saat status disconnected — QR code tampil

**Status:** PASSED | **Duration:** 6.27s

- 🪝 Before Hooks (1.81s)
  - 🪝 beforeEach hook (1.81s)
    - ⚙️ Fixture "context" (3ms)
      - 📝 Create context (2ms)
    - ⚙️ Fixture "page" (57ms)
      - 📝 Create page (55ms)
    - 📝 Navigate to "/login" (749ms)
    - 📝 Wait for load state "networkidle" (770ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (46ms)
    - 📝 Fill "sihuni123" locator('#password') (12ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (78ms)
    - 📝 Wait for navigation (79ms)
- 📝 Navigate to "/dashboard/settings" (927ms)
- 📝 Wait for load state "networkidle" (667ms)
- 📝 Click getByRole('tab', { name: /whatsapp|wa/i }) (120ms)
- 📝 Wait for timeout (501ms)
- 📝 Click getByRole('button', { name: /hubungkan|connect/i }) (54ms)
- 📝 Wait for timeout (2.01s)
- 📝 Screenshot (70ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (76ms)
  - ⚙️ Fixture "page" (1ms)
  - ⚙️ Fixture "context" (7ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/4ac5952e-2182-4cdb-a68c-77d1d2906f7f.png)

### ✅ KF-14-03: Batalkan proses pairing — status kembali disconnected

**Status:** PASSED | **Duration:** 3.86s

- 🪝 Before Hooks (1.51s)
  - 🪝 beforeEach hook (1.51s)
    - ⚙️ Fixture "context" (4ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (53ms)
      - 📝 Create page (52ms)
    - 📝 Navigate to "/login" (679ms)
    - 📝 Wait for load state "networkidle" (505ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (36ms)
    - 📝 Fill "sihuni123" locator('#password') (12ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (104ms)
    - 📝 Wait for navigation (99ms)
- 📝 Navigate to "/dashboard/settings" (889ms)
- 📝 Wait for load state "networkidle" (669ms)
- 📝 Click getByRole('tab', { name: /whatsapp|wa/i }) (97ms)
- 📝 Wait for timeout (514ms)
- 📝 Screenshot (56ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (85ms)
  - ⚙️ Fixture "page" (1ms)
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/a3403de8-b79b-4a73-a430-6416b366bcc1.png)

### ✅ KF-14-04: Koneksi berhasil setelah scan QR — status connected

**Status:** PASSED | **Duration:** 5.48s

- 🪝 Before Hooks (2.47s)
  - 🪝 beforeEach hook (2.47s)
    - ⚙️ Fixture "context" (4ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (68ms)
      - 📝 Create page (67ms)
    - 📝 Navigate to "/login" (1.59s)
    - 📝 Wait for load state "networkidle" (515ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (59ms)
    - 📝 Fill "sihuni123" locator('#password') (29ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (88ms)
    - 📝 Wait for navigation (99ms)
- 📝 Navigate to "/dashboard/settings" (1.53s)
- 📝 Wait for load state "networkidle" (649ms)
- 📝 Click getByRole('tab', { name: /whatsapp|wa/i }) (137ms)
- 📝 Wait for timeout (516ms)
- 📝 Screenshot (67ms)
- 📝 Expect "toContain" (1ms)
- 🪝 After Hooks (82ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/87d45af3-047a-4baf-8735-c614d2d5d89a.png)

### ✅ KF-14-05: Kirim pesan test ke nomor tujuan — pesan terkirim

**Status:** PASSED | **Duration:** 5.36s

- 🪝 Before Hooks (2.31s)
  - 🪝 beforeEach hook (2.31s)
    - ⚙️ Fixture "context" (3ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (61ms)
      - 📝 Create page (60ms)
    - 📝 Navigate to "/login" (1.20s)
    - 📝 Wait for load state "networkidle" (715ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (79ms)
    - 📝 Fill "sihuni123" locator('#password') (40ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (93ms)
    - 📝 Wait for navigation (92ms)
- 📝 Navigate to "/dashboard/settings" (1.55s)
- 📝 Wait for load state "networkidle" (695ms)
- 📝 Click getByRole('tab', { name: /whatsapp|wa/i }) (127ms)
- 📝 Wait for timeout (503ms)
- 📝 Screenshot (70ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (78ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (6ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/882ade8a-045c-4189-8d84-cdd456963558.png)

### ✅ KF-14-06: Disconnect koneksi aktif — status disconnected, sesi dihapus

**Status:** PASSED | **Duration:** 5.09s

- 🪝 Before Hooks (2.72s)
  - 🪝 beforeEach hook (2.72s)
    - ⚙️ Fixture "context" (4ms)
      - 📝 Create context (3ms)
    - ⚙️ Fixture "page" (61ms)
      - 📝 Create page (59ms)
    - 📝 Navigate to "/login" (1.69s)
    - 📝 Wait for load state "networkidle" (719ms)
    - 📝 Fill "operator@sihuni.dev" locator('#email') (57ms)
    - 📝 Fill "sihuni123" locator('#password') (17ms)
    - 📝 Click getByRole('button', { name: 'Masuk' }) (88ms)
    - 📝 Wait for navigation (77ms)
- 📝 Navigate to "/dashboard/settings" (902ms)
- 📝 Wait for load state "networkidle" (667ms)
- 📝 Click getByRole('tab', { name: /whatsapp|wa/i }) (118ms)
- 📝 Wait for timeout (507ms)
- 📝 Screenshot (61ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (84ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/6fc126c8-acc7-49c0-b4c2-a967e7e1925f.png)

### ✅ KF-14-07: Akses manajemen WhatsApp sebagai Viewer — akses ditolak

**Status:** PASSED | **Duration:** 5.40s

- 🪝 Before Hooks (58ms)
  - ⚙️ Fixture "context" (4ms)
    - 📝 Create context (3ms)
  - ⚙️ Fixture "page" (49ms)
    - 📝 Create page (48ms)
- 📝 Navigate to "/login" (694ms)
- 📝 Wait for load state "networkidle" (756ms)
- 📝 Fill "viewer@sihuni.dev" locator('#email') (52ms)
- 📝 Fill "sihuni123" locator('#password') (27ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (100ms)
- 📝 Wait for navigation (84ms)
- 📝 Wait for timeout (502ms)
- 📝 Navigate to "/dashboard/settings" (986ms)
- 📝 Wait for timeout (2.02s)
- 📝 Wait for load state "networkidle"
- 📝 Screenshot (54ms)
- 📝 Expect "not toContain"
- 🪝 After Hooks (72ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/28aa9615-0d0f-4369-8a8f-33c97699b663.png)

## NFR-01-usability.spec.ts

### ✅ NFR-01-01: Navigasi utama tersedia dan mudah ditemukan

**Status:** PASSED | **Duration:** 5.99s

- 🪝 Before Hooks (71ms)
  - ⚙️ Fixture "context" (4ms)
    - 📝 Create context (2ms)
  - ⚙️ Fixture "page" (61ms)
    - 📝 Create page (60ms)
- 📝 Navigate to "/login" (1.40s)
- 📝 Wait for load state "networkidle" (704ms)
- 📝 Fill "operator@sihuni.dev" locator('#email') (46ms)
- 📝 Fill "sihuni123" locator('#password') (29ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (111ms)
- 📝 Wait for navigation (78ms)
- 📝 Navigate to "/dashboard" (1.37s)
- 📝 Wait for load state "networkidle" (680ms)
- 📝 Wait for timeout (1.01s)
- 📝 Screenshot (300ms)
- 📝 Expect "toBeTruthy"
- 🪝 After Hooks (182ms)
  - ⚙️ Fixture "page" (1ms)
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/b6da264c-3d28-432b-81bb-3fd628a0fa06.png)

### ✅ NFR-01-02: Pesan error informatif ditampilkan saat login gagal

**Status:** PASSED | **Duration:** 3.23s

- 🪝 Before Hooks (61ms)
  - ⚙️ Fixture "context" (4ms)
    - 📝 Create context (3ms)
  - ⚙️ Fixture "page" (53ms)
    - 📝 Create page (50ms)
- 📝 Navigate to "/login" (1.75s)
- 📝 Wait for load state "networkidle" (515ms)
- 📝 Fill "salah@example.com" locator('#email') (46ms)
- 📝 Fill "wrongpass" locator('#password') (19ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (121ms)
- 📝 Wait for load state "networkidle"
- 📝 Screenshot (374ms)
- 📝 Expect "toContain"
- 🪝 After Hooks (347ms)
  - ⚙️ Fixture "page" (1ms)
  - ⚙️ Fixture "context" (7ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/662ca9df-51e0-4a71-bd78-9f35d0b8abd1.png)

### ✅ NFR-01-03: Halaman 404 informatif untuk route tidak dikenal

**Status:** PASSED | **Duration:** 1.81s

- 🪝 Before Hooks (56ms)
  - ⚙️ Fixture "context" (4ms)
    - 📝 Create context (2ms)
  - ⚙️ Fixture "page" (47ms)
    - 📝 Create page (45ms)
- 📝 Navigate to "/halaman-tidak-ada-xyz-123" (1.08s)
- 📝 Wait for load state "networkidle" (511ms)
- 📝 Screenshot (83ms)
- 📝 Expect "toBeTruthy"
- 📝 Expect "toBeGreaterThan"
- 🪝 After Hooks (76ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (9ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/eefa4b97-39cc-45cf-b3c6-4d37b50edbeb.png)

### ✅ NFR-01-04: Tombol aksi utama konsisten dan mudah diidentifikasi

**Status:** PASSED | **Duration:** 11.69s

- 🪝 Before Hooks (72ms)
  - ⚙️ Fixture "context" (12ms)
    - 📝 Create context (10ms)
  - ⚙️ Fixture "page" (54ms)
    - 📝 Create page (53ms)
- 📝 Navigate to "/login" (1.37s)
- 📝 Wait for load state "networkidle" (707ms)
- 📝 Fill "operator@sihuni.dev" locator('#email') (58ms)
- 📝 Fill "sihuni123" locator('#password') (19ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (88ms)
- 📝 Wait for navigation (85ms)
- 📝 Navigate to "/dashboard/properties" (707ms)
- 📝 Wait for load state "networkidle" (708ms)
- 📝 Wait for timeout (513ms)
- 📝 Expect "toBeGreaterThan"
- 📝 Navigate to "/dashboard/rooms" (1.32s)
- 📝 Wait for load state "networkidle" (604ms)
- 📝 Wait for timeout (513ms)
- 📝 Expect "toBeGreaterThan"
- 📝 Navigate to "/dashboard/payments" (944ms)
- 📝 Wait for load state "networkidle" (685ms)
- 📝 Wait for timeout (508ms)
- 📝 Expect "toBeGreaterThan"
- 📝 Navigate to "/dashboard/maintenance" (1.11s)
- 📝 Wait for load state "networkidle" (662ms)
- 📝 Wait for timeout (508ms)
- 📝 Expect "toBeGreaterThan"
- 📝 Screenshot (139ms)
- 🪝 After Hooks (138ms)
  - ⚙️ Fixture "page" (1ms)
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/be2cd487-ab7d-4101-b4af-24188552df6e.png)

### ✅ NFR-01-05: Semua halaman utama memuat konten tanpa blank screen

**Status:** PASSED | **Duration:** 26.07s

- 🪝 Before Hooks (81ms)
  - ⚙️ Fixture "context" (13ms)
    - 📝 Create context (12ms)
  - ⚙️ Fixture "page" (62ms)
    - 📝 Create page (60ms)
- 📝 Navigate to "/login" (1.53s)
- 📝 Wait for load state "networkidle" (762ms)
- 📝 Fill "operator@sihuni.dev" locator('#email') (46ms)
- 📝 Fill "sihuni123" locator('#password') (15ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (74ms)
- 📝 Wait for navigation (79ms)
- 📝 Navigate to "/dashboard" (1.51s)
- 📝 Wait for load state "networkidle" (688ms)
- 📝 Wait for timeout (505ms)
- 📝 Halaman dashboard blank
- 📝 Navigate to "/dashboard/properties" (1.08s)
- 📝 Wait for load state "networkidle" (662ms)
- 📝 Wait for timeout (512ms)
- 📝 Halaman properties blank (1ms)
- 📝 Navigate to "/dashboard/rooms" (846ms)
- 📝 Wait for load state "networkidle" (677ms)
- 📝 Wait for timeout (509ms)
- 📝 Halaman rooms blank
- 📝 Navigate to "/dashboard/tenants" (1.44s)
- 📝 Wait for load state "networkidle" (718ms)
- 📝 Wait for timeout (515ms)
- 📝 Halaman tenants blank
- 📝 Navigate to "/dashboard/payments" (1.88s)
- 📝 Wait for load state "networkidle" (685ms)
- 📝 Wait for timeout (512ms)
- 📝 Halaman payments blank (1ms)
- 📝 Navigate to "/dashboard/confirmations" (1.42s)
- 📝 Wait for load state "networkidle" (691ms)
- 📝 Wait for timeout (511ms)
- 📝 Halaman confirmations blank (1ms)
- 📝 Navigate to "/dashboard/maintenance" (1.11s)
- 📝 Wait for load state "networkidle" (851ms)
- 📝 Wait for timeout (504ms)
- 📝 Halaman maintenance blank
- 📝 Navigate to "/dashboard/notifications" (1.40s)
- 📝 Wait for load state "networkidle" (619ms)
- 📝 Wait for timeout (513ms)
- 📝 Halaman notifications blank
- 📝 Navigate to "/dashboard/audit" (998ms)
- 📝 Wait for load state "networkidle" (661ms)
- 📝 Wait for timeout (510ms)
- 📝 Halaman audit blank
- 📝 Screenshot (292ms)
- 🪝 After Hooks (146ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (7ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/0c4f0a1a-555b-4347-8cb4-caccc17b30af.png)

## NFR-02-aksesibilitas.spec.ts

### ✅ NFR-02-01: Sistem dapat diakses via browser tanpa instalasi tambahan

**Status:** PASSED | **Duration:** 2.80s

- 🪝 Before Hooks (71ms)
  - ⚙️ Fixture "context" (4ms)
    - 📝 Create context (3ms)
  - ⚙️ Fixture "page" (60ms)
    - 📝 Create page (59ms)
- 📝 Navigate to "/login" (1.23s)
- 📝 Wait for load state "networkidle" (758ms)
- 📝 Screenshot (398ms)
- 📝 Expect "toContain"
- 📝 Expect "toBeGreaterThan"
- 🪝 After Hooks (339ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (6ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/f0b77ea6-087e-45cd-a026-605ec342f568.png)

### ✅ NFR-02-02: Tampilan responsif desktop (1440px) — tidak ada horizontal overflow

**Status:** PASSED | **Duration:** 15.35s

- 🪝 Before Hooks (59ms)
  - ⚙️ Fixture "context" (3ms)
    - 📝 Create context (2ms)
  - ⚙️ Fixture "page" (50ms)
    - 📝 Create page (49ms)
- 📝 Navigate to "/login" (1.22s)
- 📝 Wait for load state "networkidle" (735ms)
- 📝 Fill "operator@sihuni.dev" locator('#email') (74ms)
- 📝 Fill "sihuni123" locator('#password') (20ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (66ms)
- 📝 Wait for navigation (117ms)
- 📝 Navigate to "/dashboard" (1.01s)
- 📝 Wait for load state "networkidle" (796ms)
- 📝 Wait for timeout (308ms)
- 📝 Evaluate (28ms)
- 📝 Evaluate (22ms)
- 📝 Horizontal overflow di /dashboard
- 📝 Navigate to "/dashboard/properties" (1.62s)
- 📝 Wait for load state "networkidle" (717ms)
- 📝 Wait for timeout (304ms)
- 📝 Evaluate (18ms)
- 📝 Evaluate (10ms)
- 📝 Horizontal overflow di /dashboard/properties
- 📝 Navigate to "/dashboard/rooms" (1.10s)
- 📝 Wait for load state "networkidle" (654ms)
- 📝 Wait for timeout (343ms)
- 📝 Evaluate (194ms)
- 📝 Evaluate (56ms)
- 📝 Horizontal overflow di /dashboard/rooms
- 📝 Navigate to "/dashboard/payments" (1.52s)
- 📝 Wait for load state "networkidle" (698ms)
- 📝 Wait for timeout (308ms)
- 📝 Evaluate (130ms)
- 📝 Evaluate (17ms)
- 📝 Horizontal overflow di /dashboard/payments
- 📝 Navigate to "/dashboard/maintenance" (1.86s)
- 📝 Wait for load state "networkidle" (668ms)
- 📝 Wait for timeout (309ms)
- 📝 Evaluate (15ms)
- 📝 Evaluate (1ms)
- 📝 Horizontal overflow di /dashboard/maintenance (1ms)
- 📝 Screenshot (166ms)
- 🪝 After Hooks (147ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/5b2faacf-ae00-411c-82ab-ab3afea8b176.png)

### ✅ NFR-02-03: Tampilan responsif mobile 390px — halaman dapat dibaca

**Status:** PASSED | **Duration:** 2.15s

- 🪝 Before Hooks (75ms)
  - ⚙️ Fixture "context" (5ms)
    - 📝 Create context (3ms)
  - ⚙️ Fixture "page" (62ms)
    - 📝 Create page (61ms)
- 📝 Set viewport size (1ms)
- 📝 Navigate to "/login" (1.15s)
- 📝 Wait for load state "networkidle" (689ms)
- 📝 Screenshot (117ms)
- 📝 Expect "toBeVisible" locator('#email') (8ms)
- 📝 Expect "toBeVisible" locator('#password') (3ms)
- 📝 Expect "toBeVisible" getByRole('button', { name: 'Masuk' }) (5ms)
- 🪝 After Hooks (100ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/71bdf0e1-6344-4bfa-9be6-0731bae749bb.png)

### ✅ NFR-02-04: Dashboard dapat diakses di viewport mobile 390px

**Status:** PASSED | **Duration:** 3.06s

- 🪝 Before Hooks (65ms)
  - ⚙️ Fixture "context" (5ms)
    - 📝 Create context (3ms)
  - ⚙️ Fixture "page" (55ms)
    - 📝 Create page (54ms)
- 📝 Set viewport size (1ms)
- 📝 Navigate to "/login" (893ms)
- 📝 Wait for load state "networkidle" (501ms)
- 📝 Fill "operator@sihuni.dev" locator('#email') (40ms)
- 📝 Fill "sihuni123" locator('#password') (10ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (51ms)
- 📝 Wait for navigation (72ms)
- 📝 Wait for load state "load"
- 📝 Wait for load state "networkidle"
- 📝 Wait for timeout (1.01s)
- 📝 Screenshot (351ms)
- 📝 Expect "toContain"
- 📝 Evaluate (2ms)
- 📝 Evaluate (2ms)
- 📝 Expect "toBeLessThanOrEqual"
- 🪝 After Hooks (60ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/f938ff3d-3dad-4379-b53d-9685116cb77c.png)

### ✅ NFR-02-05: Dark mode dapat diaktifkan tanpa layout rusak

**Status:** PASSED | **Duration:** 4.75s

- 🪝 Before Hooks (69ms)
  - ⚙️ Fixture "context" (4ms)
    - 📝 Create context (2ms)
  - ⚙️ Fixture "page" (59ms)
    - 📝 Create page (58ms)
- 📝 Navigate to "/login" (1.41s)
- 📝 Wait for load state "networkidle" (720ms)
- 📝 Fill "operator@sihuni.dev" locator('#email') (55ms)
- 📝 Fill "sihuni123" locator('#password') (28ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (80ms)
- 📝 Wait for navigation (85ms)
- 📝 Navigate to "/dashboard" (169ms)
- 📝 Wait for load state "networkidle" (707ms)
- 📝 Screenshot (347ms)
- 📝 Click getByRole('button', { name: /toggle.*theme|dark|light|tema/i }) (149ms)
- 📝 Wait for timeout (302ms)
- 📝 Screenshot (454ms)
- 📝 Expect "toBeGreaterThan"
- 🪝 After Hooks (146ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/e85df651-83eb-4f9f-82eb-41a30689f3b1.png)

### ✅ NFR-02-06: Semua halaman utama memuat tanpa error JavaScript fatal

**Status:** PASSED | **Duration:** 4.15s

- 🪝 Before Hooks (60ms)
  - ⚙️ Fixture "context" (5ms)
    - 📝 Create context (3ms)
  - ⚙️ Fixture "page" (51ms)
    - 📝 Create page (50ms)
- 📝 Navigate to "/login" (1.03s)
- 📝 Wait for load state "networkidle" (697ms)
- 📝 Fill "operator@sihuni.dev" locator('#email') (44ms)
- 📝 Fill "sihuni123" locator('#password') (26ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (103ms)
- 📝 Wait for navigation (76ms)
- 📝 Navigate to "/dashboard" (775ms)
- 📝 Wait for load state "networkidle" (681ms)
- 📝 Screenshot (430ms)
- 📝 Expect "toBe"
- 🪝 After Hooks (227ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/b572165b-7a87-4312-8e93-d4e755a11d38.png)

## NFR-03-keamanan.spec.ts

### ⏭️ NFR-03-01: Akses URL terproteksi tanpa token selalu redirect ke /login

**Status:** SKIPPED | **Duration:** 103ms

- 🪝 Before Hooks (56ms)
  - ⚙️ Fixture "context" (4ms)
    - 📝 Create context (3ms)
  - ⚙️ Fixture "page" (47ms)
    - 📝 Create page (46ms)
- 🪝 After Hooks (57ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (5ms)
    - 📝 Close context (2ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/0569a354-fe94-46c9-ab9e-062e7d6cc93c.png)

### ✅ NFR-03-02: Viewer tidak dapat mengakses halaman eksklusif Operator

**Status:** PASSED | **Duration:** 9.29s

- 🪝 Before Hooks (62ms)
  - ⚙️ Fixture "context" (3ms)
    - 📝 Create context (2ms)
  - ⚙️ Fixture "page" (53ms)
    - 📝 Create page (52ms)
- 📝 Navigate to "/login" (1.72s)
- 📝 Wait for load state "networkidle" (511ms)
- 📝 Fill "viewer@sihuni.dev" locator('#email') (63ms)
- 📝 Fill "sihuni123" locator('#password') (29ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (101ms)
- 📝 Wait for navigation (104ms)
- 📝 Wait for load state "load" (1ms)
- 📝 Navigate to "/dashboard/audit" (1.53s)
- 📝 Wait for timeout (2.01s)
- 📝 Wait for load state "networkidle"
- 📝 Screenshot (61ms)
- 📝 Expect "not toContain"
- 📝 Navigate to "/dashboard/settings" (979ms)
- 📝 Wait for timeout (2.01s)
- 📝 Wait for load state "networkidle"
- 📝 Screenshot (48ms)
- 📝 Expect "not toContain"
- 🪝 After Hooks (54ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (7ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/82f27fe1-6355-4932-98c1-06d8c53b947b.png)

### ✅ NFR-03-03: Viewer tidak dapat melihat tombol tambah/ubah/hapus

**Status:** PASSED | **Duration:** 5.21s

- 🪝 Before Hooks (63ms)
  - ⚙️ Fixture "context" (5ms)
    - 📝 Create context (3ms)
  - ⚙️ Fixture "page" (53ms)
    - 📝 Create page (52ms)
- 📝 Navigate to "/login" (879ms)
- 📝 Wait for load state "networkidle" (503ms)
- 📝 Fill "viewer@sihuni.dev" locator('#email') (44ms)
- 📝 Fill "sihuni123" locator('#password') (18ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (74ms)
- 📝 Wait for navigation (90ms)
- 📝 Wait for load state "load"
- 📝 Navigate to "/dashboard/properties" (1.09s)
- 📝 Wait for load state "networkidle" (698ms)
- 📝 Wait for timeout (1.50s)
- 📝 Screenshot (102ms)
- 📝 Expect "toBe"
- 📝 Expect "toBe"
- 📝 Expect "toBe"
- 🪝 After Hooks (111ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/a16fc11f-dca5-40cb-b1fc-354680bf5000.png)

### ✅ NFR-03-04: Operator dapat mengakses seluruh fitur sistem

**Status:** PASSED | **Duration:** 18.57s

- 🪝 Before Hooks (67ms)
  - ⚙️ Fixture "context" (4ms)
    - 📝 Create context (2ms)
  - ⚙️ Fixture "page" (58ms)
    - 📝 Create page (57ms)
- 📝 Navigate to "/login" (611ms)
- 📝 Wait for load state "networkidle" (684ms)
- 📝 Fill "operator@sihuni.dev" locator('#email') (63ms)
- 📝 Fill "sihuni123" locator('#password') (31ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (79ms)
- 📝 Wait for navigation (84ms)
- 📝 Navigate to "/dashboard" (1.80s)
- 📝 Wait for load state "networkidle" (678ms)
- 📝 Wait for timeout (306ms)
- 📝 Operator tidak bisa akses /dashboard
- 📝 Navigate to "/dashboard/properties" (1.12s)
- 📝 Wait for load state "networkidle" (604ms)
- 📝 Wait for timeout (309ms)
- 📝 Operator tidak bisa akses /dashboard/properties
- 📝 Navigate to "/dashboard/rooms" (199ms)
- 📝 Wait for load state "networkidle" (617ms)
- 📝 Wait for timeout (311ms)
- 📝 Operator tidak bisa akses /dashboard/rooms
- 📝 Navigate to "/dashboard/tenants" (886ms)
- 📝 Wait for load state "networkidle" (624ms)
- 📝 Wait for timeout (313ms)
- 📝 Operator tidak bisa akses /dashboard/tenants
- 📝 Navigate to "/dashboard/payments" (223ms)
- 📝 Wait for load state "networkidle" (645ms)
- 📝 Wait for timeout (311ms)
- 📝 Operator tidak bisa akses /dashboard/payments
- 📝 Navigate to "/dashboard/confirmations" (815ms)
- 📝 Wait for load state "networkidle" (629ms)
- 📝 Wait for timeout (307ms)
- 📝 Operator tidak bisa akses /dashboard/confirmations
- 📝 Navigate to "/dashboard/maintenance" (289ms)
- 📝 Wait for load state "networkidle" (667ms)
- 📝 Wait for timeout (307ms)
- 📝 Operator tidak bisa akses /dashboard/maintenance
- 📝 Navigate to "/dashboard/audit" (779ms)
- 📝 Wait for load state "networkidle" (609ms)
- 📝 Wait for timeout (310ms)
- 📝 Operator tidak bisa akses /dashboard/audit
- 📝 Navigate to "/dashboard/settings" (71ms)
- 📝 Wait for load state "networkidle" (596ms)
- 📝 Wait for timeout (311ms)
- 📝 Operator tidak bisa akses /dashboard/settings
- 📝 Navigate to "/dashboard/viewer-requests" (208ms)
- 📝 Wait for load state "networkidle" (616ms)
- 📝 Wait for timeout (311ms)
- 📝 Operator tidak bisa akses /dashboard/viewer-requests
- 📝 Navigate to "/dashboard/notifications" (88ms)
- 📝 Wait for load state "networkidle" (581ms)
- 📝 Wait for timeout (311ms)
- 📝 Operator tidak bisa akses /dashboard/notifications (1ms)
- 📝 Screenshot (74ms)
- 🪝 After Hooks (76ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (6ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/3e383ce9-7994-4800-a3d8-6a58cecfb852.png)

### ✅ NFR-03-05: Token autentikasi tidak muncul di URL

**Status:** PASSED | **Duration:** 3.07s

- 🪝 Before Hooks (59ms)
  - ⚙️ Fixture "context" (3ms)
    - 📝 Create context (3ms)
  - ⚙️ Fixture "page" (50ms)
    - 📝 Create page (49ms)
- 📝 Navigate to "/login" (1.02s)
- 📝 Wait for load state "networkidle" (512ms)
- 📝 Fill "operator@sihuni.dev" locator('#email') (34ms)
- 📝 Fill "sihuni123" locator('#password') (11ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (55ms)
- 📝 Wait for navigation (72ms)
- 📝 Navigate to "/dashboard" (116ms)
- 📝 Wait for load state "networkidle" (653ms)
- 📝 Screenshot (337ms)
- 📝 Expect "not toContain" (1ms)
- 📝 Expect "not toContain"
- 📝 Expect "not toContain"
- 🪝 After Hooks (191ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (8ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/63315471-b4fa-461c-8c51-1af62d40790b.png)

### ✅ NFR-03-06: Viewer dapat akses modul operasional (read-only) tanpa error

**Status:** PASSED | **Duration:** 10.88s

- 🪝 Before Hooks (66ms)
  - ⚙️ Fixture "context" (4ms)
    - 📝 Create context (3ms)
  - ⚙️ Fixture "page" (57ms)
    - 📝 Create page (56ms)
- 📝 Navigate to "/login" (1.12s)
- 📝 Wait for load state "networkidle" (501ms)
- 📝 Fill "viewer@sihuni.dev" locator('#email') (30ms)
- 📝 Fill "sihuni123" locator('#password') (26ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (79ms)
- 📝 Wait for navigation (67ms)
- 📝 Wait for load state "load" (1ms)
- 📝 Navigate to "/dashboard/properties" (785ms)
- 📝 Wait for load state "networkidle" (654ms)
- 📝 Wait for timeout (311ms)
- 📝 Viewer gagal akses /dashboard/properties
- 📝 Navigate to "/dashboard/rooms" (191ms)
- 📝 Wait for load state "networkidle" (573ms)
- 📝 Wait for timeout (313ms)
- 📝 Viewer gagal akses /dashboard/rooms (1ms)
- 📝 Navigate to "/dashboard/tenants" (155ms)
- 📝 Wait for load state "networkidle" (647ms)
- 📝 Wait for timeout (307ms)
- 📝 Viewer gagal akses /dashboard/tenants
- 📝 Navigate to "/dashboard/payments" (140ms)
- 📝 Wait for load state "networkidle" (650ms)
- 📝 Wait for timeout (313ms)
- 📝 Viewer gagal akses /dashboard/payments (1ms)
- 📝 Navigate to "/dashboard/confirmations" (766ms)
- 📝 Wait for load state "networkidle" (599ms)
- 📝 Wait for timeout (312ms)
- 📝 Viewer gagal akses /dashboard/confirmations
- 📝 Navigate to "/dashboard/maintenance" (82ms)
- 📝 Wait for load state "networkidle" (616ms)
- 📝 Wait for timeout (309ms)
- 📝 Viewer gagal akses /dashboard/maintenance
- 📝 Navigate to "/dashboard/notifications" (221ms)
- 📝 Wait for load state "networkidle" (566ms)
- 📝 Wait for timeout (308ms)
- 📝 Viewer gagal akses /dashboard/notifications
- 📝 Screenshot (75ms)
- 🪝 After Hooks (64ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (7ms)
    - 📝 Close context (4ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/c54659fb-8bd0-4141-ac8c-f9a39e3fc485.png)

### ✅ NFR-03-BB-01: Viewer dilarang membuat properti baru (POST /api/v1/properties) — 403 Forbidden

**Status:** PASSED | **Duration:** 2.22s

- 🪝 Before Hooks (59ms)
  - ⚙️ Fixture "context" (4ms)
    - 📝 Create context (2ms)
  - ⚙️ Fixture "page" (50ms)
    - 📝 Create page (49ms)
- 📝 Navigate to "/login" (1.10s)
- 📝 Wait for load state "networkidle" (512ms)
- 📝 Fill "viewer@sihuni.dev" locator('#email') (47ms)
- 📝 Fill "sihuni123" locator('#password') (22ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (83ms)
- 📝 Wait for navigation (74ms)
- 📝 Wait for load state "load"
- 📝 Wait for load state "networkidle"
- 📝 Evaluate (43ms)
- 📝 Evaluate (11ms)
- 📝 Screenshot (126ms)
- 📝 Expect "toBe"
- 🪝 After Hooks (133ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (5ms)
    - 📝 Close context (2ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/14418b37-da1d-4420-9037-24c4c675915c.png)

### ✅ NFR-03-BB-02: Viewer dilarang mengubah data properti (PUT /api/v1/properties/:id) — 403 Forbidden

**Status:** PASSED | **Duration:** 2.33s

- 🪝 Before Hooks (63ms)
  - ⚙️ Fixture "context" (4ms)
    - 📝 Create context (2ms)
  - ⚙️ Fixture "page" (54ms)
    - 📝 Create page (53ms)
- 📝 Navigate to "/login" (960ms)
- 📝 Wait for load state "networkidle" (504ms)
- 📝 Fill "viewer@sihuni.dev" locator('#email') (47ms)
- 📝 Fill "sihuni123" locator('#password') (19ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (74ms)
- 📝 Wait for navigation (90ms)
- 📝 Wait for load state "load"
- 📝 Wait for load state "networkidle" (1ms)
- 📝 Evaluate (55ms)
- 📝 Evaluate (12ms)
- 📝 Evaluate (6ms)
- 📝 Evaluate (27ms)
- 📝 Screenshot (326ms)
- 📝 Expect "toBe"
- 🪝 After Hooks (140ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (7ms)
    - 📝 Close context (5ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/9790bb49-5706-47df-adff-c382d15c3a53.png)

### ✅ NFR-03-BB-03: Viewer dilarang menghapus properti (DELETE /api/v1/properties/:id) — 403 Forbidden

**Status:** PASSED | **Duration:** 2.06s

- 🪝 Before Hooks (62ms)
  - ⚙️ Fixture "context" (4ms)
    - 📝 Create context (3ms)
  - ⚙️ Fixture "page" (53ms)
    - 📝 Create page (50ms)
- 📝 Navigate to "/login" (807ms)
- 📝 Wait for load state "networkidle" (507ms)
- 📝 Fill "viewer@sihuni.dev" locator('#email') (41ms)
- 📝 Fill "sihuni123" locator('#password') (22ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (69ms)
- 📝 Wait for navigation (73ms)
- 📝 Wait for load state "load"
- 📝 Wait for load state "networkidle"
- 📝 Evaluate (47ms)
- 📝 Evaluate (10ms)
- 📝 Evaluate (1ms)
- 📝 Evaluate (28ms)
- 📝 Screenshot (259ms)
- 📝 Expect "toBe"
- 🪝 After Hooks (133ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (6ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/da0f8cd8-4314-420b-9923-f57c3817cfcf.png)

### ✅ NFR-03-BB-04: Operator diizinkan membuat properti baru (POST /api/v1/properties) — bukan 403

**Status:** PASSED | **Duration:** 1.68s

- 🪝 Before Hooks (53ms)
  - ⚙️ Fixture "context" (3ms)
    - 📝 Create context (2ms)
  - ⚙️ Fixture "page" (44ms)
    - 📝 Create page (44ms)
- 📝 Navigate to "/login" (462ms)
- 📝 Wait for load state "networkidle" (515ms)
- 📝 Fill "operator@sihuni.dev" locator('#email') (46ms)
- 📝 Fill "sihuni123" locator('#password') (17ms)
- 📝 Click getByRole('button', { name: 'Masuk' }) (74ms)
- 📝 Wait for navigation (73ms)
- 📝 Wait for load state "networkidle" (1ms)
- 📝 Evaluate (65ms)
- 📝 Evaluate (10ms)
- 📝 Screenshot (186ms)
- 📝 Expect "not toBe"
- 📝 Expect "toContain"
- 🪝 After Hooks (180ms)
  - ⚙️ Fixture "page"
  - ⚙️ Fixture "context" (6ms)
    - 📝 Close context (3ms)

**Screenshots:**
- 📸 screenshot: ![screenshot](screenshots/d632330b-8cba-432b-a947-72ea9eb5fe77.png)

