import { Briefcase, Building2, TrendingUp, TrendingDown, Minus, Download, Lightbulb, Trophy, AlertTriangle, Loader2 } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { useComparativePortfolio } from "@/features/analytics/hooks/useComparativePortfolio";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { formatRupiah } from "@/shared/utils/utils";
import { exportToPDF, generateReportHTML } from "@/shared/utils/exportUtils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import type { PropertyBenchmark, PerformanceRanking, OptimizationRecommendation } from "@/features/analytics/services/comparativePortfolioService";


function useMerchantId() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["merchant-id", user?.id],
    queryFn: async () => {
      // TODO: Go endpoint not yet implemented — was: supabase.from('merchants').select('id').eq('user_id', user?.id)
      return merchant?.id as string || "";
    },
    enabled: !!user?.id,
  });
}

const positionBadge = (pos: "above" | "at" | "below", label: string) => {
  const styles = {
    above: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
    at: "bg-amber-500/15 text-amber-700 border-amber-200",
    below: "bg-red-500/15 text-red-700 border-red-200",
  };
  const icons = { above: TrendingUp, at: Minus, below: TrendingDown };
  const Icon = icons[pos];
  return (
    <Badge className={`${styles[pos]} gap-1`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
};

const positionLabel = (pos: "above" | "at" | "below") => {
  const labels = { above: "Di Atas Pasar", at: "Sesuai Pasar", below: "Di Bawah Pasar" };
  return labels[pos];
};

const ratingBadge = (rating: string) => {
  const styles: Record<string, string> = {
    excellent: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
    good: "bg-blue-500/15 text-blue-700 border-blue-200",
    average: "bg-amber-500/15 text-amber-700 border-amber-200",
    poor: "bg-red-500/15 text-red-700 border-red-200",
  };
  const labels: Record<string, string> = { excellent: "Sangat Baik", good: "Baik", average: "Cukup", poor: "Kurang" };
  return <Badge className={styles[rating] || ""}>{labels[rating] || rating}</Badge>;
};

const tierBadge = (tier: "top" | "average" | "under") => {
  const config = {
    top: { label: "Performa Terbaik", icon: Trophy, className: "bg-emerald-500/15 text-emerald-700 border-emerald-200" },
    average: { label: "Rata-rata", icon: Minus, className: "bg-amber-500/15 text-amber-700 border-amber-200" },
    under: { label: "Performa Kurang", icon: AlertTriangle, className: "bg-red-500/15 text-red-700 border-red-200" },
  };
  const { label, icon: Icon, className } = config[tier];
  return <Badge className={`${className} gap-1`}><Icon className="h-3 w-3" />{label}</Badge>;
};

function BenchmarkingTab({ benchmarks, avgRent, avgOccupancy }: { benchmarks: PropertyBenchmark[]; avgRent: number; avgOccupancy: number }) {
  const handleExport = () => {
    const html = generateReportHTML(
      benchmarks.map(b => ({
        Nama: b.name,
        "Sewa Rata-rata": formatRupiah(b.avgRent),
        "Okupansi": `${b.occupancyRate.toFixed(1)}%`,
        "Posisi Harga": positionLabel(b.pricePosition),
        "Posisi Okupansi": positionLabel(b.occupancyPosition),
        Rating: b.overallRating,
      })),
      [
        { key: "Nama" as never, label: "Nama Properti" },
        { key: "Sewa Rata-rata" as never, label: "Sewa Rata-rata" },
        { key: "Okupansi" as never, label: "Okupansi" },
        { key: "Posisi Harga" as never, label: "Posisi Harga" },
        { key: "Posisi Okupansi" as never, label: "Posisi Okupansi" },
        { key: "Rating" as never, label: "Rating" },
      ],
      [
        { label: "Rata-rata Harga Pasar", value: formatRupiah(avgRent) },
        { label: "Rata-rata Okupansi", value: `${avgOccupancy.toFixed(1)}%` },
      ]
    );
    exportToPDF("Laporan Analisis Kompetitor", html, "competitor-analysis");
  };

  // Radar chart data
  const radarData = benchmarks.map(b => ({
    name: b.name.length > 15 ? b.name.slice(0, 15) + "…" : b.name,
    occupancy: b.occupancyRate,
    avgRent: avgRent > 0 ? (b.avgRent / avgRent) * 100 : 0,
    units: b.totalUnits,
  }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="region" aria-label="Ringkasan Benchmarking">
        <Card className="bg-card/90 backdrop-blur-sm border-border/40">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Rata-rata Harga Pasar</p>
            <p className="text-2xl font-bold mt-2">{formatRupiah(avgRent)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/90 backdrop-blur-sm border-border/40">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Rata-rata Okupansi</p>
            <p className="text-2xl font-bold mt-2">{avgOccupancy.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-card/90 backdrop-blur-sm border-border/40">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Total Properti Dibandingkan</p>
            <p className="text-2xl font-bold mt-2">{benchmarks.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart */}
      {benchmarks.length >= 2 && (
        <Card className="bg-card/90 backdrop-blur-sm border-border/40 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Perbandingan Visual</CardTitle>
            <CardDescription>Radar chart membandingkan okupansi & harga relatif</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full" role="img" aria-label="Grafik Radar Perbandingan Properti">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" className="text-[10px]" />
                  <PolarRadiusAxis />
                  <Radar name="Okupansi (%)" dataKey="occupancy" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  <Radar name="Harga Relatif (%)" dataKey="avgRent" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.2} />
                  <Legend />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitor table */}
      <Card className="bg-card/90 backdrop-blur-sm border-border/40 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-muted/20">
          <div>
            <CardTitle className="text-lg font-bold">Tabel Analisis Kompetitor</CardTitle>
            <CardDescription>Perbandingan posisi harga dan okupansi setiap properti</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="rounded-xl">
            <Download className="h-4 w-4 mr-2" aria-hidden="true" /> Ekspor PDF
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30">
                  <th className="text-left py-4 px-4 font-semibold uppercase tracking-wider text-[10px]">Properti</th>
                  <th className="text-right py-4 px-4 font-semibold uppercase tracking-wider text-[10px]">Sewa Rata-rata</th>
                  <th className="text-right py-4 px-4 font-semibold uppercase tracking-wider text-[10px]">Okupansi</th>
                  <th className="text-center py-4 px-4 font-semibold uppercase tracking-wider text-[10px]">Posisi Harga</th>
                  <th className="text-center py-4 px-4 font-semibold uppercase tracking-wider text-[10px]">Posisi Okupansi</th>
                  <th className="text-center py-4 px-4 font-semibold uppercase tracking-wider text-[10px]">Rating</th>
                </tr>
              </thead>
              <tbody>
                {benchmarks.map(b => (
                  <tr key={b.id} className="border-b border-border/40 last:border-0 hover:bg-primary/5 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{b.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-4 px-4 font-medium">{formatRupiah(b.avgRent)}</td>
                    <td className="text-right py-4 px-4">{b.occupancyRate.toFixed(1)}%</td>
                    <td className="text-center py-4 px-4">{positionBadge(b.pricePosition, positionLabel(b.pricePosition))}</td>
                    <td className="text-center py-4 px-4">{positionBadge(b.occupancyPosition, positionLabel(b.occupancyPosition))}</td>
                    <td className="text-center py-4 px-4">{ratingBadge(b.overallRating)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PortfolioTab({
  portfolio,
  benchmarks,
  rankings,
  recommendations,
}: {
  portfolio: ComparativePortfolioData["portfolio"];
  benchmarks: PropertyBenchmark[];
  rankings: PerformanceRanking[];
  recommendations: OptimizationRecommendation[];
}) {
  // Cash flow chart data
  const cashFlowData = benchmarks.map(b => ({
    name: b.name.length > 12 ? b.name.slice(0, 12) + "…" : b.name,
    Revenue: b.totalRevenue,
    Pengeluaran: b.totalExpenses,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4" role="region" aria-label="Ringkasan Portfolio">
        {[
          { label: "Total Properti", value: String(portfolio.totalProperties) },
          { label: "Total Unit", value: String(portfolio.totalUnits) },
          { label: "Pendapatan Bulanan", value: formatRupiah(portfolio.totalMonthlyRevenue) },
          { label: "Rata-rata Okupansi", value: `${portfolio.avgOccupancy.toFixed(1)}%` },
          { label: "ROI Portfolio", value: `${portfolio.portfolioROI.toFixed(1)}%` },
        ].map(item => (
          <Card key={item.label} className="bg-card/90 backdrop-blur-sm border-border/40">
            <CardContent className="pt-6 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{item.label}</p>
              <p className="text-lg font-bold mt-1 text-primary">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cash Flow Chart */}
      {benchmarks.length > 0 && (
        <Card className="bg-card/90 backdrop-blur-sm border-border/40 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Arus Kas Portfolio</CardTitle>
            <CardDescription>Pendapatan vs Pengeluaran per properti (tahunan)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full" role="img" aria-label="Grafik Arus Kas Portfolio">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" className="text-[10px]" />
                  <YAxis tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}jt`} className="text-[10px]" />
                  <Tooltip formatter={(v: number) => formatRupiah(v)} />
                  <Legend />
                  <Bar name="Pendapatan" dataKey="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar name="Pengeluaran" dataKey="Pengeluaran" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Ranking */}
      <Card className="bg-card/90 backdrop-blur-sm border-border/40 overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/40">
          <CardTitle className="text-lg">Peringkat Performa</CardTitle>
          <CardDescription>Skor komposit: Okupansi (40%) + ROI (30%) + Persentil Sewa (30%)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30">
                  <th className="text-left py-4 px-4 font-semibold uppercase tracking-wider text-[10px]">#</th>
                  <th className="text-left py-4 px-4 font-semibold uppercase tracking-wider text-[10px]">Properti</th>
                  <th className="text-right py-4 px-4 font-semibold uppercase tracking-wider text-[10px]">Okupansi</th>
                  <th className="text-right py-4 px-4 font-semibold uppercase tracking-wider text-[10px]">Skor</th>
                  <th className="text-center py-4 px-4 font-semibold uppercase tracking-wider text-[10px]">Tier</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((r, i) => (
                  <tr key={r.propertyId} className="border-b border-border/40 last:border-0 hover:bg-primary/5 transition-colors">
                    <td className="py-4 px-4 text-muted-foreground font-medium">{i + 1}</td>
                    <td className="py-4 px-4 font-bold">{r.propertyName}</td>
                    <td className="text-right py-4 px-4">{r.occupancyRate.toFixed(1)}%</td>
                    <td className="text-right py-4 px-4 font-mono text-primary font-semibold">{r.compositeScore.toFixed(1)}</td>
                    <td className="text-center py-4 px-4">{tierBadge(r.tier)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Recommendations */}
      {recommendations.length > 0 && (
        <Card className="bg-card/90 backdrop-blur-sm border-border/40">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" aria-hidden="true" />
              Rekomendasi Optimisasi
            </CardTitle>
            <CardDescription>Saran otomatis berdasarkan analisis data portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={`${rec.propertyId}-${rec.type}-${i}`} className="p-4 rounded-2xl border border-border/40 bg-muted/20 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-sm">{rec.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rec.description}</p>
                    </div>
                    <Badge variant={rec.priority === "high" ? "destructive" : "secondary"} className="shrink-0 rounded-full text-[10px]">
                      {rec.priority === "high" ? "Prioritas Tinggi" : "Sedang"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recommendations.length === 0 && (
        <Card className="bg-card/90 backdrop-blur-sm border-border/40">
          <CardContent className="py-12 text-center text-muted-foreground">
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="h-6 w-6 opacity-50" aria-hidden="true" />
            </div>
            <p className="font-medium">Tidak ada rekomendasi saat ini</p>
            <p className="text-xs mt-1">Portfolio Anda dalam kondisi sangat baik!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Need the full type for the portfolio tab
type ComparativePortfolioData = import("@/features/analytics/services/comparativePortfolioService").ComparativePortfolioData;

export default function ComparativePortfolio() {
  const { data: merchantId } = useMerchantId();
  const { data, isLoading } = useComparativePortfolio(merchantId || "");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader icon={Briefcase} title="Komparatif & Portfolio" description="Benchmarking dan analisis portfolio properti" />
        <div className="flex items-center justify-center py-20" role="status" aria-label="Memuat data komparatif">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={Briefcase} title="Komparatif & Portfolio" description="Benchmarking dan analisis portfolio properti" />

      <Tabs defaultValue="benchmarking" className="space-y-6">
        <TabsList className="inline-flex rounded-full bg-card/80 backdrop-blur-sm border border-border/40 p-1">
          <TabsTrigger value="benchmarking" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Benchmarking & Posisi</TabsTrigger>
          <TabsTrigger value="portfolio" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Analisis Portfolio</TabsTrigger>
        </TabsList>

        <TabsContent value="benchmarking">
          {data ? (
            <BenchmarkingTab benchmarks={data.benchmarks} avgRent={data.avgRent} avgOccupancy={data.avgOccupancy} />
          ) : (
            <Card className="bg-card/90 backdrop-blur-sm border-border/40"><CardContent className="py-12 text-center text-muted-foreground">Tidak ada data properti</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="portfolio">
          {data ? (
            <PortfolioTab portfolio={data.portfolio} benchmarks={data.benchmarks} rankings={data.rankings} recommendations={data.recommendations} />
          ) : (
            <Card className="bg-card/90 backdrop-blur-sm border-border/40"><CardContent className="py-12 text-center text-muted-foreground">Tidak ada data properti</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
