import { useState } from 'react';
import { Gauge, Settings, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { MerchantLayout } from '@/shared/components/layouts/MerchantLayout';
import { UtilitySettingsForm } from '@/features/utilities/components/UtilitySettingsForm';
import { MeterReadingForm } from '@/features/utilities/components/MeterReadingForm';
import { UtilityChargeGenerator } from '@/features/utilities/components/UtilityChargeGenerator';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function UtilityBilling() {
  const { merchant } = useAuth();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  const { data: properties } = useQuery({
    queryKey: ['merchant-properties', merchant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name')
        .eq('merchant_id', merchant!.id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id,
  });

  // Auto-select first property
  if (properties && properties.length > 0 && !selectedPropertyId) {
    setSelectedPropertyId(properties[0].id);
  }

  return (
    <MerchantLayout
      title="Tagihan Utilitas"
      description="Kelola tagihan air, listrik, internet, dan biaya bersama"
    >
      <div className="space-y-4">
        {/* Property selector */}
        <div className="flex items-center gap-3">
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className="w-[250px] rounded-xl">
              <SelectValue placeholder="Pilih Properti" />
            </SelectTrigger>
            <SelectContent>
              {(properties || []).map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPropertyId && merchant?.id ? (
          <Tabs defaultValue="settings" className="space-y-4">
            <TabsList className="rounded-xl">
              <TabsTrigger value="settings" className="rounded-lg gap-1">
                <Settings className="h-4 w-4" />Pengaturan
              </TabsTrigger>
              <TabsTrigger value="meter" className="rounded-lg gap-1">
                <Gauge className="h-4 w-4" />Input Meter
              </TabsTrigger>
              <TabsTrigger value="charges" className="rounded-lg gap-1">
                <FileText className="h-4 w-4" />Tagihan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings">
              <UtilitySettingsForm propertyId={selectedPropertyId} merchantId={merchant.id} />
            </TabsContent>

            <TabsContent value="meter">
              <MeterReadingForm propertyId={selectedPropertyId} merchantId={merchant.id} />
            </TabsContent>

            <TabsContent value="charges">
              <UtilityChargeGenerator propertyId={selectedPropertyId} merchantId={merchant.id} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {!properties || properties.length === 0 ? 'Anda belum memiliki properti' : 'Pilih properti untuk memulai'}
          </div>
        )}
      </div>
    </MerchantLayout>
  );
}
