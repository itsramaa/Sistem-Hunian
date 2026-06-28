import { useAuth } from "@/features/auth/hooks/useAuth";
import { useDashboardSummary } from "@/features/dashboard/hooks/useDashboard";
import {
  AlertPanel,
  SummaryCard,
} from "@/features/dashboard/components/DashboardCards";
import { ViewerRequestPanel } from "@/features/dashboard/components/ViewerRequestPanel";
import { usePayments } from "@/features/payments/hooks/usePayments";
import { useRooms } from "@/features/rooms/hooks/useRooms";
import { useProperties } from "@/features/properties/hooks/useProperties";
import { Button } from "@/shared/components/ui/button";
import { DataCard } from "@/shared/components/DataCard";
import { useIsMobile } from "@/shared/hooks/useBreakpoint";
import { cn } from "@/shared/utils/utils";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  BedDouble,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  RefreshCw,
  Users,
  Wrench,
} from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { role, user } = useAuth();
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const isOperator = role === "operator";
  const isViewer = role === "viewer";

  const { data: roomsData } = useRooms("", 1, 200);
  const allRooms = roomsData?.rooms ?? [];
  const { data: propsData } = useProperties("", 1, 100);
  const allProperties = propsData?.properties ?? [];

  const currentPeriode = format(new Date(), "yyyy-MM");
  const { data: paymentsData } = usePayments(
    1,
    200,
    "",
    "",
    "paid",
    "",
    currentPeriode,
  );
  const pendapatan = (paymentsData?.payments ?? []).reduce(
    (sum: number, p: any) => sum + (p.amount || 0),
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
      value: summary?.total_properties,
      icon: <Building2 className="h-5 w-5 text-primary" />,
      bgClass: "bg-primary/10",
      onClick: () => navigate("/dashboard/properties"),
    },
    {
      label: "Total Kamar",
      value: summary?.total_rooms,
      icon: <BedDouble className="h-5 w-5 text-secondary" />,
      bgClass: "bg-secondary/10",
      onClick: () => navigate("/dashboard/rooms"),
    },

    {
      label: "Tersedia",
      value: summary?.rooms_available,
      icon: (
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
      ),
      bgClass: "bg-green-100 dark:bg-green-900/30",
      accent: true,
      onClick: () => navigate("/dashboard/rooms?status=available"),
    },
    {
      label: "Terisi",
      value: summary?.rooms_occupied,
      icon: <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      bgClass: "bg-blue-100 dark:bg-blue-900/30",
      onClick: () => navigate("/dashboard/rooms?status=occupied"),
    },
    {
      label: "Konfirmasi DP",
      value: summary?.rooms_dp_confirmation,
      icon: <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
      bgClass: "bg-yellow-100 dark:bg-yellow-900/30",
      onClick: () => navigate("/dashboard/confirmations"),
    },
  ];

  const occupancyRate =
    summary && summary.total_rooms > 0
      ? Math.round((summary.rooms_occupied / summary.total_rooms) * 100)
      : null;

  return (
    <div className="space-y-5 w-full max-w-7xl pb-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground truncate">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Selamat datang,{" "}
            <span className="font-medium text-foreground">
              {user?.name ?? "Pengguna"}
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

      {/* Occupancy banner */}
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
              {summary?.rooms_occupied ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">
              dari {summary?.total_rooms ?? 0}
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

      {/* Stats Tambahan — operator only */}
      {isOperator && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            className="glass-card p-4 cursor-pointer hover:bg-primary/5 transition-colors"
            onClick={() =>
              navigate(
                `/dashboard/payments?period=${currentPeriode}&status=paid`,
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

          {/* Total Pengeluaran Maintenance */}
          <div
            className="glass-card p-4 cursor-pointer hover:bg-primary/5 transition-colors"
            onClick={() => navigate("/dashboard/maintenance")}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Wrench className="h-4 w-4 text-red-600" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Pengeluaran Maintenance
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              Rp
              {(
                (summary?.maintenance_summary?.total_maintenance_cost ??
                  0) as number
              ).toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Biaya dari seluruh maintenance selesai
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
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

      {/* Breakdown per Properti — operator only */}
      {isOperator && (summary?.property_summary ?? []).length > 0 && (
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Status per Properti
          </p>
          <div className="space-y-2">
            {(summary?.property_summary ?? []).map((p) => {
              const rate =
                p.total_rooms > 0
                  ? Math.round((p.occupied / p.total_rooms) * 100)
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
                        {p.property_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.total_rooms} kamar total
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold tabular-nums">
                        {p.occupied}/{p.total_rooms}
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

      {/* Viewer: Room Status per Properti */}
      {isViewer && (summary?.property_summary ?? []).length > 0 && (
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Status Hunian per Properti
          </p>
          <div className="space-y-2">
            {(summary?.property_summary ?? []).map((p) => {
              const rate =
                p.total_rooms > 0
                  ? Math.round((p.occupied / p.total_rooms) * 100)
                  : 0;
              return (
                <div key={p.property_id} className="glass-card p-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {p.property_name}
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
                    {p.occupied} terisi dari {p.total_rooms} kamar
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Viewer: Request Panel */}
      {isViewer && allRooms.length > 0 && (
        <ViewerRequestPanel rooms={allRooms} properties={allProperties} />
      )}

      {/* Daftar Kamar per Properti — mobile DataCard (operator only) */}
      {isOperator && isMobile && allRooms.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Daftar Kamar
          </p>
          <div className="space-y-2">
            {allRooms.map((room) => (
              <DataCard
                key={room.id}
                onClick={() => navigate(`/dashboard/rooms`)}
                header={
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      Kamar {room.room_number}
                    </span>
                    <span
                      title={
                        room.status === "available"
                          ? "Kamar tersedia dan dapat disewakan"
                          : room.status === "occupied"
                            ? "Kamar sedang dihuni"
                            : "Kamar dalam proses konfirmasi calon penghuni"
                      }
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        room.status === "available"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : room.status === "occupied"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                      )}
                    >
                      {room.status === "available"
                        ? "Tersedia"
                        : room.status === "occupied"
                          ? "Dihuni"
                          : "Konfirmasi DP"}
                    </span>
                  </div>
                }
                fields={[
                  {
                    label: "Harga Sewa",
                    value: `Rp${(room.rent_price ?? 0).toLocaleString("id-ID")}`,
                  },
                  {
                    label: "Penghuni",
                    value: room.active_tenant_name ?? "-",
                  },
                ]}
              />
            ))}
          </div>
        </section>
      )}

      {/* Alert Panel — operator & viewer (viewer read-only, tidak ada aksi di AlertPanel) */}
      {(isOperator || isViewer) && <AlertPanel />}
    </div>
  );
}
