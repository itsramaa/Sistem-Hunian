import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { apiClient } from "@/shared/lib/axios";
// REDESIGN_MARKER
import { useUpdateRoom, useDeleteRoom } from "../hooks/useRooms";
import { useCheckoutTenant } from "@/features/tenant/hooks/useTenants";
import { usePayments } from "@/features/payments/hooks/usePayments";
import { useMaintenances } from "@/features/maintenance/hooks/useMaintenance";
import { useConfirmations } from "@/features/confirmations/hooks/useConfirmations";
import { RoomForm } from "../components/RoomForm";
import { CheckoutForm } from "@/features/tenant/components/CheckoutForm";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import {
  ArrowLeft,
  BedDouble,
  Building2,
  Clock,
  DollarSign,
  Users,
  Loader2,
  Calendar,
  Pencil,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/shared/utils/utils";
import { useToast } from "@/shared/hooks/use-toast";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import { Room } from "../types";

interface RoomDetail extends Room {
  tenant_id?: string;
  tanggal_masuk?: string;
  durasi_sewa?: number;
}

const statusConfig = {
  available: {
    label: "Tersedia",
    variant: "default" as const,
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  dp_confirmation: {
    label: "Konfirmasi DP",
    variant: "secondary" as const,
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  occupied: {
    label: "Terisi",
    variant: "secondary" as const,
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
};

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { role } = useAuth();
  const isOperator = role === "operator";
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const {
    data: room,
    isLoading,
    error,
  } = useQuery<RoomDetail>({
    queryKey: ["room", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/rooms/${id}`);
      return data;
    },
    enabled: !!id,
  });

  // Inline histories — paralel queries
  const { data: paymentsData } = usePayments(1, 5, id);
  const { data: maintData } = useMaintenances(1, 5, undefined, undefined, id);
  const recentPayments = paymentsData?.payments ?? [];
  const recentMaintenances = maintData?.maintenances ?? [];

  // DP Confirmation info — fetch saat status dp_confirmation
  const { data: confirmData } = useConfirmations(1, 1, "pending", id);
  const activeConfirmation = confirmData?.confirmations?.[0] ?? null;

  const updateMutation = useUpdateRoom();
  const deleteMutation = useDeleteRoom();
  const checkoutMutation = useCheckoutTenant();

  const handleUpdate = async (payload: any) => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({ id, payload });
      qc.invalidateQueries({ queryKey: ["room", id] });
      setEditOpen(false);
      toast({ title: "Kamar berhasil diperbarui" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal memperbarui kamar",
        description: getApiErrorMessage(err),
      });
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Kamar berhasil dihapus" });
      navigate("/dashboard/rooms");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus kamar",
        description: getApiErrorMessage(err),
      });
      setDeleteOpen(false);
    }
  };

  const handleCheckout = async (tanggal_keluar: string) => {
    if (!room?.tenant_id) return;
    try {
      await checkoutMutation.mutateAsync({
        id: room.tenant_id,
        tanggal_keluar,
      });
      qc.invalidateQueries({ queryKey: ["room", id] });
      setCheckoutOpen(false);
      toast({
        title: "Checkout berhasil",
        description: "Status kamar kini tersedia.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal checkout",
        description: getApiErrorMessage(err),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">Memuat detail kamar...</span>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <BedDouble className="h-12 w-12 text-muted-foreground opacity-30" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">
            Kamar tidak ditemukan
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Kamar yang Anda cari tidak tersedia atau telah dihapus.
          </p>
        </div>
        <Button
          onClick={() => navigate("/dashboard/rooms")}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Kamar
        </Button>
      </div>
    );
  }

  const statusInfo = statusConfig[room.status];

  return (
    <div className="space-y-5 w-full max-w-7xl pb-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <BedDouble className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Kamar {room.nomor_kamar}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn("rounded-full", statusInfo.className)}>
                  {statusInfo.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {room.nama_properti}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap justify-end">
          {isOperator && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              {room.status === "occupied" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-xl"
                  onClick={() => setCheckoutOpen(true)}
                >
                  Checkout
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 rounded-xl"
                onClick={() => setDeleteOpen(true)}
                disabled={
                  room.status === "occupied" ||
                  room.status === "dp_confirmation"
                }
              >
                <Trash2 className="h-3.5 w-3.5" /> Hapus
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Room Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Informasi Kamar
            </span>
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Nomor Kamar</dt>
              <dd className="text-sm font-medium text-foreground">
                {room.nomor_kamar}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Tipe Kamar</dt>
              <dd className="text-sm font-medium text-foreground">
                {room.tipe_kamar}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd>
                <Badge
                  className={cn("rounded-full text-xs", statusInfo.className)}
                >
                  {statusInfo.label}
                </Badge>
              </dd>
            </div>
          </dl>
        </div>

        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Harga & Properti
            </span>
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Harga Sewa</dt>
              <dd className="text-sm font-bold text-foreground tabular-nums">
                Rp{room.harga_sewa.toLocaleString("id-ID")}
              </dd>
            </div>
            <div className="flex justify-between items-start">
              <dt className="text-sm text-muted-foreground">Properti</dt>
              <dd className="text-sm font-medium text-foreground text-right truncate max-w-[60%]">
                {room.nama_properti}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Current Occupancy Info */}
      {room.status === "occupied" && room.penghuni_aktif && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Penghuni Aktif
              </span>
            </div>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <dt className="text-xs text-muted-foreground mb-0.5">
                Nama Penghuni
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {room.penghuni_aktif}
              </dd>
            </div>
            {room.tanggal_masuk && (
              <div>
                <dt className="text-xs text-muted-foreground mb-0.5">
                  Tanggal Masuk
                </dt>
                <dd className="text-sm font-medium text-foreground">
                  {format(new Date(room.tanggal_masuk), "dd MMM yyyy", {
                    locale: localeId,
                  })}
                </dd>
              </div>
            )}
            {room.durasi_sewa && (
              <div>
                <dt className="text-xs text-muted-foreground mb-0.5">
                  Durasi Sewa
                </dt>
                <dd className="text-sm font-medium text-foreground">
                  {room.durasi_sewa} bulan
                </dd>
              </div>
            )}
          </dl>
          {room.tenant_id && (
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto gap-2 rounded-xl"
              onClick={() => navigate(`/dashboard/tenants/${room.tenant_id}`)}
            >
              <Users className="h-4 w-4" />
              Lihat Detail Penghuni
            </Button>
          )}
        </div>
      )}

      {/* DP Confirmation Info — tampil hanya saat status dp_confirmation */}
      {room.status === "dp_confirmation" && activeConfirmation && (
        <div className="glass-card p-4 space-y-3 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
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
            <div className="flex justify-between items-center text-sm">
              <dt className="text-muted-foreground">Calon Penghuni</dt>
              <dd className="font-medium">
                {activeConfirmation.nama_calon_penghuni}
              </dd>
            </div>
            <div className="flex justify-between items-center text-sm">
              <dt className="text-muted-foreground">Nominal DP</dt>
              <dd className="font-medium tabular-nums">
                Rp{(activeConfirmation.nominal_dp ?? 0).toLocaleString("id-ID")}
              </dd>
            </div>
            <div className="flex justify-between items-center text-sm">
              <dt className="text-muted-foreground">Batas Konfirmasi</dt>
              <dd
                className={cn(
                  "font-medium",
                  (() => {
                    const sisa = Math.ceil(
                      (new Date(
                        activeConfirmation.batas_tanggal_konfirmasi,
                      ).getTime() -
                        Date.now()) /
                        86400000,
                    );
                    return sisa <= 3 ? "text-destructive" : "";
                  })(),
                )}
              >
                {format(
                  new Date(activeConfirmation.batas_tanggal_konfirmasi),
                  "dd MMM yyyy",
                  { locale: localeId },
                )}{" "}
                <span className="text-xs">
                  (
                  {Math.ceil(
                    (new Date(
                      activeConfirmation.batas_tanggal_konfirmasi,
                    ).getTime() -
                      Date.now()) /
                      86400000,
                  )}{" "}
                  hari lagi)
                </span>
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Inline Payment History */}
      {recentPayments.length > 0 && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Pembayaran Terakhir
            </h2>
            <button
              onClick={() => navigate(`/dashboard/payments?room_id=${id}`)}
              className="text-xs text-primary hover:underline"
            >
              Lihat semua
            </button>
          </div>
          <div className="space-y-2">
            {recentPayments.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0"
              >
                <span className="text-muted-foreground">{p.periode}</span>
                <span className="font-medium tabular-nums">
                  Rp{(p.nominal ?? 0).toLocaleString("id-ID")}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.status === "paid"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : p.status === "overdue"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
                >
                  {p.status === "paid"
                    ? "Lunas"
                    : p.status === "overdue"
                      ? "Terlambat"
                      : "Belum Bayar"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inline Maintenance History */}
      {recentMaintenances.length > 0 && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Maintenance Terakhir
            </h2>
            <button
              onClick={() => navigate(`/dashboard/maintenance?room_id=${id}`)}
              className="text-xs text-primary hover:underline"
            >
              Lihat semua
            </button>
          </div>
          <div className="space-y-2">
            {recentMaintenances.map((m: any) => (
              <div
                key={m.id}
                className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0"
              >
                <span className="text-muted-foreground text-xs">
                  {format(new Date(m.tanggal_laporan), "dd MMM yyyy", {
                    locale: localeId,
                  })}
                </span>
                <span className="flex-1 mx-3 truncate">
                  {m.deskripsi_kerusakan?.slice(0, 40)}
                  {(m.deskripsi_kerusakan?.length ?? 0) > 40 ? "…" : ""}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    m.status === "completed"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : m.status === "in_progress"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
                >
                  {m.status === "completed"
                    ? "Selesai"
                    : m.status === "in_progress"
                      ? "Proses"
                      : "Dilaporkan"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="glass-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3 rounded-xl"
            onClick={() =>
              navigate(`/dashboard/properties/${room.property_id}`)
            }
          >
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Lihat Detail Properti</p>
              <p className="text-xs text-muted-foreground truncate">
                {room.nama_properti}
              </p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3 rounded-xl"
            onClick={() => navigate(`/dashboard/payments?room_id=${room.id}`)}
          >
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Histori Pembayaran</p>
              <p className="text-xs text-muted-foreground">
                Lihat riwayat pembayaran
              </p>
            </div>
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      {editOpen && (
        <RoomForm
          open={editOpen}
          onOpenChange={setEditOpen}
          room={room}
          onSubmit={handleUpdate}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Delete Confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kamar {room.nomor_kamar}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Kamar akan dihapus dari
              sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Checkout Dialog */}
      {checkoutOpen && room.tenant_id && (
        <CheckoutForm
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          tenantName={room.penghuni_aktif ?? ""}
          roomNumber={room.nomor_kamar}
          onSubmit={handleCheckout}
          isLoading={checkoutMutation.isPending}
        />
      )}
    </div>
  );
}
