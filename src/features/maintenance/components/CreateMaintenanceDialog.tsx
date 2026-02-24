import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMerchantProperties } from '@/features/properties/hooks/useMerchantProperties';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { CreateMerchantMaintenancePayload } from '../types';
import { MaintenancePhotoUpload } from './MaintenancePhotoUpload';

const CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Kelistrikan' },
  { value: 'structural', label: 'Struktur' },
  { value: 'appliance', label: 'Peralatan' },
  { value: 'cleaning', label: 'Kebersihan' },
  { value: 'other', label: 'Lainnya' },
];

const PRIORITIES = [
  { value: 'low', label: 'Rendah' },
  { value: 'medium', label: 'Sedang' },
  { value: 'high', label: 'Tinggi' },
  { value: 'urgent', label: 'Urgent' },
];

interface CreateMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateMerchantMaintenancePayload) => void;
  loading: boolean;
  preselectedPropertyId?: string;
  preselectedUnitId?: string;
}

export function CreateMaintenanceDialog({ open, onOpenChange, onSubmit, loading, preselectedPropertyId, preselectedUnitId }: CreateMaintenanceDialogProps) {
  const { merchant } = useAuth();
  const { properties } = useMerchantProperties(merchant?.id || '');
  const [propertyId, setPropertyId] = useState(preselectedPropertyId || '');
  const [unitId, setUnitId] = useState(preselectedUnitId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [priority, setPriority] = useState('medium');
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (preselectedPropertyId) setPropertyId(preselectedPropertyId);
  }, [preselectedPropertyId]);

  useEffect(() => {
    if (preselectedUnitId) setUnitId(preselectedUnitId);
  }, [preselectedUnitId]);

  const { data: units = [] } = useQuery({
    queryKey: ['units-for-property', propertyId],
    queryFn: async () => {
      const { data } = await supabase.from('units').select('id, unit_number').eq('property_id', propertyId).order('unit_number');
      return data || [];
    },
    enabled: !!propertyId,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitId || !title || !merchant?.id) return;
    onSubmit({
      title,
      description,
      category,
      priority,
      unit_id: unitId,
      merchant_id: merchant.id,
      images: photos.length > 0 ? photos : undefined,
    });
  };

  const resetForm = () => {
    setPropertyId('');
    setUnitId('');
    setTitle('');
    setDescription('');
    setCategory('other');
    setPriority('medium');
    setPhotos([]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Maintenance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!preselectedPropertyId && (
            <div className="space-y-1.5">
              <Label className="text-sm">Properti</Label>
              <Select value={propertyId} onValueChange={(v) => { setPropertyId(v); setUnitId(''); }}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih properti" /></SelectTrigger>
                <SelectContent>
                  {properties?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {!preselectedUnitId && (
            <div className="space-y-1.5">
              <Label className="text-sm">Unit</Label>
              <Select value={unitId} onValueChange={setUnitId} disabled={!propertyId}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih unit" /></SelectTrigger>
                <SelectContent>
                  {units.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.unit_number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm">Judul</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: AC bocor" className="rounded-xl" required />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Deskripsi</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detail masalah..." className="rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Prioritas</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <MaintenancePhotoUpload
            photos={photos}
            onChange={setPhotos}
            maxPhotos={5}
            label="Foto Masalah"
            description="Upload foto untuk membantu mendeskripsikan masalah (maks 5)"
          />

          <Button type="submit" disabled={loading || !unitId || !title} className="w-full rounded-xl gradient-cta">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Buat Maintenance
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
