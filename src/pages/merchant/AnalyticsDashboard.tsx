import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Download, ArrowDown, ArrowUp, Minus, TrendingUp } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Slider } from "@/shared/components/ui/slider";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { formatRupiah, formatYear } from "@/shared/utils/utils";
import {
  useAnalyticsProperties,
  useAnalyticsUnits,
  useAnalyticsContracts,
  useAnalyticsTenantRiskScores,
  useAnalyticsDisasterRisk,
} from "@/features/analytics/hooks/useAnalyticsDashboard";

const RISK_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#ef4444",
  rendah: "#22c55e",
  sedang: "#eab308",
  tinggi: "#ef4444",
};

const QUALITY_COLORS = ["#22c55e", "#3b82f6", "#eab308", "#f97316", "#ef4444"];

export default function AnalyticsDashboard() {
  const { merchant } = useAuth();
  const merchantId = merchant?.id;
  const navigate = useNavigate();

  const [propertyType, setPropertyType] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [yearRange, setYearRange] = useState<number[]>([2020, 2026]);

  const { data: properties = [] } = useAnalyticsProperties(merchantId, yearRange);
  const { data: units = [] } = useAnalyticsUnits(merchantId);
  const { data: contracts = [] } = useAnalyticsContracts(merchantId, yearRange);
  const { data: tenantRisk = [] } = useAnalyticsTenantRiskScores(merchantId);
  const { data: disasterRisk = [] } = useAnalyticsDisasterRisk(merchantId);

  // Filters
  const propertyTypes = useMemo(() => [...new Set(properties.map((p) => p.property_type).filter(Boolean))], [properties]);
  const cities = useMemo(() => [...new Set(properties.map((p) => p.city).filter(Boolean))], [properties]);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (propertyType !== "all" && p.property_type !== propertyType) return false;
      if (city !== "all" && p.city !== city) return false;
      const yr = p.construction_year;
      if (yr && (yr < yearRange[0] || yr > yearRange[1])) return false;
      return true;
    });
  }, [properties, propertyType, city, yearRange]);

  const filteredIds = useMemo(() => new Set(filtered.map((p) => p.id)), [filtered]);
  const filteredUnits = useMemo(() => units.filter((u) => filteredIds.has(u.property_id)), [units, filteredIds]);

  // Section A: Price Stats
  const priceStats = useMemo(() => {
    const rents = filteredUnits.map((u) => u.rent_amount).filter((r): r is number => r != null && r > 0);
    if (rents.length === 0) return { min: 0, max: 0, avg: 0, median: 0 };
    rents.sort((a, b) => a - b);
    const mid = Math.floor(rents.length / 2);
    return {
      min: rents[0],
      max: rents[rents.length - 1],
      avg: Math.round(rents.reduce((s, v) => s + v, 0) / rents.length),
      median: rents.length % 2 ? rents[mid] : Math.round((rents[mid - 1] + rents[mid]) / 2),
    };
  }, [filteredUnits]);

  // Section B: Occupancy Trend 6 months
  const occupancyTrend = useMemo(() => {
    const now = new Date();
    const months: { label: string; start: Date; end: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      months.push({
        label: format(d, "MMM yy", { locale: idLocale }),
        start: startOfMonth(d),
        end: endOfMonth(d),
      });
    }
    const totalUnits = filteredUnits.length || 1;
    return months.map((m) => {
      const active = contracts.filter((c) => {
        const unitInFilter = filteredUnits.some((u) => u.id === c.unit_id);
        if (!unitInFilter) return false;
        const start = new Date(c.start_date);
        const end = new Date(c.end_date);
        return c.status === "active" && start <= m.end && end >= m.start;
      }).length;
      return { name: m.label, okupansi: Math.round((active / totalUnits) * 100) };
    });
  }, [contracts, filteredUnits]);

  // Section C: ROI Distribution
  const roiDistribution = useMemo(() => {
    const buckets = [
      { label: "0-5%", min: 0, max: 5, count: 0 },
      { label: "5-10%", min: 5, max: 10, count: 0 },
      { label: "10-15%", min: 10, max: 15, count: 0 },
      { label: "15-20%", min: 15, max: 20, count: 0 },
      { label: "20%+", min: 20, max: Infinity, count: 0 },
    ];
    filtered.forEach((p) => {
      const cost = (p.construction_cost || 0) + (p.renovation_cost || 0);
      if (cost <= 0) return;
      const propUnits = filteredUnits.filter((u) => u.property_id === p.id);
      const annualRev = propUnits.reduce((s, u) => s + (u.rent_amount || 0) * 12, 0);
      const roi = (annualRev / cost) * 100;
      const bucket = buckets.find((b) => roi >= b.min && roi < b.max);
      if (bucket) bucket.count++;
    });
    return buckets.map((b) => ({ name: b.label, jumlah: b.count }));
  }, [filtered, filteredUnits]);

  // Section D: Risk map data
  const riskMapData = useMemo(() => {
    return filtered
      .filter((p) => p.latitude && p.longitude)
      .map((p) => {
        const drp = disasterRisk.find((d) => d.property_id === p.id);
        const riskLevel = p.disaster_risk_level || drp?.risk_zone || "low";
        return {
          id: p.id,
          name: p.name,
          lat: p.latitude!,
          lng: p.longitude!,
          riskLevel: riskLevel.toLowerCase(),
          score: drp?.overall_risk_score,
        };
      });
  }, [filtered, disasterRisk]);

  // Section E: Tenant Quality
  const tenantQualityData = useMemo(() => {
    const grades: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    tenantRisk.forEach((t) => {
      const score = t.risk_score || 0;
      if (score >= 80) grades.A++;
      else if (score >= 60) grades.B++;
      else if (score >= 40) grades.C++;
      else if (score >= 20) grades.D++;
      else grades.F++;
    });
    return Object.entries(grades)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [tenantRisk]);

  const handleExportPDF = () => {
    window.print();
  };

  const mapCenter = useMemo(() => {
    if (riskMapData.length === 0) return [-6.2, 106.8] as [number, number];
    const avgLat = riskMapData.reduce((s, p) => s + p.lat, 0) / riskMapData.length;
    const avgLng = riskMapData.reduce((s, p) => s + p.lng, 0) / riskMapData.length;
    return [avgLat, avgLng] as [number, number];
  }, [riskMapData]);

  return (
    <div className="space-y-6 print:space-y-4">
      <PageHeader icon={BarChart3} title="Dashboard Analitik" description="Visualisasi komprehensif performa properti">
        <Button variant="outline" size="sm" onClick={handleExportPDF} className="print:hidden">
          <Download className="h-4 w-4 mr-2" /> Ekspor PDF
        </Button>
      </PageHeader>

      {/* Filters */}
      <Card className="print:hidden">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Tipe Properti</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {propertyTypes.map((t) => (
                    <SelectItem key={t} value={t!}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Kota</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c!}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[200px]">
              <Label className="text-xs">Tahun Bangun: {formatYear(yearRange[0])} - {formatYear(yearRange[1])}</Label>
              <Slider
                min={2020}
                max={2026}
                step={1}
                value={yearRange}
                onValueChange={setYearRange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section A: Price Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Minimum", value: priceStats.min, icon: ArrowDown, color: "text-success" },
          { label: "Maksimum", value: priceStats.max, icon: ArrowUp, color: "text-destructive" },
          { label: "Rata-rata", value: priceStats.avg, icon: Minus, color: "text-primary" },
          { label: "Median", value: priceStats.median, icon: TrendingUp, color: "text-warning" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-lg font-bold">{formatRupiah(stat.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section B: Occupancy Trend */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Tren Hunian 6 Bulan</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={occupancyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis unit="%" className="text-xs" />
                <Tooltip formatter={(v: number) => [`${v}%`, "Hunian"]} />
                <Line type="monotone" dataKey="okupansi" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Section C: ROI Distribution */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Distribusi ROI</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={roiDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="jumlah" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Section D: Risk Heatmap */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Peta Risiko Bencana</CardTitle></CardHeader>
          <CardContent>
            {riskMapData.length > 0 ? (
              <div className="h-[300px] rounded-lg overflow-hidden border border-border">
                <MapContainer center={mapCenter} zoom={10} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {riskMapData.map((p) => (
                    <CircleMarker
                      key={p.id}
                      center={[p.lat, p.lng]}
                      radius={10}
                      pathOptions={{
                        color: RISK_COLORS[p.riskLevel] || "#6b7280",
                        fillColor: RISK_COLORS[p.riskLevel] || "#6b7280",
                        fillOpacity: 0.7,
                      }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <p className="font-semibold">{p.name}</p>
                          <p>Risiko: {p.riskLevel}</p>
                          {p.score != null && <p>Skor: {p.score}</p>}
                          <button
                            className="text-primary underline text-xs mt-1"
                            onClick={() => navigate(`/merchant/properties/${p.id}`)}
                          >
                            Lihat Detail →
                          </button>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                Tidak ada properti dengan koordinat lokasi
              </div>
            )}
            <div className="flex gap-4 mt-2 text-xs">
              {Object.entries({ Rendah: "#22c55e", Sedang: "#eab308", Tinggi: "#ef4444" }).map(([label, color]) => (
                <span key={label} className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
                  {label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section E: Tenant Quality */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Distribusi Kualitas Tenant</CardTitle></CardHeader>
          <CardContent>
            {tenantQualityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={tenantQualityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {tenantQualityData.map((_, i) => (
                      <Cell key={i} fill={QUALITY_COLORS[i % QUALITY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
                Belum ada data kualitas tenant
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
