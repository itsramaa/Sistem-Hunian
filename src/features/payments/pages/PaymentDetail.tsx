import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useToast } from "@/shared/hooks/use-toast";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import { cn } from "@/shared/utils/utils";
import { formatCurrency } from "@/shared/utils/currency";
import { getSiHuniStatus } from "@/shared/utils/statusColors";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowLeft,
  BedDouble,
  CheckCircle2,
  DollarSign,
  Download,
  FileText,
  Loader2,
  Upload,
  User,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useMarkPaid,
  useUploadBukti,
  usePaymentById,
} from "../hooks/usePayments";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const statusConfig: Record<string, { label: string; className: string }> = {
  paid: getSiHuniStatus("paid"),
  unpaid: getSiHuniStatus("unpaid"),
  overdue: getSiHuniStatus("overdue"),
};

export default function PaymentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadBukti();
  const markPaidMutation = useMarkPaid();

  const handleFileSelect = useCallback(
    (file: File | null) => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (file && file.size > MAX_FILE_SIZE) {
        toast({
          variant: "destructive",
          title: "File terlalu besar",
          description: `Maks 5MB.`,
        });
        setUploadFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setUploadFile(file);
      if (file && file.type.startsWith("image/"))
        setPreviewUrl(URL.createObjectURL(file));
      else setPreviewUrl(null);
    },
    [previewUrl, toast],
  );

  const closeUpload = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setUploadOpen(false);
    setUploadFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [previewUrl]);

  const handleUpload = async () => {
    if (!id || !uploadFile) return;
    try {
      await uploadMutation.mutateAsync({ id, file: uploadFile });
      qc.invalidateQueries({ queryKey: ["payment", id] });
      closeUpload();
      toast({ title: "Bukti transfer berhasil diunggah" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal upload",
        description: getApiErrorMessage(err),
      });
    }
  };

  const handleMarkPaid = async () => {
    if (!id) return;
    try {
      await markPaidMutation.mutateAsync(id);
      qc.invalidateQueries({ queryKey: ["payment", id] });
      toast({ title: "Pembayaran ditandai lunas" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: getApiErrorMessage(err),
      });
    }
  };

  const { data: payment, isLoading, error } = usePaymentById(id);

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
    <div className="space-y-5 w-full max-w-7xl pb-2">
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
        {payment.status !== "paid" && (
          <div className="flex gap-2 shrink-0 flex-wrap justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl"
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="h-3.5 w-3.5" /> Upload Bukti
            </Button>
            <Button
              size="sm"
              className="gap-1.5 rounded-xl"
              onClick={handleMarkPaid}
              disabled={markPaidMutation.isPending}
            >
              {markPaidMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Tandai Lunas
            </Button>
          </div>
        )}
      </div>

      {/* Payment Amount Card */}
      <div className="glass-card p-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">Total Pembayaran</p>
        <p className="text-4xl font-bold text-foreground tabular-nums">
          {formatCurrency(payment.nominal ?? 0)}
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

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={(v) => !v && closeUpload()}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Upload Bukti Transfer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Format: JPG, PNG, PDF. Maks 5MB.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
            />
            <div
              className="border-2 border-dashed border-border/60 rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelect(e.dataTransfer.files?.[0] ?? null);
              }}
            >
              {uploadFile ? (
                <p className="text-sm font-medium truncate">
                  {uploadFile.name}
                </p>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Klik untuk pilih file atau drag & drop
                  </p>
                </>
              )}
            </div>
            {uploadFile && previewUrl && (
              <div className="rounded-xl border border-border/40 overflow-hidden bg-muted/20">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-h-48 object-contain bg-muted/30"
                />
              </div>
            )}
            {uploadFile && !previewUrl && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {uploadFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(uploadFile.size)}
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeUpload}>
              Batal
            </Button>
            <Button
              disabled={!uploadFile || uploadMutation.isPending}
              onClick={handleUpload}
              className="gap-2 rounded-xl"
            >
              {uploadMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
