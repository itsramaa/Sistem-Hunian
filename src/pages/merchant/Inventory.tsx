import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Loader2, Package, Plus, Search, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/shared/utils/currency';
import { FacilityManagementDialog } from '@/features/properties/components/FacilityManagementDialog';

interface Facility {
  id: string;
  name: string;
  category: string;
  asset_type: string;
  purchase_price: number;
  purchase_date: string | null;
  useful_life_months: number;
  salvage_value: number;
  brand: string | null;
  notes: string | null;
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  elektronik: 'Elektronik',
  furnitur: 'Furnitur',
  infrastruktur: 'Infrastruktur',
  lainnya: 'Lainnya',
};

function calcDepreciation(f: Facility) {
  if (!f.purchase_date || f.useful_life_months <= 0) return 0;
  const monthsElapsed = Math.max(0, Math.floor((Date.now() - new Date(f.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
  const monthlyDep = (f.purchase_price - f.salvage_value) / f.useful_life_months;
  return Math.min(monthsElapsed * monthlyDep, f.purchase_price - f.salvage_value);
}

export default function Inventory() {
  const { merchant } = useAuth();
  const merchantId = merchant?.id;
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [assetTypeFilter, setAssetTypeFilter] = useState('all');
  const [showManageDialog, setShowManageDialog] = useState(false);

  const { data: facilities = [], isLoading } = useQuery({
    queryKey: ['facilities', merchantId],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('facilities')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('name');
      if (error) throw error;
      return data as Facility[];
    },
    enabled: !!merchantId,
  });

  const filtered = facilities.filter(f => {
    const matchesSearch = !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || f.category === categoryFilter;
    const matchesAssetType = assetTypeFilter === 'all' || f.asset_type === assetTypeFilter;
    return matchesSearch && matchesCategory && matchesAssetType;
  });

  const totalItems = facilities.length;
  const totalAssetValue = facilities.reduce((sum, f) => sum + (f.purchase_price || 0), 0);
  const totalDepreciation = facilities.reduce((sum, f) => sum + calcDepreciation(f), 0);
  const totalBookValue = totalAssetValue - totalDepreciation;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventori & Fasilitas</h1>
          <p className="text-muted-foreground text-sm">Kelola semua aset fasilitas properti dan unit Anda</p>
        </div>
        <Button onClick={() => setShowManageDialog(true)} className="rounded-xl gradient-cta text-primary-foreground shadow-md">
          <Plus className="h-4 w-4 mr-2" />Tambah Fasilitas
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10"><Package className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Item</p>
              <p className="text-xl font-bold">{totalItems}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success/10"><span className="text-success text-lg">💰</span></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Nilai Aset</p>
              <p className="text-xl font-bold">{formatCurrency(totalAssetValue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning/10"><TrendingDown className="h-5 w-5 text-warning" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Depresiasi</p>
              <p className="text-xl font-bold">{formatCurrency(totalDepreciation)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-info/10"><span className="text-info text-lg">📊</span></div>
            <div>
              <p className="text-sm text-muted-foreground">Nilai Buku</p>
              <p className="text-xl font-bold">{formatCurrency(Math.max(0, totalBookValue))}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40">
          <CardTitle className="text-lg">Daftar Fasilitas</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 sm:p-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari nama/merek..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 rounded-xl border-border/40 bg-card/50" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[160px] rounded-xl border-border/40 bg-card/50"><SelectValue placeholder="Kategori" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="umum">Umum (Properti)</SelectItem>
                <SelectItem value="unit">Unit (Kamar)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={assetTypeFilter} onValueChange={setAssetTypeFilter}>
              <SelectTrigger className="w-full sm:w-[160px] rounded-xl border-border/40 bg-card/50"><SelectValue placeholder="Jenis Barang" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                {Object.entries(ASSET_TYPE_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40 mb-3" />
              <p className="text-sm text-muted-foreground">Memuat data inventori...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">Data tidak ditemukan.</p>
              <p className="text-sm text-muted-foreground mt-1">Tambah fasilitas baru atau sesuaikan filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-b-0">
                    <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Nama</TableHead>
                    <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Kategori</TableHead>
                    <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Jenis</TableHead>
                    <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Merek</TableHead>
                    <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Harga Beli</TableHead>
                    <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Nilai Buku</TableHead>
                    <TableHead className="font-semibold uppercase tracking-wider text-[10px]">Nilai Sisa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(f => {
                    const dep = calcDepreciation(f);
                    const bookValue = Math.max(0, f.purchase_price - dep);
                    return (
                      <TableRow key={f.id} className="transition-colors hover:bg-primary/5 border-b border-border/30">
                        <TableCell className="font-medium text-sm">{f.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-full text-[10px]">
                            {f.category === 'umum' ? 'Umum' : 'Unit'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{ASSET_TYPE_LABELS[f.asset_type] || f.asset_type}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{f.brand || '-'}</TableCell>
                        <TableCell className="text-sm">{formatCurrency(f.purchase_price)}</TableCell>
                        <TableCell className="text-sm font-medium">{formatCurrency(bookValue)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatCurrency(f.salvage_value)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {merchantId && (
        <FacilityManagementDialog
          open={showManageDialog}
          onOpenChange={setShowManageDialog}
          merchantId={merchantId}
        />
      )}
    </div>
  );
}
