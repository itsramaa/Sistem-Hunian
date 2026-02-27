import { useAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMerchantDashboardStats } from '@/features/dashboard/hooks/useMerchantDashboardStats';
import { usePropertyContext } from '@/shared/stores/propertyContext';
import { InteractiveDashboardCharts } from '@/features/dashboard/components/InteractiveDashboardCharts';
import { VacancyDashboard } from '@/features/dashboard/components/VacancyDashboard';
import { OccupancyForecastWidget } from '@/features/dashboard/components/OccupancyForecastWidget';
import { SubscriptionWidget } from '@/features/subscriptions/components/SubscriptionWidget';
import { MerchantQuickStartChecklist } from '@/features/launch/components/MerchantQuickStartChecklist';
import { TrialCountdownWidget } from '@/features/subscriptions/components/TrialCountdownWidget';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { MobileMerchantDashboard } from '@/features/dashboard/components/MobileMerchantDashboard';
import { DashboardCustomizeDialog } from '@/features/dashboard/components/DashboardCustomizeDialog';
import { useDashboardPreferences, useSaveDashboardPreferences } from '@/features/dashboard/hooks/useDashboardPreferences';
import { getOrderedWidgets, DEFAULT_WIDGET_ORDER } from '@/features/dashboard/constants/widgetRegistry';

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
  Settings2,
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
  const isMobile = useIsMobile();
  const [vacancyOpen, setVacancyOpen] = useState(true);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const selectedPropertyId = usePropertyContext((s) => s.selectedPropertyId);

  const { data: stats, isLoading, error, refetch, isRefetching } = useMerchantDashboardStats();
  const { data: prefs } = useDashboardPreferences(merchant?.id);
  const savePrefsMutation = useSaveDashboardPreferences();

  const widgetOrder = prefs?.widget_order || DEFAULT_WIDGET_ORDER;
  const hiddenWidgets = prefs?.hidden_widgets || [];
  const visibleWidgets = getOrderedWidgets(widgetOrder, hiddenWidgets);

  if (isLoading) {
    return <MerchantDashboardSkeleton />;
  }

  if (isMobile) {
    return <MobileMerchantDashboard />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="rounded-xl">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Gagal memuat data dashboard. Silakan coba lagi.
          <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2 rounded-xl">
            Coba Lagi
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const quickActions = [
    { icon: Plus, label: 'Tambah Properti', path: '/merchant/properties', color: 'from-primary/20 to-primary/5' },
    { icon: FileText, label: 'Buat Tagihan', path: '/merchant/invoices', color: 'from-success/20 to-success/5' },
    { icon: ScrollText, label: 'Buat Kontrak', path: '/merchant/contracts', color: 'from-warning/20 to-warning/5' },
    { icon: TrendingUp, label: 'Lihat Laporan', path: '/merchant/reports', color: 'from-accent/20 to-accent/5' },
  ];

  // Widget renderers mapped by ID
  const widgetRenderers: Record<string, () => JSX.Element> = {
    kpi_strip: () => (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Ringkasan Bisnis</h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {/* KPI Card: Total Properti */}
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in" style={{ animationDelay: '0ms', animationFillMode: 'both' }} onClick={() => navigate('/merchant/properties')} role="button" aria-label={`Total Properti: ${stats?.properties.total || 0}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properti</CardTitle>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"><Building2 className="h-4 w-4 text-primary" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.properties.total || 0}</div>
              <p className="text-xs text-muted-foreground">{stats?.properties.totalUnits || 0} total unit dikelola</p>
            </CardContent>
          </Card>

          {/* KPI Card: Tingkat Hunian */}
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in" style={{ animationDelay: '80ms', animationFillMode: 'both' }} onClick={() => navigate('/merchant/properties')} role="button" aria-label={`Tingkat Hunian: ${Math.round(stats?.properties.occupancyRate || 0)}%`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tingkat Hunian</CardTitle>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center"><Home className="h-4 w-4 text-success" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats?.properties.occupancyRate || 0)}%</div>
              <Progress value={stats?.properties.occupancyRate || 0} className={`mt-2 h-2 rounded-full ${(stats?.properties.occupancyRate || 0) >= 80 ? '[&>div]:bg-success' : (stats?.properties.occupancyRate || 0) >= 50 ? '[&>div]:bg-warning' : '[&>div]:bg-destructive'}`} />
              <p className="mt-1 text-xs text-muted-foreground">{stats?.properties.occupiedUnits || 0} terisi / {stats?.properties.totalUnits || 0} total</p>
            </CardContent>
          </Card>

          {/* KPI Card: Penyewa Aktif */}
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in" style={{ animationDelay: '160ms', animationFillMode: 'both' }} onClick={() => navigate('/merchant/tenants')} role="button" aria-label={`Penyewa Aktif: ${stats?.tenants.active || 0}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Penyewa Aktif</CardTitle>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center"><Users className="h-4 w-4 text-warning" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.tenants.active || 0}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stats?.tenants.growth ? (
                  stats.tenants.growth > 0 ? (<span className="text-success flex items-center mr-1"><ArrowUpRight className="h-3 w-3 mr-0.5" />{Math.abs(Math.round(stats.tenants.growth))}%</span>)
                  : stats.tenants.growth < 0 ? (<span className="text-destructive flex items-center mr-1"><ArrowDownRight className="h-3 w-3 mr-0.5" />{Math.abs(Math.round(stats.tenants.growth))}%</span>)
                  : (<span className="text-muted-foreground flex items-center mr-1"><Minus className="h-3 w-3 mr-0.5" />0%</span>)
                ) : (<span className="text-muted-foreground flex items-center mr-1"><Minus className="h-3 w-3 mr-0.5" />0%</span>)}
                dari bulan lalu
              </div>
            </CardContent>
          </Card>

          {/* KPI Card: Pendapatan */}
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in" style={{ animationDelay: '240ms', animationFillMode: 'both' }} onClick={() => navigate('/merchant/payments')} role="button" aria-label={`Pendapatan Bulan Ini: ${formatCurrency(stats?.financials.monthlyRevenue || 0)}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendapatan Bulan Ini</CardTitle>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center"><Wallet className="h-4 w-4 text-accent" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.financials.monthlyRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">vs {formatCurrency(stats?.financials.lastMonthRevenue || 0)} bulan lalu</p>
            </CardContent>
          </Card>
        </div>
      </section>
    ),

    quick_actions: () => (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Aksi & Langganan</h2>
        <div className="grid gap-4 lg:grid-cols-7">
          <Card className="lg:col-span-4 bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"><LayoutDashboard className="h-4 w-4 text-primary" /></div>
                <div><CardTitle>Aksi Cepat</CardTitle><CardDescription>Lompat ke tugas umum</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <div key={action.label} className="flex items-center gap-3 p-4 rounded-xl hover:bg-primary/5 transition-all cursor-pointer border border-transparent hover:border-border/40" onClick={() => navigate(action.path)}>
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shrink-0`}><action.icon className="h-5 w-5 text-primary" /></div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="lg:col-span-3"><SubscriptionWidget /></div>
        </div>
      </section>
    ),

    charts: () => (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Analitik Performa</h2>
        <InteractiveDashboardCharts />
      </section>
    ),

    property_overview: () => (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Rincian Detail</h2>
        <div className={`grid gap-4 md:grid-cols-2 ${!selectedPropertyId ? 'lg:grid-cols-7' : ''}`}>
          {!selectedPropertyId && (
            <Card className="col-span-4 bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"><Building2 className="h-4 w-4 text-primary" /></div>
                  <div><CardTitle>Ringkasan Properti</CardTitle><CardDescription>Rincian hunian per properti</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.properties.list.map((property) => {
                    const occupancy = property.total_units > 0 ? (property.occupied_units / property.total_units) * 100 : 0;
                    return (
                      <div key={property.id} className="space-y-2 cursor-pointer hover:bg-primary/5 rounded-xl p-3 -mx-2 transition-colors" onClick={() => navigate(`/merchant/properties/${property.id}`)}>
                        <div className="flex items-center justify-between text-sm">
                          <div className="font-medium">{property.name}</div>
                          <div className="text-muted-foreground">{property.occupied_units}/{property.total_units} Unit ({Math.round(occupancy)}%)</div>
                        </div>
                        <Progress value={occupancy} className="h-2 rounded-full" />
                      </div>
                    );
                  })}
                  {(!stats?.properties.list || stats.properties.list.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      Tidak ada properti ditemukan.
                      <Button variant="link" onClick={() => navigate('/merchant/properties')} className="px-1">Tambahkan properti pertama Anda</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className={`${!selectedPropertyId ? 'col-span-3' : 'col-span-full'} bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center"><Wallet className="h-4 w-4 text-success" /></div>
                <div><CardTitle>Ringkasan Keuangan</CardTitle><CardDescription>Performa pendapatan bulan ini</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Pendapatan Bulanan</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats?.financials.monthlyRevenue || 0)}</p>
                    </div>
                    <div className={`flex items-center rounded-full px-2 py-1 text-xs font-medium ${(stats?.financials.revenueGrowth || 0) >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {(stats?.financials.revenueGrowth || 0) >= 0 ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
                      {Math.abs(Math.round(stats?.financials.revenueGrowth || 0))}%
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">vs {formatCurrency(stats?.financials.lastMonthRevenue || 0)} bulan lalu</div>
                </div>
                <Button className="w-full gradient-cta rounded-xl shadow-md" onClick={() => navigate('/merchant/reports')}>Lihat Laporan Detail</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    ),

    vacancy: () => (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Manajemen Kekosongan</h2>
        <Collapsible open={vacancyOpen} onOpenChange={setVacancyOpen}>
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-primary/5 transition-colors rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center"><Home className="h-4 w-4 text-warning" /></div>
                    <div><CardTitle>Manajemen Kekosongan</CardTitle><CardDescription>Lacak dan kelola unit kosong</CardDescription></div>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${vacancyOpen ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent><VacancyDashboard /></CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </section>
    ),

    occupancy_forecast: () => (
      <section className="space-y-4">
        <OccupancyForecastWidget />
      </section>
    ),
  };

  return (
    <div className="space-y-8 pb-8">
      {/* PageHeader */}
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description={`Selamat datang kembali, ${merchant?.business_name || 'Merchant'}! Berikut ringkasan bisnis Anda.`}
      >
        <Button variant="outline" size="sm" onClick={() => setCustomizeOpen(true)} className="gap-2 rounded-xl">
          <Settings2 className="h-4 w-4" />
          Kustomisasi
        </Button>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching} className="gap-2 rounded-xl" aria-label="Segarkan data dashboard">
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Segarkan
        </Button>
      </PageHeader>

      {/* Alert Strip */}
      <TrialCountdownWidget />
      <MerchantQuickStartChecklist />

      {/* Dynamic widget rendering based on preferences */}
      {visibleWidgets.map(widget => {
        const renderer = widgetRenderers[widget.id];
        if (!renderer) return null;
        return <div key={widget.id}>{renderer()}</div>;
      })}

      {/* Customize Dialog */}
      <DashboardCustomizeDialog
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        widgetOrder={widgetOrder}
        hiddenWidgets={hiddenWidgets}
        onSave={(newOrder, newHidden) => {
          if (merchant?.id) {
            savePrefsMutation.mutate({ merchantId: merchant.id, widgetOrder: newOrder, hiddenWidgets: newHidden });
            setCustomizeOpen(false);
          }
        }}
        isSaving={savePrefsMutation.isPending}
      />
    </div>
  );
}
