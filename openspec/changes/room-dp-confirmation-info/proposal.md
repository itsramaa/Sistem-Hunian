# Proposal: Room Detail — DP Confirmation Info Section

## Problem

Saat kamar berstatus `dp_confirmation`, Room Detail tidak menampilkan informasi terkait konfirmasi DP yang sedang berjalan — nama calon penghuni, nominal DP, dan batas tanggal konfirmasi tidak terlihat. Operator harus navigasi ke halaman Confirmations secara terpisah untuk mendapat info ini.

## Solution

Tambahkan section "Info Konfirmasi DP" di Room Detail yang muncul conditional saat `room.status === "dp_confirmation"`. Section ini menampilkan data dari confirmation yang terkait dan memiliki shortcut ke halaman Confirmations.

## Scope

- **Frontend only** — data confirmation sudah bisa di-fetch via `GET /api/v1/confirmations?room_id=<id>&status=pending`
- File: `src/features/rooms/pages/RoomDetail.tsx`
- Menggunakan hook `useConfirmations` yang sudah ada

## Implementation Plan

### 1. Fetch confirmation data di RoomDetail

```ts
const { data: confirmData } = useConfirmations(
  1,
  1,
  "pending",
  undefined,
  room?.id,
);
const activeConfirmation = confirmData?.confirmations?.[0] ?? null;
```

### 2. Inject section di bawah Room Info Cards

```tsx
{
  room.status === "dp_confirmation" && activeConfirmation && (
    <div className="glass-card p-4 space-y-3 border-l-4 border-yellow-500">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-yellow-600" />
          Info Konfirmasi DP
        </h2>
        <button
          onClick={() => navigate(`/dashboard/confirmations`)}
          className="text-xs text-primary hover:underline"
        >
          Lihat Detail
        </button>
      </div>
      <dl className="space-y-2">
        <div className="flex justify-between text-sm">
          <dt className="text-muted-foreground">Calon Penghuni</dt>
          <dd className="font-medium">
            {activeConfirmation.nama_calon_penghuni}
          </dd>
        </div>
        <div className="flex justify-between text-sm">
          <dt className="text-muted-foreground">Nominal DP</dt>
          <dd className="font-medium tabular-nums">
            Rp{activeConfirmation.nominal_dp.toLocaleString("id-ID")}
          </dd>
        </div>
        <div className="flex justify-between text-sm">
          <dt className="text-muted-foreground">Batas Konfirmasi</dt>
          <dd className={`font-medium ${sisa <= 3 ? "text-destructive" : ""}`}>
            {fmt(activeConfirmation.batas_tanggal_konfirmasi)} ({sisa} hari
            lagi)
          </dd>
        </div>
      </dl>
    </div>
  );
}
```

## Acceptance Criteria

- [ ] Saat `room.status === "dp_confirmation"`, section Info Konfirmasi DP tampil
- [ ] Menampilkan nama calon penghuni, nominal DP, batas tanggal
- [ ] Batas tanggal yang ≤ 3 hari tampil merah
- [ ] Tombol "Lihat Detail" navigate ke Confirmations
- [ ] Saat status bukan `dp_confirmation`, section tidak tampil
