# Tasks: feat-06-wa-notification

## Task List

### T1 — Add Whatsmeow dependency
```bash
cd F:\Coding\golang\Sistem-Hunian-Go
go get go.mau.fi/whatsmeow
go get github.com/mdp/qrterminal/v3
```

### T2 — WA Session Manager
- Buat `internal/pkg/waservice/session.go`
- Setup Whatsmeow client dengan SQLite store untuk session persistence
- Fungsi `Connect() error` — connect ke WA, QR scan jika belum ada session
- Fungsi `Disconnect()` — graceful disconnect

### T3 — WA Message Service
- Buat `internal/pkg/waservice/sender.go`
- Fungsi `SendMessage(to, body string) error`
- Cek `WA_ENABLED` env var — jika false, return nil
- Gunakan `WAClient.SendMessage()` dari Whatsmeow
- Log success/error tanpa panic

### T4 — Integrasi ke DP Worker
- Di `internal/worker/worker.go` (atau file dp worker)
- Setelah INSERT notification `dp_reminder` → panggil `waservice.SendMessage(operatorNumber, pesanReminder)`
- Setelah transaction `dp_expired` → panggil `waservice.SendMessage(operatorNumber, pesanExpired)`
- Gunakan goroutine + recover agar WA failure tidak crash worker

### T5 — Integrasi ke Payment Worker
- Setelah INSERT notification `payment_due` → kirim WA
- Setelah UPDATE status `overdue` → kirim WA
- Format pesan sesuai SRS srs_background_worker.md §4 contoh pesan

### T6 — Startup sequence
- Di `cmd/api/main.go`, init WA session sebelum start HTTP server
- Jika `WA_ENABLED=false`, skip init
- Graceful shutdown: disconnect WA saat app stop

### T7 — Environment config
- Tambah ke `.env.example`: `WA_ENABLED`, `WA_OPERATOR_NUMBER`, `WA_SESSION_PATH`
- Update Railway environment variables

### T8 — Go build + manual test
- `go build ./...` — 0 errors
- Test manual: trigger worker → verify WA diterima

## Definition of Done
- [ ] go.mau.fi/whatsmeow berhasil di-import
- [ ] QR scan berhasil, session persisted
- [ ] WA_ENABLED=false tidak mengirim pesan
- [ ] WA_ENABLED=true mengirim pesan ke WA_OPERATOR_NUMBER
- [ ] DP expired trigger → pesan WA diterima
- [ ] Payment overdue trigger → pesan WA diterima
- [ ] Worker tidak crash jika WA gagal
- [ ] Go build sukses
