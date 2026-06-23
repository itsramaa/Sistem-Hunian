# Proposal: Notifications — Delete/Clear Lama

## Problem

Notifikasi yang sudah dibaca terus menumpuk dan tidak ada cara untuk menghapus/clear notifikasi lama. Setelah lama dipakai, list notifikasi menjadi panjang dan sulit dibaca.

## Solution

Tambah tombol "Hapus semua yang sudah dibaca" di Notification panel (Dashboard) dan halaman Notifications. Backend perlu endpoint `DELETE /api/v1/notifications/read` untuk bulk delete notifikasi yang sudah is_read=true.

## Scope

- **Frontend** — `src/features/dashboard/pages/Dashboard.tsx` (NotificationPanel) + `src/features/notifications/`
- **Backend** — tambah endpoint `DELETE /api/v1/notifications/read`

## Backend Requirement

```
DELETE /api/v1/notifications/read
Response: { success: true, data: { deleted: number } }
```

## Frontend Implementation Plan

### NotificationPanel di Dashboard

```tsx
const clearReadMutation = useClearReadNotifications();

// Di header panel
{
  showAll && items.filter((n) => n.is_read).length > 0 && (
    <button
      onClick={() => clearReadMutation.mutate()}
      className="text-xs text-destructive hover:underline"
    >
      Hapus yang sudah dibaca
    </button>
  );
}
```

### Hook baru

```ts
export function useClearReadNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete("/notifications/read"),
    onSuccess: () => qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] }),
  });
}
```

## Acceptance Criteria

- [ ] Tombol "Hapus yang sudah dibaca" muncul di notification panel saat ada notif yang is_read=true
- [ ] Konfirmasi sebelum hapus (atau langsung dengan undo toast)
- [ ] Backend endpoint `DELETE /api/v1/notifications/read` menghapus semua is_read=true milik user
- [ ] List refresh setelah delete
- [ ] Toast success dengan jumlah notifikasi yang dihapus
