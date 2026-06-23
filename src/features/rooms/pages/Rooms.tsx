import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  useRooms,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
} from "../hooks/useRooms";
import { useProperties } from "@/features/properties/hooks/useProperties";
import { RoomForm } from "../components/RoomForm";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Plus,
  Loader2,
  Search,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  MoreHorizontal,
  AlertTriangle,
  History,
  Eye,
  Building2,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useToast } from "@/shared/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Room } from "../types";
import { useIsMobile } from "@/shared/hooks/useBreakpoint";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { cn } from "@/shared/utils/utils";

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ElementType; dot: string }
> = {
  available: {
    label: "Tersedia",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle2,
    dot: "bg-green-500",
  },
  dp_confirmation: {
    label: "Konfirmasi DP",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: Clock,
    dot: "bg-amber-500",
  },
  occupied: {
    label: "Terisi",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Users,
    dot: "bg-blue-500",
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    className: "",
    dot: "bg-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        cfg.className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export default function RoomsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [propertyFilter, setPropertyFilter] = useState(
    searchParams.get("property_id") || "",
  );
  const [statusFilter, setStatusFilter] = useState("");
  const [tipeFilter, setTipeFilter] = useState("");
  const [sortBy, setSortBy] = useState("nomor_asc");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const { toast } = useToast();

  const limit = 20;
  const { data: roomsData, isLoading } = useRooms(
    debouncedSearch,
    page,
    limit,
    propertyFilter || undefined,
    statusFilter || undefined,
  );
  const { data: propsData } = useProperties("", 1, 100);
  const createMutation = useCreateRoom();
  const updateMutation = useUpdateRoom();
  const deleteMutation = useDeleteRoom();

  const rawRooms = roomsData?.rooms ?? [];
  const rooms = [...rawRooms]
    .filter((r: any) => !tipeFilter || r.tipe === tipeFilter)
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case "nomor_asc":
          return a.nomor_kamar.localeCompare(b.nomor_kamar, undefined, {
            numeric: true,
          });
        case "nomor_desc":
          return b.nomor_kamar.localeCompare(a.nomor_kamar, undefined, {
            numeric: true,
          });
        case "harga_asc":
          return (a.harga_sewa ?? 0) - (b.harga_sewa ?? 0);
        case "harga_desc":
          return (b.harga_sewa ?? 0) - (a.harga_sewa ?? 0);
        default:
          return 0;
      }
    });

  const total = roomsData?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const properties = propsData?.properties ?? [];

  // Summary counts from current data
  const counts = {
    available: rawRooms.filter((r: any) => r.status === "available").length,
    occupied: rawRooms.filter((r: any) => r.status === "occupied").length,
    dp_confirmation: rawRooms.filter((r: any) => r.status === "dp_confirmation")
      .length,
  };

  const handleCreate = async (payload: any) => {
    try {
      await createMutation.mutateAsync(payload);
      setFormOpen(false);
      toast({
        title: "Kamar berhasil ditambahkan",
        description: "Kamar baru telah disimpan ke sistem.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal menambahkan kamar",
        description: getApiErrorMessage(err),
      });
    }
  };

  const handleUpdate = async (payload: any) => {
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({ id: editing.id, payload });
      setEditing(null);
      setFormOpen(false);
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
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast({
        title: "Kamar berhasil dihapus",
        description: `Kamar ${deleteTarget.nomor_kamar} telah dihapus.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus kamar",
        description: getApiErrorMessage(err),
      });
      setDeleteTarget(null);
    }
  };

  const RoomActions = ({ room }: { room: Room }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-muted"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl w-44">
        <DropdownMenuItem
          onClick={() => navigate(`/dashboard/rooms/${room.id}`)}
        >
          <Eye className="h-4 w-4 mr-2 text-muted-foreground" /> Lihat Detail
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate(`/dashboard/payments?room_id=${room.id}`)}
        >
          <History className="h-4 w-4 mr-2 text-muted-foreground" /> Histori
          Bayar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            setEditing(room);
            setFormOpen(true);
          }}
        >
          <Edit className="h-4 w-4 mr-2 text-muted-foreground" /> Ubah
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget(room);
          }}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" /> Hapus
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const Pagination = () =>
    totalPages > 1 ? (
      <div className="flex items-center justify-between text-sm text-muted-foreground pt-1">
        <span className="text-xs">
          {(page - 1) * limit + 1}–{Math.min(page * limit, total)} dari {total}{" "}
          kamar
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs font-medium px-2 tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-5 w-full max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Manajemen Kamar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola seluruh kamar di semua properti
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="shrink-0 gap-2 rounded-xl h-10"
        >
          <Plus className="h-4 w-4" />
          Tambah Kamar
        </Button>
      </div>

      {/* Summary Strip */}
      {!isLoading && rawRooms.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              key: "available",
              label: "Tersedia",
              count: counts.available,
              color: "text-green-600 dark:text-green-400",
              bg: "bg-green-100 dark:bg-green-900/30",
            },
            {
              key: "occupied",
              label: "Terisi",
              count: counts.occupied,
              color: "text-blue-600 dark:text-blue-400",
              bg: "bg-blue-100 dark:bg-blue-900/30",
            },
            {
              key: "dp_confirmation",
              label: "Konfirmasi DP",
              count: counts.dp_confirmation,
              color: "text-amber-600 dark:text-amber-400",
              bg: "bg-amber-100 dark:bg-amber-900/30",
            },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => {
                setStatusFilter(statusFilter === s.key ? "" : s.key);
                setPage(1);
              }}
              className={cn(
                "glass-card p-3 rounded-xl text-left transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer",
                statusFilter === s.key && "ring-2 ring-primary/50",
              )}
            >
              <p className={cn("text-2xl font-bold tabular-nums", s.color)}>
                {s.count}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-filter-bar space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Cari nomor kamar..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 rounded-xl h-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-10 w-10 rounded-xl shrink-0",
              filtersExpanded && "bg-primary/10 border-primary/30 text-primary",
            )}
            onClick={() => setFiltersExpanded((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {filtersExpanded && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/40">
            <Select
              value={propertyFilter || " "}
              onValueChange={(v) => {
                const val = v.trim() ? v : "";
                setPropertyFilter(val);
                setPage(1);
                setSearchParams(val ? { property_id: val } : {});
              }}
            >
              <SelectTrigger className="rounded-xl h-9 text-sm">
                <Building2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Properti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Semua properti</SelectItem>
                {properties.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter || " "}
              onValueChange={(v) => {
                setStatusFilter(v.trim() ? v : "");
                setPage(1);
              }}
            >
              <SelectTrigger className="rounded-xl h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Semua status</SelectItem>
                <SelectItem value="available">Tersedia</SelectItem>
                <SelectItem value="dp_confirmation">Konfirmasi DP</SelectItem>
                <SelectItem value="occupied">Terisi</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={tipeFilter || "_all"}
              onValueChange={(v) => {
                setTipeFilter(v === "_all" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="rounded-xl h-9 text-sm">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Semua tipe</SelectItem>
                <SelectItem value="1 petak">1 Petak</SelectItem>
                <SelectItem value="2 petak">2 Petak</SelectItem>
                <SelectItem value="3 petak">3 Petak</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="rounded-xl h-9 text-sm">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nomor_asc">Nomor A–Z</SelectItem>
                <SelectItem value="nomor_desc">Nomor Z–A</SelectItem>
                <SelectItem value="harga_asc">Harga Terendah</SelectItem>
                <SelectItem value="harga_desc">Harga Tertinggi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Active filter chips */}
        {(statusFilter || propertyFilter || tipeFilter) && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {statusFilter && (
              <button
                onClick={() => {
                  setStatusFilter("");
                  setPage(1);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                {STATUS_CONFIG[statusFilter]?.label ?? statusFilter}
                <span className="ml-0.5 text-primary/70">×</span>
              </button>
            )}
            {propertyFilter && (
              <button
                onClick={() => {
                  setPropertyFilter("");
                  setPage(1);
                  setSearchParams({});
                }}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                {properties.find((p: any) => p.id === propertyFilter)?.nama ??
                  "Properti"}
                <span className="ml-0.5 text-primary/70">×</span>
              </button>
            )}
            {tipeFilter && (
              <button
                onClick={() => {
                  setTipeFilter("");
                  setPage(1);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                {tipeFilter}
                <span className="ml-0.5 text-primary/70">×</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="glass-card rounded-2xl p-8">
          <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
            <span className="text-sm">Memuat data kamar...</span>
          </div>
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="Belum ada kamar"
          description={
            debouncedSearch || statusFilter || propertyFilter
              ? "Tidak ada kamar yang sesuai filter."
              : "Tambah kamar untuk properti Anda."
          }
          action={
            !debouncedSearch && !statusFilter && !propertyFilter
              ? {
                  label: "Tambah Kamar",
                  onClick: () => {
                    setEditing(null);
                    setFormOpen(true);
                  },
                  icon: Plus,
                }
              : undefined
          }
        />
      ) : isMobile ? (
        /* ── Mobile Card Grid ── */
        <div className="space-y-3">
          {rooms.map((room: Room) => (
            <div
              key={room.id}
              onClick={() => navigate(`/dashboard/rooms/${room.id}`)}
              className="glass-card rounded-2xl p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl gradient-icon-box shrink-0 flex items-center justify-center">
                    <BedDouble className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground">
                      Kamar {room.nomor_kamar}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {room.nama_properti}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <StatusBadge status={room.status} />
                  <RoomActions room={room} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-3 border-t border-border/40">
                <div>
                  <p className="text-xs text-muted-foreground">Tipe</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {room.tipe_kamar}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Harga Sewa</p>
                  <p className="font-semibold text-foreground mt-0.5 tabular-nums">
                    Rp{room.harga_sewa.toLocaleString("id-ID")}
                  </p>
                </div>
                {room.penghuni_aktif && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Penghuni</p>
                    <p className="font-medium text-foreground mt-0.5 truncate">
                      {room.penghuni_aktif}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
          <Pagination />
        </div>
      ) : (
        /* ── Desktop Table ── */
        <div className="space-y-3">
          <div className="glass-table overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50 hover:bg-transparent">
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground pl-5 py-3">
                    Kamar
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground py-3">
                    Properti
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground py-3">
                    Tipe
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground py-3 text-right">
                    Harga Sewa
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground py-3">
                    Penghuni
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground py-3">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground py-3 pr-4 text-right">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room: Room, idx) => (
                  <TableRow
                    key={room.id}
                    className={cn(
                      "group cursor-pointer border-b border-border/30 hover:bg-primary/5 transition-colors",
                      idx % 2 === 0 ? "bg-card/50" : "bg-transparent",
                    )}
                    onClick={() => navigate(`/dashboard/rooms/${room.id}`)}
                  >
                    <TableCell className="pl-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl gradient-icon-box shrink-0 flex items-center justify-center">
                          <BedDouble className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-semibold text-sm text-foreground">
                          {room.nomor_kamar}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground max-w-[180px]">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                        <span className="truncate">{room.nama_properti}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <span className="text-sm text-foreground">
                        {room.tipe_kamar}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 text-right">
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        Rp{room.harga_sewa.toLocaleString("id-ID")}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5">
                      {room.penghuni_aktif ? (
                        <span className="text-sm text-foreground">
                          {room.penghuni_aktif}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground/50">
                          —
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5">
                      <StatusBadge status={room.status} />
                    </TableCell>
                    <TableCell className="py-3.5 pr-4 text-right">
                      <RoomActions room={room} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination />
        </div>
      )}

      {/* Room Form Dialog */}
      <RoomForm
        open={formOpen}
        onOpenChange={setFormOpen}
        room={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-base">Hapus Kamar</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Kamar <strong>{deleteTarget?.nomor_kamar}</strong> akan
                  dihapus permanen.
                </p>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setDeleteTarget(null)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={handleDelete}
              className="gap-2 rounded-xl"
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
