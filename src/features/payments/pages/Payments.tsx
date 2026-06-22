import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProperties } from "@/features/properties/hooks/useProperties";
import { useRooms } from "@/features/rooms/hooks/useRooms";
import { useActiveTenants } from "@/features/tenant/hooks/useTenants";
import { DataCard } from "@/shared/components/DataCard";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { MonthPicker } from "@/shared/components/ui/month-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useToast } from "@/shared/hooks/use-toast";
import { useIsMobile } from "@/shared/hooks/useBreakpoint";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Loader2,
  Plus,
  Upload,
  X,
} from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import {
  useCreatePayment,
  useMarkPaid,
  usePayments,
  useUpdatePayment,
  useUploadBukti,
} from "../hooks/usePayments";
import { CreatePaymentPayload, Payment } from "../types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const statusColors: Record<string, { label: string; className: string }> = {
  paid: {
    label: "Lunas",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  unpaid: {
    label: "Belum Bayar",
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  overdue: {
    label: "Terlambat",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

const paymentSchema = z.object({
  room_id: z.string().min(1, "Pilih kamar"),
  tenant_id: z.string().min(1, "Pilih penghuni"),
  periode: z.string().min(1, "Periode wajib diisi"),
  nominal: z.coerce.number().positive("Nominal harus > 0"),
  tanggal_bayar: z.string().optional(),
});
type FormData = z.infer<typeof paymentSchema>;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function PaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const isOperator = role === "operator";
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [periodeFilter, setPeriodeFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<Payment | null>(null);
  const [editTarget, setEditTarget] = useState<Payment | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roomIdFromUrl = searchParams.get("room_id") || "";
  const limit = 20;
  const { data, isLoading } = usePayments(
    page,
    limit,
    roomIdFromUrl || undefined,
    undefined,
    statusFilter || undefined,
    propertyFilter || undefined,
    periodeFilter || undefined,
  );
  const { data: propsData } = useProperties("", 1, 100);
  const { data: roomsData } = useRooms(
    "",
    1,
    200,
    propertyFilter || undefined,
    "occupied",
  );
  const { data: tenantsData } = useActiveTenants(
    1,
    200,
    propertyFilter || undefined,
  );

  const createMutation = useCreatePayment();
  const uploadMutation = useUploadBukti();
  const updateMutation = useUpdatePayment();
  const markPaidMutation = useMarkPaid();

  const payments: Payment[] = data?.payments ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const properties = propsData?.properties ?? [];
  const rooms = roomsData?.rooms ?? [];
  const tenants = tenantsData?.tenants ?? [];

  // Calculate summary stats
  const stats = React.useMemo(() => {
    const paid = payments.filter((p) => p.status === "paid");
    const unpaid = payments.filter((p) => p.status === "unpaid");
    const overdue = payments.filter((p) => p.status === "overdue");
    const totalPaidAmount = paid.reduce((sum, p) => sum + (p.nominal || 0), 0);

    return {
      paid: paid.length,
      unpaid: unpaid.length,
      overdue: overdue.length,
      totalPaidAmount,
    };
  }, [payments]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { room_id: "", tenant_id: "", periode: "", nominal: 0 },
  });
  const selectedRoomId = watch("room_id");

  const handleFileSelect = useCallback(
    (file: File | null) => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (file && file.size > MAX_FILE_SIZE) {
        toast({
          variant: "destructive",
          title: "File terlalu besar",
          description: `Ukuran file ${formatFileSize(file.size)} melebihi batas maksimal 5MB.`,
        });
        setUploadFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setUploadFile(file);
      if (file && file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    },
    [previewUrl, toast],
  );

  const closeUploadModal = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setUploadTarget(null);
    setUploadFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [previewUrl]);

  const handleCreate = async (payload: FormData) => {
    try {
      await createMutation.mutateAsync(payload as CreatePaymentPayload);
      setFormOpen(false);
      reset();
      toast({
        title: "Pembayaran berhasil dicatat",
        description: "Data pembayaran telah tersimpan.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal mencatat pembayaran",
        description: getApiErrorMessage(err),
      });
    }
  };

  const handleUpload = async () => {
    if (!uploadTarget || !uploadFile) return;
    try {
      await uploadMutation.mutateAsync({
        id: uploadTarget.id,
        file: uploadFile,
      });
      closeUploadModal();
      toast({
        title: "Bukti transfer berhasil diunggah",
        description: "Bukti pembayaran Anda telah tersimpan.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal mengunggah bukti transfer",
        description: getApiErrorMessage(err),
      });
    }
  };

  const handleUpdate = async (payload: {
    nominal?: number;
    tanggal_bayar?: string;
    periode?: string;
  }) => {
    if (!editTarget) return;
    try {
      await updateMutation.mutateAsync({ id: editTarget.id, payload });
      setEditTarget(null);
      toast({ title: "Pembayaran berhasil diperbarui" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal memperbarui",
        description: getApiErrorMessage(err),
      });
    }
  };

  const handleMarkPaid = async (payment: Payment) => {
    try {
      await markPaidMutation.mutateAsync(payment.id);
      toast({ title: `Pembayaran ${payment.periode} berhasil ditandai lunas` });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal menandai pembayaran lunas",
        description: getApiErrorMessage(err),
      });
    }
  };

  const fmt = (d?: string) => {
    try {
      return d ? format(new Date(d), "dd MMM yyyy", { locale: localeId }) : "—";
    } catch {
      return d ?? "—";
    }
  };

  const PaymentActions = ({ p }: { p: Payment }) =>
    !isOperator || p.status === "paid" ? null : (
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-xs rounded-lg text-green-600 min-h-[40px]"
          disabled={markPaidMutation.isPending}
          onClick={(e) => {
            e.stopPropagation();
            handleMarkPaid(p);
          }}
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Lunas
        </Button>
        {!p.bukti_transfer_url && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs rounded-lg min-h-[40px]"
            onClick={(e) => {
              e.stopPropagation();
              setUploadTarget(p);
            }}
          >
            <Upload className="h-3.5 w-3.5" /> Bukti
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-xs rounded-lg min-h-[40px]"
          onClick={(e) => {
            e.stopPropagation();
            setEditTarget(p);
          }}
        >
          Edit
        </Button>
      </div>
    );

  const Pagination = () =>
    totalPages > 1 ? (
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {(page - 1) * limit + 1}–{Math.min(page * limit, total)} dari {total}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs">
            {page}/{totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Pembayaran</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pencatatan pembayaran sewa
          </p>
        </div>
        {isOperator && (
          <Button
            onClick={() => setFormOpen(true)}
            className="shrink-0 gap-2 rounded-xl min-h-[44px]"
          >
            <Plus className="h-4 w-4" /> Catat Pembayaran
          </Button>
        )}
      </div>

      {roomIdFromUrl && (
        <div className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm text-primary font-medium">
            Filter: histori kamar tertentu
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-full"
            onClick={() => {
              setSearchParams({});
              setPage(1);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="glass-filter-bar space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={propertyFilter || "_all"}
            onValueChange={(v) => {
              setPropertyFilter(v === "_all" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="rounded-xl h-10 w-full">
              <SelectValue placeholder="Semua properti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Semua properti</SelectItem>
              {properties.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter || "_all"}
            onValueChange={(v) => {
              setStatusFilter(v === "_all" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="rounded-xl h-10 w-full">
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Semua status</SelectItem>
              <SelectItem value="paid">Lunas</SelectItem>
              <SelectItem value="unpaid">Belum Bayar</SelectItem>
              <SelectItem value="overdue">Terlambat</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl shrink-0"
            onClick={() => {
              if (!periodeFilter) {
                const prev = new Date();
                prev.setMonth(prev.getMonth() - 1);
                setPeriodeFilter(prev.toISOString().slice(0, 7));
              } else {
                const [y, m] = periodeFilter.split("-").map(Number);
                const d = new Date(y, m - 2);
                setPeriodeFilter(
                  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
                );
              }
              setPage(1);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <MonthPicker
              value={periodeFilter}
              onChange={(v) => {
                setPeriodeFilter(v);
                setPage(1);
              }}
              onClear={() => {
                setPeriodeFilter("");
                setPage(1);
              }}
              placeholder="Semua periode"
              className="w-full"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl shrink-0"
            disabled={periodeFilter === new Date().toISOString().slice(0, 7)}
            onClick={() => {
              if (!periodeFilter) return;
              const [y, m] = periodeFilter.split("-").map(Number);
              const d = new Date(y, m);
              setPeriodeFilter(
                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
              );
              setPage(1);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {!isLoading && payments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-xs text-muted-foreground">Lunas</div>
            </div>
            <div className="text-2xl font-bold tabular-nums">{stats.paid}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Rp{stats.totalPaidAmount.toLocaleString("id-ID")}
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="text-xs text-muted-foreground">Belum Bayar</div>
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {stats.unpaid}
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <X className="h-4 w-4 text-red-500" />
              </div>
              <div className="text-xs text-muted-foreground">Terlambat</div>
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {stats.overdue}
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="text-xs text-muted-foreground">Total Record</div>
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {payments.length}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Memuat...</span>
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Belum ada pembayaran"
          description="Catat pembayaran sewa pertama."
          action={{
            label: "Catat Pembayaran",
            onClick: () => setFormOpen(true),
            icon: Plus,
          }}
        />
      ) : isMobile ? (
        <div className="space-y-3">
          {payments.map((p) => {
            const sc = statusColors[p.status] || {
              label: p.status,
              className: "",
            };
            return (
              <DataCard
                key={p.id}
                onClick={() => navigate(`/dashboard/payments/${p.id}`)}
                header={
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">
                        {p.nomor_kamar || "—"} · {p.periode}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.nama_penghuni || "—"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sc.className}`}
                    >
                      {sc.label}
                    </span>
                  </div>
                }
                fields={[
                  {
                    label: "Nominal",
                    value: `Rp${p.nominal.toLocaleString("id-ID")}`,
                  },
                  { label: "Tgl Bayar", value: fmt(p.tanggal_bayar) },
                ]}
                actions={<PaymentActions p={p} />}
              />
            );
          })}
          <Pagination />
        </div>
      ) : (
        <>
          <div className="glass-table overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
                  <TableHead className="font-semibold text-xs uppercase">
                    Kamar
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase">
                    Penghuni
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase">
                    Periode
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase text-right">
                    Nominal
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase">
                    Tgl Bayar
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase text-right">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => {
                  const sc = statusColors[p.status] || {
                    label: p.status,
                    className: "",
                  };
                  return (
                    <TableRow
                      key={p.id}
                      className="hover:bg-primary/5 transition-colors cursor-pointer"
                      onClick={() => navigate(`/dashboard/payments/${p.id}`)}
                    >
                      <TableCell className="text-sm font-medium">
                        {p.nomor_kamar || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.nama_penghuni || "—"}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {p.periode}
                      </TableCell>
                      <TableCell className="text-sm font-medium tabular-nums text-right">
                        Rp{p.nominal.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {fmt(p.tanggal_bayar)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.className}`}
                        >
                          {sc.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <PaymentActions p={p} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <Pagination />
        </>
      )}

      {/* Create form */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Catat Pembayaran</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Masukkan data pembayaran sewa
                </p>
              </div>
            </div>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(handleCreate)}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label>Kamar (terisi)</Label>
              <Select
                onValueChange={(v) => {
                  setValue("room_id", v);
                  setValue("tenant_id", "");
                }}
              >
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Pilih kamar" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nomor_kamar} — {r.nama_properti}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.room_id && (
                <p className="text-sm text-destructive">
                  {errors.room_id.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Penghuni</Label>
              <Select
                disabled={!selectedRoomId}
                onValueChange={(v) => setValue("tenant_id", v)}
              >
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Pilih penghuni" />
                </SelectTrigger>
                <SelectContent>
                  {tenants
                    .filter(
                      (t: any) =>
                        !selectedRoomId || t.room_id === selectedRoomId,
                    )
                    .map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nama}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.tenant_id && (
                <p className="text-sm text-destructive">
                  {errors.tenant_id.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Periode</Label>
                <Input type="month" {...register("periode")} />
                {errors.periode && (
                  <p className="text-sm text-destructive">
                    {errors.periode.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Nominal (Rp)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="1200000"
                  {...register("nominal")}
                />
                {errors.nominal && (
                  <p className="text-sm text-destructive">
                    {errors.nominal.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tanggal Bayar (opsional)</Label>
              <Input type="date" {...register("tanggal_bayar")} />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormOpen(false);
                  reset();
                }}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="gap-2 rounded-xl"
              >
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}{" "}
                Catat
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload bukti */}
      <Dialog
        open={!!uploadTarget}
        onOpenChange={(v) => !v && closeUploadModal()}
      >
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
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, PDF — maks 5MB
                  </p>
                </>
              )}
            </div>
            {uploadFile && (
              <div className="rounded-xl border border-border/40 overflow-hidden bg-muted/20">
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview bukti transfer"
                      className="w-full max-h-48 object-contain bg-muted/30"
                    />
                    <div className="px-3 py-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/30">
                      <span className="truncate max-w-[200px]">
                        {uploadFile.name}
                      </span>
                      <span className="shrink-0 ml-2">
                        {formatFileSize(uploadFile.size)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
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
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeUploadModal}>
              Batal
            </Button>
            <Button
              disabled={!uploadFile || uploadMutation.isPending}
              onClick={handleUpload}
              className="gap-2 rounded-xl"
            >
              {uploadMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}{" "}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Edit Payment */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Pembayaran</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const payload: any = {};
              const nominal = formData.get("nominal") as string;
              if (nominal) payload.nominal = parseFloat(nominal);
              const tanggal_bayar = formData.get("tanggal_bayar") as string;
              if (tanggal_bayar) payload.tanggal_bayar = tanggal_bayar;
              const periode = formData.get("periode") as string;
              if (periode) payload.periode = periode;
              handleUpdate(payload);
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label>Nominal</Label>
              <Input
                type="number"
                name="nominal"
                defaultValue={editTarget?.nominal}
                placeholder="Nominal pembayaran"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal Bayar</Label>
              <Input
                type="date"
                name="tanggal_bayar"
                defaultValue={
                  editTarget?.tanggal_bayar
                    ? format(new Date(editTarget.tanggal_bayar), "yyyy-MM-dd")
                    : ""
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Periode (YYYY-MM)</Label>
              <Input
                name="periode"
                defaultValue={editTarget?.periode}
                placeholder="2026-06"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="gap-2 rounded-xl"
              >
                {updateMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
