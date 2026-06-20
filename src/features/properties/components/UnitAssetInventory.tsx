import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/axios';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { OcrCameraButton } from '@/shared/components/OcrCameraButton';
import { Badge } from '@/shared/components/ui/badge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Card, CardContent } from '@/shared/components/ui/card';
import { toast } from 'sonner';
import { Box, Camera, Plus, ScanLine, Trash2 } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/shared/utils/utils';

interface UnitAsset {
  id: string;
  unit_id: string;
  merchant_id: string;
  asset_name: string;
  serial_number: string | null;
  brand: string | null;
  model: string | null;
  category: string;
  condition: string;
  photo_url: string | null;
  barcode_data: string | null;
  notes: string | null;
  created_at: string;
}

const CATEGORIES = [
  { value: 'electronics', label: 'Elektronik' },
  { value: 'furniture', label: 'Furnitur' },
  { value: 'appliance', label: 'Peralatan' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'lighting', label: 'Pencahayaan' },
  { value: 'other', label: 'Lainnya' },
];

const CONDITIONS = [
  { value: 'good', label: 'Baik', color: 'bg-success/10 text-success' },
  { value: 'fair', label: 'Cukup', color: 'bg-warning/10 text-warning' },
  { value: 'poor', label: 'Buruk', color: 'bg-destructive/10 text-destructive' },
  { value: 'broken', label: 'Rusak', color: 'bg-destructive/10 text-destructive' },
];

interface UnitAssetInventoryProps {
  unitId: string;
  merchantId: string;
}

export function UnitAssetInventory({ unitId, merchantId }: UnitAssetInventoryProps) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    asset_name: '',
    brand: '',
    model: '',
    serial_number: '',
    category: 'other',
    condition: 'good',
    notes: '',
  });

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['unit-assets', unitId],
    queryFn: async () => {
      const response = await apiClient.get('/unit-assets', {
        params: { unit_id: unitId, order: 'created_at', ascending: false },
      });
      return (response.data?.data || response.data || []) as UnitAsset[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (payload: Partial<UnitAsset>) => {
      await apiClient.post('/unit-assets', {
        ...payload,
        unit_id: unitId,
        merchant_id: merchantId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-assets', unitId] });
      setShowAddDialog(false);
      resetForm();
      toast.success('Aset berhasil ditambahkan');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (assetId: string) => {
      await apiClient.delete(`/unit-assets/${assetId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-assets', unitId] });
      toast.success('Aset dihapus');
    },
  });

  const resetForm = () => setFormData({ asset_name: '', brand: '', model: '', serial_number: '', category: 'other', condition: 'good', notes: '' });

  const handleOcrExtracted = (data: Record<string, any>) => {
    setFormData(prev => ({
      ...prev,
      asset_name: (data.asset_name as string) || prev.asset_name,
      brand: (data.brand as string) || prev.brand,
      model: (data.model as string) || prev.model,
      serial_number: (data.serial_number as string) || prev.serial_number,
      category: (data.category as string) || prev.category,
    }));
    setShowAddDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.asset_name) return;
    addMutation.mutate(formData);
  };

  const conditionBadge = (cond: string) => {
    const c = CONDITIONS.find(x => x.value === cond);
    return <Badge variant="secondary" className={cn("rounded-full text-xs", c?.color)}>{c?.label || cond}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <Box className="h-4 w-4 text-primary" /> Inventaris Aset ({assets.length})
        </h3>
        <div className="flex gap-2">
          <OcrCameraButton
            label="Scan Aset"
            bucket="maintenance-photos"
            edgeFunction="ocr-asset-label"
            extraPayload={{ unit_id: unitId }}
            onExtracted={handleOcrExtracted}
            icon={<ScanLine className="h-4 w-4" />}
            size="sm"
          />
          <Button size="sm" className="rounded-xl gradient-cta" onClick={() => { resetForm(); setShowAddDialog(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Tambah
          </Button>
        </div>
      </div>

      {assets.length === 0 ? (
        <EmptyState
          icon={Box}
          title="Belum ada aset tercatat"
          description="Tambahkan aset unit atau scan label/barcode untuk pendataan otomatis."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {assets.map(asset => (
            <Card key={asset.id} className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{asset.asset_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[asset.brand, asset.model].filter(Boolean).join(' • ') || 'No brand/model'}
                    </p>
                  </div>
                  {conditionBadge(asset.condition)}
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="rounded-full text-[10px] capitalize">{asset.category}</Badge>
                  {asset.serial_number && <span>SN: {asset.serial_number}</span>}
                </div>
                <div className="flex justify-end mt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive/60 hover:text-destructive"
                    onClick={() => deleteMutation.mutate(asset.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Aset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Nama Aset *</Label>
              <Input
                value={formData.asset_name}
                onChange={e => setFormData(p => ({ ...p, asset_name: e.target.value }))}
                placeholder="Contoh: AC Daikin 1PK"
                className="rounded-xl"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Merek</Label>
                <Input value={formData.brand} onChange={e => setFormData(p => ({ ...p, brand: e.target.value }))} placeholder="Daikin" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Model</Label>
                <Input value={formData.model} onChange={e => setFormData(p => ({ ...p, model: e.target.value }))} placeholder="FTV-25" className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Serial Number</Label>
              <Input value={formData.serial_number} onChange={e => setFormData(p => ({ ...p, serial_number: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Kategori</Label>
                <Select value={formData.category} onValueChange={v => setFormData(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Kondisi</Label>
                <Select value={formData.condition} onValueChange={v => setFormData(p => ({ ...p, condition: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={addMutation.isPending || !formData.asset_name} className="w-full rounded-xl gradient-cta">
              {addMutation.isPending ? 'Menyimpan...' : 'Simpan Aset'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
