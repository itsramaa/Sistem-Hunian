# 10 — Notifications

**Pages**: `/dashboard/notifications`  
**Components**: `NotificationsDropdown.tsx`, `NotificationHistory.tsx`

---

## Current Issues

- Dropdown mungkin tidak cukup informatif
- Unread badge count mungkin tidak ter-update realtime
- Notification history mungkin tidak ada grouping

---

## Enhancement Specification

### Notification Dropdown (Header)

#### Trigger Button
```
[Bell icon]
[Badge count: merah, angka unread]
```
- Badge hilang jika count = 0
- `cursor-pointer hover:bg-accent/50 transition-colors`

#### Dropdown Content
- Max height: `max-h-96 overflow-y-auto`
- Header: "Notifikasi" + tombol "Tandai Semua Dibaca"
- Divider

#### Notification Item
```
[Icon tipe]  [Pesan 2 baris truncate]
             [Waktu relatif: "2 menit lalu"]
[● unread dot jika belum dibaca]
```

#### Tipe Icon
- `dp_reminder` → Clock (warning color)
- `dp_expired` → XCircle (destructive color)
- `payment_due` → AlertCircle (info color)
- `payment_overdue` → AlertTriangle (destructive color)
- `maintenance` → Wrench (primary color)

#### Empty State
```
[Bell icon]
"Tidak ada notifikasi"
```

#### Footer Link
"Lihat semua notifikasi →"

### Notification History Page

#### Page Header
```
Notifikasi                           [Tandai Semua Dibaca]
Riwayat semua notifikasi operasional
```

#### Grouping by Date
```
─── Hari Ini ────────────────
[Item] [Item]
─── Kemarin ─────────────────
[Item]
─── Minggu Lalu ─────────────
[Item]
```

#### Notification Row
```
[Icon bg-tipe/10]  [Pesan]                           [Waktu]
                   [Sub-label: tipe notifikasi]       [● unread]
```
- Unread: background `bg-primary/5`
- Read: background normal
- Hover: `hover:bg-muted/50 cursor-pointer`
- Klik → mark as read

#### Empty State
```
[Bell icon]
"Belum ada notifikasi"
"Notifikasi akan muncul saat ada aktivitas operasional"
```

### Acceptance Criteria
- [ ] Badge count unread tampil di header
- [ ] Badge hilang saat semua sudah dibaca
- [ ] Icon per tipe notifikasi
- [ ] Waktu relatif di dropdown
- [ ] History digroup per tanggal
- [ ] Klik item → mark as read + update UI
- [ ] Tombol "Tandai Semua Dibaca" berfungsi
