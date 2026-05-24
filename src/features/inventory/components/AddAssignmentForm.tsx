import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AddAssignmentFormProps {
  merchantId: string;
}

export function AddAssignmentForm({ merchantId }: AddAssignmentFormProps) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [facilityTypeId, setFacilityTypeId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const { data: facilityTypes = [] } = useQuery({
    queryKey: ['facility-types-intangible', merchantId],
    queryFn: async () => {
      // TODO: Go endpoint not yet implemented — was: supabase.from('facility_types').select(...)
      return [];
    },
    enabled: !!merchantId && expanded,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['merchant-properties-list', merchantId],
    queryFn: async () => {
      // TODO: Go endpoint not yet implemented — was: supabase.from('properties').select(...)
      return [];
    },
    enabled: !!merchantId && expanded,
  });

  const { data: units = [] } = useQuery({
    queryKey: ['property-units-list', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      // TODO: Go endpoint not yet implemented — was: supabase.from('units').select(...)
      return [];
    },
    enabled: !!propertyId && expanded,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      // TODO: Go endpoint not yet implemented — was: supabase.from('facility_assignments').insert(...)
      // No-op stub
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-assignments'] });
      toast.success('Assignment berhasil ditambahkan');
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetForm = () => {
    setFacilityTypeId(''); setPropertyId(''); setUnitId('');
    setCapacity(''); setNotes(''); setExpanded(false);
  };

  const inputCls = "rounded-xl bg-background/60 border-border/50";

  return (
    <div className="rounded-2xl border border-border/40 bg-card/90 backdrop-blur-sm">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors rounded-2xl"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="font-medium text-sm">Tambah Assignment (Intangible)</span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/30">
          <div className="pt-3">
            <Label className="text-xs">Tipe Fasilitas <span className="text-destructive">*</span></Label>
            <Select value={facilityTypeId} onValueChange={setFacilityTypeId}>
              <SelectTrigger className={inputCls}><SelectValue placeholder="Pilih tipe intangible..." /></SelectTrigger>
              <SelectContent>
                {facilityTypes.map((ft: any) => <SelectItem key={ft.id} value={ft.id}>{ft.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Properti</Label>
              <Select value={propertyId} onValueChange={(v) => { setPropertyId(v); setUnitId(''); }}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tidak Ditentukan —</SelectItem>
                  {properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Unit</Label>
              <Select value={unitId} onValueChange={setUnitId} disabled={!propertyId}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tidak Ditentukan —</SelectItem>
                  {units.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.unit_number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Kapasitas (Opsional)</Label>
            <Input type="number" min={0} value={capacity} onChange={e => setCapacity(e.target.value ? Number(e.target.value) : '')} placeholder="Contoh: 5 motor" className={inputCls} />
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
              Tambah Assignment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
