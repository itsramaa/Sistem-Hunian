# Proposal: feat-06-wa-notification

## Summary
FR-09 mensyaratkan notifikasi operasional untuk Operator. Saat ini notifikasi hanya in-app — tidak berguna jika Operator tidak membuka aplikasi. WhatsApp via Whatsmeow (Go library, gratis, self-hosted) mengirim pesan langsung ke HP Operator saat background worker mendeteksi kondisi kritis.

## Problem
- Notifikasi in-app tidak efektif jika Operator jarang buka aplikasi
- DP expired dan payment overdue bisa terlewat
- Tidak ada mekanisme push/external delivery

## Solution
Integrasi Whatsmeow ke Go backend. Background worker mengirim WA message ke nomor Operator saat trigger event (dp_reminder, dp_expired, payment_due, payment_overdue). Feature flag WA_ENABLED untuk on/off tanpa redeploy.

## Requirements

### ADDED — WA Session Manager
- Backend SHALL setup Whatsmeow session dengan QR code scan sekali
- Session SHALL persisted ke database atau file agar tidak perlu scan ulang setiap restart
- Scenario: Admin scan QR sekali → session tersimpan → WA aktif sampai logout manual

### ADDED — WA Message Service
- `sendMessage(to string, body string) error` SHALL tersedia sebagai internal service
- Pesan dikirim ke `WA_OPERATOR_NUMBER` (env var)
- Jika WA_ENABLED = false, fungsi di-skip tanpa error
- Scenario: Worker trigger dp_expired → sendMessage dipanggil → pesan WA dikirim ke operator

### ADDED — Integration ke Background Workers
- DP Expiration Worker SHALL kirim WA saat `dp_reminder` dan `dp_expired`
- Payment Monitoring Worker SHALL kirim WA saat `payment_due` dan `payment_overdue`
- Pesan format sesuai SRS §4 notification spec (sudah ada contoh pesan di srs_background_worker.md)
- WA delivery SHALL tidak memblokir worker jika gagal (async/non-blocking)

### ADDED — Configuration
- `WA_ENABLED=true/false` env var (feature flag)
- `WA_OPERATOR_NUMBER=628xxxxxxxxxx` env var (nomor tujuan dalam format internasional)
- `WA_SESSION_PATH=./wa-session` env var (path penyimpanan session)

## Non-Goals
- Tidak mengirim WA ke lebih dari 1 nomor (hanya operator)
- Tidak ada WA untuk Manager atau Viewer
- Tidak ada 2-way WA (hanya outbound)
- Tidak menggunakan Official WhatsApp Business API

## Dependencies
- Go backend di `F:\Coding\golang\Sistem-Hunian-Go`
- `github.com/mdp/qrterminal` atau sejenisnya untuk display QR di terminal
- `go.mau.fi/whatsmeow` library
- Whatsapp account untuk session (personal/bisnis)
