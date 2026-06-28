import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProperties } from "@/features/properties/hooks/useProperties";
import { useRooms } from "@/features/rooms/hooks/useRooms";
import { DataCard } from "@/shared/components/DataCard";
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
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { DatePicker } from "@/shared/components/ui/date-picker";
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
import { getSiHuniStatus } from "@/shared/utils/statusColors";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, differenceInDays, format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import {
  useConfirmations,
  useConfirmDP,
  useCreateConfirmation,
  useExpireConfirmation,
  useUpdateDeadline,
} from "../hooks/useConfirmations";
import {
  Confirmation,
  ConfirmDPPayload,
  CreateConfirmationPayload,
} from "../types";

const statusColors: Record<string, { label: string; className: string }> = {
  pending: getSiHuniStatus("pending"),
  confirmed: getSiHuniStatus("confirmed"),
  expired: {
    label: "Hangus",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

const createSchema = z.object({
  room_id: z.string().min(1, "Pilih kamar"),
  prospect_name: z.string().min(2).max(255),
  phone_number: z.string().min(1, "Nomor telepon wajib").max(30),
  down_payment_amount: z.coerce.number().positive("Nominal harus > 0"),
  confirmation_deadline: z.string().min(1, "Tanggal wajib"),
});

const confirmSchema = z.object({
  name: z.string().min(2).max(255),
  identity_number: z.string().min(1).max(100),
  phone_number: z.string().min(1).max(30),
  check_in_date: z.string().min(1),
  rental_duration: z.coerce.number().int().positive(),
});

const perpanjangSchema = z.object({
  confirmation_deadline: z.string().min(1, "Tanggal wajib"),
});

type CreateForm = z.infer<typeof createSchema>;
type ConfirmForm = z.infer<typeof confirmSchema>;
type PerpanjangForm = z.infer<typeof perpanjangSchema>;

function ExpireButton({ id, nama }: { id: string; nama: string }) {
  const expireMutation = useExpireConfirmation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleExpire = async () => {
    try {
      await expireMutation.mutateAsync(id);
      toast({
        title: `DP ${nama} berhasil ditandai hangus`,
        description: "Kamar telah dikembalikan ke status tersedia.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal menghanguskan DP",
        description: getApiErrorMessage(err),
      });
    }
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs rounded-lg text-destructive border-destructive/30 hover:bg-destructive/5"
        onClick={() => setOpen(true)}
      >
        <XCircle className="h-3.5 w-3.5" /> Tandai Hangus
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tandai DP Hangus?</AlertDialogTitle>
            <AlertDialogDescription>
              DP atas nama <strong>{nama}</strong> akan ditandai hangus. Kamar
              akan dikembalikan ke status tersedia. Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={expireMutation.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExpire}
              disabled={expireMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {expireMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Ya, Hanguskan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function ConfirmationsPage() {
  const { role } = useAuth();
  const isOperator = role === "operator";
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Confirmation | null>(null);
  const [perpanjangTarget, setPerpanjangTarget] = useState<Confirmation | null>(
    null,
  );
  const [confirmCreatePayload, setConfirmCreatePayload] =
    useState<CreateForm | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const limit = 20;

  const { data, isLoading } = useConfirmations(
    page,
    limit,
    statusFilter || undefined,
    propertyFilter || undefined,
  );
  const { data: propsData } = useProperties("", 1, 100);
  const { data: roomsData } = useRooms(
    "",
    1,
    200,
    propertyFilter || undefined,
    "available",
  );

  const updateDeadlineMutation = useUpdateDeadline();
  const createMutation = useCreateConfirmation();
  const confirmMutation = useConfirmDP();

  const confirmations: Confirmation[] = data?.confirmations ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const properties = propsData?.properties ?? [];
  const rooms = roomsData?.rooms ?? [];

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });
  const confirmForm = useForm<ConfirmForm>({
    resolver: zodResolver(confirmSchema),
  });
  const perpanjangForm = useForm<PerpanjangForm>({
    resolver: zodResolver(perpanjangSchema),
    defaultValues: { confirmation_deadline: "" },
  });

  const handlePerpanjang = async (payload: PerpanjangForm) => {
    if (!perpanjangTarget) return;
    try {
      await updateDeadlineMutation.mutateAsync({
        id: perpanjangTarget.id,
        payload: { confirmation_deadline: payload.confirmation_deadline },
      });
      setPerpanjangTarget(null);
      perpanjangForm.reset();
      toast({ title: "Batas tanggal berhasil diperpanjang" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal memperpanjang",
        description: getApiErrorMessage(err),
      });
    }
  };

  const handleCreate = async (payload: CreateForm) => {
    // Tahan payload — tampilkan konfirmasi dulu
    setConfirmCreatePayload(payload);
    setCreateOpen(false);
  };

  const handleConfirmCreate = async () => {
    if (!confirmCreatePayload) return;
    try {
      await createMutation.mutateAsync(
        confirmCreatePayload as CreateConfirmationPayload,
      );
      setConfirmCreatePayload(null);
      createForm.reset();
      toast({
        title: "Konfirmasi DP berhasil dicatat",
        description: "Down payment telah tercatat untuk kamar ini.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal mencatat konfirmasi DP",
        description: getApiErrorMessage(err),
      });
      setConfirmCreatePayload(null);
    }
  };

  const handleConfirm = async (payload: ConfirmForm) => {
    if (!confirmTarget) return;
    try {
      await confirmMutation.mutateAsync({
        id: confirmTarget.id,
        payload: payload as ConfirmDPPayload,
      });
      setConfirmTarget(null);
      confirmForm.reset();
      toast({
        title: "Penghuni berhasil dikonfirmasi masuk",
        description: "Status kamar telah diperbarui menjadi terisi.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal konfirmasi penghuni",
        description: getApiErrorMessage(err),
      });
    }
  };

  const fmt = (d: string) => {
    try {
      return format(new Date(d), "dd MMM yyyy", { locale: localeId });
    } catch {
      return d;
    }
  };

  const sisaHari = (d: string) => {
    try {
      return differenceInDays(new Date(d), new Date());
    } catch {
      return null;
    }
  };

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
    <div className="space-y-5 w-full max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Konfirmasi DP</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola konfirmasi down payment calon penghuni
          </p>
        </div>
        {isOperator && (
          <Button
            onClick={() => setCreateOpen(true)}
            className="shrink-0 gap-2 rounded-xl"
          >
            <Plus className="h-4 w-4" /> Catat Konfirmasi DP
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          value={propertyFilter || "_all"}
          onValueChange={(v) => {
            setPropertyFilter(v === "_all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px] rounded-xl h-10">
            <SelectValue placeholder="Semua properti" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Semua properti</SelectItem>
            {properties.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
                {p.property_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tab-style status filter */}
        <div className="flex rounded-xl border border-border overflow-hidden">
          {[
            { value: "_all", label: "Semua" },
            { value: "pending", label: "Menunggu" },
            { value: "_selesai", label: "Selesai" },
            { value: "expired", label: "Hangus" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                if (opt.value === "_selesai") setStatusFilter("confirmed");
                else if (opt.value === "_all") setStatusFilter("");
                else setStatusFilter(opt.value);
                setPage(1);
              }}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                (opt.value === "pending" && statusFilter === "pending") ||
                (opt.value === "_selesai" && statusFilter === "confirmed") ||
                (opt.value === "expired" && statusFilter === "expired") ||
                (opt.value === "_all" && statusFilter === "")
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Memuat...</span>
        </div>
      ) : isMobile ? (
        <div className="space-y-3">
          {confirmations.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-16">
              Belum ada konfirmasi DP.
            </p>
          ) : (
            confirmations.map((c) => {
              const sc = statusColors[c.status] || {
                label: c.status,
                className: "",
              };
              const sisa = sisaHari(c.confirmation_deadline);
              const isExpired =
                c.status === "pending" && sisa !== null && sisa < 0;
              return (
                <DataCard
                  key={c.id}
                  header={
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">
                          {c.room_number} · {c.prospect_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fmt(c.confirmation_deadline)}
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
                      label: "Nominal DP",
                      value: `Rp${(c.down_payment_amount ?? 0).toLocaleString("id-ID")}`,
                    },
                    {
                      label: "Sisa Hari",
                      value:
                        c.status === "pending" && sisa !== null
                          ? isExpired
                            ? "Expired"
                            : `${sisa} hari`
                          : "—",
                    },
                  ]}
                  actions={
                    isOperator && c.status === "pending" ? (
                      <div className="flex gap-1.5 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs rounded-lg min-h-[44px]"
                          onClick={() => {
                            setConfirmTarget(c);
                            confirmForm.reset({
                              name: c.prospect_name,
                              identity_number: "",
                              phone_number: "",
                              check_in_date: "",
                              rental_duration: 1,
                            });
                          }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />{" "}
                          Konfirmasi Masuk
                        </Button>
                        {c.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs rounded-lg"
                            onClick={() => {
                              // Default perpanjangan dari tanggal expired + 1 hari
                              const expired = c.confirmation_deadline;
                              const nextDay = addDays(new Date(expired), 1);
                              perpanjangForm.reset({
                                confirmation_deadline: format(
                                  nextDay,
                                  "yyyy-MM-dd",
                                ),
                              });
                              setPerpanjangTarget(c);
                            }}
                          >
                            Perpanjang
                          </Button>
                        )}
                        <ExpireButton id={c.id} nama={c.prospect_name} />
                      </div>
                    ) : undefined
                  }
                />
              );
            })
          )}
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
                    Calon Penghuni
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase text-right">
                    Nominal DP
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase">
                    Batas Tanggal
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase text-center">
                    Sisa Hari
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
                {confirmations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Belum ada konfirmasi DP.
                    </TableCell>
                  </TableRow>
                ) : (
                  confirmations.map((c) => {
                    const sc = statusColors[c.status] || {
                      label: c.status,
                      className: "",
                    };
                    const sisa = sisaHari(c.confirmation_deadline);
                    const isExpired =
                      c.status === "pending" && sisa !== null && sisa < 0;
                    return (
                      <TableRow
                        key={c.id}
                        className="hover:bg-primary/5 transition-colors"
                      >
                        <TableCell className="text-sm font-medium">
                          {c.room_number}
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.prospect_name}
                        </TableCell>
                        <TableCell className="text-sm font-medium tabular-nums text-right">
                          Rp
                          {(c.down_payment_amount ?? 0).toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {fmt(c.confirmation_deadline)}
                        </TableCell>
                        <TableCell className="text-center">
                          {c.status === "pending" && sisa !== null ? (
                            <span
                              className={`text-sm font-medium tabular-nums ${isExpired ? "text-destructive" : sisa <= 3 ? "text-warning" : "text-foreground"}`}
                            >
                              {isExpired ? "Expired" : `${sisa} hari`}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.className}`}
                          >
                            {sc.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {isOperator && c.status === "pending" && (
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 text-xs rounded-lg"
                                onClick={() => {
                                  setConfirmTarget(c);
                                  confirmForm.reset({
                                    name: c.prospect_name,
                                    identity_number: "",
                                    phone_number: "",
                                    check_in_date: "",
                                    rental_duration: 1,
                                  });
                                }}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />{" "}
                                Konfirmasi Masuk
                              </Button>
                              <ExpireButton id={c.id} nama={c.prospect_name} />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 text-xs rounded-lg"
                                onClick={() => {
                                  const expired = c.confirmation_deadline;
                                  const nextDay = addDays(new Date(expired), 1);
                                  perpanjangForm.reset({
                                    confirmation_deadline: format(
                                      nextDay,
                                      "yyyy-MM-dd",
                                    ),
                                  });
                                  setPerpanjangTarget(c);
                                }}
                              >
                                Perpanjang
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <Pagination />
        </>
      )}

      {/* Create DP modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Catat Konfirmasi DP</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Kamar berstatus available
                </p>
              </div>
            </div>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit(handleCreate)}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label>Kamar Tersedia</Label>
              <Select onValueChange={(v) => createForm.setValue("room_id", v)}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Pilih kamar" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.room_number} — {r.property_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {createForm.formState.errors.room_id && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.room_id.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nama Calon Penghuni</Label>
              <Input
                placeholder="Sari Dewi"
                {...createForm.register("prospect_name")}
              />
              {createForm.formState.errors.prospect_name && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.prospect_name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nomor Telepon</Label>
              <Input
                placeholder="08xxxxxxxxxx"
                inputMode="numeric"
                onKeyDown={(e) => {
                  if (
                    !/[0-9+]|Backspace|Delete|Tab|ArrowLeft|ArrowRight/.test(
                      e.key,
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
                {...createForm.register("phone_number")}
              />
              {createForm.formState.errors.phone_number && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.phone_number.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nominal DP (Rp)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    placeholder="600000"
                    {...createForm.register("down_payment_amount")}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimal 10% dari harga sewa kamar.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Batas Tanggal</Label>
                <Controller
                  control={createForm.control}
                  name="confirmation_deadline"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Pilih batas tanggal"
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Lewat tanggal ini, DP akan hangus secara otomatis dan kamar
                  kembali tersedia.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
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
                Catat DP
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi masuk modal */}
      <Dialog
        open={!!confirmTarget}
        onOpenChange={(v) => !v && setConfirmTarget(null)}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <DialogTitle>Konfirmasi Masuk</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {confirmTarget?.prospect_name} — Kamar{" "}
                  {confirmTarget?.room_number}
                </p>
              </div>
            </div>
          </DialogHeader>
          <form
            onSubmit={confirmForm.handleSubmit(handleConfirm)}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input
                defaultValue={confirmTarget?.prospect_name}
                {...confirmForm.register("name")}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>No. Identitas</Label>
                <Input
                  placeholder="3271..."
                  inputMode="numeric"
                  onKeyDown={(e) => {
                    if (
                      !/[0-9]|Backspace|Delete|Tab|ArrowLeft|ArrowRight/.test(
                        e.key,
                      )
                    ) {
                      e.preventDefault();
                    }
                  }}
                  {...confirmForm.register("identity_number")}
                />
              </div>
              <div className="space-y-2">
                <Label>No. Telepon</Label>
                <Input
                  placeholder="0812..."
                  inputMode="numeric"
                  onKeyDown={(e) => {
                    if (
                      !/[0-9+]|Backspace|Delete|Tab|ArrowLeft|ArrowRight/.test(
                        e.key,
                      )
                    ) {
                      e.preventDefault();
                    }
                  }}
                  {...confirmForm.register("phone_number")}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tanggal Masuk</Label>
                <Controller
                  control={confirmForm.control}
                  name="check_in_date"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Pilih tanggal masuk"
                    />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Durasi (bulan)</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="6"
                  {...confirmForm.register("rental_duration")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmTarget(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={confirmMutation.isPending}
                className="gap-2 rounded-xl"
              >
                {confirmMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}{" "}
                Konfirmasi Masuk
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Perpanjang Batas Tanggal */}
      <Dialog
        open={!!perpanjangTarget}
        onOpenChange={(v) => !v && setPerpanjangTarget(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Perpanjang Batas Tanggal Konfirmasi</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={perpanjangForm.handleSubmit(handlePerpanjang)}
            className="space-y-4 py-2"
          >
            <p className="text-sm text-muted-foreground">
              Perpanjang batas waktu konfirmasi untuk{" "}
              <strong>{perpanjangTarget?.prospect_name}</strong>.
            </p>
            <div className="space-y-1.5">
              <Label>Batas Tanggal Baru</Label>
              <Controller
                control={perpanjangForm.control}
                name="confirmation_deadline"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Pilih batas tanggal baru"
                    fromDate={new Date()}
                  />
                )}
              />
              {perpanjangForm.formState.errors.confirmation_deadline && (
                <p className="text-xs text-destructive">
                  {
                    perpanjangForm.formState.errors.confirmation_deadline
                      .message
                  }
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPerpanjangTarget(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={updateDeadlineMutation.isPending}
                className="gap-2 rounded-xl"
              >
                {updateDeadlineMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi create DP */}
      <AlertDialog
        open={!!confirmCreatePayload}
        onOpenChange={(v) => !v && setConfirmCreatePayload(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Catat Konfirmasi DP?</AlertDialogTitle>
            <AlertDialogDescription>
              DP atas nama{" "}
              <strong>{confirmCreatePayload?.prospect_name}</strong> akan
              dicatat dan status kamar akan berubah menjadi{" "}
              <strong>Konfirmasi DP</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={createMutation.isPending}
              onClick={() => setConfirmCreatePayload(null)}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Ya, Catat DP
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
