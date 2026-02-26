import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { useLaunchReadiness } from "@/features/launch/hooks/useLaunchReadiness";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  Loader2, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Rocket,
  Building2, Wrench, Wallet, Brain, Server, Users, FileText, Home, TrendingUp,
  Target
} from "lucide-react";
import { formatCurrency } from "@/shared/utils/currency";

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  core: { label: 'Inti', icon: Building2, color: 'text-primary' },
  operations: { label: 'Operasional', icon: Wrench, color: 'text-warning' },
  finance: { label: 'Keuangan', icon: Wallet, color: 'text-success' },
  intelligence: { label: 'Inteligensi', icon: Brain, color: 'text-accent' },
  infrastructure: { label: 'Infrastruktur', icon: Server, color: 'text-muted-foreground' },
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'pass') return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-warning" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
}

export default function LaunchReadiness() {
  const {
    metrics, checks, checksByCategory, passCount, warnCount, failCount, totalCount,
    readinessScore, isLoading, refetch,
  } = useLaunchReadiness();

  if (isLoading) {
    return (
      <AdminLayout title="Kesiapan Launch" description="Evaluasi kesiapan platform untuk peluncuran">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Kesiapan Launch"
      description="Evaluasi kesiapan platform untuk peluncuran publik"
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Segarkan
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Readiness Score */}
        <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex items-center gap-4">
                <div className={`h-20 w-20 rounded-2xl flex items-center justify-center ${
                  readinessScore >= 90 ? 'bg-success/10' : readinessScore >= 70 ? 'bg-warning/10' : 'bg-destructive/10'
                }`}>
                  <Rocket className={`h-10 w-10 ${
                    readinessScore >= 90 ? 'text-success' : readinessScore >= 70 ? 'text-warning' : 'text-destructive'
                  }`} />
                </div>
                <div>
                  <p className="text-4xl font-bold">{readinessScore}%</p>
                  <p className="text-sm text-muted-foreground">Skor Kesiapan</p>
                </div>
              </div>
              <div className="flex-1 w-full">
                <Progress value={readinessScore} className={`h-3 rounded-full ${
                  readinessScore >= 90 ? '[&>div]:bg-success' : readinessScore >= 70 ? '[&>div]:bg-warning' : '[&>div]:bg-destructive'
                }`} />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-success" /> {passCount} Lulus</span>
                  <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-warning" /> {warnCount} Peringatan</span>
                  <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" /> {failCount} Gagal</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <KpiCard icon={Users} label="Merchant" value={metrics.totalMerchants} sub={`${metrics.activeMerchants} terverifikasi`} />
            <KpiCard icon={Home} label="Properti" value={metrics.totalProperties} sub={`${metrics.totalUnits} unit`} />
            <KpiCard icon={Users} label="Penyewa Aktif" value={metrics.totalTenants} />
            <KpiCard icon={FileText} label="Tagihan" value={metrics.totalInvoices} sub={`${metrics.paidInvoices} lunas`} />
            <KpiCard icon={Wallet} label="Pembayaran" value={metrics.totalPayments} sub={`${metrics.autoMatchedPayments} matched`} />
            <KpiCard icon={Target} label="Match Rate" value={`${metrics.paymentMatchRate.toFixed(0)}%`} sub="Target ≥80%" />
          </div>
        )}

        {/* Checklist by Category */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Semua ({totalCount})</TabsTrigger>
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <TabsTrigger key={key} value={key}>
                {meta.label} ({checksByCategory[key]?.length || 0})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {Object.entries(CATEGORY_META).map(([catKey, meta]) => {
              const catChecks = checksByCategory[catKey] || [];
              if (catChecks.length === 0) return null;
              const CatIcon = meta.icon;
              return (
                <Card key={catKey} className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CatIcon className={`h-4 w-4 ${meta.color}`} />
                      {meta.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {catChecks.map(check => (
                        <div key={check.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-primary/5 transition-colors">
                          <StatusIcon status={check.status} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{check.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{check.detail}</p>
                          </div>
                          <Badge variant={check.status === 'pass' ? 'default' : check.status === 'warning' ? 'secondary' : 'destructive'}>
                            {check.status === 'pass' ? 'Lulus' : check.status === 'warning' ? 'Peringatan' : 'Gagal'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {Object.entries(CATEGORY_META).map(([catKey, meta]) => {
            const catChecks = checksByCategory[catKey] || [];
            const CatIcon = meta.icon;
            return (
              <TabsContent key={catKey} value={catKey} className="space-y-4">
                <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CatIcon className={`h-4 w-4 ${meta.color}`} />
                      {meta.label}
                    </CardTitle>
                    <CardDescription>
                      {catChecks.filter(c => c.status === 'pass').length}/{catChecks.length} item lulus
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {catChecks.map(check => (
                        <div key={check.id} className="flex items-start gap-3 p-3 rounded-xl border border-border/40 bg-card/60">
                          <StatusIcon status={check.status} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{check.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{check.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Success Criteria (4.2) */}
        <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Kriteria Sukses (Go/No-Go)
            </CardTitle>
            <CardDescription>Checkpoint sebelum peluncuran publik</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CriteriaCard
                label="Activation Time"
                target="< 2 menit"
                current="Sistem onboarding aktif"
                status="pass"
              />
              <CriteriaCard
                label="Collections Accuracy"
                target="Outstanding amount benar"
                current="Dashboard penagihan + aging buckets aktif"
                status="pass"
              />
              <CriteriaCard
                label="Payment Auto-Match"
                target="≥ 80%"
                current={`${metrics?.paymentMatchRate.toFixed(1) || 0}%`}
                status={(metrics?.paymentMatchRate || 0) >= 80 ? 'pass' : 'warning'}
              />
              <CriteriaCard
                label="Data Integrity"
                target="Tidak ada data hilang"
                current="RLS aktif, audit log aktif"
                status="pass"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function KpiCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) {
  return (
    <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <p className="text-xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function CriteriaCard({ label, target, current, status }: { label: string; target: string; current: string; status: 'pass' | 'warning' | 'fail' }) {
  return (
    <div className={`p-4 rounded-xl border ${
      status === 'pass' ? 'border-success/30 bg-success/5' :
      status === 'warning' ? 'border-warning/30 bg-warning/5' :
      'border-destructive/30 bg-destructive/5'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">{label}</p>
        <StatusIcon status={status} />
      </div>
      <p className="text-xs text-muted-foreground">Target: {target}</p>
      <p className="text-xs font-medium mt-1">Saat ini: {current}</p>
    </div>
  );
}
