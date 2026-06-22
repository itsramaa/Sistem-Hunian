import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/axios";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  ArrowLeft,
  DollarSign,
  BedDouble,
  User,
  Calendar,
  Loader2,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/shared/utils/utils";

interface PaymentDetail {
  id: string;
  room_id: string;
  tenant_id: string;
  nomor_kamar: string;
  nama_penghuni: string;
  property_id: string;
  nama_properti: string;
  periode: string;
  nominal: number;
  tanggal_bayar?: string | null;
  status: "paid" | "unpaid" | "overdue";
  metode_pembayaran?: string;
  bukti_transfer_url?: string;
  keterangan?: string;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  paid: {
    label: "Lunas",
    variant: "default" as const,
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  unpaid: {
    label: "Belum Bayar",
    variant: "secondary" as const,
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  overdue: {
    label: "Terlambat",
    variant: "destructive" as const,
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

export default function PaymentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: payment,
    isLoading,
    error,
  } = useQuery<PaymentDetail>({
    queryKey: ["payment", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/payments/${id}`);
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">Memuat detail pembayaran...</span>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <DollarSign className="h-12 w-12 text-muted-foreground opacity-30" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">
            Pembayaran tidak ditemukan
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Pembayaran yang Anda cari tidak tersedia atau telah dihapus.
          </p>
        </div>
        <Button
          onClick={() => navigate("/dashboard/payments")}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Pembayaran
        </Button>
      </div>
    );
  }

  const statusInfo = statusConfig[payment.status] ?? statusConfig.unpaid;
  const tanggalBayar = payment.tanggal_bayar
    ? new Date(payment.tanggal_bayar)
    : null;

  return (
    <div className="space-y-5 pb-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Pembayaran Periode {payment.periode}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn("rounded-full", statusInfo.className)}>
                  {statusInfo.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Amount Card */}
      <div className="glass-card p-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">Total Pembayaran</p>
        <p className="text-4xl font-bold text-foreground tabular-nums">
          Rp{(payment.nominal ?? 0).toLocaleString("id-ID")}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {tanggalBayar
            ? format(tanggalBayar, "dd MMMM yyyy", { locale: localeId })
            : "—"}
        </p>
      </div>

      {/* Payment Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Informasi Pembayaran
            </span>
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Periode</dt>
              <dd className="text-sm font-medium text-foreground">
                {payment.periode}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Tanggal Bayar</dt>
              <dd className="text-sm font-medium text-foreground">
                {tanggalBayar
                  ? format(tanggalBayar, "dd MMM yyyy", { locale: localeId })
                  : "—"}
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
            {payment.metode_pembayaran && (
              <div className="flex justify-between items-center">
                <dt className="text-sm text-muted-foreground">Metode</dt>
                <dd className="text-sm font-medium text-foreground">
                  {payment.metode_pembayaran}
                </dd>
              </div>
            )}
          </dl>
        </div>

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
              <dd className="text-sm font-medium text-foreground">
                {payment.nomor_kamar}
              </dd>
            </div>
            <div className="flex justify-between items-start">
              <dt className="text-sm text-muted-foreground">Properti</dt>
              <dd className="text-sm font-medium text-foreground text-right truncate max-w-[60%]">
                {payment.nama_properti}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Penghuni</dt>
              <dd className="text-sm font-medium text-foreground">
                {payment.nama_penghuni}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Payment Proof */}
      {payment.bukti_transfer_url && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Bukti Pembayaran
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-lg"
              onClick={() => window.open(payment.bukti_transfer_url, "_blank")}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
          <div className="border border-border/40 rounded-xl overflow-hidden bg-muted/30">
            <img
              src={payment.bukti_transfer_url}
              alt="Bukti Pembayaran"
              className="w-full h-auto object-contain max-h-96"
            />
          </div>
        </div>
      )}

      {/* Notes */}
      {payment.keterangan && (
        <div className="glass-card p-4 space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Keterangan</h2>
          <p className="text-sm text-muted-foreground">{payment.keterangan}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="glass-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3 rounded-xl"
            onClick={() => navigate(`/dashboard/rooms/${payment.room_id}`)}
          >
            <BedDouble className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Detail Kamar</p>
              <p className="text-xs text-muted-foreground">
                Kamar {payment.nomor_kamar}
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3 rounded-xl"
            onClick={() => navigate(`/dashboard/tenants/${payment.tenant_id}`)}
          >
            <User className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Detail Penghuni</p>
              <p className="text-xs text-muted-foreground truncate">
                {payment.nama_penghuni}
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3 rounded-xl"
            onClick={() =>
              navigate(`/dashboard/properties/${payment.property_id}`)
            }
          >
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Detail Properti</p>
              <p className="text-xs text-muted-foreground truncate">
                {payment.nama_properti}
              </p>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
