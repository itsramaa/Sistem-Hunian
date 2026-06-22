import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  DpAlert,
  Notification,
  PaymentAlert,
  useDashboardAlerts,
  useDashboardSummary,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/dashboard/hooks/useDashboard";
import { usePayments } from "@/features/payments/hooks/usePayments";
import { useCreateViewerRequest } from "@/features/viewer-requests/hooks/useViewerRequests";
import { useRooms } from "@/features/rooms/hooks/useRooms";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/utils";
import { useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  AlertCircle,
  AlertTriangle,
  BedDouble,
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  RefreshCw,
  Send,
  Users,
  Wrench,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// ─── Summary Card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  bgClass: string;
  isLoading: boolean;
  accent?: boolean;
  onClick?: () => void;
}

function SummaryCard({
  label,
  value,
  icon,
  bgClass,
  isLoading,
  accent,
  onClick,
}: SummaryCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-stat-card p-4 flex flex-col gap-3 min-w-0",
        accent && "ring-1 ring-primary/20",
        onClick &&
          "cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]",
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          bgClass,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        {isLoading ? (
          <div className="h-7 w-12 bg-muted animate-pulse rounded-lg mb-1" />
        ) : (
          <p className="text-2xl font-bold tabular-nums text-foreground leading-none mb-1">
            {value ?? 0}
          </p>
        )}
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}

// ─── Alert Item ───────────────────────────────────────────────────────────────

function AlertItem({
  children,
  danger,
}: {
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-xl px-3 py-3 text-sm",
        danger
          ? "bg-destructive/10 text-destructive dark:bg-destructive/15"
          : "bg-amber-50 text-amber-900 dark:bg-warning/15 dark:text-warning-foreground",
      )}
    >
      <AlertCircle
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          danger ? "text-destructive" : "text-amber-600 dark:text-warning",
        )}
      />
      <span className="leading-snug">{children}</span>
    </li>
  );
}

// ─── Alert Panel ──────────────────────────────────────────────────────────────

function AlertPanel() {
  const { data: alerts, isLoading } = useDashboardAlerts();
  const dpAlerts: DpAlert[] = alerts?.dp_alerts ?? [];
  const paymentAlerts: PaymentAlert[] = alerts?.payment_alerts ?? [];
  const total = dpAlerts.length + paymentAlerts.length;

  if (isLoading) {
    return (
      <section aria-label="Alert Panel" className="glass-card p-4 space-y-3">
        <div className="h-5 w-36 bg-muted animate-pulse rounded" />
        <div className="h-12 bg-muted animate-pulse rounded-xl" />
        <div className="h-12 bg-muted animate-pulse rounded-xl" />
      </section>
    );
  }

  if (total === 0) return null;

  return (
    <section aria-label="Perlu Perhatian" className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h2 className="text-sm font-semibold text-foreground">
            Perlu Perhatian
          </h2>
        </div>
        <span className="text-xs font-medium bg-warning/15 text-warning rounded-full px-2 py-0.5">
          {total}
        </span>
      </div>
      <ul className="space-y-2">
        {dpAlerts.map((a) => (
          <AlertItem key={a.confirmation_id} danger={a.tipe === "dp_expired"}>
            <span>
              <strong>{a.nama_calon_penghuni}</strong>
              {" — "}Kamar {a.nomor_kamar} · {a.nama_properti}
              <br />
              <span className="text-xs opacity-80">
                {a.tipe === "dp_expired"
                  ? "DP sudah expired"
                  : `DP berakhir ${a.sisa_hari} hari lagi`}
              </span>
            </span>
          </AlertItem>
        ))}
        {paymentAlerts.map((a) => (
          <AlertItem
            key={`${a.room_id}-${a.periode}`}
            danger={a.tipe === "payment_overdue"}
          >
            <span>
              <strong>{a.nama_penghuni}</strong>
              {" — "}Kamar {a.nomor_kamar} · {a.nama_properti}
              <br />
              <span className="text-xs opacity-80">
                {a.tipe === "payment_overdue"
                  ? "Pembayaran terlambat"
                  : "Mendekati jatuh tempo"}
                {a.periode ? ` · ${a.periode}` : ""}
              </span>
            </span>
          </AlertItem>
        ))}
      </ul>
    </section>
  );
}

// ─── Notification Panel ───────────────────────────────────────────────────────

function NotificationPanel() {
  const [showAll, setShowAll] = React.useState(false);
  const { data: rawNotifications, isLoading } = useNotifications(
    showAll ? undefined : false,
  );
  const { mutate: markRead } = useMarkNotificationRead();
  const items: Notification[] = Array.isArray(rawNotifications)
    ? rawNotifications
    : [];

  return (
    <section aria-label="Notifikasi" className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Notifikasi</h2>
          {!showAll && items.length > 0 && (
            <span className="text-xs font-medium bg-primary/15 text-primary rounded-full px-2 py-0.5">
              {items.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAll((v) => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAll ? "Belum dibaca" : "Lihat semua"}
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-14 bg-muted animate-pulse rounded-xl" />
          <div className="h-14 bg-muted animate-pulse rounded-xl" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-2 text-muted-foreground">
          <Bell className="h-8 w-8 opacity-30" />
          <p className="text-sm">
            {showAll ? "Tidak ada notifikasi." : "Tidak ada notifikasi baru."}
          </p>
        </div>
      ) : (
        <ul className="space-y-1 max-h-64 overflow-y-auto -mx-1 px-1">
          {items.map((n) => (
            <li
              key={n.id}
              className={cn(
                "flex items-start justify-between gap-3 rounded-xl px-3 py-3 text-sm transition-colors",
                !n.is_read ? "bg-muted/60" : "opacity-70",
              )}
            >
              <div className="flex-1 min-w-0">
                {!n.is_read && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary inline-block mr-1.5 mb-0.5" />
                )}
                <span
                  className={cn("leading-snug", !n.is_read && "font-medium")}
                >
                  {n.pesan}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(n.created_at), {
                    addSuffix: true,
                    locale: localeId,
                  })}
                </p>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => markRead(n.id)}
                  className="text-xs text-primary hover:underline shrink-0 mt-0.5"
                  aria-label="Tandai sudah dibaca"
                >
                  Baca
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

// ─── Viewer Request Panel ──────────────────────────────────────────────────────

type RequestJenis = "pembayaran" | "kerusakan" | "calon_penghuni";

const REQUEST_OPTIONS: {
  jenis: RequestJenis;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    jenis: "pembayaran",
    label: "Ada Pembayaran Masuk",
    icon: <DollarSign className="w-5 h-5" />,
    color: "bg-green-500",
  },
  {
    jenis: "kerusakan",
    label: "Ada Kerusakan",
    icon: <Wrench className="w-5 h-5" />,
    color: "bg-orange-500",
  },
  {
    jenis: "calon_penghuni",
    label: "Ada Calon Penghuni",
    icon: <Users className="w-5 h-5" />,
    color: "bg-blue-500",
  },
];

function ViewerRequestPanel({ rooms }: { rooms: any[] }) {
  const [activeJenis, setActiveJenis] = useState<RequestJenis | null>(null);
  const [nomorKamar, setNomorKamar] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [namaCalon, setNamaCalon] = useState("");
  const [noHPCalon, setNoHPCalon] = useState("");

  const createReq = useCreateViewerRequest();

  const handleSubmit = () => {
    if (!nomorKamar || !keterangan) return;
    createReq.mutate(
      {
        jenis: activeJenis!,
        room_id: rooms.find((r) => r.nomor_kamar === nomorKamar)?.id ?? null,
        nomor_kamar: nomorKamar,
        keterangan,
        nama_calon: activeJenis === "calon_penghuni" ? namaCalon || null : null,
        no_hp_calon:
          activeJenis === "calon_penghuni" ? noHPCalon || null : null,
      },
      {
        onSuccess: () => {
          setActiveJenis(null);
          setNomorKamar("");
          setKeterangan("");
          setNamaCalon("");
          setNoHPCalon("");
        },
      },
    );
  };

  return (
    <section>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
        Lapor Cepat
      </p>
      <p className="text-sm text-muted-foreground mb-3">
        Tekan tombol di bawah untuk mengirim laporan ke operator via WhatsApp.
      </p>

      {/* Big buttons */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {REQUEST_OPTIONS.map((opt) => (
          <button
            key={opt.jenis}
            onClick={() =>
              setActiveJenis(activeJenis === opt.jenis ? null : opt.jenis)
            }
            className={cn(
              "glass-card p-3 flex flex-col items-center gap-2 text-center transition-all cursor-pointer",
              activeJenis === opt.jenis
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:bg-muted/50",
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white",
                opt.color,
              )}
            >
              {opt.icon}
            </div>
            <span className="text-xs font-medium text-foreground leading-tight">
              {opt.label}
            </span>
          </button>
        ))}
      </div>

      {/* Inline form */}
      {activeJenis && (
        <div className="glass-card p-4 space-y-3 animate-in fade-in">
          <p className="text-sm font-semibold text-foreground">
            {REQUEST_OPTIONS.find((o) => o.jenis === activeJenis)?.label}
          </p>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Nomor Kamar
            </label>
            <select
              value={nomorKamar}
              onChange={(e) => setNomorKamar(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Pilih kamar...</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.nomor_kamar}>
                  {r.nomor_kamar} — {r.property_name}
                </option>
              ))}
            </select>
          </div>

          {activeJenis === "calon_penghuni" && (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Nama Calon
                </label>
                <input
                  type="text"
                  value={namaCalon}
                  onChange={(e) => setNamaCalon(e.target.value)}
                  placeholder="Nama calon penghuni"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  No HP Calon
                </label>
                <input
                  type="text"
                  value={noHPCalon}
                  onChange={(e) => setNoHPCalon(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Keterangan
            </label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              rows={2}
              placeholder={
                activeJenis === "pembayaran"
                  ? "Contoh: kamar 5 sudah bayar tunai"
                  : activeJenis === "kerusakan"
                    ? "Contoh: AC kamar 3 bocor"
                    : "Contoh: calon penghuni mau masuk tgl 1"
              }
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!nomorKamar || !keterangan || createReq.isPending}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-1" />
              {createReq.isPending ? "Mengirim..." : "Kirim Laporan"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setActiveJenis(null);
                setNomorKamar("");
                setKeterangan("");
                setNamaCalon("");
                setNoHPCalon("");
              }}
            >
              Batal
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

export default function Dashboard() {
  const { role, user } = useAuth();
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const isOperator = role === "operator";
  const isManagerOrAbove = role === "operator" || role === "manager";
  const isViewer = role === "viewer";

  // Rooms for viewer request panel
  const { data: roomsData } = useRooms("", 1, 200);
  const allRooms = roomsData?.rooms ?? [];

  // Pendapatan bulan ini (payments paid bulan berjalan)
  const currentPeriode = format(new Date(), "yyyy-MM");
  const { data: paymentsData } = usePayments(
    1,
    200,
    "",
    "",
    "",
    "paid",
    currentPeriode,
  );
  const pendapatan = (paymentsData?.payments ?? []).reduce(
    (sum: number, p: any) => sum + (p.nominal || 0),
    0,
  );

  const maintenanceAktif =
    (summary?.maintenance_summary?.reported ?? 0) +
    (summary?.maintenance_summary?.in_progress ?? 0);

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["payments"] });
  };

  const summaryCards = [
    {
      label: "Total Properti",
      value: summary?.total_properti,
      icon: <Building2 className="h-5 w-5 text-primary" />,
      bgClass: "bg-primary/10",
      onClick: () => navigate("/dashboard/properties"),
    },
    {
      label: "Total Kamar",
      value: summary?.total_kamar,
      icon: <BedDouble className="h-5 w-5 text-secondary" />,
      bgClass: "bg-secondary/10",
      onClick: () => navigate("/dashboard/rooms"),
    },
    {
      label: "Tersedia",
      value: summary?.kamar_available,
      icon: (
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
      ),
      bgClass: "bg-green-100 dark:bg-green-900/30",
      accent: true,
      onClick: () => navigate("/dashboard/rooms?status=available"),
    },
    {
      label: "Terisi",
      value: summary?.kamar_occupied,
      icon: <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      bgClass: "bg-blue-100 dark:bg-blue-900/30",
      onClick: () => navigate("/dashboard/rooms?status=occupied"),
    },
    {
      label: "Konfirmasi DP",
      value: summary?.kamar_dp_confirmation,
      icon: <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
      bgClass: "bg-yellow-100 dark:bg-yellow-900/30",
      onClick: () => navigate("/dashboard/confirmations"),
    },
  ];

  // Occupancy rate for a quick visual indicator
  const occupancyRate =
    summary && summary.total_kamar > 0
      ? Math.round((summary.kamar_occupied / summary.total_kamar) * 100)
      : null;

  return (
    <div className="space-y-5 pb-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground truncate">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Selamat datang,{" "}
            <span className="font-medium text-foreground">
              {user?.nama ?? "Pengguna"}
            </span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Refresh data"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Occupancy banner — shown when data loaded */}
      {!summaryLoading && occupancyRate !== null && (
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Tingkat Hunian
              </p>
              <p className="text-sm font-bold text-foreground">
                {occupancyRate}%
              </p>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                style={{ width: `${occupancyRate}%` }}
                role="progressbar"
                aria-valuenow={occupancyRate}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {summary?.kamar_occupied ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">
              dari {summary?.total_kamar ?? 0}
            </p>
          </div>
        </div>
      )}

      {summaryLoading && (
        <div className="glass-card p-4">
          <div className="h-4 w-32 bg-muted animate-pulse rounded mb-2" />
          <div className="h-2 bg-muted animate-pulse rounded-full" />
        </div>
      )}

      {/* Summary Cards — 2-col grid on mobile, 5-col on desktop */}
      <section aria-label="Ringkasan Status Kamar">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Ringkasan
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              bgClass={card.bgClass}
              isLoading={summaryLoading}
              accent={card.accent}
              onClick={card.onClick}
            />
          ))}
        </div>
      </section>

      {/* Alert Panel — operator & manajer */}
      {isManagerOrAbove && <AlertPanel />}

      {/* Stats Tambahan — operator & manager */}
      {isManagerOrAbove && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Pendapatan bulan ini */}
          <div
            className="glass-card p-4 cursor-pointer hover:bg-primary/5 transition-colors"
            onClick={() =>
              navigate(
                `/dashboard/payments?periode=${currentPeriode}&status=paid`,
              )
            }
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pendapatan{" "}
                {format(new Date(), "MMMM yyyy", { locale: localeId })}
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              Rp{pendapatan.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {paymentsData?.payments?.length ?? 0} transaksi lunas
            </p>
          </div>

          {/* Maintenance aktif — gunakan data dari dashboard summary */}
          <div
            className="glass-card p-4 cursor-pointer hover:bg-primary/5 transition-colors"
            onClick={() => navigate("/dashboard/maintenance")}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  maintenanceAktif > 0 ? "bg-orange-500/10" : "bg-muted",
                )}
              >
                <Wrench
                  className={cn(
                    "h-4 w-4",
                    maintenanceAktif > 0
                      ? "text-orange-600"
                      : "text-muted-foreground",
                  )}
                />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Maintenance Aktif
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {maintenanceAktif}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.maintenance_summary?.reported ?? 0} dilaporkan ·{" "}
              {summary?.maintenance_summary?.in_progress ?? 0} dalam proses
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions — operator only */}
      {isOperator && (
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Aksi Cepat
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => navigate("/dashboard/payments")}
              className="glass-card p-3 flex flex-col items-center gap-2 text-center hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-xs font-medium text-foreground leading-tight">
                Catat Pembayaran
              </span>
            </button>
            <button
              onClick={() => navigate("/dashboard/confirmations")}
              className="glass-card p-3 flex flex-col items-center gap-2 text-center hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-foreground leading-tight">
                Tambah DP
              </span>
            </button>
            <button
              onClick={() => navigate("/dashboard/maintenance")}
              className="glass-card p-3 flex flex-col items-center gap-2 text-center hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Wrench className="h-5 w-5 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-foreground leading-tight">
                Catat Maintenance
              </span>
            </button>
          </div>
        </section>
      )}

      {/* Breakdown per Properti — operator & manager — gunakan properti_summary dari dashboard */}
      {isManagerOrAbove && (summary?.properti_summary ?? []).length > 0 && (
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Status per Properti
          </p>
          <div className="space-y-2">
            {(summary?.properti_summary ?? []).map((p) => {
              const rate =
                p.total_kamar > 0
                  ? Math.round((p.occupied / p.total_kamar) * 100)
                  : 0;
              return (
                <div
                  key={p.property_id}
                  className="glass-card p-3 cursor-pointer hover:bg-primary/5 transition-colors"
                  onClick={() =>
                    navigate(`/dashboard/properties/${p.property_id}`)
                  }
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {p.nama_properti}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.total_kamar} kamar total
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold tabular-nums">
                        {p.occupied}/{p.total_kamar}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rate}% terisi
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        rate >= 80
                          ? "bg-green-500"
                          : rate >= 50
                            ? "bg-blue-500"
                            : "bg-yellow-500",
                      )}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  {p.available > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {p.available} kamar tersedia
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
      {/* Viewer: Room Status per Properti — pakai properti_summary dari dashboard */}
      {isViewer && (summary?.properti_summary ?? []).length > 0 && (
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Status Hunian per Properti
          </p>
          <div className="space-y-2">
            {(summary?.properti_summary ?? []).map((p) => {
              const rate =
                p.total_kamar > 0
                  ? Math.round((p.occupied / p.total_kamar) * 100)
                  : 0;
              return (
                <div key={p.property_id} className="glass-card p-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {p.nama_properti}
                    </p>
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        p.available > 0
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                      )}
                    >
                      {p.available > 0 ? `${p.available} kosong` : "Penuh"}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        rate >= 80 ? "bg-green-500" : "bg-blue-500",
                      )}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {p.occupied} terisi dari {p.total_kamar} kamar
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Viewer: Request Panel */}
      {isViewer && allRooms.length > 0 && (
        <ViewerRequestPanel rooms={allRooms} />
      )}

      {/* Notification Panel — operator only */}
      {isOperator && <NotificationPanel />}
    </div>
  );
}
