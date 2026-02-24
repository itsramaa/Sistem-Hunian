import { Briefcase, Building2, TrendingUp, TrendingDown, Minus, Download, Lightbulb, Trophy, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { useComparativePortfolio } from "@/features/analytics/hooks/useComparativePortfolio";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatRupiah } from "@/shared/utils/utils";
import { exportToPDF, generateReportHTML } from "@/shared/utils/exportUtils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import type { PropertyBenchmark, PerformanceRanking, OptimizationRecommendation } from "@/features/analytics/services/comparativePortfolioService";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function useMerchantId() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["merchant-id", user?.id],
    queryFn: async () => {
      const { data } = await db.from("merchants").select("id").eq("user_id", user?.id).maybeSingle();
      return data?.id as string || "";
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
    top: { label: "Top Performer", icon: Trophy, className: "bg-emerald-500/15 text-emerald-700 border-emerald-200" },
    average: { label: "Average", icon: Minus, className: "bg-amber-500/15 text-amber-700 border-amber-200" },
    under: { label: "Underperformer", icon: AlertTriangle, className: "bg-red-500/15 text-red-700 border-red-200" },
  };
  const { label, icon: Icon, className } = config[tier];
  return <Badge className={`${className} gap-1`}><Icon className="h-3 w-3" />{label}</Badge>;
};

function BenchmarkingTab({ benchmarks, avgRent, avgOccupancy }: { benchmarks: PropertyBenchmark[]; avgRent: number; avgOccupancy: number }) {
  const handleExport = () => {
    const html = generateReportHTML(
      benchmarks.map(b => ({
        Nama: b.name,
        "Avg Rent": formatRupiah(b.avgRent),
        "Occupancy": `${b.occupancyRate.toFixed(1)}%`,
        "Price Position": positionLabel(b.pricePosition),
        "Occupancy Position": positionLabel(b.occupancyPosition),
        Rating: b.overallRating,
      })),
      [
        { key: "Nama" as never, label: "Nama Properti" },
        { key: "Avg Rent" as never, label: "Rata-rata Sewa" },
        { key: "Occupancy" as never, label: "Occupancy" },
        { key: "Price Position" as never, label: "Posisi Harga" },
        { key: "Occupancy Position" as never, label: "Posisi Occupancy" },
        { key: "Rating" as never, label: "Rating" },
      ],
      [
        { label: "Rata-rata Harga Pasar", value: formatRupiah(avgRent) },
        { label: "Rata-rata Occupancy", value: `${avgOccupancy.toFixed(1)}%` },
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Rata-rata Harga Pasar</p>
            <p className="text-2xl font-bold">{formatRupiah(avgRent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Rata-rata Occupancy</p>
            <p className="text-2xl font-bold">{avgOccupancy.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Properti Dibandingkan</p>
            <p className="text-2xl font-bold">{benchmarks.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart */}
      {benchmarks.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Perbandingan Visual</CardTitle>
            <CardDescription>Radar chart membandingkan occupancy & harga relatif</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" className="text-xs" />
                <PolarRadiusAxis />
                <Radar name="Occupancy (%)" dataKey="occupancy" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                <Radar name="Harga Relatif (%)" dataKey="avgRent" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.2} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Competitor table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Tabel Analisis Kompetitor</CardTitle>
            <CardDescription>Perbandingan posisi harga dan occupancy setiap properti</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export PDF
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Properti</th>
                  <th className="text-right py-3 px-2 font-medium">Avg Rent</th>
                  <th className="text-right py-3 px-2 font-medium">Occupancy</th>
                  <th className="text-center py-3 px-2 font-medium">Posisi Harga</th>
                  <th className="text-center py-3 px-2 font-medium">Posisi Occupancy</th>
                  <th className="text-center py-3 px-2 font-medium">Rating</th>
                </tr>
              </thead>
              <tbody>
                {benchmarks.map(b => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{b.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-2">{formatRupiah(b.avgRent)}</td>
                    <td className="text-right py-3 px-2">{b.occupancyRate.toFixed(1)}%</td>
                    <td className="text-center py-3 px-2">{positionBadge(b.pricePosition, positionLabel(b.pricePosition))}</td>
                    <td className="text-center py-3 px-2">{positionBadge(b.occupancyPosition, positionLabel(b.occupancyPosition))}</td>
                    <td className="text-center py-3 px-2">{ratingBadge(b.overallRating)}</td>
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
    Expenses: b.totalExpenses,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Properti", value: String(portfolio.totalProperties) },
          { label: "Total Unit", value: String(portfolio.totalUnits) },
          { label: "Revenue Bulanan", value: formatRupiah(portfolio.totalMonthlyRevenue) },
          { label: "Avg Occupancy", value: `${portfolio.avgOccupancy.toFixed(1)}%` },
          { label: "Portfolio ROI", value: `${portfolio.portfolioROI.toFixed(1)}%` },
        ].map(item => (
          <Card key={item.label}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-xl font-bold mt-1">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cash Flow Chart */}
      {benchmarks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Portfolio Cash Flow</CardTitle>
            <CardDescription>Revenue vs Expenses per properti (tahunan)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}jt`} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} />
                <Legend />
                <Bar dataKey="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Performance Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Peringkat Performa</CardTitle>
          <CardDescription>Skor komposit: Okupansi (40%) + ROI (30%) + Persentil Sewa (30%)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">#</th>
                  <th className="text-left py-3 px-2 font-medium">Properti</th>
                  <th className="text-right py-3 px-2 font-medium">Occupancy</th>
                  <th className="text-right py-3 px-2 font-medium">Skor</th>
                  <th className="text-center py-3 px-2 font-medium">Tier</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((r, i) => (
                  <tr key={r.propertyId} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-2 text-muted-foreground">{i + 1}</td>
                    <td className="py-3 px-2 font-medium">{r.propertyName}</td>
                    <td className="text-right py-3 px-2">{r.occupancyRate.toFixed(1)}%</td>
                    <td className="text-right py-3 px-2 font-mono">{r.compositeScore.toFixed(1)}</td>
                    <td className="text-center py-3 px-2">{tierBadge(r.tier)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Rekomendasi Optimisasi
            </CardTitle>
            <CardDescription>Saran otomatis berdasarkan analisis data portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={`${rec.propertyId}-${rec.type}-${i}`} className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{rec.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                    </div>
                    <Badge variant={rec.priority === "high" ? "destructive" : "secondary"} className="shrink-0">
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
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Tidak ada rekomendasi saat ini — portfolio Anda dalam kondisi baik!</p>
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
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={Briefcase} title="Komparatif & Portfolio" description="Benchmarking dan analisis portfolio properti" />

      <Tabs defaultValue="benchmarking">
        <TabsList>
          <TabsTrigger value="benchmarking">Benchmarking & Positioning</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="benchmarking">
          {data ? (
            <BenchmarkingTab benchmarks={data.benchmarks} avgRent={data.avgRent} avgOccupancy={data.avgOccupancy} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Tidak ada data properti</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="portfolio">
          {data ? (
            <PortfolioTab portfolio={data.portfolio} benchmarks={data.benchmarks} rankings={data.rankings} recommendations={data.recommendations} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Tidak ada data properti</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
