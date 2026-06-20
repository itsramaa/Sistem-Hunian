import { useState } from 'react';
import { useProperties, useCreateProperty, useUpdateProperty, useDeleteProperty } from '../hooks/useProperties';
import { PropertyForm } from '../components/PropertyForm';
import { Property } from '../types';
import { Button } from '@/shared/components/ui/button';
import { Plus, Loader2, Building2, Edit, Trash2, AlertTriangle, Search } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useToast } from '@/shared/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Badge } from '@/shared/components/ui/badge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { DataCard } from '@/shared/components/DataCard';
import { useIsMobile } from '@/shared/hooks/useBreakpoint';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PropertiesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const limit = 20;
  const { data, isLoading, isError, error } = useProperties(debouncedSearch, page, limit);
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  const deleteMutation = useDeleteProperty();

  const properties = data?.properties ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleCreate = async (payload: any) => {
    try { await createMutation.mutateAsync(payload); setFormOpen(false); toast({ title: 'Properti berhasil ditambahkan' }); }
    catch { toast({ variant: 'destructive', title: 'Gagal menambahkan properti' }); }
  };

  const handleUpdate = async (payload: any) => {
    if (!editing) return;
    try { await updateMutation.mutateAsync({ id: editing.id, payload }); setEditing(null); setFormOpen(false); toast({ title: 'Properti berhasil diubah' }); }
    catch { toast({ variant: 'destructive', title: 'Gagal mengubah properti' }); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteMutation.mutateAsync(deleteTarget.id); setDeleteTarget(null); toast({ title: 'Properti berhasil dihapus' }); }
    catch (err: any) { toast({ variant: 'destructive', title: err?.response?.data?.error?.message || 'Gagal menghapus properti' }); setDeleteTarget(null); }
  };

  const Pagination = () => totalPages > 1 ? (
    <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
      <span>{(page-1)*limit+1}–{Math.min(page*limit, total)} dari {total}</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" disabled={page<=1} onClick={() => setPage(p=>p-1)}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="text-xs">{page}/{totalPages}</span>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Properti</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola data properti kos Anda</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="shrink-0 gap-2 rounded-xl min-h-[44px]">
          <Plus className="h-4 w-4" /> Tambah Properti
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Cari properti..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9 rounded-xl"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Memuat properti...</span>
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-destructive text-sm">Gagal memuat data: {(error as any)?.message}</div>
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Belum ada properti"
          description="Tambah properti pertama Anda untuk mulai mengelola kos."
          action={{ label: 'Tambah Properti', onClick: () => { setEditing(null); setFormOpen(true); }, icon: Plus }}
        />
      ) : isMobile ? (
        /* Mobile: Card view */
        <div className="space-y-3">
          {properties.map((p: Property) => (
            <DataCard
              key={p.id}
              header={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{p.nama}</p>
                      <p className="text-xs text-muted-foreground">{p.jumlah_kamar ?? 0} kamar</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 min-h-[44px] min-w-[44px]"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => { setEditing(p); setFormOpen(true); }}><Edit className="h-4 w-4 mr-2" /> Ubah</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteTarget(p)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Hapus</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              }
              fields={[
                { label: 'Alamat', value: p.alamat, fullWidth: true },
                { label: 'Deskripsi', value: p.deskripsi, fullWidth: true },
              ]}
            />
          ))}
          <Pagination />
        </div>
      ) : (
        /* Desktop: Table view */
        <>
          <div className="glass-table overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
                  <TableHead className="font-semibold text-xs uppercase">Nama</TableHead>
                  <TableHead className="font-semibold text-xs uppercase">Alamat</TableHead>
                  <TableHead className="font-semibold text-xs uppercase text-center">Kamar</TableHead>
                  <TableHead className="font-semibold text-xs uppercase text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((p: Property) => (
                  <TableRow key={p.id} className="group hover:bg-primary/5 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{p.nama}</p>
                          {p.deskripsi && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{p.deskripsi}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">{p.alamat}</TableCell>
                    <TableCell className="text-center"><span className="text-sm font-medium tabular-nums">{p.jumlah_kamar ?? 0}</span></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Menu ${p.nama}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => { setEditing(p); setFormOpen(true); }}><Edit className="h-4 w-4 mr-2" /> Ubah</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(p)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Hapus</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination />
        </>
      )}

      <PropertyForm open={formOpen} onOpenChange={setFormOpen} property={editing} onSubmit={editing ? handleUpdate : handleCreate} isLoading={createMutation.isPending || updateMutation.isPending} />

      <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
              <div>
                <DialogTitle>Hapus Properti</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">Properti <strong>{deleteTarget?.nama}</strong> akan dihapus. Tidak bisa jika masih memiliki kamar.</p>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="destructive" disabled={deleteMutation.isPending} onClick={handleDelete} className="gap-2 rounded-xl">
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
