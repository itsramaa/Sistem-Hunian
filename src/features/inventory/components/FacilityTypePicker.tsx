import { useState } from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Plus, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface FacilityType {
  id: string;
  name: string;
  scope: string;
  nature: string;
  is_trackable: boolean;
  asset_type: string;
}

interface FacilityTypePickerProps {
  selectedTypeIds: string[];
  onSelectionChange: (ids: string[]) => void;
  scope?: 'property' | 'unit';
}

const NATURE_OPTIONS = [
  { value: 'tangible', label: 'Tangible (Barang Fisik)' },
  { value: 'intangible', label: 'Intangible (Layanan/Fasilitas)' },
];

const ASSET_TYPE_OPTIONS = [
  { value: 'elektronik', label: 'Elektronik' },
  { value: 'furnitur', label: 'Furnitur' },
  { value: 'infrastruktur', label: 'Infrastruktur' },
  { value: 'lainnya', label: 'Lainnya' },
];

export function FacilityTypePicker({ selectedTypeIds, onSelectionChange, scope = 'property' }: FacilityTypePickerProps) {
  const { merchant } = useAuth();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNature, setNewNature] = useState('tangible');
  const [newAssetType, setNewAssetType] = useState('lainnya');

  const { data: facilityTypes = [], isLoading } = useQuery({
    queryKey: ['facility-types', merchant?.id, scope],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('facility_types')
        .select('id, name, scope, nature, is_trackable, asset_type')
        .eq('merchant_id', merchant!.id)
        .eq('scope', scope)
        .order('name');
      if (error) throw error;
      return data as FacilityType[];
    },
    enabled: !!merchant?.id,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from as any)('facility_types').insert({
        merchant_id: merchant!.id,
        name: newName.trim(),
        scope,
        nature: newNature,
        is_trackable: newNature === 'tangible',
        asset_type: newNature === 'tangible' ? newAssetType : 'lainnya',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-types'] });
      setNewName('');
      setShowAddForm(false);
    },
  });

  const toggleType = (id: string) => {
    onSelectionChange(
      selectedTypeIds.includes(id)
        ? selectedTypeIds.filter(t => t !== id)
        : [...selectedTypeIds, id]
    );
  };

  const sectionLabel = scope === 'property' ? 'Fasilitas Properti' : 'Fasilitas Kamar';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{sectionLabel}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-xl gap-1 text-xs h-7"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? <ChevronUp className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showAddForm ? 'Tutup' : 'Tambah Tipe'}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat...
        </div>
      ) : facilityTypes.length === 0 && !showAddForm ? (
        <p className="text-sm text-muted-foreground py-2">Belum ada tipe fasilitas. Tambahkan tipe baru.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {facilityTypes.map((ft) => (
            <Badge
              key={ft.id}
              variant={selectedTypeIds.includes(ft.id) ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer transition-all duration-200 rounded-full px-3 py-1",
                selectedTypeIds.includes(ft.id)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background/60 border-border/50 hover:border-primary/40 hover:bg-primary/5"
              )}
              onClick={() => toggleType(ft.id)}
            >
              {ft.name}
              <span className="ml-1 text-[10px] opacity-60">
                {ft.nature === 'tangible' ? '📦' : '🔗'}
              </span>
            </Badge>
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="rounded-xl border border-border/40 p-3 space-y-3 bg-muted/20">
          <div>
            <Label className="text-xs">Nama Tipe Fasilitas</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Contoh: AC, CCTV, Parkiran..."
              className="rounded-xl bg-background/60 border-border/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Sifat</Label>
              <Select value={newNature} onValueChange={setNewNature}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NATURE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {newNature === 'tangible' && (
              <div>
                <Label className="text-xs">Jenis Barang</Label>
                <Select value={newAssetType} onValueChange={setNewAssetType}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            className="rounded-xl gradient-cta text-primary-foreground w-full"
            disabled={!newName.trim() || addMutation.isPending}
            onClick={() => addMutation.mutate()}
          >
            {addMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            Tambah Tipe
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">Klik badge untuk memilih/batal pilih tipe fasilitas</p>
    </div>
  );
}
