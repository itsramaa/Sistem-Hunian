import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/shared/components/ui/card';
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
      // TODO: Go endpoint not yet implemented — was: supabase.from('payments').select(*)
      return [];
    },
    enabled: !!merchant?.id,
  });

  const totalPaidPayments = payments.length;
  const onTimePayments = payments.filter(p => {
    if (!p.paid_at || !p.due_date) return false;
    return new Date(p.paid_at) <= new Date(p.due_date);
  });

  const onTimeRate = totalPaidPayments > 0
    ? Math.round((onTimePayments.length / totalPaidPayments) * 100) : 0;

  const previousStartDate = subMonths(new Date(), parseInt(timeRange) * 2);
  const previousEndDate = subMonths(new Date(), parseInt(timeRange));
  const previousPeriodPayments = payments.filter(p => {
    const paidDate = new Date(p.paid_at || p.created_at);
    return paidDate >= previousStartDate && paidDate < previousEndDate;
  });
  const previousOnTime = previousPeriodPayments.filter(p => {
    if (!p.paid_at || !p.due_date) return false;
    return new Date(p.paid_at) <= new Date(p.due_date);
  });
  const previousRate = previousPeriodPayments.length > 0
    ? Math.round((previousOnTime.length / previousPeriodPayments.length) * 100) : 0;
  const rateDiff = onTimeRate - previousRate;
  const isImproved = rateDiff >= 0;

  return (
    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">On-Time Payment Rate</p>
            <p className="text-2xl font-bold">{onTimeRate}%</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
        </div>
        <div className={`flex items-center gap-1 mt-2 text-sm ${isImproved ? 'text-success' : 'text-destructive'}`}>
          {isImproved ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span>{isImproved ? '+' : ''}{rateDiff}% from last period</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {onTimePayments.length} of {totalPaidPayments} payments on time
        </p>
      </CardContent>
    </Card>
  );
}
