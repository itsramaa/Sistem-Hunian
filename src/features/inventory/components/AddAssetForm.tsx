import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/shared/utils/currency';

const SALVAGE_WEIGHTS: Record<string, number> = {
  elektronik: 0.10,
  furnitur: 0.05,
  infrastruktur: 0.15,
  lainnya: 0.10,
};

interface AddAssetFormProps {
  merchantId: string;
}

export function AddAssetForm({ merchantId }: AddAssetFormProps) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [facilityTypeId, setFacilityTypeId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [usefulLifeMonths, setUsefulLifeMonths] = useState(60);
  const [notes, setNotes] = useState('');

  const { data: facilityTypes = [] } = useQuery({
    queryKey: ['facility-types-tangible', merchantId],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('facility_types')
        .select('id, name, asset_type, default_useful_life_months')
        .eq('merchant_id', merchantId)
        .eq('nature', 'tangible')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!merchantId && expanded,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['merchant-properties-list', merchantId],
    queryFn: async () => {
      const { data, error } = await supabase.from('properties').select('id, name').eq('merchant_id', merchantId).order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!merchantId && expanded,
  });

  const { data: units = [] } = useQuery({
    queryKey: ['property-units-list', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase.from('units').select('id, unit_number').eq('property_id', propertyId).order('unit_number');
      if (error) throw error;
      return data;
    },
    enabled: !!propertyId && expanded,
  });

  const selectedType = facilityTypes.find((ft: any) => ft.id === facilityTypeId);
  const assetType = selectedType?.asset_type || 'lainnya';
  const salvageValue = Math.round(purchasePrice * (SALVAGE_WEIGHTS[assetType] || 0.10));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from as any)('assets').insert({
        facility_type_id: facilityTypeId,
        merchant_id: merchantId,
        property_id: propertyId || null,
        unit_id: unitId || null,
        serial_number: serialNumber || null,
        brand: brand || null,
        purchase_price: purchasePrice,
        purchase_date: purchaseDate || null,
        useful_life_months: usefulLifeMonths,
        salvage_value: salvageValue,
        status: propertyId || unitId ? 'in_use' : 'available',
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Aset berhasil ditambahkan');
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetForm = () => {
    setFacilityTypeId(''); setPropertyId(''); setUnitId('');
    setSerialNumber(''); setBrand(''); setPurchasePrice(0);
    setPurchaseDate(''); setUsefulLifeMonths(60); setNotes('');
    setExpanded(false);
  };

  const inputCls = "rounded-xl bg-background/60 border-border/50";

  return (
    <div className="rounded-2xl border border-border/40 bg-card/90 backdrop-blur-sm">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors rounded-2xl"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="font-medium text-sm">Tambah Aset Baru</span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/30">
          <div className="pt-3">
            <Label className="text-xs">Tipe Fasilitas <span className="text-destructive">*</span></Label>
            <Select value={facilityTypeId} onValueChange={(v) => { setFacilityTypeId(v); const t = facilityTypes.find((ft: any) => ft.id === v); if (t?.default_useful_life_months) setUsefulLifeMonths(t.default_useful_life_months); }}>
              <SelectTrigger className={inputCls}><SelectValue placeholder="Pilih tipe..." /></SelectTrigger>
              <SelectContent>
                {facilityTypes.map((ft: any) => <SelectItem key={ft.id} value={ft.id}>{ft.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Properti (Opsional)</Label>
              <Select value={propertyId} onValueChange={(v) => { setPropertyId(v); setUnitId(''); }}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tidak Ditentukan —</SelectItem>
                  {properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Unit (Opsional)</Label>
              <Select value={unitId} onValueChange={setUnitId} disabled={!propertyId}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tidak Ditentukan —</SelectItem>
                  {units.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.unit_number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Merek</Label>
              <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Opsional" className={inputCls} />
            </div>
            <div>
              <Label className="text-xs">Serial Number</Label>
              <Input value={serialNumber} onChange={e => setSerialNumber(e.target.value)} placeholder="Opsional" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Harga Beli (Rp)</Label>
              <Input type="number" min={0} value={purchasePrice} onChange={e => setPurchasePrice(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <Label className="text-xs">Tanggal Beli</Label>
              <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Umur Pakai (bulan)</Label>
              <Input type="number" min={1} value={usefulLifeMonths} onChange={e => setUsefulLifeMonths(Number(e.target.value))} className={inputCls} />
            </div>
            <div className="rounded-xl bg-muted/50 border border-border/40 p-2">
              <p className="text-[10px] text-muted-foreground">Nilai Sisa (otomatis)</p>
              <p className="text-sm font-semibold">{formatCurrency(salvageValue)}</p>
            </div>
          </div>

          <div>
            <Label className="text-xs">Catatan</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} rows={2} />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl flex-1">Batal</Button>
            <Button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={!facilityTypeId || saveMutation.isPending}
              className="rounded-xl gradient-cta text-primary-foreground flex-1"
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Tambah Aset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
