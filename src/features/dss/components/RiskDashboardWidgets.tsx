import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { RiskScoreIndicator } from "@/shared/components/dss/RiskScoreIndicator";
import { TrendingUp, TrendingDown, Minus, DollarSign, Users, Home, AlertTriangle } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/shared/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, Area, ComposedChart } from "recharts";
import { cn } from "@/shared/utils/utils";

interface KpiMetric {
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
  icon: React.ReactNode;
}

interface RiskDashboardWidgetsProps {
  riskScore?: number;
  metrics?: KpiMetric[];
  forecastData?: Array<{ month: string; actual?: number; predicted?: number; lower?: number; upper?: number }>;
  className?: string;
}

const defaultMetrics: KpiMetric[] = [
  { label: "Pendapatan Bulanan", value: "Rp 45.2M", trend: 12.5, trendLabel: "+12.5% vs bulan lalu", icon: <DollarSign className="h-4 w-4" /> },
  { label: "Tingkat Hunian", value: "87%", trend: 3.2, trendLabel: "+3.2% vs bulan lalu", icon: <Home className="h-4 w-4" /> },
  { label: "Penyewa Aktif", value: "142", trend: -2.1, trendLabel: "-2.1% vs bulan lalu", icon: <Users className="h-4 w-4" /> },
  { label: "Tunggakan", value: "Rp 8.5M", trend: -15.3, trendLabel: "-15.3% vs bulan lalu", icon: <AlertTriangle className="h-4 w-4" /> },
];

const defaultForecast = [
  { month: "Jan", actual: 42, predicted: 42 },
  { month: "Feb", actual: 44, predicted: 43 },
  { month: "Mar", actual: 45, predicted: 45 },
  { month: "Apr", predicted: 47, lower: 44, upper: 50 },
  { month: "Mei", predicted: 49, lower: 45, upper: 53 },
  { month: "Jun", predicted: 51, lower: 46, upper: 56 },
];

const chartConfig: ChartConfig = {
  actual: { label: "Aktual", color: "hsl(var(--primary))" },
  predicted: { label: "Prediksi", color: "hsl(var(--info))" },
};

const iconBgs: Record<string, string> = {
  "Pendapatan Bulanan": "from-success/20 to-success/5",
  "Tingkat Hunian": "from-info/20 to-info/5",
  "Penyewa Aktif": "from-primary/20 to-primary/5",
  "Tunggakan": "from-warning/20 to-warning/5",
};

export function RiskDashboardWidgets({
  riskScore = 35,
  metrics = defaultMetrics,
  forecastData = defaultForecast,
  className,
}: RiskDashboardWidgetsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
              <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${iconBgs[m.label] || "from-muted/20 to-muted/5"} flex items-center justify-center text-muted-foreground`}>
                {m.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{m.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {m.trend > 0 ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : m.trend < 0 ? (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                ) : (
                  <Minus className="h-3 w-3 text-muted-foreground" />
                )}
                <span className={cn("text-xs", m.trend > 0 ? "text-success" : m.trend < 0 ? "text-destructive" : "text-muted-foreground")}>
                  {m.trendLabel}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
          <CardHeader>
            <CardTitle className="text-base">Skor Risiko Keseluruhan</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskScoreIndicator score={riskScore} size="lg" />
            <p className="text-xs text-muted-foreground mt-3">
              Dihitung berdasarkan tingkat hunian, tunggakan, dan tren pembayaran
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
          <CardHeader>
            <CardTitle className="text-base">Proyeksi Pendapatan (Juta Rp)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px]">
              <ComposedChart data={forecastData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area dataKey="upper" stroke="none" fill="hsl(var(--info))" fillOpacity={0.1} />
                <Area dataKey="lower" stroke="none" fill="hsl(var(--background))" fillOpacity={1} />
                <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="predicted" stroke="hsl(var(--info))" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
