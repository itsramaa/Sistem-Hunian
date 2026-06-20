import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from '../hooks/useRooms';
import { useProperties } from '@/features/properties/hooks/useProperties';
import { RoomForm } from '../components/RoomForm';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/components/ui/table';
import { Plus, Loader2, Search, BedDouble, ChevronLeft, ChevronRight, Edit, Trash2, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useToast } from '@/shared/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Room } from '../types';

const statusColors: Record<string, { label: string; className: string }> = {
  available: { label: 'Tersedia', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  dp_confirmation: { label: 'Konfirmasi DP', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  occupied: { label: 'Terisi', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
};

export default function RoomsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [propertyFilter, setPropertyFilter] = useState(searchParams.get('property_id') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const { toast } = useToast();

  const limit = 20;
  const { data: roomsData, isLoading } = useRooms(debouncedSearch, page, limit, propertyFilter || undefined, statusFilter || undefined);
  const { data: propsData } = useProperties('', 1, 100);
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
      toast({ title: 'Kamar berhasil ditambahkan' });
    } catch { toast({ variant: 'destructive', title: 'Gagal menambahkan kamar' }); }
  };

  const handleUpdate = async (payload: any) => {
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({ id: editing.id, payload });
      setEditing(null); setFormOpen(false);
      toast({ title: 'Kamar berhasil diubah' });
    } catch { toast({ variant: 'destructive', title: 'Gagal mengubah kamar' }); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast({ title: 'Kamar berhasil dihapus' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: err?.response?.data?.error?.message || 'Gagal menghapus kamar' });
      setDeleteTarget(null);
    }
  };

  const openEdit = (room: Room) => { setEditing(room); setFormOpen(true); };
  const openCreate = () => { setEditing(null); setFormOpen(true); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Kamar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola kamar di seluruh properti</p>
        </div>
        <Button onClick={openCreate} className="shrink-0 gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> Tambah Kamar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari nomor kamar..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 rounded-xl h-10"
          />
        </div>
        <Select value={propertyFilter} onValueChange={(v) => { setPropertyFilter(v); setPage(1); setSearchParams(v && v.trim() ? { property_id: v } : {}); }}>
          <SelectTrigger className="w-[200px] rounded-xl h-10">
            <SelectValue placeholder="Semua properti" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Semua properti</SelectItem>
            {properties.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px] rounded-xl h-10">
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

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> <span className="text-sm">Memuat kamar...</span>
        </div>
      ) : (
        <div className="glass-table overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
                <TableHead className="font-semibold text-xs uppercase">Kamar</TableHead>
                <TableHead className="font-semibold text-xs uppercase">Properti</TableHead>
                <TableHead className="font-semibold text-xs uppercase">Tipe</TableHead>
                <TableHead className="font-semibold text-xs uppercase text-right">Harga Sewa</TableHead>
                <TableHead className="font-semibold text-xs uppercase">Penghuni</TableHead>
                <TableHead className="font-semibold text-xs uppercase">Status</TableHead>
                <TableHead className="font-semibold text-xs uppercase text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Belum ada kamar.</TableCell></TableRow>
              ) : rooms.map((room: Room) => {
                const sc = statusColors[room.status] || { label: room.status, className: '' };
                return (
                  <TableRow key={room.id} className="group hover:bg-primary/5 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <BedDouble className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-sm">{room.nomor_kamar}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{room.nama_properti}</TableCell>
                    <TableCell className="text-sm">{room.tipe_kamar}</TableCell>
                    <TableCell className="text-sm font-medium tabular-nums text-right">Rp{room.harga_sewa.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-sm">{room.penghuni_aktif || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.className}`}>
                        {sc.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => openEdit(room)}><Edit className="h-4 w-4 mr-2" /> Ubah</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(room)} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{(page-1)*limit+1}–{Math.min(page*limit, total)} dari {total}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" disabled={page <= 1} onClick={() => setPage(p => p-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs tabular-nums">{page}/{totalPages}</span>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" disabled={page >= totalPages} onClick={() => setPage(p => p+1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Form modal */}
      <RoomForm
        open={formOpen}
        onOpenChange={setFormOpen}
        room={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* ConfirmDialog hapus kamar */}
      <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Hapus Kamar</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Kamar <strong>{deleteTarget?.nomor_kamar}</strong> akan dihapus. Kamar tidak dapat dihapus jika masih terisi atau dalam konfirmasi DP.
                </p>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="destructive" disabled={deleteMutation.isPending} onClick={handleDelete} className="gap-2 rounded-xl">
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
