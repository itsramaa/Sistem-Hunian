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
} from "lucide-react";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useToast } from "@/shared/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Room } from "../types";
import { DataCard } from "@/shared/components/DataCard";
import { useIsMobile } from "@/shared/hooks/useBreakpoint";
import { EmptyState } from "@/shared/components/ui/EmptyState";

const statusColors: Record<string, { label: string; className: string }> = {
  available: {
    label: "Tersedia",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  dp_confirmation: {
    label: "Konfirmasi DP",
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  occupied: {
    label: "Terisi",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
};

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
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
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

  const rooms = roomsData?.rooms ?? [];
  const total = roomsData?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const properties = propsData?.properties ?? [];

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
          className="h-9 w-9 min-h-[44px] min-w-[44px]"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        <DropdownMenuItem
          onClick={() => navigate(`/dashboard/rooms/${room.id}`)}
        >
          <Eye className="h-4 w-4 mr-2" /> Lihat Detail
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate(`/dashboard/payments?room_id=${room.id}`)}
        >
          <History className="h-4 w-4 mr-2" /> Histori Pembayaran
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            setEditing(room);
            setFormOpen(true);
          }}
        >
          <Edit className="h-4 w-4 mr-2" /> Ubah
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
          <span className="text-xs tabular-nums">
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
          <h1 className="text-xl font-bold tracking-tight">Kamar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola kamar di seluruh properti
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="shrink-0 gap-2 rounded-xl min-h-[44px]"
        >
          <Plus className="h-4 w-4" /> Tambah Kamar
        </Button>
      </div>

      {/* Filters */}
      <div className="glass-filter-bar space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari nomor kamar..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 rounded-xl h-11 w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={propertyFilter}
            onValueChange={(v) => {
              setPropertyFilter(v);
              setPage(1);
              setSearchParams(v && v.trim() ? { property_id: v } : {});
            }}
          >
            <SelectTrigger className="rounded-xl h-10 w-full">
              <SelectValue placeholder="Semua properti" />
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
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="rounded-xl h-10 w-full">
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">Semua status</SelectItem>
              <SelectItem value="available">Tersedia</SelectItem>
              <SelectItem value="dp_confirmation">Konfirmasi DP</SelectItem>
              <SelectItem value="occupied">Terisi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Memuat kamar...</span>
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="Belum ada kamar"
          description="Tambah kamar untuk properti Anda."
          action={{
            label: "Tambah Kamar",
            onClick: () => {
              setEditing(null);
              setFormOpen(true);
            },
            icon: Plus,
          }}
        />
      ) : isMobile ? (
        <div className="space-y-3">
          {rooms.map((room: Room) => {
            const sc = statusColors[room.status] || {
              label: room.status,
              className: "",
            };
            return (
              <DataCard
                key={room.id}
                onClick={() => navigate(`/dashboard/rooms/${room.id}`)}
                header={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <BedDouble className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {room.nomor_kamar}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-0.5 ${sc.className}`}
                        >
                          {sc.label}
                        </span>
                      </div>
                    </div>
                    <RoomActions room={room} />
                  </div>
                }
                fields={[
                  { label: "Properti", value: room.nama_properti },
                  { label: "Tipe", value: room.tipe_kamar },
                  {
                    label: "Harga Sewa",
                    value: `Rp${room.harga_sewa.toLocaleString("id-ID")}`,
                  },
                  { label: "Penghuni", value: room.penghuni_aktif },
                ]}
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
                    Properti
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase">
                    Tipe
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase text-right">
                    Harga Sewa
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase">
                    Penghuni
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
                {rooms.map((room: Room) => {
                  const sc = statusColors[room.status] || {
                    label: room.status,
                    className: "",
                  };
                  return (
                    <TableRow
                      key={room.id}
                      className="group hover:bg-primary/5 transition-colors cursor-pointer"
                      onClick={() => navigate(`/dashboard/rooms/${room.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <BedDouble className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium text-sm">
                            {room.nomor_kamar}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {room.nama_properti}
                      </TableCell>
                      <TableCell className="text-sm">
                        {room.tipe_kamar}
                      </TableCell>
                      <TableCell className="text-sm font-medium tabular-nums text-right">
                        Rp{room.harga_sewa.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {room.penghuni_aktif || (
                          <span className="text-muted-foreground">—</span>
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
                        <RoomActions room={room} />
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

      <RoomForm
        open={formOpen}
        onOpenChange={setFormOpen}
        room={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Hapus Kamar</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Kamar <strong>{deleteTarget?.nomor_kamar}</strong> akan
                  dihapus.
                </p>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
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
              )}{" "}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
