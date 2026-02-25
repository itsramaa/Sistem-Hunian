import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useGuardians, useGuardiansByProperty, useCreateGuardian, useUpdateGuardian, useDeleteGuardian } from '@/features/properties/hooks/useGuardians';
import { useMerchantProperties } from '@/features/properties/hooks/useMerchantProperties';
import { GuardianFormDialog, GuardianFormData } from '@/features/properties/components/GuardianFormDialog';
import { PropertyGuardian } from '@/features/properties/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Edit, Loader2, Plus, Search, Trash2, UserCheck, Users } from 'lucide-react';
import { SALARY_FREQUENCY_OPTIONS } from '@/features/properties/constants';

interface GuardiansProps {
  propertyId?: string;
}

export default function Guardians({ propertyId }: GuardiansProps) {
  const { merchant } = useAuth();
  const merchantId = merchant?.id;

  // Use property-filtered query when propertyId is provided
  const allGuardiansQuery = useGuardians(propertyId ? undefined : merchantId);
  const propertyGuardiansQuery = useGuardiansByProperty(propertyId);
  
  const guardians = propertyId 
    ? (propertyGuardiansQuery.data || []) 
    : (allGuardiansQuery.data || []);
  const isLoading = propertyId ? propertyGuardiansQuery.isLoading : allGuardiansQuery.isLoading;

  const { properties } = useMerchantProperties(merchantId || '');
  const createMutation = useCreateGuardian();
  const updateMutation = useUpdateGuardian();
  const deleteMutation = useDeleteGuardian();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PropertyGuardian | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const handleSubmit = async (data: GuardianFormData) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...data } as any);
    } else {
      // When embedded in property context, pre-set the property_id
      const payload = propertyId 
        ? { ...data, merchant_id: merchantId!, property_id: propertyId }
        : { ...data, merchant_id: merchantId! };
      await createMutation.mutateAsync(payload as any);
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
  
  const freqLabel = (v: string) => {
    const option = SALARY_FREQUENCY_OPTIONS.find(o => o.value === v);
    if (!option) return v;
    switch(v) {
      case 'monthly': return 'Bulanan';
      case 'weekly': return 'Mingguan';
      case 'daily': return 'Harian';
      default: return option.label;
    }
  };

  const roleLabels: Record<string, string> = {
    security: 'Keamanan',
    cleaner: 'Kebersihan',
    manager: 'Manajer',
    maintenance: 'Pemeliharaan'
  };

  // Filter guardians
  const filtered = guardians.filter((g: any) => {
    const matchesSearch = !searchQuery || g.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || g.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Penjaga</h1>
          <p className="text-muted-foreground text-sm">
            {propertyId ? 'Kelola penjaga untuk properti ini' : 'Kelola data staf dan penjaga di seluruh properti Anda'}
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="rounded-xl gradient-cta text-primary-foreground shadow-md" aria-label="Tambah staf penjaga baru">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />Tambah Penjaga
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10" aria-hidden="true"><Users className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Penjaga</p>
              <p className="text-xl font-bold">{guardians.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success/10" aria-hidden="true"><UserCheck className="h-5 w-5 text-success" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Aktif</p>
              <p className="text-xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning/10" aria-hidden="true"><span className="text-warning text-lg">💰</span></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Gaji Aktif/bln</p>
              <p className="text-xl font-bold">{formatCurrency(totalSalary)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40"><CardTitle className="text-lg">Daftar Penjaga</CardTitle></CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 sm:p-0" role="search" aria-label="Filter daftar penjaga">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Cari nama penjaga..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl border-border/40 bg-card/50"
                aria-label="Cari berdasarkan nama"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[200px] rounded-xl border-border/40 bg-card/50" aria-label="Filter berdasarkan peran staf">
                <SelectValue placeholder="Semua Peran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Peran</SelectItem>
                {Object.entries(roleLabels).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12" role="status">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40 mb-3" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Memuat data penjaga...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12" role="status">
              <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" aria-hidden="true" />
              <p className="text-muted-foreground font-medium">Data tidak ditemukan.</p>
              <p className="text-sm text-muted-foreground mt-1">Coba sesuaikan pencarian atau tambah penjaga baru.</p>
            </div>
          ) : (
            <div className="overflow-x-auto" role="region" aria-label="Tabel staf penjaga">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-b-0">
                    <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Nama</TableHead>
                    {!propertyId && <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Properti</TableHead>}
                    <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Peran</TableHead>
                    <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Telepon</TableHead>
                    <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Gaji</TableHead>
                    <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Status</TableHead>
                    <TableHead className="text-right font-semibold uppercase tracking-wider text-[10px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((g: any) => (
                    <TableRow key={g.id} className="transition-colors hover:bg-primary/5 border-b border-border/30">
                      <TableCell className="font-bold text-sm">{g.name}</TableCell>
                      {!propertyId && <TableCell className="text-sm">{g.property_name || '-'}</TableCell>}
                      <TableCell className="text-sm">{roleLabels[g.role] || g.role}</TableCell>
                      <TableCell className="text-sm font-mono">{g.phone || '-'}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {formatCurrency(g.salary || 0)}
                        <span className="text-[10px] text-muted-foreground ml-1">/{freqLabel(g.salary_frequency)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={g.status === 'active' ? 'default' : 'secondary'} className="rounded-full text-[10px] font-bold uppercase tracking-tight">
                          {g.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => { setEditing(g); setFormOpen(true); }} aria-label={`Edit data ${g.name}`}>
                            <Edit className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(g.id)} aria-label={`Hapus data ${g.name}`}>
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
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
        properties={propertyId 
          ? (properties || []).filter(p => p.id === propertyId).map(p => ({ id: p.id, name: p.name }))
          : (properties || []).map(p => ({ id: p.id, name: p.name }))
        }
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
        defaultPropertyId={propertyId}
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
