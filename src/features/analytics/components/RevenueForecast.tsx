import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { supabase } from '@/lib/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { format, addMonths } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export function RevenueForecast() {
  const { merchant } = useAuth();

  // Fetch active contracts
  const { data: contracts = [] } = useQuery({
    queryKey: ['active-contracts-forecast', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase
        .from('contracts')
        .select('rent_amount, start_date, end_date, status')
        .eq('merchant_id', merchant.id)
        .eq('status', 'active');
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id,
  });

  // Fetch historical payments for comparison
  const { data: payments = [] } = useQuery({
    queryKey: ['historical-payments-forecast', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('amount, paid_at, status')
        .eq('merchant_id', merchant.id)
        .eq('status', 'paid')
        .order('paid_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id,
  });

  // Calculate forecast data for next 6 months
  const generateForecastData = () => {
    const data = [];
    const today = new Date();
    
    // Historical data (last 3 months)
    for (let i = 2; i >= 0; i--) {
      const monthDate = addMonths(today, -i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      const monthRevenue = payments
        .filter(p => {
          if (!p.paid_at) return false;
          const paidDate = new Date(p.paid_at);
          return paidDate >= monthStart && paidDate <= monthEnd;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);

      data.push({
        month: format(monthDate, 'MMM yyyy'),
        actual: monthRevenue,
        forecast: null,
      });
    }

    // Forecast data (next 6 months)
    for (let i = 1; i <= 6; i++) {
      const monthDate = addMonths(today, i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      // Calculate projected revenue based on active contracts
      const projectedRevenue = contracts
        .filter(c => {
          const startDate = new Date(c.start_date);
          const endDate = new Date(c.end_date);
          return startDate <= monthEnd && endDate >= monthStart;
        })
        .reduce((sum, c) => sum + Number(c.rent_amount), 0);

      data.push({
        month: format(monthDate, 'MMM yyyy'),
        actual: null,
        forecast: projectedRevenue,
      });
    }

    return data;
  };

  const forecastData = generateForecastData();

  // Calculate total projected revenue for next 6 months
  const totalForecast = forecastData
    .filter(d => d.forecast !== null)
    .reduce((sum, d) => sum + (d.forecast || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Forecast
          </CardTitle>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Next 6 months projection</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(totalForecast)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} 
                className="text-xs" 
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), '']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="actual"
                name="Actual Revenue"
                stroke="hsl(var(--primary))"
                fill="url(#colorActual)"
                strokeWidth={2}
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="forecast"
                name="Projected Revenue"
                stroke="hsl(var(--accent))"
                fill="url(#colorForecast)"
                strokeWidth={2}
                strokeDasharray="5 5"
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Forecast based on {contracts.length} active contracts. Actual results may vary.
        </p>
      </CardContent>
    </Card>
  );
}
