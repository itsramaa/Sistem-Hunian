import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";

import {
  useMaintenances,
  useCreateMaintenance,
  useUpdateMaintenance,
} from "../hooks/useMaintenance";

import { useProperties } from "@/features/properties/hooks/useProperties";

import { useRooms } from "@/features/rooms/hooks/useRooms";

import { Maintenance, CreateMaintenancePayload } from "../types";

import { MaintenanceProcessDialog } from "../components/MaintenanceProcessDialog";
import { MaintenanceCompleteDialog } from "../components/MaintenanceCompleteDialog";

import { Button } from "@/shared/components/ui/button";

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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";

import { Input } from "@/shared/components/ui/input";
import { DatePicker } from "@/shared/components/ui/date-picker";

import { Label } from "@/shared/components/ui/label";

import { Textarea } from "@/shared/components/ui/textarea";

import {
  Plus,
  Loader2,
  Wrench,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

import { useToast } from "@/shared/hooks/use-toast";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import { getSiHuniStatus } from "@/shared/utils/statusColors";

import { useForm, Controller } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";

import { format } from "date-fns";

import { id as localeId } from "date-fns/locale";

import { DataCard } from "@/shared/components/DataCard";

import { useIsMobile } from "@/shared/hooks/useBreakpoint";

import { EmptyState } from "@/shared/components/ui/EmptyState";

const statusColors: Record<string, { label: string; className: string }> = {
  reported: getSiHuniStatus("reported"),
  in_progress: getSiHuniStatus("in_progress"),
  completed: getSiHuniStatus("completed"),
};

const createSchema = z.object({
  property_id: z.string().min(1, "Pilih properti"),
  room_id: z.string().min(1, "Pilih kamar"),
  report_date: z.string().min(1),
  damage_description: z.string().min(5, "Deskripsi minimal 5 karakter"),
});

type CreateForm = z.infer<typeof createSchema>;

export default function MaintenancePage() {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { toast } = useToast();
  const { role } = useAuth();
  const isOperator = role === "operator";

  const isMobile = useIsMobile();

  const limit = 20;

  const { data, isLoading } = useMaintenances(
    page,

    limit,

    statusFilter || undefined,

    propertyFilter || undefined,
  );

  const { data: propsData } = useProperties("", 1, 100);

  const getToday = () => format(new Date(), "yyyy-MM-dd");

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),

    defaultValues: {
      property_id: "",
      room_id: "",
      report_date: getToday(),
      damage_description: "",
    },
  });

  const selectedPropertyId = createForm.watch("property_id");

  const { data: roomsData } = useRooms(
    "",
    1,
    200,
    selectedPropertyId || propertyFilter || undefined,
  );

  const createMutation = useCreateMaintenance();

  const updateMutation = useUpdateMaintenance();

  const maintenances: Maintenance[] = data?.maintenances ?? [];

  const total = data?.pagination?.total ?? 0;

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const properties = propsData?.properties ?? [];

  const rooms = roomsData?.rooms ?? [];

  // Process dialog
  const [processTarget, setProcessTarget] = useState<Maintenance | null>(null);
  const [processOpen, setProcessOpen] = useState(false);

  // Complete dialog
  const [completeTarget, setCompleteTarget] = useState<Maintenance | null>(
    null,
  );
  const [completeOpen, setCompleteOpen] = useState(false);

  const handleProcess = async (id: string, handlerName: string) => {
    await updateMutation.mutateAsync({
      id,
      payload: {
        status: "in_progress",
        repair_action: `Ditangani oleh: ${handlerName}`,
      },
    });
    toast({ title: "Maintenance ditandai sedang diproses" });
  };

  const handleComplete = async (
    id: string,
    actions: string[],
    costVal: number,
  ) => {
    await updateMutation.mutateAsync({
      id,
      payload: {
        status: "completed",
        repair_action: actions.join("\n"),
        cost: costVal,
      },
    });
    toast({ title: "Maintenance ditandai selesai" });
  };

  const handleCreate = async (payload: CreateForm) => {
    try {
      await createMutation.mutateAsync(payload as CreateMaintenancePayload);

      setCreateOpen(false);

      createForm.reset({
        property_id: "",
        room_id: "",
        report_date: getToday(),
        damage_description: "",
      });

      toast({
        title: "Laporan maintenance berhasil dicatat",
        description: "Laporan baru telah disimpan ke sistem.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal mencatat laporan maintenance",
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
          <h1 className="text-xl font-bold tracking-tight">Maintenance</h1>

          <p className="text-sm text-muted-foreground mt-0.5">
            Laporan dan histori maintenance kamar
          </p>
        </div>

        {isOperator && (
          <Button
            onClick={() => setCreateOpen(true)}
            className="shrink-0 gap-2 rounded-xl min-h-[44px]"
          >
            <Plus className="h-4 w-4" /> Buat Laporan
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 overflow-x-auto pb-1">
        <Select
          value={propertyFilter || "_all"}
          onValueChange={(v) => {
            setPropertyFilter(v === "_all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px] rounded-xl h-10 shrink-0">
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

        <Select
          value={statusFilter || "_all"}
          onValueChange={(v) => {
            setStatusFilter(v === "_all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px] rounded-xl h-10 shrink-0">
            <SelectValue placeholder="Semua status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="_all">Semua status</SelectItem>

            <SelectItem value="reported">Dilaporkan</SelectItem>

            <SelectItem value="in_progress">Diproses</SelectItem>

            <SelectItem value="completed">Selesai</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />

          <span className="text-sm">Memuat...</span>
        </div>
      ) : maintenances.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Belum ada laporan maintenance"
          description="Buat laporan kerusakan kamar baru."
          action={{
            label: "Buat Laporan",

            onClick: () => setCreateOpen(true),

            icon: Plus,
          }}
        />
      ) : isMobile ? (
        /* Mobile: Card view */

        <div className="space-y-3">
          {maintenances.map((m) => {
            const sc = statusColors[m.status] || {
              label: m.status,

              className: "",
            };

            return (
              <DataCard
                key={m.id}
                onClick={() => navigate(`/dashboard/maintenance/${m.id}`)}
                header={
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">
                        {m.room_number || "—"} · {m.property_name || "—"}
                      </p>

                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {m.damage_description}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${sc.className}`}
                    >
                      {sc.label}
                    </span>
                  </div>
                }
                fields={[
                  { label: "Tgl Laporan", value: fmt(m.report_date) },
                  {
                    label: "Biaya",
                    value: m.cost
                      ? `Rp${m.cost.toLocaleString("id-ID")}`
                      : undefined,
                  },
                ]}
                actions={
                  m.status !== "completed" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 gap-1.5 text-xs rounded-lg min-h-[44px]"
                      onClick={() => {
                        if (m.status === "reported") {
                          setProcessTarget(m);
                          setProcessOpen(true);
                        } else if (m.status === "in_progress") {
                          setCompleteTarget(m);
                          setCompleteOpen(true);
                        }
                      }}
                    >
                      {m.status === "reported" ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" /> Proses
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
                        </>
                      )}
                    </Button>
                  ) : undefined
                }
              />
            );
          })}

          <Pagination />
        </div>
      ) : (
        /* Desktop: Table view */

        <>
          <div className="glass-table overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
                  <TableHead className="font-semibold text-xs uppercase">
                    Kamar
                  </TableHead>

                  <TableHead className="font-semibold text-xs uppercase">
                    Properti
                  </TableHead>

                  <TableHead className="font-semibold text-xs uppercase">
                    Deskripsi
                  </TableHead>

                  <TableHead className="font-semibold text-xs uppercase">
                    Tgl Laporan
                  </TableHead>

                  <TableHead className="font-semibold text-xs uppercase text-right">
                    Biaya
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
                {maintenances.map((m) => {
                  const sc = statusColors[m.status] || {
                    label: m.status,

                    className: "",
                  };

                  return (
                    <TableRow
                      key={m.id}
                      className="hover:bg-primary/5 transition-colors cursor-pointer"
                      onClick={() => navigate(`/dashboard/maintenance/${m.id}`)}
                    >
                      <TableCell className="text-sm font-medium">
                        {m.room_number || "—"}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {m.property_name || "—"}
                      </TableCell>

                      <TableCell className="text-sm max-w-[200px] truncate">
                        {m.damage_description}
                      </TableCell>

                      <TableCell className="text-sm">
                        {fmt(m.report_date)}
                      </TableCell>

                      <TableCell className="text-sm tabular-nums text-right">
                        {m.cost ? `Rp${m.cost.toLocaleString("id-ID")}` : "—"}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.className}`}
                        >
                          {sc.label}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        {m.status !== "completed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs rounded-lg"
                            onClick={() => {
                              if (m.status === "reported") {
                                setProcessTarget(m);
                                setProcessOpen(true);
                              } else if (m.status === "in_progress") {
                                setCompleteTarget(m);
                                setCompleteOpen(true);
                              }
                            }}
                          >
                            {m.status === "reported" ? "Proses" : "Selesai"}
                          </Button>
                        )}
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

      {/* Create modal */}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wrench className="h-5 w-5 text-primary" />
              </div>

              <div>
                <DialogTitle>Buat Laporan Maintenance</DialogTitle>

                <p className="text-sm text-muted-foreground">
                  Laporan kerusakan kamar
                </p>
              </div>
            </div>
          </DialogHeader>

          <form
            onSubmit={createForm.handleSubmit(handleCreate)}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label>Properti</Label>

              <Select
                value={createForm.watch("property_id")}
                onValueChange={(v) => {
                  createForm.setValue("property_id", v, {
                    shouldValidate: true,
                  });
                  createForm.setValue("room_id", "");
                }}
              >
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Pilih properti" />
                </SelectTrigger>

                <SelectContent>
                  {properties.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.property_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {createForm.formState.errors.property_id && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.property_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Kamar</Label>

              <Select
                value={createForm.watch("room_id")}
                onValueChange={(v) =>
                  createForm.setValue("room_id", v, { shouldValidate: true })
                }
                disabled={!selectedPropertyId}
              >
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue
                    placeholder={
                      selectedPropertyId ? "Pilih kamar" : "Pilih properti dulu"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {rooms.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.room_number}
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
              <Label>Tanggal Laporan</Label>
              <Controller
                control={createForm.control}
                name="report_date"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Pilih tanggal laporan"
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Deskripsi Kerusakan</Label>

              <Textarea
                placeholder="Kebocoran atap lantai 2..."
                rows={3}
                {...createForm.register("damage_description")}
              />

              {createForm.formState.errors.damage_description && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.damage_description.message}
                </p>
              )}
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
                Buat Laporan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Process / Complete dialogs — per state transition */}
      <MaintenanceProcessDialog
        maintenance={processTarget}
        open={processOpen}
        onClose={() => setProcessOpen(false)}
        onSubmit={handleProcess}
      />
      <MaintenanceCompleteDialog
        maintenance={completeTarget}
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onSubmit={handleComplete}
      />
    </div>
  );
}
