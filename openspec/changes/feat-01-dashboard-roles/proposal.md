# Proposal: feat-01-dashboard-roles

## Summary
Dashboard saat ini menampilkan komponen yang sama untuk semua role. SRS §4.2 mendefinisikan tampilan berbeda per role: Viewer hanya Summary Cards, Manager Summary Cards + Alert Panel (read-only), Operator semua komponen.

## Problem
- Viewer melihat Notification Panel dan Alert Panel yang tidak relevan dengan kebutuhannya
- Manager tidak melihat Alert Panel padahal SRS §4.2 eksplisit menyatakannya
- NFR-01 mensyaratkan tampilan Viewer "benar-benar minimal"

## Solution
Tambahkan role-based conditional rendering di Dashboard component berdasarkan `role` dari `useAuth()`.

## Requirements

### MODIFIED — Dashboard §4.2 Viewer
- Viewer SHALL hanya melihat Summary Cards (Total Properti, Total Kamar, Tersedia, Terisi, Konfirmasi DP)
- Viewer SHALL NOT melihat Alert Panel
- Viewer SHALL NOT melihat Notification Panel
- Scenario: Login sebagai viewer → dashboard hanya tampilkan 5 summary cards, tidak ada panel lain

### MODIFIED — Dashboard §4.2 Manager  
- Manager SHALL melihat Summary Cards + Alert Panel (read-only)
- Manager SHALL NOT melihat Notification Panel
- Manager SHALL NOT melihat tombol aksi apapun di Alert Panel
- Scenario: Login sebagai manager → dashboard tampilkan summary cards + alert panel tanpa action buttons

### UNCHANGED — Dashboard §4.2 Operator
- Operator SHALL melihat Summary Cards + Alert Panel + Notification Panel
- Operator SHALL dapat melakukan mark-as-read pada notifikasi

## Non-Goals
- Tidak mengubah data yang ditampilkan di Summary Cards
- Tidak mengubah API calls

## Dependencies
- `useAuth()` hook sudah tersedia dan mengembalikan `role`
- Dashboard component di `src/features/dashboard/pages/Dashboard.tsx`
