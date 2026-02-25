import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Loader2, Plus, Pencil, Trash2, Package } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/shared/utils/currency';

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

interface FacilityManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchantId: string;
  categoryFilter?: 'umum' | 'unit';
}

const ASSET_TYPE_OPTIONS = [
  { value: 'elektronik', label: 'Elektronik (AC, TV, Water Heater)' },
  { value: 'furnitur', label: 'Furnitur (Lemari, Meja, Kursi)' },
  { value: 'infrastruktur', label: 'Infrastruktur (CCTV, Pompa Air)' },
  { value: 'lainnya', label: 'Lainnya' },
];

const SALVAGE_VALUE_WEIGHTS: Record<string, number> = {
  elektronik: 0.10,
  furnitur: 0.05,
  infrastruktur: 0.15,
  lainnya: 0.10,
};

function calcSalvageValue(purchasePrice: number, assetType: string): number {
  const weight = SALVAGE_VALUE_WEIGHTS[assetType] || 0.10;
  return Math.round(purchasePrice * weight);
}

export function FacilityManagementDialog({ open, onOpenChange, merchantId, categoryFilter }: FacilityManagementDialogProps) {
  const queryClient = useQueryClient();
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(categoryFilter || 'umum');
  const [assetType, setAssetType] = useState('lainnya');
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [usefulLifeMonths, setUsefulLifeMonths] = useState(60);
  const [brand, setBrand] = useState('');
  const [notes, setNotes] = useState('');

  const computedSalvageValue = calcSalvageValue(purchasePrice, assetType);

  const { data: facilities = [], isLoading } = useQuery({
    queryKey: ['facilities', merchantId, categoryFilter],
    queryFn: async () => {
      let query = (supabase.from as any)('facilities').select('*').eq('merchant_id', merchantId).order('name');
      if (categoryFilter) query = query.eq('category', categoryFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data as Facility[];
    },
    enabled: !!merchantId && open,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Facility> & { merchant_id: string }) => {
      if (editingFacility) {
        const { error } = await (supabase.from as any)('facilities').update(data).eq('id', editingFacility.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from as any)('facilities').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities', merchantId] });
      toast.success(editingFacility ? 'Fasilitas diperbarui' : 'Fasilitas ditambahkan');
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)('facilities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities', merchantId] });
      toast.success('Fasilitas dihapus');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetForm = () => {
    setName(''); setCategory(categoryFilter || 'umum'); setAssetType('lainnya');
    setPurchasePrice(0); setPurchaseDate(''); setUsefulLifeMonths(60);
    setBrand(''); setNotes('');
    setEditingFacility(null); setShowForm(false);
  };

  const startEdit = (f: Facility) => {
    setEditingFacility(f);
    setName(f.name); setCategory(f.category); setAssetType(f.asset_type || 'lainnya');
    setPurchasePrice(f.purchase_price); setPurchaseDate(f.purchase_date || '');
    setUsefulLifeMonths(f.useful_life_months); setBrand(f.brand || ''); setNotes(f.notes || '');
    setShowForm(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    saveMutation.mutate({
      merchant_id: merchantId,
      name: name.trim(),
      category,
      asset_type: assetType,
      purchase_price: purchasePrice,
      purchase_date: purchaseDate || null,
      useful_life_months: usefulLifeMonths,
      salvage_value: computedSalvageValue,
      brand: brand || null,
      notes: notes || null,
    });
  };

  const calcDepreciation = (f: Facility) => {
    if (!f.purchase_date || f.useful_life_months <= 0) return 0;
    const monthsElapsed = Math.max(0, Math.floor((Date.now() - new Date(f.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
    const monthlyDep = (f.purchase_price - f.salvage_value) / f.useful_life_months;
    return Math.min(monthsElapsed * monthlyDep, f.purchase_price - f.salvage_value);
  };

  const assetTypeLabel = (v: string) => ASSET_TYPE_OPTIONS.find(o => o.value === v)?.label?.split(' (')[0] || v;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg w-[95vw] rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Kelola Fasilitas {categoryFilter === 'umum' ? 'Umum' : categoryFilter === 'unit' ? 'Unit' : ''}
          </DialogTitle>
        </DialogHeader>

        {showForm ? (
          <div className="space-y-3">
            <div>
              <Label>Nama Fasilitas <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: AC Daikin 1PK" className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {!categoryFilter && (
                <div>
                  <Label>Tipe</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="umum">Umum (Properti)</SelectItem>
                      <SelectItem value="unit">Unit (Kamar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Jenis Barang</Label>
                <Select value={assetType} onValueChange={setAssetType}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Merek</Label>
                <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Opsional" className="rounded-xl" />
              </div>
              <div>
                <Label>Tanggal Beli</Label>
                <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Harga Beli (Rp)</Label>
                <Input type="number" min={0} value={purchasePrice} onChange={e => setPurchasePrice(Number(e.target.value))} className="rounded-xl" />
              </div>
              <div>
                <Label>Umur Pakai (bulan)</Label>
                <Input type="number" min={1} value={usefulLifeMonths} onChange={e => setUsefulLifeMonths(Number(e.target.value))} className="rounded-xl" />
              </div>
            </div>
            {/* Auto-calculated salvage value display */}
            <div className="rounded-xl bg-muted/50 border border-border/40 p-3">
              <p className="text-xs text-muted-foreground mb-1">Nilai Sisa (otomatis berdasarkan jenis barang)</p>
              <p className="text-sm font-semibold">{formatCurrency(computedSalvageValue)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {assetTypeLabel(assetType)}: {(SALVAGE_VALUE_WEIGHTS[assetType] || 0.10) * 100}% dari harga beli
              </p>
            </div>
            <div>
              <Label>Catatan</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="rounded-xl" rows={2} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={resetForm} className="rounded-xl flex-1">Batal</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending || !name.trim()} className="rounded-xl gradient-cta text-primary-foreground flex-1">
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingFacility ? 'Simpan' : 'Tambah'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Button onClick={() => setShowForm(true)} className="w-full rounded-xl gradient-cta text-primary-foreground gap-2">
              <Plus className="h-4 w-4" /> Tambah Fasilitas Baru
            </Button>

            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : facilities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Belum ada fasilitas</div>
            ) : (
              facilities.map(f => {
                const dep = calcDepreciation(f);
                const bookValue = f.purchase_price - dep;
                return (
                  <Card key={f.id} className="rounded-xl border-border/40">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">{f.name}</span>
                            <Badge variant="outline" className="rounded-full text-[10px] shrink-0">
                              {f.category === 'umum' ? 'Umum' : 'Unit'}
                            </Badge>
                            {f.asset_type && f.asset_type !== 'lainnya' && (
                              <Badge variant="secondary" className="rounded-full text-[10px] shrink-0">
                                {assetTypeLabel(f.asset_type)}
                              </Badge>
                            )}
                          </div>
                          {f.brand && <p className="text-xs text-muted-foreground">{f.brand}</p>}
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>Beli: {formatCurrency(f.purchase_price)}</span>
                            {f.purchase_date && <span>Nilai Buku: {formatCurrency(Math.max(0, bookValue))}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => startEdit(f)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive" onClick={() => deleteMutation.mutate(f.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
