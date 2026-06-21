# Proposal: feat-02-notification-ux

## Summary
Notification panel di dashboard belum sesuai SRS §4.2: belum ada toggle unread/semua, mark-as-read belum berfungsi per notifikasi, dan Viewer masih bisa melihat notification panel.

## Problem
- Panel default seharusnya hanya unread, ada toggle untuk lihat semua — belum ada
- Operator seharusnya bisa mark-as-read per notifikasi — belum diimplementasi
- Viewer tidak seharusnya melihat notification panel — masih tampil

## Solution
Update NotificationsDropdown component dan dashboard notification section sesuai spesifikasi SRS §4.2.

## Requirements

### MODIFIED — Notification Panel default state
- Panel SHALL menampilkan hanya notifikasi `is_read = false` secara default
- Panel SHALL memiliki toggle "Lihat semua" untuk tampilkan semua notifikasi
- Scenario: Operator buka dashboard → hanya notif unread tampil, klik "Lihat semua" → semua notif tampil

### ADDED — Mark-as-read per notifikasi
- Operator SHALL dapat menandai satu notifikasi sebagai dibaca
- Klik pada notifikasi atau tombol "Tandai dibaca" SHALL memanggil `PATCH /api/v1/notifications/:id/read`
- Setelah mark-as-read, notifikasi hilang dari view default (unread only)
- Scenario: Operator klik mark-as-read pada notif → notif hilang dari list unread

### MODIFIED — Role visibility
- Notification panel SHALL hanya tampil untuk role `operator`
- Viewer dan Manager SHALL NOT melihat notification panel
- Scenario: Login sebagai viewer/manager → tidak ada notification bell/panel di dashboard

## Non-Goals
- Tidak mengubah cara background worker membuat notifikasi
- Tidak menambahkan notification untuk role selain Operator

## Dependencies
- API endpoint `PATCH /api/v1/notifications/:id/read` sudah ada di backend
- `useNotifications` hook atau service di `src/features/notifications/`
- feat-01-dashboard-roles harus selesai terlebih dahulu (role-based rendering sudah ada)
