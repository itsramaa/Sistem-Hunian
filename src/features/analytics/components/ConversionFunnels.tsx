import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { TrendingDown, TrendingUp, Users, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { subDays, subMonths, format } from 'date-fns';

interface FunnelStep {
  name: string;
  eventType: string;
  count: number;
  percentage: number;
  dropoff: number;
}

interface ConversionFunnelProps {
  funnelType: 'payment' | 'order' | 'registration' | 'maintenance';
}

const FUNNEL_CONFIGS = {
  payment: {
    title: 'Payment Funnel',
    description: 'Konversi dari invoice hingga pembayaran',
    steps: [
      { name: 'Invoice Dilihat', eventType: 'page_view', filter: { path: '/invoices' } },
      { name: 'Payment Dimulai', eventType: 'payment_initiated' },
      { name: 'Payment Selesai', eventType: 'payment_completed' },
    ],
  },
  order: {
    title: 'Order Funnel',
    description: 'Konversi dari browse hingga order',
    steps: [
      { name: 'Marketplace Dilihat', eventType: 'page_view', filter: { path: '/marketplace' } },
      { name: 'Produk Dilihat', eventType: 'page_view', filter: { path: '/vendor/' } },
      { name: 'Order Dibuat', eventType: 'order_placed' },
      { name: 'Order Selesai', eventType: 'order_completed' },
    ],
  },
  registration: {
    title: 'Registration Funnel',
    description: 'Konversi dari signup hingga aktivasi',
    steps: [
      { name: 'Halaman Auth', eventType: 'page_view', filter: { path: '/auth' } },
      { name: 'Signup', eventType: 'signup' },
      { name: 'Login Pertama', eventType: 'login' },
    ],
  },
  maintenance: {
    title: 'Maintenance Funnel',
    description: 'Konversi permintaan maintenance',
    steps: [
      { name: 'Form Dibuka', eventType: 'page_view', filter: { path: '/maintenance' } },
      { name: 'Request Dibuat', eventType: 'maintenance_created' },
      { name: 'Request Selesai', eventType: 'maintenance_resolved' },
    ],
  },
};

const DATE_RANGES = [
  { value: '7d', label: '7 Hari' },
  { value: '30d', label: '30 Hari' },
  { value: '3m', label: '3 Bulan' },
];

export function ConversionFunnels({ funnelType }: ConversionFunnelProps) {
  const [dateRange, setDateRange] = useState('30d');
  const config = FUNNEL_CONFIGS[funnelType];

  const getDateFilter = (range: string): Date => {
    const now = new Date();
    switch (range) {
      case '7d': return subDays(now, 7);
      case '30d': return subDays(now, 30);
      case '3m': return subMonths(now, 3);
      default: return subDays(now, 30);
    }
  };

  const { data: funnelData, isLoading } = useQuery({
    queryKey: ['conversion-funnel', funnelType, dateRange],
    queryFn: async () => {
      const startDate = getDateFilter(dateRange);
      const steps: FunnelStep[] = [];

      for (let i = 0; i < config.steps.length; i++) {
        const step = config.steps[i];
        
        let query = supabase
          .from('analytics_events')
          .select('id', { count: 'exact' })
          .eq('event_type', step.eventType)
          .gte('created_at', startDate.toISOString());

        // Apply path filter if exists
        if ('filter' in step && step.filter?.path) {
          query = query.ilike('page', `%${step.filter.path}%`);
        }

        const { count, error } = await query;
        
        if (error) {
          console.error(`Error fetching step ${step.name}:`, error);
        }

        const currentCount = count || 0;
        const prevCount = i > 0 ? steps[i - 1].count : currentCount;
        const percentage = prevCount > 0 ? (currentCount / prevCount) * 100 : 100;
        const dropoff = i > 0 ? 100 - percentage : 0;

        steps.push({
          name: step.name,
          eventType: step.eventType,
          count: currentCount,
          percentage: i === 0 ? 100 : percentage,
          dropoff,
        });
      }

      return steps;
    },
  });

  const overallConversion = funnelData && funnelData.length > 0
    ? ((funnelData[funnelData.length - 1].count / funnelData[0].count) * 100) || 0
    : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Conversion */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Conversion Rate</span>
            <div className="flex items-center gap-2">
              {overallConversion > 50 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className="text-2xl font-bold">
                {overallConversion.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Funnel Visualization */}
        <div className="space-y-3">
          {funnelData?.map((step, index) => {
            const widthPercentage = Math.max(step.percentage, 20);
            const isLast = index === funnelData.length - 1;
            
            return (
              <div key={step.eventType} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{step.name}</span>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{step.count.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="h-10 bg-muted rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ 
                        width: `${index === 0 ? 100 : widthPercentage}%`,
                        opacity: 0.3 + (step.percentage / 100) * 0.7,
                      }}
                    />
                  </div>
                  
                  {/* Percentage badge */}
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-sm font-medium">
                      {index === 0 ? '100%' : `${step.percentage.toFixed(1)}%`}
                    </span>
                  </div>
                </div>

                {/* Dropoff indicator */}
                {!isLast && step.dropoff > 0 && (
                  <div className="flex items-center gap-2 text-xs text-destructive pl-2">
                    <ArrowRight className="h-3 w-3" />
                    <span>-{step.dropoff.toFixed(1)}% dropoff</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Insights */}
        {funnelData && funnelData.length > 1 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Insights</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {funnelData.map((step, i) => {
                if (i === 0) return null;
                if (step.dropoff > 50) {
                  return (
                    <li key={step.eventType} className="text-destructive">
                      • High dropoff ({step.dropoff.toFixed(0)}%) at "{step.name}"
                    </li>
                  );
                }
                return null;
              })}
              {overallConversion > 20 && (
                <li className="text-green-600">
                  • Conversion rate {overallConversion.toFixed(1)}% is above average
                </li>
              )}
              {overallConversion < 5 && (
                <li className="text-destructive">
                  • Low conversion rate - consider UX improvements
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
