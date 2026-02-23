import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useGuardians, useCreateGuardian, useUpdateGuardian, useDeleteGuardian } from '@/features/properties/hooks/useGuardians';
import { useMerchantProperties } from '@/features/properties/hooks/useMerchantProperties';
import { GuardianFormDialog, GuardianFormData } from '@/features/properties/components/GuardianFormDialog';
import { PropertyGuardian } from '@/features/properties/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { Edit, Loader2, Plus, Trash2, UserCheck, Users } from 'lucide-react';
import { SALARY_FREQUENCY_OPTIONS } from '@/features/properties/constants';

export default function Guardians() {
  const { merchant } = useAuth();
  const merchantId = merchant?.id;
  const { data: guardians = [], isLoading } = useGuardians(merchantId);
  const { properties } = useMerchantProperties(merchantId || '');
  const createMutation = useCreateGuardian();
  const updateMutation = useUpdateGuardian();
  const deleteMutation = useDeleteGuardian();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PropertyGuardian | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSubmit = async (data: GuardianFormData) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...data } as any);
    } else {
      await createMutation.mutateAsync({ ...data, merchant_id: merchantId! } as any);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const activeCount = guardians.filter((g: any) => g.status === 'active').length;
  const totalSalary = guardians
    .filter((g: any) => g.status === 'active')
    .reduce((sum: number, g: any) => sum + (g.salary || 0), 0);

  const formatCurrency = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
  const freqLabel = (v: string) => SALARY_FREQUENCY_OPTIONS.find(o => o.value === v)?.label || v;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Penjaga</h1>
          <p className="text-muted-foreground text-sm">Kelola data penjaga seluruh properti Anda</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="rounded-xl gradient-cta text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />Tambah Penjaga
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Penjaga</p>
              <p className="text-xl font-bold">{guardians.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success/10"><UserCheck className="h-5 w-5 text-success" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Aktif</p>
              <p className="text-xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning/10"><span className="text-warning text-lg">💰</span></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Gaji Aktif/bln</p>
              <p className="text-xl font-bold">{formatCurrency(totalSalary)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-lg">Daftar Penjaga</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : guardians.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Belum ada penjaga. Klik "Tambah Penjaga" untuk memulai.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Properti</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Gaji</TableHead>
                    <TableHead>Frekuensi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guardians.map((g: any) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.name}</TableCell>
                      <TableCell>{g.property_name || '-'}</TableCell>
                      <TableCell>{g.phone || '-'}</TableCell>
                      <TableCell>{formatCurrency(g.salary || 0)}</TableCell>
                      <TableCell>{freqLabel(g.salary_frequency)}</TableCell>
                      <TableCell>
                        <Badge variant={g.status === 'active' ? 'default' : 'secondary'} className="rounded-full">
                          {g.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" onClick={() => { setEditing(g); setFormOpen(true); }}><Edit className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(g.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <GuardianFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        guardian={editing}
        properties={(properties || []).map(p => ({ id: p.id, name: p.name }))}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Penjaga?</AlertDialogTitle>
            <AlertDialogDescription>Data penjaga akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
