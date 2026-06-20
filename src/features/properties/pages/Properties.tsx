import React, { useState } from 'react';
import { useProperties, useCreateProperty, useUpdateProperty, useDeleteProperty } from '../hooks/useProperties';
import { PropertyTable } from '../components/PropertyTable';
import { PropertyForm } from '../components/PropertyForm';
import { Property } from '../types';
import { Button } from '@/shared/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useToast } from '@/shared/hooks/use-toast';

export default function PropertiesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const { toast } = useToast();

  const limit = 20;
  const { data, isLoading, isError, error } = useProperties(debouncedSearch, page, limit);
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  const deleteMutation = useDeleteProperty();

  const properties = data?.properties ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleCreate = async (payload: any) => {
    try {
      await createMutation.mutateAsync(payload);
      setFormOpen(false);
      toast({ title: 'Properti berhasil ditambahkan' });
    } catch {
      toast({ variant: 'destructive', title: 'Gagal menambahkan properti' });
    }
  };

  const handleUpdate = async (payload: any) => {
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({ id: editing.id, payload });
      setEditing(null);
      setFormOpen(false);
      toast({ title: 'Properti berhasil diubah' });
    } catch {
      toast({ variant: 'destructive', title: 'Gagal mengubah properti' });
    }
  };

  const handleDelete = async (property: Property) => {
    if (!confirm(`Hapus properti "${property.nama}"?`)) return;
    try {
      await deleteMutation.mutateAsync(property.id);
      toast({ title: 'Properti berhasil dihapus' });
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Gagal menghapus properti';
      toast({ variant: 'destructive', title: msg });
    }
  };

  const openEdit = (property: Property) => {
    setEditing(property);
    setFormOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Properti</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola data properti kos Anda
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0 gap-2 rounded-xl">
          <Plus className="h-4 w-4" />
          Tambah Properti
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Cari properti..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="max-w-sm rounded-xl"
      />

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Memuat properti...</span>
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-destructive text-sm">
          Gagal memuat data: {(error as any)?.message}
        </div>
      ) : (
        <PropertyTable
          properties={properties}
          onEdit={openEdit}
          onDelete={handleDelete}
          onManageRooms={(p) => window.open(`/dashboard/rooms?property_id=${p.id}`, '_self')}
          page={page}
          totalPages={totalPages}
          totalProperties={total}
          onPageChange={setPage}
          itemsPerPage={limit}
        />
      )}

      {/* Form Modal */}
      <PropertyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        property={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
