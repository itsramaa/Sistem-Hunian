import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUpdateTenant,
  useCheckoutTenant,
  useTenantById,
} from "../hooks/useTenants";
import { usePayments } from "@/features/payments/hooks/usePayments";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { formatCurrency } from "@/shared/utils/currency";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { DatePicker } from "@/shared/components/ui/date-picker";
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
  Phone,
  CreditCard,
  Calendar,
  Loader2,
  DollarSign,
  Pencil,
  LogOut,
  PlusCircle,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/shared/utils/utils";
import { useToast } from "@/shared/hooks/use-toast";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import { getSiHuniStatus } from "@/shared/utils/statusColors";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TenantForm } from "../components/TenantForm";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

const checkoutSchema = z.object({
  check_out_date: z.string().min(1, "Tanggal keluar wajib diisi"),
});
type CheckoutFormValues = z.infer<typeof checkoutSchema>;

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
  const [extendOpen, setExtendOpen] = useState(false);
  const [tambahBulan, setTambahBulan] = useState(1);

  const { data: tenant, isLoading, error } = useTenantById(id);

  // Inline payment history
  const { data: paymentsData } = usePayments(1, 5, undefined, id);
  const recentPayments = paymentsData?.payments ?? [];
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const currentMonthPayment = recentPayments.find(
    (p: any) => p.period === currentPeriod,
  );

  const updateMutation = useUpdateTenant();
  const checkoutMutation = useCheckoutTenant();

  const checkoutForm = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { check_out_date: format(new Date(), "yyyy-MM-dd") },
  });

  const handleEdit = async (values: any) => {
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

  const handleCheckout = async (values: CheckoutFormValues) => {
    if (!id || !tenant) return;
    try {
      await checkoutMutation.mutateAsync({
        id,
        check_out_date: values.check_out_date,
      });
      qc.invalidateQueries({ queryKey: ["tenant", id] });
      setCheckoutOpen(false);
      toast({
        title: "Checkout berhasil",
        description: `${tenant.name} telah berhasil di-checkout.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal checkout",
        description: getApiErrorMessage(err),
      });
    }
  };

  const handleExtend = async () => {
    if (!id || !tenant) return;
    try {
      await updateMutation.mutateAsync({
        id,
        payload: { rental_duration: tenant.rental_duration + tambahBulan },
      });
      qc.invalidateQueries({ queryKey: ["tenant", id] });
      setExtendOpen(false);
      setTambahBulan(1);
      toast({ title: `Kontrak diperpanjang ${tambahBulan} bulan` });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal perpanjang kontrak",
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
          <h3 className="text-lg font-semibold">Penghuni tidak ditemukan</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Data penghuni tidak tersedia atau telah dihapus.
          </p>
        </div>
        <Button
          onClick={() => navigate("/dashboard/tenants")}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>
      </div>
    );
  }

  const tanggalMasuk = new Date(tenant.check_in_date);
  const estimatedCheckout = new Date(tanggalMasuk);
  estimatedCheckout.setMonth(
    estimatedCheckout.getMonth() + tenant.rental_duration,
  );

  const statusInfo = getSiHuniStatus(tenant.status);

  return (
    <div className="space-y-5 w-full max-w-7xl pb-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-xl"
            onClick={() => navigate("/dashboard/tenants")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-foreground truncate">
                {tenant.name}
              </h1>
              <Badge
                className={cn("rounded-full text-xs", statusInfo.className)}
              >
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              Kamar {tenant.room_number} · {tenant.property_name}
            </p>
          </div>
        </div>
        {isOperator && tenant.status === "active" && (
          <div className="flex gap-2 shrink-0 flex-wrap justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl"
              onClick={() => setExtendOpen(true)}
            >
              <PlusCircle className="h-3.5 w-3.5" /> Perpanjang
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

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Identity */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Identitas
            </span>
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">No. Identitas</dt>
              <dd className="text-sm font-medium">{tenant.identity_number}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">No. Telepon</dt>
              <dd className="text-sm font-medium flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {tenant.phone_number}
              </dd>
            </div>
          </dl>
        </div>

        {/* Contract */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Kontrak
            </span>
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Tanggal Masuk</dt>
              <dd className="text-sm font-medium">
                {fmt(tenant.check_in_date)}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Durasi Sewa</dt>
              <dd className="text-sm font-medium">
                {tenant.rental_duration} bulan
              </dd>
            </div>
            {tenant.status === "active" ? (
              <div className="flex justify-between items-center">
                <dt className="text-sm text-muted-foreground">Est. Berakhir</dt>
                <dd className="text-sm font-medium">
                  {fmt(estimatedCheckout.toISOString())}
                </dd>
              </div>
            ) : tenant.check_out_date ? (
              <div className="flex justify-between items-center">
                <dt className="text-sm text-muted-foreground">
                  Tanggal Keluar
                </dt>
                <dd className="text-sm font-medium">
                  {fmt(tenant.check_out_date)}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        {/* Room & Property */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BedDouble className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Kamar & Properti
            </span>
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Kamar</dt>
              <dd className="text-sm font-medium">
                {tenant.room_number} · {tenant.property_name}
              </dd>
            </div>
          </dl>
        </div>

        {/* Current Payment */}
        {currentMonthPayment && (
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Pembayaran Bulan Ini
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {formatCurrency(currentMonthPayment.amount ?? 0)}
              </span>
              <Badge
                className={cn(
                  "rounded-full text-xs",
                  getSiHuniStatus(currentMonthPayment.status).className,
                )}
              >
                {getSiHuniStatus(currentMonthPayment.status).label}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Riwayat Pembayaran
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 rounded-lg"
              onClick={() =>
                navigate(`/dashboard/payments?room_id=${tenant.room_id}`)
              }
            >
              Lihat Semua
            </Button>
          </div>
          <div className="space-y-2">
            {recentPayments.map((p: any) => {
              const sc = getSiHuniStatus(p.status);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 border-b border-border/40 last:border-0 cursor-pointer hover:bg-muted/30 rounded-lg px-2 -mx-2"
                  onClick={() => navigate(`/dashboard/payments/${p.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium">{p.period}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.payment_date ? fmt(p.payment_date) : "Belum dibayar"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums">
                      {formatCurrency(p.amount ?? 0)}
                    </p>
                    <Badge className={cn("rounded-full text-xs", sc.className)}>
                      {sc.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
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
            onClick={() => navigate(`/dashboard/rooms/${tenant.room_id}`)}
          >
            <BedDouble className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Detail Kamar</p>
              <p className="text-xs text-muted-foreground">
                Kamar {tenant.room_number}
              </p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3 rounded-xl"
            onClick={() =>
              navigate(`/dashboard/payments?room_id=${tenant.room_id}`)
            }
          >
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Riwayat Pembayaran</p>
              <p className="text-xs text-muted-foreground">
                {tenant.property_name}
              </p>
            </div>
          </Button>
        </div>
      </div>

      {/* Edit Dialog — menggunakan TenantForm component yang sama dengan halaman list */}
      <TenantForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEdit}
        isLoading={updateMutation.isPending}
        initialData={
          tenant
            ? {
                name: tenant.name,
                identity_number: tenant.identity_number,
                phone_number: tenant.phone_number,
                check_in_date: tenant.check_in_date,
                rental_duration: tenant.rental_duration,
              }
            : undefined
        }
      />

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <LogOut className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Checkout Penghuni</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Konfirmasi checkout untuk <strong>{tenant.name}</strong>.
                </p>
              </div>
            </div>
          </DialogHeader>
          <form
            onSubmit={checkoutForm.handleSubmit(handleCheckout)}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label>Tanggal Keluar</Label>
              <Controller
                control={checkoutForm.control}
                name="check_out_date"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Pilih tanggal keluar"
                    toDate={new Date()}
                  />
                )}
              />
              {checkoutForm.formState.errors.check_out_date && (
                <p className="text-sm text-destructive">
                  {checkoutForm.formState.errors.check_out_date.message}
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
                className="gap-2 rounded-xl"
              >
                {checkoutMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Checkout
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Extend Contract Dialog */}
      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Perpanjang Kontrak</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Durasi sewa saat ini:{" "}
              <strong>{tenant.rental_duration} bulan</strong>
            </p>
            <div className="space-y-2">
              <Label>Tambah Durasi (bulan)</Label>
              <Input
                type="number"
                min={1}
                value={tambahBulan}
                onChange={(e) => setTambahBulan(Number(e.target.value))}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Total setelah perpanjangan:{" "}
              <strong>
                {tenant.rental_duration + tambahBulan} bulan total
              </strong>
              {" — "}berakhir{" "}
              {fmt(
                new Date(
                  new Date(tenant.check_in_date).setMonth(
                    new Date(tenant.check_in_date).getMonth() +
                      tenant.rental_duration +
                      tambahBulan,
                  ),
                ).toISOString(),
              )}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleExtend}
              disabled={updateMutation.isPending}
              className="gap-2 rounded-xl"
            >
              {updateMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Perpanjang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
