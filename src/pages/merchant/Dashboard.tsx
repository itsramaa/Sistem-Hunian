import { useAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMerchantDashboardStats } from '@/features/dashboard/hooks/useMerchantDashboardStats';
import { InteractiveDashboardCharts } from '@/features/dashboard/components/InteractiveDashboardCharts';
import { VacancyDashboard } from '@/features/dashboard/components/VacancyDashboard';
import { SubscriptionWidget } from '@/features/subscriptions/components/SubscriptionWidget';
import { TrialCountdownWidget } from '@/features/subscriptions/components/TrialCountdownWidget';
import { PageHeader } from '@/shared/components/ui/PageHeader';

import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible';
import { Progress } from '@/shared/components/ui/progress';
import { MerchantDashboardSkeleton } from '@/shared/components/ui/skeletons';
import { formatCurrency } from '@/shared/utils/currency';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  ChevronDown,
  FileText,
  Home,
  LayoutDashboard,
  Minus,
  Plus,
  RefreshCw,
  ScrollText,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MerchantDashboard() {
  const { merchant } = useAuth();
  const navigate = useNavigate();
  useAnalytics();
  const [vacancyOpen, setVacancyOpen] = useState(true);

  const { data: stats, isLoading, error, refetch, isRefetching } = useMerchantDashboardStats();

  if (isLoading) {
    return <MerchantDashboardSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="rounded-xl">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load dashboard data. Please try again.
          <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2 rounded-xl">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const quickActions = [
    { icon: Plus, label: 'Add Property', path: '/merchant/properties', color: 'from-primary/20 to-primary/5' },
    { icon: FileText, label: 'Create Invoice', path: '/merchant/invoices', color: 'from-success/20 to-success/5' },
    { icon: ScrollText, label: 'Create Contract', path: '/merchant/contracts', color: 'from-warning/20 to-warning/5' },
    { icon: TrendingUp, label: 'View Reports', path: '/merchant/reports', color: 'from-accent/20 to-accent/5' },
  ];

  return (
    <div className="space-y-6">
      {/* Section 1: PageHeader */}
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description={`Welcome back, ${merchant?.business_name || 'Merchant'}! Here's what's happening today.`}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="gap-2 rounded-xl"
          aria-label="Refresh dashboard data"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </PageHeader>

      {/* Section 2: Alert Strip */}
      <TrialCountdownWidget />

      {/* Section 3: KPI Strip */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card
          className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in"
          style={{ animationDelay: '0ms', animationFillMode: 'both' }}
          onClick={() => navigate('/merchant/properties')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.properties.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.properties.totalUnits || 0} total units managed
            </p>
          </CardContent>
        </Card>

        <Card
          className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in"
          style={{ animationDelay: '80ms', animationFillMode: 'both' }}
          onClick={() => navigate('/merchant/properties')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center">
              <Home className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(stats?.properties.occupancyRate || 0)}%
            </div>
            <Progress
              value={stats?.properties.occupancyRate || 0}
              className={`mt-2 h-2 rounded-full ${
                (stats?.properties.occupancyRate || 0) >= 80 ? '[&>div]:bg-success' :
                (stats?.properties.occupancyRate || 0) >= 50 ? '[&>div]:bg-warning' : '[&>div]:bg-destructive'
              }`}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {stats?.properties.occupiedUnits || 0} occupied / {stats?.properties.totalUnits || 0} total
            </p>
          </CardContent>
        </Card>

        <Card
          className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in"
          style={{ animationDelay: '160ms', animationFillMode: 'both' }}
          onClick={() => navigate('/merchant/tenants')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center">
              <Users className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tenants.active || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats?.tenants.growth ? (
                stats.tenants.growth > 0 ? (
                  <span className="text-success flex items-center mr-1">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    {Math.abs(Math.round(stats.tenants.growth))}%
                  </span>
                ) : stats.tenants.growth < 0 ? (
                  <span className="text-destructive flex items-center mr-1">
                    <ArrowDownRight className="h-3 w-3 mr-0.5" />
                    {Math.abs(Math.round(stats.tenants.growth))}%
                  </span>
                ) : (
                  <span className="text-muted-foreground flex items-center mr-1">
                    <Minus className="h-3 w-3 mr-0.5" />
                    0%
                  </span>
                )
              ) : (
                <span className="text-muted-foreground flex items-center mr-1">
                  <Minus className="h-3 w-3 mr-0.5" />
                  0%
                </span>
              )}
              from last month
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in"
          style={{ animationDelay: '240ms', animationFillMode: 'both' }}
          onClick={() => navigate('/merchant/payments')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escrow Balance</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.financials.balance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.financials.pendingBalance || 0)} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section 4: Quick Actions + Subscription */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <LayoutDashboard className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Jump to common tasks</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <div
                  key={action.label}
                  className="flex items-center gap-3 p-4 rounded-xl hover:bg-primary/5 transition-all cursor-pointer border border-transparent hover:border-border/40"
                  onClick={() => navigate(action.path)}
                >
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shrink-0`}>
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <SubscriptionWidget />
        </div>
      </div>

      {/* Section 5: Interactive Charts */}
      <InteractiveDashboardCharts />

      {/* Section 6: Property Overview + Financial Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle>Property Overview</CardTitle>
                <CardDescription>Occupancy breakdown by property</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.properties.list.map((property) => {
                const occupancy = property.total_units > 0
                  ? (property.occupied_units / property.total_units) * 100
                  : 0;

                return (
                  <div key={property.id} className="space-y-2 cursor-pointer hover:bg-primary/5 rounded-xl p-3 -mx-2 transition-colors" onClick={() => navigate(`/merchant/properties/${property.id}`)}>
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-medium">{property.name}</div>
                      <div className="text-muted-foreground">
                        {property.occupied_units}/{property.total_units} Units ({Math.round(occupancy)}%)
                      </div>
                    </div>
                    <Progress value={occupancy} className="h-2 rounded-full" />
                  </div>
                );
              })}

              {(!stats?.properties.list || stats.properties.list.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No properties found.
                  <Button variant="link" onClick={() => navigate('/merchant/properties')} className="px-1">
                    Add your first property
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-success" />
              </div>
              <div>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>Revenue performance this month</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stats?.financials.monthlyRevenue || 0)}
                    </p>
                  </div>
                  <div className={`flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    (stats?.financials.revenueGrowth || 0) >= 0
                      ? 'bg-success/10 text-success'
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {(stats?.financials.revenueGrowth || 0) >= 0 ? (
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="mr-1 h-3 w-3" />
                    )}
                    {Math.abs(Math.round(stats?.financials.revenueGrowth || 0))}%
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  vs {formatCurrency(stats?.financials.lastMonthRevenue || 0)} last month
                </div>
              </div>

              <Button className="w-full gradient-cta rounded-xl shadow-md" onClick={() => navigate('/merchant/reports')}>
                View Detailed Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 7: Vacancy Management */}
      <Collapsible open={vacancyOpen} onOpenChange={setVacancyOpen}>
        <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-primary/5 transition-colors rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center">
                    <Home className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <CardTitle>Vacancy Management</CardTitle>
                    <CardDescription>Track and manage vacant units</CardDescription>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${vacancyOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <VacancyDashboard />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
