import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/shared/components/ui/button";
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
import { useToast } from "@/shared/hooks/use-toast";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import {
  ArrowLeft,
  BedDouble,
  Building2,
  Home,
  Loader2,
  MapPin,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PropertyForm } from "../components/PropertyForm";
import {
  useDeleteProperty,
  usePropertyById,
  useUpdateProperty,
} from "../hooks/useProperties";
import { useQueryClient } from "@tanstack/react-query";

interface PropertyDetail {
  id: string;
  nama: string;
  alamat: string;
  deskripsi?: string;
  total_kamar: number;
  kamar_available: number;
  kamar_occupied: number;
  kamar_dp_confirmation: number;
  jumlah_penghuni_aktif: number;
  created_at: string;
  updated_at: string;
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { role } = useAuth();
  const isOperator = role === "operator";
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const updateMutation = useUpdateProperty();
  const deleteMutation = useDeleteProperty();

  const handleUpdate = async (payload: any) => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({ id, payload });
      qc.invalidateQueries({ queryKey: ["property", id] });
      setEditOpen(false);
      toast({ title: "Properti berhasil diperbarui" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal memperbarui properti",
        description: getApiErrorMessage(err),
      });
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Properti berhasil dihapus" });
      navigate("/dashboard/properties");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus properti",
        description: getApiErrorMessage(err),
      });
      setDeleteOpen(false);
    }
  };

  const { data: property, isLoading, error } = usePropertyById(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">Memuat detail properti...</span>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Building2 className="h-12 w-12 text-muted-foreground opacity-30" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">
            Properti tidak ditemukan
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Properti yang Anda cari tidak tersedia atau telah dihapus.
          </p>
        </div>
        <Button
          onClick={() => navigate("/dashboard/properties")}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Properti
        </Button>
      </div>
    );
  }

  const occupancyRate =
    property.total_kamar > 0
      ? Math.round((property.kamar_occupied / property.total_kamar) * 100)
      : 0;

  return (
    <div className="space-y-5 w-full max-w-7xl pb-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-foreground truncate">
                {property.nama}
              </h1>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{property.alamat}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
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
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 rounded-xl"
                onClick={() => setDeleteOpen(true)}
                disabled={property.total_kamar > 0}
                title={
                  property.total_kamar > 0
                    ? "Hapus semua kamar terlebih dahulu"
                    : undefined
                }
              >
                <Trash2 className="h-3.5 w-3.5" /> Hapus
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Occupancy Banner */}
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
            {property.kamar_occupied}
          </p>
          <p className="text-xs text-muted-foreground">
            dari {property.total_kamar}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <section aria-label="Statistik Kamar">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Statistik Kamar
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-stat-card p-4 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <BedDouble className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-foreground leading-none mb-1">
                {property.total_kamar}
              </p>
              <p className="text-xs text-muted-foreground">Total Kamar</p>
            </div>
          </div>

          <div className="glass-stat-card p-4 flex flex-col gap-3 ring-1 ring-primary/20">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Home className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-foreground leading-none mb-1">
                {property.kamar_available}
              </p>
              <p className="text-xs text-muted-foreground">Tersedia</p>
            </div>
          </div>

          <div className="glass-stat-card p-4 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-foreground leading-none mb-1">
                {property.kamar_occupied}
              </p>
              <p className="text-xs text-muted-foreground">Terisi</p>
            </div>
          </div>

          <div className="glass-stat-card p-4 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-foreground leading-none mb-1">
                {property.kamar_dp_confirmation}
              </p>
              <p className="text-xs text-muted-foreground">Konfirmasi DP</p>
            </div>
          </div>
        </div>
      </section>

      {/* Property Info */}
      {property.deskripsi && (
        <div className="glass-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Deskripsi</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {property.deskripsi}
          </p>
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
              navigate(`/dashboard/rooms?property_id=${property.id}`)
            }
          >
            <BedDouble className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Lihat Daftar Kamar</p>
              <p className="text-xs text-muted-foreground">
                {property.total_kamar} kamar
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3 rounded-xl"
            onClick={() =>
              navigate(`/dashboard/tenants?property_id=${property.id}`)
            }
          >
            <Users className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Lihat Penghuni</p>
              <p className="text-xs text-muted-foreground">
                {property.jumlah_penghuni_aktif} penghuni aktif
              </p>
            </div>
          </Button>
        </div>
      </div>

      {/* Edit Form */}
      {editOpen && (
        <PropertyForm
          open={editOpen}
          onOpenChange={setEditOpen}
          property={property as any}
          onSubmit={handleUpdate}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Delete Confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {property.nama}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Properti akan dihapus dari
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
    </div>
  );
}
