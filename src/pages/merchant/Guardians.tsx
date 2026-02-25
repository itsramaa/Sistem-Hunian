import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useGuardians, useGuardiansByProperty, useCreateGuardian, useUpdateGuardian, useDeleteGuardian, useGuardianAssignments, useAssignGuardianToProperty, useRemoveGuardianAssignment } from '@/features/properties/hooks/useGuardians';
import { useMerchantProperties } from '@/features/properties/hooks/useMerchantProperties';
import { GuardianFormDialog, GuardianFormData } from '@/features/properties/components/GuardianFormDialog';
import { PropertyGuardian } from '@/features/properties/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Building2, Edit, Loader2, MapPin, Plus, Search, Trash2, UserCheck, Users, X } from 'lucide-react';
import { SALARY_FREQUENCY_OPTIONS } from '@/features/properties/constants';

interface GuardiansProps {
  propertyId?: string;
}

export default function Guardians({ propertyId }: GuardiansProps) {
  const { merchant } = useAuth();
  const merchantId = merchant?.id;

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
  const assignMutation = useAssignGuardianToProperty();
  const removeAssignmentMutation = useRemoveGuardianAssignment();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PropertyGuardian | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Assign dialog state
  const [assignGuardian, setAssignGuardian] = useState<PropertyGuardian | null>(null);
  const [assignPropertyId, setAssignPropertyId] = useState('');
  const [assignRole, setAssignRole] = useState('primary');

  const assignmentsQuery = useGuardianAssignments(assignGuardian?.id);

  const handleSubmit = async (data: GuardianFormData) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...data } as any);
    } else {
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

  const handleAssign = async () => {
    if (!assignGuardian || !assignPropertyId) return;
    await assignMutation.mutateAsync({ guardianId: assignGuardian.id, propertyId: assignPropertyId, role: assignRole });
    setAssignPropertyId('');
    setAssignRole('primary');
  };

  const activeCount = guardians.filter((g: any) => g.status === 'active').length;
  const totalSalary = guardians
    .filter((g: any) => g.status === 'active')
    .reduce((sum: number, g: any) => sum + (g.salary || 0), 0);

  const formatCurrency = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
  
  const freqLabel = (v: string) => {
    switch(v) {
      case 'monthly': return 'Bulanan';
      case 'weekly': return 'Mingguan';
      case 'daily': return 'Harian';
      default: return v;
    }
  };

  const roleLabels: Record<string, string> = {
    security: 'Keamanan',
    cleaner: 'Kebersihan',
    manager: 'Manajer',
    maintenance: 'Pemeliharaan'
  };

  const filtered = guardians.filter((g: any) => {
    const matchesSearch = !searchQuery || g.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || g.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Properties available for assignment (exclude already assigned)
  const assignedPropertyIds = (assignmentsQuery.data || []).map((a: any) => a.property_id);
  const availableProperties = (properties || []).filter(p => !assignedPropertyIds.includes(p.id) && p.id !== assignGuardian?.property_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Penjaga</h1>
          <p className="text-muted-foreground text-sm">
            {propertyId ? 'Kelola penjaga untuk properti ini' : 'Kelola data staf dan penjaga di seluruh properti Anda'}
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="rounded-xl gradient-cta text-primary-foreground shadow-md">
          <Plus className="h-4 w-4 mr-2" />Tambah Penjaga
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Penjaga</p>
              <p className="text-xl font-bold">{guardians.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success/10"><UserCheck className="h-5 w-5 text-success" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Aktif</p>
              <p className="text-xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
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
      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40"><CardTitle className="text-lg">Daftar Penjaga</CardTitle></CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 sm:p-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari nama penjaga..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 rounded-xl border-border/40 bg-card/50" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[200px] rounded-xl border-border/40 bg-card/50"><SelectValue placeholder="Semua Peran" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Peran</SelectItem>
                {Object.entries(roleLabels).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40 mb-3" />
              <p className="text-sm text-muted-foreground">Memuat data penjaga...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">Data tidak ditemukan.</p>
              <p className="text-sm text-muted-foreground mt-1">Coba sesuaikan pencarian atau tambah penjaga baru.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-info/10 hover:text-info" onClick={() => setAssignGuardian(g)} title="Assign ke properti">
                            <Building2 className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => { setEditing(g); setFormOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(g.id)}>
                            <Trash2 className="h-4 w-4" />
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

      {/* Assign Dialog */}
      <Dialog open={!!assignGuardian} onOpenChange={(o) => { if (!o) { setAssignGuardian(null); setAssignPropertyId(''); } }}>
        <DialogContent className="max-w-md w-[95vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Assign {assignGuardian?.name} ke Properti
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current assignments */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Properti saat ini:</Label>
              <div className="space-y-2">
                {assignGuardian?.property_id && (
                  <div className="flex items-center gap-2 text-sm rounded-lg bg-muted/50 p-2">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="flex-1">{(assignGuardian as any).property_name || 'Properti Utama'}</span>
                    <Badge variant="outline" className="rounded-full text-[10px]">Utama</Badge>
                  </div>
                )}
                {assignmentsQuery.isLoading ? (
                  <div className="flex items-center gap-2 py-2"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm text-muted-foreground">Memuat...</span></div>
                ) : (assignmentsQuery.data || []).map((a: any) => (
                  <div key={a.id} className="flex items-center gap-2 text-sm rounded-lg bg-muted/50 p-2">
                    <MapPin className="h-3.5 w-3.5 text-info shrink-0" />
                    <span className="flex-1">{a.properties?.name || '-'}</span>
                    <Badge variant="outline" className="rounded-full text-[10px]">{a.role === 'backup' ? 'Cadangan' : 'Utama'}</Badge>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeAssignmentMutation.mutate(a.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add new assignment */}
            {availableProperties.length > 0 ? (
              <div className="space-y-3 pt-2 border-t">
                <div>
                  <Label>Properti Baru</Label>
                  <Select value={assignPropertyId} onValueChange={setAssignPropertyId}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih properti..." /></SelectTrigger>
                    <SelectContent>
                      {availableProperties.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Peran</Label>
                  <Select value={assignRole} onValueChange={setAssignRole}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Utama</SelectItem>
                      <SelectItem value="backup">Cadangan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">Semua properti sudah di-assign.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignGuardian(null)} className="rounded-xl">Tutup</Button>
            {availableProperties.length > 0 && (
              <Button onClick={handleAssign} disabled={!assignPropertyId || assignMutation.isPending} className="rounded-xl gradient-cta text-primary-foreground">
                {assignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Assign
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
