import { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import { useUtilitySettings, useSaveSettings } from '../hooks/useUtilityBilling';
import { type UtilitySetting } from '../services/utilityBillingService';
import { formatCurrency } from '@/shared/utils/currency';

const UTILITY_TYPES = [
  { value: 'water', label: 'Air', icon: '💧' },
  { value: 'electricity', label: 'Listrik', icon: '⚡' },
  { value: 'internet', label: 'Internet', icon: '🌐' },
  { value: 'cleaning', label: 'Kebersihan', icon: '🧹' },
  { value: 'other', label: 'Lainnya', icon: '📦' },
];

const ALLOCATION_METHODS = [
  { value: 'metered', label: 'Meteran (per pemakaian)' },
  { value: 'equal_split', label: 'Bagi rata' },
  { value: 'weighted_split', label: 'Bagi berbobot' },
  { value: 'fixed', label: 'Biaya tetap per unit' },
];

interface Props {
  propertyId: string;
  merchantId: string;
}

export function UtilitySettingsForm({ propertyId, merchantId }: Props) {
  const { data: existingSettings, isLoading } = useUtilitySettings(propertyId);
  const saveSettings = useSaveSettings();
  const [settings, setSettings] = useState<UtilitySetting[]>([]);

  useEffect(() => {
    if (existingSettings) setSettings(existingSettings);
  }, [existingSettings]);

  const addSetting = () => {
    const usedTypes = settings.map(s => s.utility_type);
    const availableType = UTILITY_TYPES.find(t => !usedTypes.includes(t.value));
    if (!availableType) return;

    setSettings(prev => [...prev, {
      merchant_id: merchantId,
      property_id: propertyId,
      utility_type: availableType.value,
      allocation_method: availableType.value === 'water' || availableType.value === 'electricity' ? 'metered' : 'equal_split',
      rate_per_unit: null,
      fixed_monthly: null,
      weight_config: null,
      is_active: true,
    }]);
  };

  const updateSetting = (index: number, updates: Partial<UtilitySetting>) => {
    setSettings(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  };

  const removeSetting = (index: number) => {
    setSettings(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    saveSettings.mutate(settings);
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Memuat pengaturan...</div>;

  return (
    <Card className="rounded-2xl border-border/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              Pengaturan Utilitas
            </CardTitle>
            <CardDescription>Konfigurasi jenis utilitas dan metode alokasi biaya</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={addSetting} size="sm" variant="outline" className="rounded-xl" disabled={settings.length >= UTILITY_TYPES.length}>
              <Plus className="h-4 w-4 mr-1" />Tambah
            </Button>
            <Button onClick={handleSave} size="sm" className="rounded-xl" disabled={saveSettings.isPending}>
              <Save className="h-4 w-4 mr-1" />{saveSettings.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Belum ada pengaturan utilitas</p>
            <Button onClick={addSetting} variant="outline" className="mt-4 rounded-xl">
              <Plus className="h-4 w-4 mr-1" />Tambah Utilitas
            </Button>
          </div>
        ) : (
          settings.map((setting, index) => {
            const typeInfo = UTILITY_TYPES.find(t => t.value === setting.utility_type);
            return (
              <div key={setting.id || index} className="p-4 rounded-xl border border-border/40 bg-card/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{typeInfo?.icon}</span>
                    <Badge variant={setting.is_active ? 'default' : 'secondary'}>{typeInfo?.label}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={setting.is_active} onCheckedChange={(v) => updateSetting(index, { is_active: v })} />
                    <Button variant="ghost" size="icon" onClick={() => removeSetting(index)} className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Metode Alokasi</Label>
                    <Select value={setting.allocation_method} onValueChange={(v) => updateSetting(index, { allocation_method: v })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ALLOCATION_METHODS.map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {setting.allocation_method === 'metered' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tarif per unit (Rp)</Label>
                      <Input type="number" value={setting.rate_per_unit || ''} onChange={(e) => updateSetting(index, { rate_per_unit: Number(e.target.value) })} placeholder="Misal: 1500" className="rounded-xl" />
                    </div>
                  )}
                  {(setting.allocation_method === 'equal_split' || setting.allocation_method === 'weighted_split' || setting.allocation_method === 'fixed') && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Biaya bulanan total (Rp)</Label>
                      <Input type="number" value={setting.fixed_monthly || ''} onChange={(e) => updateSetting(index, { fixed_monthly: Number(e.target.value) })} placeholder="Misal: 500000" className="rounded-xl" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
