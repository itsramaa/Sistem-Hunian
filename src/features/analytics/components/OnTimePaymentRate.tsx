import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/shared/components/ui/card';
import { supabase } from '@/lib/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { subMonths } from 'date-fns';

interface OnTimePaymentRateProps {
  timeRange: string;
}

export function OnTimePaymentRate({ timeRange }: OnTimePaymentRateProps) {
  const { merchant } = useAuth();

  const { data: payments = [] } = useQuery({
    queryKey: ['on-time-payments', merchant?.id, timeRange],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const startDate = subMonths(new Date(), parseInt(timeRange));
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('merchant_id', merchant.id)
        .eq('status', 'paid')
        .gte('created_at', startDate.toISOString());
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id,
  });

  // Calculate on-time payment rate
  const totalPaidPayments = payments.length;
  const onTimePayments = payments.filter(p => {
    if (!p.paid_at || !p.due_date) return false;
    const paidDate = new Date(p.paid_at);
    const dueDate = new Date(p.due_date);
    return paidDate <= dueDate;
  });

  const onTimeRate = totalPaidPayments > 0 
    ? Math.round((onTimePayments.length / totalPaidPayments) * 100) 
    : 0;

  // Calculate previous period rate for comparison
  const previousStartDate = subMonths(new Date(), parseInt(timeRange) * 2);
  const previousEndDate = subMonths(new Date(), parseInt(timeRange));
  
  const previousPeriodPayments = payments.filter(p => {
    const paidDate = new Date(p.paid_at || p.created_at);
    return paidDate >= previousStartDate && paidDate < previousEndDate;
  });

  const previousOnTime = previousPeriodPayments.filter(p => {
    if (!p.paid_at || !p.due_date) return false;
    const paidDate = new Date(p.paid_at);
    const dueDate = new Date(p.due_date);
    return paidDate <= dueDate;
  });

  const previousRate = previousPeriodPayments.length > 0
    ? Math.round((previousOnTime.length / previousPeriodPayments.length) * 100)
    : 0;

  const rateDiff = onTimeRate - previousRate;
  const isImproved = rateDiff >= 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">On-Time Payment Rate</p>
            <p className="text-2xl font-bold">{onTimeRate}%</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
        </div>
        <div className={`flex items-center gap-1 mt-2 text-sm ${isImproved ? 'text-success' : 'text-destructive'}`}>
          {isImproved ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span>{isImproved ? '+' : ''}{rateDiff}% from last period</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {onTimePayments.length} of {totalPaidPayments} payments on time
        </p>
      </CardContent>
    </Card>
  );
}
