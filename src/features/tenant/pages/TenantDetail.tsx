import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/axios";
import { useUpdateTenant, useCheckoutTenant } from "../hooks/useTenants";
import { usePayments } from "@/features/payments/hooks/usePayments";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import {
  ArrowLeft,
  User,
  BedDouble,
  Building2,
  Phone,
  CreditCard,
  Calendar,
  Loader2,
  DollarSign,
  Pencil,
  LogOut,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/shared/utils/utils";
import { useToast } from "@/shared/hooks/use-toast";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface TenantDetail {
  id: string;
  room_id: string;
  nomor_kamar: string;
  property_id: string;
  nama_properti: string;
  nama: string;
  nomor_identitas: string;
  nomor_telepon: string;
  tanggal_masuk: string;
  durasi_sewa: number;
  status: "active" | "checked_out";
  tanggal_keluar?: string;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  active: {
    label: "Aktif",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  checked_out: {
    label: "Checkout",
    className: "bg-muted text-muted-foreground",
  },
};

const editSchema = z.object({
  nomor_identitas: z.string().min(1, "Wajib diisi"),
  nomor_telepon: z.string().min(1, "Wajib diisi"),
});
type EditForm = z.infer<typeof editSchema>;

const checkoutSchema = z.object({
  tanggal_keluar: z.string().min(1, "Tanggal keluar wajib diisi"),
});
type CheckoutForm = z.infer<typeof checkoutSchema>;

const fmt = (d: string) => {
  try {
    return format(new Date(d), "dd MMMM yyyy", { locale: localeId });
  } catch {
    return d;
  }
};

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { role } = useAuth();
  const isOperator = role === "operator";
  const [editOpen, setEditOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const {
    data: tenant,
    isLoading,
    error,
  } = useQuery<TenantDetail>({
    queryKey: ["tenant", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/tenants/${id}`);
      return data;
    },
    enabled: !!id,
  });

  // Inline payment history
  const { data: paymentsData } = usePayments(1, 5, undefined, id);
  const recentPayments = paymentsData?.payments ?? [];
  const currentPeriode = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonthPayment = recentPayments.find(
    (p: any) => p.periode === currentPeriode,
  );

  const updateMutation = useUpdateTenant();
  const checkoutMutation = useCheckoutTenant();

  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { nomor_identitas: "", nomor_telepon: "" },
  });

  const checkoutForm = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { tanggal_keluar: format(new Date(), "yyyy-MM-dd") },
  });

  const openEdit = () => {
    if (!tenant) return;
    editForm.reset({
      nomor_identitas: tenant.nomor_identitas,
      nomor_telepon: tenant.nomor_telepon,
    });
    setEditOpen(true);
  };

  const handleEdit = async (values: EditForm) => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({ id, payload: values });
      qc.invalidateQueries({ queryKey: ["tenant", id] });
      setEditOpen(false);
      toast({ title: "Data penghuni berhasil diperbarui" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal memperbarui",
        description: getApiErrorMessage(err),
      });
    }
  };

  const handleCheckout = async (values: CheckoutForm) => {
    if (!id || !tenant) return;
    try {
      await checkoutMutation.mutateAsync({
        id,
        tanggal_keluar: values.tanggal_keluar,
      });
      qc.invalidateQueries({ queryKey: ["tenant", id] });
      setCheckoutOpen(false);
      toast({
        title: "Checkout berhasil",
        description: `${tenant.nama} telah berhasil di-checkout.`,
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
        <span className="text-sm">Memuat detail penghuni...</span>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <User className="h-12 w-12 text-muted-foreground opacity-30" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">
            Penghuni tidak ditemukan
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Penghuni yang Anda cari tidak tersedia atau telah dihapus.
          </p>
        </div>
        <Button
          onClick={() => navigate("/dashboard/tenants")}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Penghuni
        </Button>
      </div>
    );
  }

  const statusInfo = statusConfig[tenant.status];
  const tanggalMasuk = new Date(tenant.tanggal_masuk);
  const estimatedCheckout = new Date(tanggalMasuk);
  estimatedCheckout.setMonth(estimatedCheckout.getMonth() + tenant.durasi_sewa);

  return (
    <div className="space-y-5 pb-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {tenant.nama}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className={cn("rounded-full", statusInfo.className)}>
                {statusInfo.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Kamar {tenant.nomor_kamar} · {tenant.nama_properti}
              </span>
            </div>
          </div>
        </div>
        {tenant.status === "active" && isOperator && (
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl"
              onClick={openEdit}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 rounded-xl"
              onClick={() => setCheckoutOpen(true)}
            >
              <LogOut className="h-3.5 w-3.5" /> Checkout
            </Button>
          </div>
        )}
      </div>

      {/* Personal Info */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Data Pribadi
          </span>
        </div>
        <dl className="space-y-2.5">
          <div className="flex justify-between items-center">
            <dt className="text-sm text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> No. Identitas
            </dt>
            <dd className="text-sm font-medium text-foreground tabular-nums">
              {tenant.nomor_identitas}
            </dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> No. Telepon
            </dt>
            <dd className="text-sm font-medium text-foreground">
              {tenant.nomor_telepon}
            </dd>
          </div>
        </dl>
      </div>

      {/* Tenancy Info */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Info Hunian
          </span>
        </div>
        <dl className="space-y-2.5">
          <div className="flex justify-between items-center">
            <dt className="text-sm text-muted-foreground">Tanggal Masuk</dt>
            <dd className="text-sm font-medium text-foreground">
              {fmt(tenant.tanggal_masuk)}
            </dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="text-sm text-muted-foreground">Durasi Sewa</dt>
            <dd className="text-sm font-medium text-foreground">
              {tenant.durasi_sewa} bulan
            </dd>
          </div>
          {tenant.status === "active" ? (
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Est. Berakhir</dt>
              <dd className="text-sm font-medium text-foreground">
                {format(estimatedCheckout, "dd MMMM yyyy", {
                  locale: localeId,
                })}
              </dd>
            </div>
          ) : tenant.tanggal_keluar ? (
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Tanggal Keluar</dt>
              <dd className="text-sm font-medium text-foreground">
                {fmt(tenant.tanggal_keluar)}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between items-start">
            <dt className="text-sm text-muted-foreground">Kamar & Properti</dt>
            <dd className="text-sm font-medium text-foreground text-right">
              {tenant.nomor_kamar} · {tenant.nama_properti}
            </dd>
          </div>
        </dl>
      </div>

      {/* Inline Payment History */}
      {recentPayments.length > 0 && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Pembayaran Terakhir
              {currentMonthPayment && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ml-1 ${
                    currentMonthPayment.status === "paid"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : currentMonthPayment.status === "overdue"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
                >
                  Bulan ini:{" "}
                  {currentMonthPayment.status === "paid"
                    ? "Lunas"
                    : currentMonthPayment.status === "overdue"
                      ? "Terlambat"
                      : "Belum Bayar"}
                </span>
              )}
            </h2>
            <button
              onClick={() => navigate(`/dashboard/payments?tenant_id=${id}`)}
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

      {/* Quick Actions */}
      <div className="glass-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3 rounded-xl"
            onClick={() => navigate(`/dashboard/rooms/${tenant.room_id}`)}
          >
            <BedDouble className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Detail Kamar</p>
              <p className="text-xs text-muted-foreground">
                Kamar {tenant.nomor_kamar}
              </p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3 rounded-xl"
            onClick={() =>
              navigate(`/dashboard/properties/${tenant.property_id}`)
            }
          >
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Detail Properti</p>
              <p className="text-xs text-muted-foreground truncate">
                {tenant.nama_properti}
              </p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3 rounded-xl"
            onClick={() =>
              navigate(`/dashboard/payments?tenant_id=${tenant.id}`)
            }
          >
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Riwayat Pembayaran</p>
              <p className="text-xs text-muted-foreground">
                Lihat semua tagihan
              </p>
            </div>
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Data Penghuni</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit(handleEdit)}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1.5">
              <Label>No. Identitas</Label>
              <Input
                {...editForm.register("nomor_identitas")}
                placeholder="Nomor KTP/identitas"
              />
              {editForm.formState.errors.nomor_identitas && (
                <p className="text-xs text-destructive">
                  {editForm.formState.errors.nomor_identitas.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>No. Telepon</Label>
              <Input
                {...editForm.register("nomor_telepon")}
                placeholder="08xx..."
              />
              {editForm.formState.errors.nomor_telepon && (
                <p className="text-xs text-destructive">
                  {editForm.formState.errors.nomor_telepon.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Checkout Penghuni</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={checkoutForm.handleSubmit(handleCheckout)}
            className="space-y-4 pt-2"
          >
            <p className="text-sm text-muted-foreground">
              Konfirmasi checkout untuk <strong>{tenant.nama}</strong>. Status
              kamar akan berubah menjadi tersedia.
            </p>
            <div className="space-y-1.5">
              <Label>Tanggal Keluar</Label>
              <Input type="date" {...checkoutForm.register("tanggal_keluar")} />
              {checkoutForm.formState.errors.tanggal_keluar && (
                <p className="text-xs text-destructive">
                  {checkoutForm.formState.errors.tanggal_keluar.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCheckoutOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Checkout
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
