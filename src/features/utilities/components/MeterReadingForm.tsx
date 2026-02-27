import { useState, useEffect } from 'react';
import { Gauge, Save } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { useSubmitReadings, useLastReadings, useUtilitySettings } from '../hooks/useUtilityBilling';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { MeterReading } from '../services/utilityBillingService';

interface Props {
  propertyId: string;
  merchantId: string;
}

export function MeterReadingForm({ propertyId, merchantId }: Props) {
  const [utilityType, setUtilityType] = useState<string>('water');
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: settings } = useUtilitySettings(propertyId);
  const { data: lastReadings } = useLastReadings(propertyId, utilityType);
  const submitReadings = useSubmitReadings();

  // Get active metered utility types
  const meteredTypes = (settings || []).filter(s => s.allocation_method === 'metered' && s.is_active);

  // Get occupied units
  const { data: occupiedUnits } = useQuery({
    queryKey: ['occupied-units', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('id, unit_number')
        .eq('property_id', propertyId)
        .eq('status', 'occupied')
        .order('unit_number');
      if (error) throw error;
      return data;
    },
    enabled: !!propertyId,
  });

  const [readings, setReadings] = useState<Record<string, { previous: number; current: number }>>({});

  useEffect(() => {
    if (occupiedUnits && lastReadings) {
      const initial: Record<string, { previous: number; current: number }> = {};
      for (const unit of occupiedUnits) {
        const last = lastReadings.get(unit.id);
        initial[unit.id] = {
          previous: last?.current_reading || 0,
          current: last?.current_reading || 0,
        };
      }
      setReadings(initial);
    }
  }, [occupiedUnits, lastReadings]);

  const currentSetting = meteredTypes.find(s => s.utility_type === utilityType);

  const handleSubmit = () => {
    if (!occupiedUnits || !currentSetting) return;

    const meterReadings: MeterReading[] = occupiedUnits
      .filter(unit => {
        const r = readings[unit.id];
        return r && r.current >= r.previous;
      })
      .map(unit => ({
        merchant_id: merchantId,
        property_id: propertyId,
        unit_id: unit.id,
        utility_type: utilityType,
        reading_date: `${period}-01`,
        previous_reading: readings[unit.id].previous,
        current_reading: readings[unit.id].current,
        rate_per_unit: currentSetting.rate_per_unit || 0,
      }));

    if (meterReadings.length === 0) return;
    submitReadings.mutate(meterReadings);
  };

  const unitLabel = utilityType === 'water' ? 'm³' : 'kWh';

  if (meteredTypes.length === 0) {
    return (
      <Card className="rounded-2xl border-border/40">
        <CardContent className="py-8 text-center text-muted-foreground">
          Tidak ada utilitas meteran yang aktif. Tambahkan di tab Pengaturan terlebih dahulu.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/40">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                <Gauge className="h-5 w-5 text-primary" />
              </div>
              Input Meter
            </CardTitle>
            <CardDescription>Catat pembacaan meter untuk unit yang terisi</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={utilityType} onValueChange={setUtilityType}>
              <SelectTrigger className="w-[140px] rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {meteredTypes.map(s => (
                  <SelectItem key={s.utility_type} value={s.utility_type}>
                    {s.utility_type === 'water' ? '💧 Air' : '⚡ Listrik'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-[160px] rounded-xl" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!occupiedUnits || occupiedUnits.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">Tidak ada unit terisi</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground px-2">
              <span>Unit</span>
              <span>Meter Sebelumnya</span>
              <span>Meter Sekarang</span>
              <span>Pemakaian ({unitLabel})</span>
            </div>
            {occupiedUnits.map(unit => {
              const r = readings[unit.id] || { previous: 0, current: 0 };
              const usage = Math.max(0, r.current - r.previous);
              const isValid = r.current >= r.previous;
              return (
                <div key={unit.id} className="grid grid-cols-4 gap-2 items-center p-2 rounded-xl bg-card/60 border border-border/30">
                  <Badge variant="outline" className="w-fit">{unit.unit_number}</Badge>
                  <Input
                    type="number"
                    value={r.previous}
                    onChange={(e) => setReadings(prev => ({ ...prev, [unit.id]: { ...prev[unit.id], previous: Number(e.target.value) } }))}
                    className="rounded-lg h-9 text-sm"
                  />
                  <Input
                    type="number"
                    value={r.current}
                    onChange={(e) => setReadings(prev => ({ ...prev, [unit.id]: { ...prev[unit.id], current: Number(e.target.value) } }))}
                    className={`rounded-lg h-9 text-sm ${!isValid ? 'border-destructive' : ''}`}
                  />
                  <span className={`text-sm font-medium ${!isValid ? 'text-destructive' : ''}`}>
                    {isValid ? `${usage} ${unitLabel}` : 'Invalid'}
                  </span>
                </div>
              );
            })}
            <div className="flex justify-end pt-2">
              <Button onClick={handleSubmit} disabled={submitReadings.isPending} className="rounded-xl">
                <Save className="h-4 w-4 mr-1" />
                {submitReadings.isPending ? 'Menyimpan...' : 'Simpan Pembacaan'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
