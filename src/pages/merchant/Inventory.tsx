import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Loader2, Package, Search, TrendingDown, Plus, Trash2, Link2 } from 'lucide-react';
import { formatCurrency } from '@/shared/utils/currency';
import { AddAssetForm } from '@/features/inventory/components/AddAssetForm';
import { AddAssignmentForm } from '@/features/inventory/components/AddAssignmentForm';
import { AssetDetailPanel } from '@/features/inventory/components/AssetDetailPanel';
import { toast } from 'sonner';

const ASSET_TYPE_LABELS: Record<string, string> = {
  elektronik: 'Elektronik', furnitur: 'Furnitur', infrastruktur: 'Infrastruktur', lainnya: 'Lainnya',
};

const NATURE_OPTIONS = [
  { value: 'tangible', label: 'Tangible' },
  { value: 'intangible', label: 'Intangible' },
];

const CONDITION_LABELS: Record<string, string> = { good: 'Baik', damaged: 'Rusak', lost: 'Hilang' };
const STATUS_LABELS: Record<string, string> = { available: 'Tersedia', in_use: 'Dipakai', maintenance: 'Perbaikan' };

function calcDepreciation(purchasePrice: number, salvageValue: number, usefulLifeMonths: number, purchaseDate: string | null) {
  if (!purchaseDate || usefulLifeMonths <= 0) return 0;
  const monthsElapsed = Math.max(0, Math.floor((Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
  const monthlyDep = (purchasePrice - salvageValue) / usefulLifeMonths;
  return Math.min(monthsElapsed * monthlyDep, purchasePrice - salvageValue);
}

export default function Inventory() {
  const { merchant } = useAuth();
  const merchantId = merchant?.id;
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  // Inline add facility type form
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeScope, setNewTypeScope] = useState('property');
  const [newTypeNature, setNewTypeNature] = useState('tangible');
  const [newTypeAssetType, setNewTypeAssetType] = useState('lainnya');

  // Facility Types
  const { data: facilityTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: ['facility-types', merchantId],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('facility_types')
        .select('*').eq('merchant_id', merchantId).order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!merchantId,
  });

  // Assets
  const { data: assets = [], isLoading: loadingAssets } = useQuery({
    queryKey: ['assets', merchantId],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('assets')
        .select('*, facility_type:facility_types(name, asset_type, scope), property:properties(name), unit:units(unit_number)')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!merchantId,
  });

  // Assignments
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['facility-assignments', merchantId],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('facility_assignments')
        .select('*, facility_type:facility_types(name, merchant_id), property:properties(name), unit:units(unit_number)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Filter by merchant through facility_type
      return (data || []).filter((a: any) => a.facility_type?.merchant_id === merchantId);
    },
    enabled: !!merchantId,
  });

  // Add facility type mutation
  const addTypeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from as any)('facility_types').insert({
        merchant_id: merchantId,
        name: newTypeName.trim(),
        scope: newTypeScope,
        nature: newTypeNature,
        is_trackable: newTypeNature === 'tangible',
        asset_type: newTypeNature === 'tangible' ? newTypeAssetType : 'lainnya',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-types'] });
      toast.success('Tipe fasilitas ditambahkan');
      setNewTypeName(''); setShowAddType(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)('facility_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-types'] });
      toast.success('Tipe fasilitas dihapus');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Stats
  const totalAssetValue = assets.reduce((s: number, a: any) => s + (a.purchase_price || 0), 0);
  const totalDepreciation = assets.reduce((s: number, a: any) => s + calcDepreciation(a.purchase_price, a.salvage_value, a.useful_life_months, a.purchase_date), 0);

  if (selectedAsset) {
    return (
      <div className="space-y-6">
        <AssetDetailPanel asset={selectedAsset} onBack={() => setSelectedAsset(null)} />
      </div>
    );
  }

  const inputCls = "rounded-xl bg-background/60 border-border/50";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inventori & Fasilitas</h1>
        <p className="text-muted-foreground text-sm">Kelola tipe fasilitas, aset fisik, dan assignment intangible</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10"><Package className="h-5 w-5 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Tipe Fasilitas</p><p className="text-xl font-bold">{facilityTypes.length}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success/10"><span className="text-success text-lg">📦</span></div>
            <div><p className="text-sm text-muted-foreground">Total Aset</p><p className="text-xl font-bold">{assets.length}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning/10"><TrendingDown className="h-5 w-5 text-warning" /></div>
            <div><p className="text-sm text-muted-foreground">Nilai Aset</p><p className="text-xl font-bold">{formatCurrency(totalAssetValue)}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-info/10"><Link2 className="h-5 w-5 text-info" /></div>
            <div><p className="text-sm text-muted-foreground">Assignment</p><p className="text-xl font-bold">{assignments.length}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="types" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="types">Tipe Fasilitas</TabsTrigger>
          <TabsTrigger value="assets">Aset ({assets.length})</TabsTrigger>
          <TabsTrigger value="assignments">Assignment ({assignments.length})</TabsTrigger>
        </TabsList>

        {/* Tab: Tipe Fasilitas */}
        <TabsContent value="types" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{facilityTypes.length} tipe terdaftar</p>
            <Button size="sm" className="rounded-xl gradient-cta text-primary-foreground" onClick={() => setShowAddType(!showAddType)}>
              <Plus className="h-4 w-4 mr-1" />{showAddType ? 'Tutup' : 'Tambah Tipe'}
            </Button>
          </div>

          {showAddType && (
            <Card className="rounded-2xl border-border/40 bg-muted/20">
              <CardContent className="pt-4 space-y-3">
                <div>
                  <Label className="text-xs">Nama Tipe <span className="text-destructive">*</span></Label>
                  <Input value={newTypeName} onChange={e => setNewTypeName(e.target.value)} placeholder="Contoh: AC, CCTV, Parkiran..." className={inputCls} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Scope</Label>
                    <Select value={newTypeScope} onValueChange={setNewTypeScope}>
                      <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="property">Property</SelectItem>
                        <SelectItem value="unit">Unit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Sifat</Label>
                    <Select value={newTypeNature} onValueChange={setNewTypeNature}>
                      <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {NATURE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {newTypeNature === 'tangible' && (
                    <div>
                      <Label className="text-xs">Jenis Barang</Label>
                      <Select value={newTypeAssetType} onValueChange={setNewTypeAssetType}>
                        <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(ASSET_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => addTypeMutation.mutate()}
                  disabled={!newTypeName.trim() || addTypeMutation.isPending}
                  className="rounded-xl gradient-cta text-primary-foreground w-full"
                >
                  {addTypeMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Tambah Tipe
                </Button>
              </CardContent>
            </Card>
          )}

          {loadingTypes ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : facilityTypes.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">Belum ada tipe fasilitas.</p>
              <p className="text-sm text-muted-foreground mt-1">Tambah tipe baru untuk memulai.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Nama</TableHead>
                    <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Scope</TableHead>
                    <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Sifat</TableHead>
                    <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Jenis</TableHead>
                    <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Trackable</TableHead>
                    <TableHead className="font-semibold uppercase tracking-wider text-[10px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facilityTypes.map((ft: any) => (
                    <TableRow key={ft.id} className="hover:bg-primary/5">
                      <TableCell className="font-medium">{ft.name}</TableCell>
                      <TableCell><Badge variant="outline" className="rounded-full text-[10px]">{ft.scope === 'property' ? 'Property' : 'Unit'}</Badge></TableCell>
                      <TableCell><Badge variant={ft.nature === 'tangible' ? 'default' : 'secondary'} className="rounded-full text-[10px]">{ft.nature === 'tangible' ? '📦 Tangible' : '🔗 Intangible'}</Badge></TableCell>
                      <TableCell className="text-sm">{ASSET_TYPE_LABELS[ft.asset_type] || '-'}</TableCell>
                      <TableCell>{ft.is_trackable ? '✓' : '—'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTypeMutation.mutate(ft.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Tab: Aset */}
        <TabsContent value="assets" className="space-y-4 mt-4">
          <AddAssetForm merchantId={merchantId || ''} />

          <Card className="rounded-2xl bg-card/90 border-border/40 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Daftar Aset</CardTitle>
                <div className="relative w-60">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari aset..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 rounded-xl border-border/40 bg-card/50" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-4">
              {loadingAssets ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : assets.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground">Belum ada aset.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Tipe</TableHead>
                        <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Merek</TableHead>
                        <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Kondisi</TableHead>
                        <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Lokasi</TableHead>
                        <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Harga Beli</TableHead>
                        <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Nilai Buku</TableHead>
                        <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assets
                        .filter((a: any) => !searchQuery || a.facility_type?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || a.brand?.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((a: any) => {
                          const dep = calcDepreciation(a.purchase_price, a.salvage_value, a.useful_life_months, a.purchase_date);
                          const bv = Math.max(0, a.purchase_price - dep);
                          return (
                            <TableRow key={a.id} className="hover:bg-primary/5 cursor-pointer" onClick={() => setSelectedAsset(a)}>
                              <TableCell className="font-medium">{a.facility_type?.name || '-'}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{a.brand || '—'}</TableCell>
                              <TableCell><Badge variant="outline" className="rounded-full text-[10px]">{CONDITION_LABELS[a.condition] || a.condition}</Badge></TableCell>
                              <TableCell className="text-sm text-muted-foreground">{a.property?.name || '—'}{a.unit?.unit_number ? ` → ${a.unit.unit_number}` : ''}</TableCell>
                              <TableCell className="text-sm">{formatCurrency(a.purchase_price)}</TableCell>
                              <TableCell className="text-sm font-medium">{formatCurrency(bv)}</TableCell>
                              <TableCell><Badge variant="outline" className="rounded-full text-[10px]">{STATUS_LABELS[a.status] || a.status}</Badge></TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Assignments */}
        <TabsContent value="assignments" className="space-y-4 mt-4">
          <AddAssignmentForm merchantId={merchantId || ''} />

          <Card className="rounded-2xl bg-card/90 border-border/40 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40">
              <CardTitle className="text-lg">Daftar Assignment</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-4">
              {loadingAssignments ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-12">
                  <Link2 className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground">Belum ada assignment intangible.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Fasilitas</TableHead>
                        <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Properti</TableHead>
                        <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Unit</TableHead>
                        <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Kapasitas</TableHead>
                        <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Catatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((a: any) => (
                        <TableRow key={a.id} className="hover:bg-primary/5">
                          <TableCell className="font-medium">{a.facility_type?.name || '-'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{a.property?.name || '—'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{a.unit?.unit_number || '—'}</TableCell>
                          <TableCell>{a.capacity || '—'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{a.notes || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
