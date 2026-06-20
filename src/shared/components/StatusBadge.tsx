import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/utils";

// ─── Room Status ────────────────────────────────────────────────────────────
export type RoomStatus = "available" | "occupied" | "dp_confirmation";

const roomStatusMap: Record<RoomStatus, { label: string; className: string }> = {
  available:       { label: "Tersedia",       className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  occupied:        { label: "Terisi",         className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  dp_confirmation: { label: "Konfirmasi DP",  className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
};

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  const { label, className } = roomStatusMap[status] ?? { label: status, className: "" };
  return <Badge className={cn("font-medium", className)}>{label}</Badge>;
}

// ─── Payment Status ──────────────────────────────────────────────────────────
export type PaymentStatus = "paid" | "unpaid" | "overdue";

const paymentStatusMap: Record<PaymentStatus, { label: string; className: string }> = {
  paid:    { label: "Lunas",     className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  unpaid:  { label: "Belum Bayar", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  overdue: { label: "Terlambat",  className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, className } = paymentStatusMap[status] ?? { label: status, className: "" };
  return <Badge className={cn("font-medium", className)}>{label}</Badge>;
}

// ─── Confirmation Status ─────────────────────────────────────────────────────
export type ConfirmationStatus = "pending" | "confirmed" | "expired";

const confirmationStatusMap: Record<ConfirmationStatus, { label: string; className: string }> = {
  pending:   { label: "Menunggu",   className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  confirmed: { label: "Dikonfirmasi", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  expired:   { label: "Kedaluwarsa", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export function ConfirmationStatusBadge({ status }: { status: ConfirmationStatus }) {
  const { label, className } = confirmationStatusMap[status] ?? { label: status, className: "" };
  return <Badge className={cn("font-medium", className)}>{label}</Badge>;
}

// ─── Maintenance Status ──────────────────────────────────────────────────────
export type MaintenanceStatus = "reported" | "in_progress" | "completed";

const maintenanceStatusMap: Record<MaintenanceStatus, { label: string; className: string }> = {
  reported:    { label: "Dilaporkan",  className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  in_progress: { label: "Dikerjakan", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  completed:   { label: "Selesai",    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
};

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  const { label, className } = maintenanceStatusMap[status] ?? { label: status, className: "" };
  return <Badge className={cn("font-medium", className)}>{label}</Badge>;
}

// ─── Tenant Status ───────────────────────────────────────────────────────────
export type TenantStatus = "active" | "checked_out";

const tenantStatusMap: Record<TenantStatus, { label: string; className: string }> = {
  active:      { label: "Aktif",     className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  checked_out: { label: "Sudah Keluar", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  const { label, className } = tenantStatusMap[status] ?? { label: status, className: "" };
  return <Badge className={cn("font-medium", className)}>{label}</Badge>;
}
