import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingDown, TrendingUp, Users, UserMinus, Calendar, AlertTriangle } from 'lucide-react';
import { format, subMonths, differenceInDays, isBefore, addDays } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const CHURN_COLORS = ['hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--muted))', 'hsl(var(--primary))'];

const CHURN_REASONS = [
  { value: 'rent_increase', label: 'Rent Increase', color: 'hsl(var(--destructive))' },
  { value: 'relocation', label: 'Relocation', color: 'hsl(var(--primary))' },
  { value: 'maintenance_issues', label: 'Maintenance Issues', color: 'hsl(var(--warning))' },
  { value: 'end_of_term', label: 'End of Term', color: 'hsl(var(--muted))' },
  { value: 'other', label: 'Other', color: 'hsl(var(--accent))' },
];

export function TenantChurnAnalytics() {
  const { merchant } = useAuth();

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts-churn', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase
        .from('contracts')
        .select('*, unit:units(unit_number, property:properties(name))')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id,
  });

  // Calculate metrics
  const now = new Date();
  const sixMonthsAgo = subMonths(now, 6);
  const threeMonthsAgo = subMonths(now, 3);

  const activeContracts = contracts.filter(c => c.status === 'active');
  const endedContracts = contracts.filter(c => 
    c.status === 'terminated' || c.status === 'expired'
  );
  
  // Recent churned (last 6 months)
  const recentChurned = endedContracts.filter(c => 
    new Date(c.end_date) >= sixMonthsAgo
  );

  // Calculate churn rate (churned / (churned + active) in period)
  const churnRate = activeContracts.length + recentChurned.length > 0
    ? Math.round((recentChurned.length / (activeContracts.length + recentChurned.length)) * 100)
    : 0;

  // Previous period churn rate for comparison
  const previousPeriodChurned = endedContracts.filter(c => {
    const endDate = new Date(c.end_date);
    return endDate >= subMonths(sixMonthsAgo, 6) && endDate < sixMonthsAgo;
  });
  const previousChurnRate = previousPeriodChurned.length > 0
    ? Math.round((previousPeriodChurned.length / (previousPeriodChurned.length + activeContracts.length)) * 100)
    : 0;

  const churnTrend = churnRate - previousChurnRate;

  // Contracts expiring soon (next 30 days)
  const expiringSoon = activeContracts.filter(c => {
    const endDate = new Date(c.end_date);
    return isBefore(endDate, addDays(now, 30)) && isBefore(now, endDate);
  });

  // Churn by reason
  const churnByReason = CHURN_REASONS.map(reason => {
    const count = recentChurned.filter(c => (c as any).churn_reason === reason.value).length;
    return { name: reason.label, value: count, color: reason.color };
  }).filter(r => r.value > 0);

  // If no churn reasons recorded, show general category
  if (churnByReason.length === 0 && recentChurned.length > 0) {
    churnByReason.push({ name: 'Not Specified', value: recentChurned.length, color: 'hsl(var(--muted))' });
  }

  // Average tenancy duration
  const averageTenancyDays = endedContracts.length > 0
    ? Math.round(
        endedContracts.reduce((sum, c) => {
          return sum + differenceInDays(new Date(c.end_date), new Date(c.start_date));
        }, 0) / endedContracts.length
      )
    : 0;

  const averageTenancyMonths = Math.round(averageTenancyDays / 30);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Churn Rate</p>
                <p className="text-2xl font-bold">{churnRate}%</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <UserMinus className="h-5 w-5 text-destructive" />
              </div>
            </div>
            <div className={`flex items-center gap-1 mt-2 text-sm ${churnTrend <= 0 ? 'text-success' : 'text-destructive'}`}>
              {churnTrend <= 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              <span>{Math.abs(churnTrend)}% vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Tenants</p>
                <p className="text-2xl font-bold">{activeContracts.length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-success" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {recentChurned.length} left in 6 months
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Tenancy</p>
                <p className="text-2xl font-bold">{averageTenancyMonths} mo</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              ~{averageTenancyDays} days average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold">{expiringSoon.length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Next 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Churn by Reason */}
        <Card>
          <CardHeader>
            <CardTitle>Churn Reasons</CardTitle>
            <CardDescription>Why tenants left in the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {churnByReason.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={churnByReason}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {churnByReason.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHURN_COLORS[index % CHURN_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No churn data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contracts Expiring Soon */}
        <Card>
          <CardHeader>
            <CardTitle>Contracts Expiring Soon</CardTitle>
            <CardDescription>Tenants to follow up with for renewal</CardDescription>
          </CardHeader>
          <CardContent>
            {expiringSoon.length > 0 ? (
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {expiringSoon.map((contract) => {
                  const daysLeft = differenceInDays(new Date(contract.end_date), now);
                  return (
                    <div key={contract.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">
                          {(contract.unit as any)?.property?.name} - Unit {(contract.unit as any)?.unit_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ends {format(new Date(contract.end_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge variant={daysLeft <= 7 ? 'destructive' : daysLeft <= 14 ? 'outline' : 'secondary'}>
                        {daysLeft} days left
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No contracts expiring in the next 30 days
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
