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
import { cn, getAssetUrl } from "@/shared/utils/utils";
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
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { useNavigate, useParams } from "react-router-dom";
import {
  useMarkPaid,
  useUploadBukti,
  usePaymentById,
  useWriteOff,
} from "../hooks/usePayments";
import { useAuth } from "@/features/auth/hooks/useAuth";

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
  cancelled: getSiHuniStatus("cancelled"),
};

export default function PaymentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { role } = useAuth();
  const isOperator = role === "operator";
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [markPaidDate, setMarkPaidDate] = useState<Date>(new Date());
  const [writeOffOpen, setWriteOffOpen] = useState(false);

  const uploadMutation = useUploadBukti();
  const markPaidMutation = useMarkPaid();
  const writeOffMutation = useWriteOff();

  const handleWriteOff = async () => {
    if (!id) return;
    try {
      await writeOffMutation.mutateAsync(id);
      qc.invalidateQueries({ queryKey: ["payment", id] });
      setWriteOffOpen(false);
      toast({
        title: "Tagihan berhasil di-write-off",
        description: "Status tagihan berubah menjadi dibatalkan.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal write-off",
        description: getApiErrorMessage(err),
      });
    }
  };

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
      await markPaidMutation.mutateAsync({
        id,
        payment_date: format(markPaidDate, "yyyy-MM-dd"),
      });
      qc.invalidateQueries({ queryKey: ["payment", id] });
      setMarkPaidOpen(false);
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
  const tanggalBayar = payment.payment_date
    ? new Date(payment.payment_date)
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
                Pembayaran Periode {payment.period}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn("rounded-full", statusInfo.className)}>
                  {statusInfo.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        {payment.status !== "paid" && payment.status !== "cancelled" && (
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
              onClick={() => {
                setMarkPaidDate(new Date());
                setMarkPaidOpen(true);
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Tandai Lunas
            </Button>
            {isOperator && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 rounded-xl"
                onClick={() => setWriteOffOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapuskan Tunggakan
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Payment Amount Card */}
      <div className="glass-card p-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">Total Pembayaran</p>
        <p className="text-4xl font-bold text-foreground tabular-nums">
          {formatCurrency(payment.amount ?? 0)}
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
                {payment.period}
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
            {/* metode_pembayaran removed — not in schema */}
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
                {payment.room_number}
              </dd>
            </div>
            <div className="flex justify-between items-start">
              <dt className="text-sm text-muted-foreground">Properti</dt>
              <dd className="text-sm font-medium text-foreground text-right truncate max-w-[60%]">
                {payment.property_name}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm text-muted-foreground">Penghuni</dt>
              <dd className="text-sm font-medium text-foreground">
                {payment.tenant_name}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Payment Proof */}
      {payment.transfer_proof_url && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Bukti Pembayaran
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-lg"
              onClick={() =>
                window.open(getAssetUrl(payment.transfer_proof_url), "_blank")
              }
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
          <div className="border border-border/40 rounded-xl overflow-hidden bg-muted/30">
            <img
              src={getAssetUrl(payment.transfer_proof_url)}
              alt="Bukti Pembayaran"
              className="w-full h-auto object-contain max-h-96"
            />
          </div>
        </div>
      )}

      {/* keterangan removed — not in schema */}

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
                Kamar {payment.room_number}
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
                {payment.tenant_name}
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3 rounded-xl"
            onClick={() => navigate(`/dashboard/rooms/${payment.room_id}`)}
          >
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Detail Properti</p>
              <p className="text-xs text-muted-foreground truncate">
                {payment.property_name}
              </p>
            </div>
          </Button>
        </div>
      </div>

      {/* Mark Paid Dialog */}
      <Dialog open={markPaidOpen} onOpenChange={setMarkPaidOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Tandai Lunas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Pilih tanggal pembayaran diterima. Default hari ini.
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tanggal Pembayaran</label>
              <DatePicker
                value={format(markPaidDate, "yyyy-MM-dd")}
                onChange={(v) => {
                  if (v) setMarkPaidDate(new Date(v));
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleMarkPaid}
              disabled={markPaidMutation.isPending}
              className="gap-2 rounded-xl"
            >
              {markPaidMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Konfirmasi Lunas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Write-Off Confirmation Dialog */}
      <Dialog open={writeOffOpen} onOpenChange={setWriteOffOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Hapuskan Tunggakan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Fitur ini digunakan untuk{" "}
              <span className="font-semibold text-foreground">
                menghapus tagihan yang tidak bisa ditagih
              </span>{" "}
              — misalnya penghuni sudah keluar namun masih punya tunggakan yang
              tidak bisa dikejar.
            </p>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-sm">
              <p className="font-semibold text-amber-800 dark:text-amber-400 text-xs uppercase tracking-wide mb-1.5">
                ⚠️ Perhatian
              </p>
              <p className="text-amber-700 dark:text-amber-300 text-xs leading-relaxed">
                Tagihan ini{" "}
                <span className="font-semibold">
                  tidak akan dihapus permanen
                </span>{" "}
                dari sistem — hanya ditandai sebagai{" "}
                <span className="font-semibold">tunggakan dibebaskan</span> dan
                tetap tersimpan sebagai catatan historis. Aksi ini tidak dapat
                dibatalkan.
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 border border-border/50 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Penghuni</span>
                <span className="font-medium">{payment?.tenant_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kamar</span>
                <span className="font-medium">{payment?.room_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Periode</span>
                <span className="font-medium">{payment?.period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tagihan</span>
                <span className="font-medium">
                  {formatCurrency(payment?.amount ?? 0)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWriteOffOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleWriteOff}
              disabled={writeOffMutation.isPending}
              className="gap-2"
            >
              {writeOffMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Ya, Bebaskan Tunggakan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
