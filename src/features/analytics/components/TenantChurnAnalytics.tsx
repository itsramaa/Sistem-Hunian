import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { TrendingDown, TrendingUp, Users, UserMinus, Calendar, AlertTriangle } from 'lucide-react';
import { format, subMonths, differenceInDays, isBefore, addDays } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CHURN_COLORS = ['hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--muted))', 'hsl(var(--primary))'];

const CHURN_REASONS = [
  { value: 'rent_increase', label: 'Rent Increase', color: 'hsl(var(--destructive))' },
  { value: 'relocation', label: 'Relocation', color: 'hsl(var(--primary))' },
  { value: 'maintenance_issues', label: 'Maintenance Issues', color: 'hsl(var(--warning))' },
  { value: 'end_of_term', label: 'End of Term', color: 'hsl(var(--muted))' },
  { value: 'other', label: 'Other', color: 'hsl(var(--accent))' },
];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border) / 0.4)',
  borderRadius: '16px',
  backdropFilter: 'blur(8px)',
};

export function TenantChurnAnalytics() {
  const { merchant } = useAuth();

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts-churn', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      // TODO: Go endpoint not yet implemented — was: supabase.from('contracts').select(...)
      return [];
    },
    enabled: !!merchant?.id,
  });

  const now = new Date();
  const sixMonthsAgo = subMonths(now, 6);
  const threeMonthsAgo = subMonths(now, 3);
  const previousPeriodStart = subMonths(sixMonthsAgo, 6);

  const activeContracts = contracts.filter(c => c.status === 'active');
  const endedContracts = contracts.filter(c => c.status === 'terminated' || c.status === 'expired');
  const recentChurned = endedContracts.filter(c => new Date(c.end_date) >= sixMonthsAgo);

  const activeAtPeriodStart = contracts.filter(c => {
    const startDate = new Date(c.start_date);
    const endDate = new Date(c.end_date);
    return startDate <= sixMonthsAgo && endDate >= sixMonthsAgo;
  });

  const churnRate = activeAtPeriodStart.length + recentChurned.length > 0
    ? Math.round((recentChurned.length / (activeAtPeriodStart.length + recentChurned.length)) * 100) : 0;

  const previousPeriodChurned = endedContracts.filter(c => {
    const endDate = new Date(c.end_date);
    return endDate >= previousPeriodStart && endDate < sixMonthsAgo;
  });
  const activeAtPreviousPeriodStart = contracts.filter(c => {
    const startDate = new Date(c.start_date);
    const endDate = new Date(c.end_date);
    return startDate <= previousPeriodStart && endDate >= previousPeriodStart;
  });
  const previousChurnRate = activeAtPreviousPeriodStart.length + previousPeriodChurned.length > 0
    ? Math.round((previousPeriodChurned.length / (activeAtPreviousPeriodStart.length + previousPeriodChurned.length)) * 100) : 0;
  const churnTrend = churnRate - previousChurnRate;

  const expiringSoon = activeContracts.filter(c => {
    const endDate = new Date(c.end_date);
    return isBefore(endDate, addDays(now, 30)) && isBefore(now, endDate);
  });

  const churnByReason = CHURN_REASONS.map(reason => {
    const count = recentChurned.filter(c => (c as any).churn_reason === reason.value).length;
    return { name: reason.label, value: count, color: reason.color };
  }).filter(r => r.value > 0);
  if (churnByReason.length === 0 && recentChurned.length > 0) {
    churnByReason.push({ name: 'Not Specified', value: recentChurned.length, color: 'hsl(var(--muted))' });
  }

  const averageTenancyDays = endedContracts.length > 0
    ? Math.round(endedContracts.reduce((sum, c) => sum + differenceInDays(new Date(c.end_date), new Date(c.start_date)), 0) / endedContracts.length)
    : 0;
  const averageTenancyMonths = Math.round(averageTenancyDays / 30);

  const kpis = [
    { label: "Churn Rate", value: `${churnRate}%`, icon: UserMinus, iconBg: "from-destructive/20 to-destructive/5", iconColor: "text-destructive", trend: churnTrend, trendInverse: true, trendLabel: `${Math.abs(churnTrend)}% vs previous period` },
    { label: "Active Tenants", value: `${activeContracts.length}`, icon: Users, iconBg: "from-success/20 to-success/5", iconColor: "text-success", subtext: `${recentChurned.length} left in 6 months` },
    { label: "Avg. Tenancy", value: `${averageTenancyMonths} mo`, icon: Calendar, iconBg: "from-primary/20 to-primary/5", iconColor: "text-primary", subtext: `~${averageTenancyDays} days average` },
    { label: "Expiring Soon", value: `${expiringSoon.length}`, icon: AlertTriangle, iconBg: "from-warning/20 to-warning/5", iconColor: "text-warning", subtext: "Next 30 days" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.iconBg} flex items-center justify-center`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                </div>
              </div>
              {kpi.trend !== undefined && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${(kpi.trendInverse ? kpi.trend <= 0 : kpi.trend >= 0) ? 'text-success' : 'text-destructive'}`}>
                  {(kpi.trendInverse ? kpi.trend <= 0 : kpi.trend >= 0) ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                  <span>{kpi.trendLabel}</span>
                </div>
              )}
              {kpi.subtext && <p className="text-sm text-muted-foreground mt-2">{kpi.subtext}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
          <CardHeader>
            <CardTitle>Churn Reasons</CardTitle>
            <CardDescription>Why tenants left in the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {churnByReason.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={churnByReason} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {churnByReason.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHURN_COLORS[index % CHURN_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
                    <UserMinus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No churn data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
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
                    <div key={contract.id} className="flex items-center justify-between p-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 hover:border-primary/20 transition-colors">
                      <div>
                        <p className="font-medium text-sm">
                          {(contract.unit as any)?.property?.name} - Unit {(contract.unit as any)?.unit_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ends {format(new Date(contract.end_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge variant={daysLeft <= 7 ? 'destructive' : daysLeft <= 14 ? 'outline' : 'secondary'} className="rounded-full">
                        {daysLeft} days left
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No contracts expiring in the next 30 days</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
