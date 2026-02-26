import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicantId: string | null;
  onSubmit: (applicantId: string, unitId: string) => void;
  loading?: boolean;
}

export function SendOfferDialog({ open, onOpenChange, applicantId, onSubmit, loading }: Props) {
  const { merchant } = useAuth();
  const [unitId, setUnitId] = useState('');

  const { data: units } = useQuery({
    queryKey: ['available-units', merchant?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('units')
        .select('id, unit_number, property_id, properties(name)')
        .eq('status', 'available')
        .order('unit_number');
      return data || [];
    },
    enabled: open && !!merchant?.id,
  });

  const handleSubmit = () => {
    if (applicantId && unitId) {
      onSubmit(applicantId, unitId);
      setUnitId('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Kirim Penawaran</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Pilih Unit Tersedia</Label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger><SelectValue placeholder="Pilih unit..." /></SelectTrigger>
              <SelectContent>
                {(units || []).map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.unit_number} — {u.properties?.name || 'N/A'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {units?.length === 0 && <p className="text-sm text-muted-foreground mt-1">Tidak ada unit tersedia</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!unitId || loading}>Kirim Penawaran</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
