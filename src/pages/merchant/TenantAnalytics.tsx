import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTenantDemographics, useOccupancyMetrics, useTenantPaymentProfiles } from '@/features/dss/hooks/useTenantAnalytics';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Progress } from '@/shared/components/ui/progress';
import { Loader2, Users, BarChart3, TrendingUp, CalendarClock, PieChart, ArrowUpDown, Clock, Award } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from 'recharts';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--accent))',
  'hsl(var(--muted-foreground))',
];

function toChartData(distribution: Record<string, number>) {
  return Object.entries(distribution)
    .map(([name, value]) => ({ name: name || 'Tidak diketahui', value }))
    .sort((a, b) => b.value - a.value);
}

function DistributionChart({ data, title, icon: Icon }: { data: Record<string, number>; title: string; icon: React.ElementType }) {
  const chartData = toChartData(data);
  if (chartData.length === 0) {
    return (
      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Icon className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Belum ada data {title.toLowerCase()}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="gradient-icon-box p-2">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-sm">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [v, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {chartData.map((d, i) => (
            <Badge key={d.name} variant="outline" className="rounded-full text-xs gap-1.5" style={{ borderColor: COLORS[i % COLORS.length] }}>
              <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              {d.name} ({d.value})
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentScoreBadge({ score }: { score: number }) {
  const bg = score >= 80 ? 'bg-success/15 text-success border-success/30' :
    score >= 60 ? 'bg-warning/15 text-warning border-warning/30' :
    'bg-destructive/15 text-destructive border-destructive/30';
  const label = score >= 80 ? 'Baik' : score >= 60 ? 'Cukup' : 'Buruk';
  return <Badge className={`rounded-full border ${bg}`}>{score} - {label}</Badge>;
}

export default function TenantAnalytics() {
  const { merchant } = useAuth();
  const merchantId = merchant?.id;

  const { data: demographics, isLoading: demoLoading } = useTenantDemographics(merchantId);
  const { data: occupancy, isLoading: occLoading } = useOccupancyMetrics(merchantId);
  const { data: paymentProfiles, isLoading: payLoading } = useTenantPaymentProfiles(merchantId);

  const [sortField, setSortField] = useState<'payment_score' | 'avg_days_late' | 'total_tenure_months'>('payment_score');
  const [sortAsc, setSortAsc] = useState(false);

  const sortedProfiles = [...(paymentProfiles || [])].sort((a, b) => {
    const diff = (a[sortField] ?? 0) - (b[sortField] ?? 0);
    return sortAsc ? diff : -diff;
  });

  const isLoading = demoLoading || occLoading || payLoading;

  // Seasonal chart data
  const seasonalData = (() => {
    if (!occupancy) return [];
    const months = new Set([...Object.keys(occupancy.moveInsByMonth), ...Object.keys(occupancy.moveOutsByMonth)]);
    return [...months].sort().slice(-12).map(m => ({
      month: m,
      masuk: occupancy.moveInsByMonth[m] || 0,
      keluar: occupancy.moveOutsByMonth[m] || 0,
    }));
  })();

  // KPI cards
  const avgPaymentScore = paymentProfiles && paymentProfiles.length > 0
    ? Math.round(paymentProfiles.reduce((s, p) => s + p.payment_score, 0) / paymentProfiles.length)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader icon={BarChart3} title="Analitik Tenant" description="Profiling demografi, payment tracking, dan occupancy analytics">
        <Badge variant="outline" className="rounded-full bg-primary/10 text-primary border-primary/30 gap-1.5">
          <PieChart className="h-3 w-3" />DSS Analytics
        </Badge>
      </PageHeader>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Tenant', value: demographics?.totalTenants ?? '-', icon: Users, bg: 'from-primary/20 to-primary/5' },
          { label: 'Tingkat Hunian', value: occupancy ? `${Math.round(occupancy.currentOccupancyRate)}%` : '-', icon: TrendingUp, bg: 'from-success/20 to-success/5' },
          { label: 'Rerata Lama Sewa', value: occupancy ? `${Math.round(occupancy.avgTenureMonths)} bln` : '-', icon: CalendarClock, bg: 'from-chart-2/20 to-chart-2/5' },
          { label: 'Rerata Skor Bayar', value: avgPaymentScore || '-', icon: Award, bg: 'from-warning/20 to-warning/5' },
        ].map(kpi => (
          <Card key={kpi.label} className="glass-stat-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.bg} flex items-center justify-center shrink-0`} aria-hidden="true">
                <kpi.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold truncate">{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : kpi.value}</p>
                <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="demographics" className="space-y-6">
        <TabsList className="pill-tab-list">
          <TabsTrigger value="demographics" className="pill-tab-trigger gap-1.5"><PieChart className="h-3.5 w-3.5" />Demografi</TabsTrigger>
          <TabsTrigger value="payment" className="pill-tab-trigger gap-1.5"><Award className="h-3.5 w-3.5" />Profil Bayar</TabsTrigger>
          <TabsTrigger value="occupancy" className="pill-tab-trigger gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Okupansi</TabsTrigger>
          <TabsTrigger value="seasonal" className="pill-tab-trigger gap-1.5"><CalendarClock className="h-3.5 w-3.5" />Musiman</TabsTrigger>
        </TabsList>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-6">
          {demoLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <>
              {demographics && demographics.totalTenants > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm">{demographics.totalProfiled} dari {demographics.totalTenants} tenant memiliki data profil lengkap ({Math.round((demographics.totalProfiled / demographics.totalTenants) * 100)}%)</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DistributionChart data={demographics?.genderDistribution || {}} title="Gender" icon={Users} />
                <DistributionChart data={demographics?.ageGroupDistribution || {}} title="Kelompok Usia" icon={CalendarClock} />
                <DistributionChart data={demographics?.occupationDistribution || {}} title="Pekerjaan" icon={BarChart3} />
                <DistributionChart data={demographics?.incomeDistribution || {}} title="Range Penghasilan" icon={TrendingUp} />
              </div>
            </>
          )}
        </TabsContent>

        {/* Payment Profiles Tab */}
        <TabsContent value="payment" className="space-y-4">
          {payLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : sortedProfiles.length === 0 ? (
            <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada data pembayaran tenant</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Sort controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Urutkan:</span>
                {[
                  { key: 'payment_score' as const, label: 'Skor Bayar' },
                  { key: 'avg_days_late' as const, label: 'Hari Terlambat' },
                  { key: 'total_tenure_months' as const, label: 'Lama Sewa' },
                ].map(opt => (
                  <Badge
                    key={opt.key}
                    variant={sortField === opt.key ? 'default' : 'outline'}
                    className="rounded-full cursor-pointer"
                    onClick={() => {
                      if (sortField === opt.key) setSortAsc(!sortAsc);
                      else { setSortField(opt.key); setSortAsc(false); }
                    }}
                  >
                    {opt.label}
                    {sortField === opt.key && <ArrowUpDown className="h-3 w-3 ml-1" />}
                  </Badge>
                ))}
              </div>

              <div className="space-y-2">
                {sortedProfiles.map(p => (
                  <Card key={p.tenant_user_id} className="rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 hover:border-primary/20 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-sm">{p.tenant_name || p.tenant_user_id.slice(0, 8) + '...'}</p>
                          <p className="text-xs text-muted-foreground">{p.total_tenure_months} bulan • {p.renewal_count} renewal</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <PaymentScoreBadge score={p.payment_score} />
                          {p.risk_level && (
                            <Badge variant="outline" className={`rounded-full text-xs ${
                              p.risk_level === 'low' ? 'border-success/30 text-success' :
                              p.risk_level === 'medium' ? 'border-warning/30 text-warning' :
                              'border-destructive/30 text-destructive'
                            }`}>{p.risk_level}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div>
                          <p className="text-lg font-bold text-success">{p.paid_on_time}</p>
                          <p className="text-[10px] text-muted-foreground">Tepat Waktu</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-warning">{p.paid_late}</p>
                          <p className="text-[10px] text-muted-foreground">Terlambat</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-destructive">{p.unpaid}</p>
                          <p className="text-[10px] text-muted-foreground">Belum Bayar</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{p.avg_days_late}<span className="text-xs font-normal text-muted-foreground"> hr</span></p>
                          <p className="text-[10px] text-muted-foreground">Avg Telat</p>
                        </div>
                      </div>
                      {p.total_invoices > 0 && (
                        <Progress value={(p.paid_on_time / p.total_invoices) * 100} className="h-1.5 mt-3 rounded-full [&>div]:bg-success" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Occupancy Tab */}
        <TabsContent value="occupancy" className="space-y-6">
          {occLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="glass-stat-card">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold">{Math.round(occupancy?.currentOccupancyRate ?? 0)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Occupancy Rate Saat Ini</p>
                  </CardContent>
                </Card>
                <Card className="glass-stat-card">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold">{occupancy?.avgTenureMonths ?? 0}<span className="text-sm font-normal text-muted-foreground"> bln</span></p>
                    <p className="text-xs text-muted-foreground mt-1">Rata-rata Lama Sewa</p>
                  </CardContent>
                </Card>
                <Card className="glass-stat-card">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold">{occupancy?.turnoverRateAnnual ?? 0}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Turnover Rate</p>
                  </CardContent>
                </Card>
              </div>

              {(occupancy?.snapshots?.length ?? 0) > 0 && (
                <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                  <CardHeader>
                    <CardTitle className="text-sm">Tren Okupansi</CardTitle>
                    <CardDescription>Data snapshot bulanan</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={occupancy?.snapshots}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="snapshot_month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                          <Legend />
                          <Line type="monotone" dataKey="occupancy_rate" stroke="hsl(var(--primary))" name="Occupancy %" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Seasonal Tab */}
        <TabsContent value="seasonal" className="space-y-6">
          {occLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : seasonalData.length === 0 ? (
            <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarClock className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium">Belum ada data musiman</p>
                <p className="text-xs text-muted-foreground mt-1">Data akan muncul setelah ada riwayat kontrak</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="gradient-icon-box p-2"><CalendarClock className="h-4 w-4 text-primary" /></div>
                  <div>
                    <CardTitle className="text-sm">Pola Masuk & Keluar Tenant</CardTitle>
                    <CardDescription>12 bulan terakhir</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={seasonalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                      <Legend />
                      <Bar dataKey="masuk" fill="hsl(var(--chart-2))" name="Masuk" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="keluar" fill="hsl(var(--chart-4))" name="Keluar" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
