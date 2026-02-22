import { useAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMerchantDashboardStats } from '@/features/dashboard/hooks/useMerchantDashboardStats';
import { SubscriptionWidget } from '@/features/subscriptions/components/SubscriptionWidget';
import { TrialCountdownWidget } from '@/features/subscriptions/components/TrialCountdownWidget';

import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { MerchantDashboardSkeleton } from '@/shared/components/ui/skeletons';
import { formatCurrency } from '@/shared/utils/currency';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Home,
  Minus,
  RefreshCw,
  Users,
  Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MerchantDashboard() {
  const { merchant } = useAuth();
  const navigate = useNavigate();
  useAnalytics();

  const { data: stats, isLoading, error, refetch, isRefetching } = useMerchantDashboardStats();

  if (isLoading) {
    return <MerchantDashboardSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load dashboard data. Please try again.
          <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <p className="text-sm text-muted-foreground">
            {`Welcome back, ${merchant?.business_name || 'Merchant'}! Here's what's happening today.`}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()} 
          disabled={isRefetching}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      <div className="space-y-6">
        {/* Subscription Status & Alerts */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SubscriptionWidget />
          </div>
          <div>
            <TrialCountdownWidget />
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Properties */}
          <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-in" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.properties.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.properties.totalUnits || 0} total units managed
              </p>
            </CardContent>
          </Card>

          {/* Occupancy Rate */}
          <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-in" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats?.properties.occupancyRate || 0)}%
              </div>
              <Progress 
                value={stats?.properties.occupancyRate || 0} 
                className={`mt-2 h-2 ${
                  (stats?.properties.occupancyRate || 0) >= 80 ? '[&>div]:bg-success' : 
                  (stats?.properties.occupancyRate || 0) >= 50 ? '[&>div]:bg-warning' : '[&>div]:bg-destructive'
                }`}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {stats?.properties.occupiedUnits || 0} occupied / {stats?.properties.totalUnits || 0} total
              </p>
            </CardContent>
          </Card>

          {/* Active Tenants */}
          <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-in" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
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

          {/* Revenue / Escrow */}
          <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-in" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escrow Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
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

        {/* Detailed Property Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Property Overview</CardTitle>
              <CardDescription>
                Occupancy breakdown by property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.properties.list.map((property) => {
                  const occupancy = property.total_units > 0 
                    ? (property.occupied_units / property.total_units) * 100 
                    : 0;
                  
                  return (
                    <div key={property.id} className="space-y-2 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors" onClick={() => navigate(`/merchant/properties/${property.id}`)}>
                      <div className="flex items-center justify-between text-sm">
                        <div className="font-medium">{property.name}</div>
                        <div className="text-muted-foreground">
                          {property.occupied_units}/{property.total_units} Units ({Math.round(occupancy)}%)
                        </div>
                      </div>
                      <Progress value={occupancy} className="h-2" />
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
          
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
              <CardDescription>
                Revenue performance this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Monthly Revenue
                      </p>
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
                
                <Button className="w-full" variant="outline" onClick={() => navigate('/merchant/reports')}>
                  View Detailed Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
