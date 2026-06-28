// ── SiHuni Domain Status ────────────────────────────────────────────────────

export interface SiHuniStatusConfig {
  label: string;
  className: string;
  tooltip?: string;
}

const siHuniStatusMap: Record<string, SiHuniStatusConfig> = {
  // Room status
  available: {
    label: "Tersedia",
    className: "bg-success/10 text-success border-success/20",
    tooltip: "Kamar tersedia dan dapat disewakan",
  },
  dp_confirmation: {
    label: "Konfirmasi DP",
    className: "bg-warning/10 text-warning border-warning/20",
    tooltip: "Kamar dalam proses konfirmasi calon penghuni",
  },
  occupied: {
    label: "Terisi",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    tooltip: "Kamar sedang dihuni",
  },
  // Tenant status
  active: {
    label: "Aktif",
    className: "bg-success/10 text-success border-success/20",
  },
  checked_out: {
    label: "Checkout",
    className: "bg-muted text-muted-foreground border-border",
  },
  // Payment status
  paid: {
    label: "Lunas",
    className: "bg-success/10 text-success border-success/20",
  },
  unpaid: {
    label: "Belum Bayar",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  overdue: {
    label: "Jatuh Tempo",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  cancelled: {
    label: "Tunggakan Dibebaskan",
    className: "bg-muted text-muted-foreground border-border",
  },
  // Confirmation (DP) status
  pending: {
    label: "Pending",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  confirmed: {
    label: "Dikonfirmasi",
    className: "bg-success/10 text-success border-success/20",
  },
  expired: {
    label: "Kedaluwarsa",
    className: "bg-muted text-muted-foreground border-border",
  },
  // Maintenance status
  reported: {
    label: "Dilaporkan",
    className: "bg-info/10 text-info border-info/20",
  },
  in_progress: {
    label: "Diproses",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  completed: {
    label: "Selesai",
    className: "bg-success/10 text-success border-success/20",
  },
};

/**
 * Get label + className for any SiHuni domain status.
 * Use with Shadcn Badge: <Badge className={config.className}>{config.label}</Badge>
 */
export const getSiHuniStatus = (status: string): SiHuniStatusConfig => {
  return (
    siHuniStatusMap[status] ?? {
      label: status,
      className: "bg-muted text-muted-foreground border-border",
    }
  );
};
