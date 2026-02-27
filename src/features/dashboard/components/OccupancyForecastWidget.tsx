import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Activity, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Skeleton } from '@/shared/components/ui/skeleton';

export function OccupancyForecastWidget() {
  const { user } = useAuth();

  const { data: merchant } = useQuery({
    queryKey: ['merchant-id-for-widget', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('merchants').select('id').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['merchant-analytics-widget', merchant?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('merchant_analytics_summary' as any)
        .select('occupancy_rate, occupied_units, total_units')
        .eq('merchant_id', merchant!.id)
        .single();
      return data as unknown as { occupancy_rate: number | null; occupied_units: number | null; total_units: number | null } | null;
    },
    enabled: !!merchant?.id,
    staleTime: 5 * 60 * 1000,
  });

  const currentRate = analytics?.occupancy_rate ?? 0;
  // Simple projection: slight regression toward 85% mean
  const projectedRate = Math.min(100, Math.max(0, currentRate + (85 - currentRate) * 0.05));
  const diff = projectedRate - currentRate;
  const trend = diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'stable';

  if (isLoading) {
    return (
      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
        <CardHeader className="pb-2"><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent><Skeleton className="h-20 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
          Prediksi Okupansi
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="text-xs text-primary">
          <Link to="/merchant/market-intelligence">Lihat Detail →</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Saat Ini</p>
            <p className="text-2xl font-bold">{currentRate.toFixed(0)}%</p>
            <p className="text-[10px] text-muted-foreground">
              {analytics?.occupied_units ?? 0}/{analytics?.total_units ?? 0} unit
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Bulan Depan</p>
            <p className="text-2xl font-bold">{projectedRate.toFixed(0)}%</p>
            <Badge
              variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}
              className="text-[10px] rounded-full mt-1"
            >
              {trend === 'up' && <ArrowUpRight className="h-3 w-3 mr-0.5" />}
              {trend === 'down' && <ArrowDownRight className="h-3 w-3 mr-0.5" />}
              {trend === 'stable' && <Minus className="h-3 w-3 mr-0.5" />}
              {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Target</p>
            <p className="text-2xl font-bold text-muted-foreground">85%</p>
            <Badge
              variant={currentRate >= 85 ? 'default' : 'secondary'}
              className="text-[10px] rounded-full mt-1"
            >
              {currentRate >= 85 ? '✓ Tercapai' : `${(85 - currentRate).toFixed(0)}% lagi`}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
