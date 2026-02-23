import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Loader2, Building2, Wrench } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function AssignedProperties() {
  const { vendor } = useAuth();

  const { data: services, isLoading } = useQuery({
    queryKey: ['vendor-assigned-services', vendor?.id],
    queryFn: async () => {
      if (!vendor?.id) return [];
      const { data, error } = await supabase
        .from('property_vendor_services')
        .select('*, properties(name, address, city)')
        .eq('vendor_id', vendor.id)
        .eq('status', 'active');
      if (error) throw error;
      return data || [];
    },
    enabled: !!vendor?.id,
  });

  if (isLoading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Properti Assigned</h1>
        <p className="text-muted-foreground">Properti yang menggunakan jasa Anda</p>
      </div>

      {!services?.length ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Building2 className="h-12 w-12 mb-4 opacity-40" />
            <p className="text-lg font-medium">Belum ada properti yang assign jasa Anda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((s: any) => (
            <Card key={s.id} className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  {s.properties?.name || 'Unknown'}
                </CardTitle>
                <CardDescription>{s.properties?.address || s.properties?.city || '-'}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm capitalize">{s.service_type}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">Rp {(s.monthly_fee || 0).toLocaleString('id-ID')}/bln</p>
                  <Badge variant="outline" className="text-success border-success/30">{s.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
