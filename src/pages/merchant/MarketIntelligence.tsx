import { useState } from "react";
import { TrendingUp, Sparkles, Loader2, BarChart3, DollarSign, LineChart, Activity, AlertTriangle, SlidersHorizontal } from "lucide-react";
import { Slider } from "@/shared/components/ui/slider";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { TierGate } from "@/features/dss/components/TierGate";
import { usePriceIntelligence, useOccupancyForecast } from "@/features/dss/hooks/useMarketIntelligence";
import { useMerchantProperties } from "@/features/properties/hooks/useMerchantProperties";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/integrations/supabase/client";
import { formatRupiah } from "@/shared/utils/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart as ReLineChart, Line, Area, AreaChart, Legend,
} from "recharts";
import type {
  PriceIntelligenceResult,
  OccupancyForecastResult,
  OccupancyAnomaly,
} from "@/features/dss/services/marketIntelligenceService";

export default function MarketIntelligence() {
  const { user } = useAuth();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");

  // Get merchant ID
  const { data: merchant } = useQuery({
    queryKey: ["merchant-for-mi", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("merchants").select("id").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { properties, loading: propsLoading } = useMerchantProperties(merchant?.id || "");

  const priceIntel = usePriceIntelligence();
  const occForecast = useOccupancyForecast();

  const propertyId = selectedPropertyId === "all" ? undefined : selectedPropertyId;

  const priceData = priceIntel.data?.analysis as PriceIntelligenceResult | undefined;
  const occData = occForecast.data?.forecast as OccupancyForecastResult | undefined;

  // What-if simulator state
  const [priceChangePct, setPriceChangePct] = useState(0);
  const elasticity = -0.5;

  return (
    <div className="space-y-6">
      <PageHeader icon={TrendingUp} title="Intelijen Pasar" description="Analitik harga & prediksi okupansi berbasis AI">
        <Badge variant="secondary" className="gap-1 rounded-full">
          <Sparkles className="h-3 w-3" aria-hidden="true" /> Berbasis AI
        </Badge>
      </PageHeader>

      {/* Property Selector */}
      <div className="flex items-center gap-3">
        <label htmlFor="property-selector" className="text-sm font-medium text-muted-foreground">Properti:</label>
        <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
          <SelectTrigger id="property-selector" className="w-[260px] rounded-xl" aria-label="Pilih properti untuk analisis">
            <SelectValue placeholder="Pilih properti" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Properti</SelectItem>
            {(properties || []).map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TierGate feature="ml_price_intelligence" propertyId={propertyId} merchantId={merchant?.id}>
        <Tabs defaultValue="comparison" className="space-y-4">
          <TabsList className="pill-tab-list" aria-label="Opsi analisis pasar">
            <TabsTrigger value="comparison" className="pill-tab-trigger gap-1.5"><BarChart3 className="h-3.5 w-3.5" aria-hidden="true" /> Perbandingan Harga</TabsTrigger>
            <TabsTrigger value="optimal" className="pill-tab-trigger gap-1.5"><DollarSign className="h-3.5 w-3.5" aria-hidden="true" /> Harga Optimal</TabsTrigger>
            <TabsTrigger value="trends" className="pill-tab-trigger gap-1.5"><LineChart className="h-3.5 w-3.5" aria-hidden="true" /> Tren Harga</TabsTrigger>
            <TabsTrigger value="occupancy" className="pill-tab-trigger gap-1.5"><Activity className="h-3.5 w-3.5" aria-hidden="true" /> Prediksi Okupansi</TabsTrigger>
          </TabsList>

          {/* Tab 1: Price Comparison */}
          <TabsContent value="comparison" className="space-y-4">
            {!priceData ? (
              <Card className="rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-4" aria-hidden="true" />
                  <p className="text-muted-foreground mb-4">Klik tombol di bawah untuk menganalisis perbandingan harga per segmen.</p>
                  <Button onClick={() => priceIntel.mutate(propertyId)} disabled={priceIntel.isPending} className="gradient-cta rounded-xl">
                    {priceIntel.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />}
                    Analisis Harga
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40" role="region" aria-label="Tabel Segmen Harga">
                  <CardHeader><CardTitle className="text-base">Segmen Harga</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left py-2 pr-4">Segmen</th>
                            <th className="text-right py-2 px-4">Rata-rata</th>
                            <th className="text-right py-2 px-4">Rentang</th>
                            <th className="text-right py-2 px-4">Unit</th>
                            <th className="text-right py-2 px-4">Okupansi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {priceData.segments.map((seg, i) => (
                            <tr key={i} className="border-b border-border/30">
                              <td className="py-2.5 pr-4 font-medium">{seg.segment_name}</td>
                              <td className="text-right py-2.5 px-4">{formatRupiah(seg.avg_price)}</td>
                              <td className="text-right py-2.5 px-4 text-muted-foreground">{formatRupiah(seg.price_range.min)} - {formatRupiah(seg.price_range.max)}</td>
                              <td className="text-right py-2.5 px-4">{seg.unit_count}</td>
                              <td className="text-right py-2.5 px-4">{(seg.occupancy_rate * 100).toFixed(0)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {priceData.segments.length > 0 && (
                  <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40" role="region" aria-label="Grafik Perbandingan Harga">
                    <CardHeader><CardTitle className="text-base">Perbandingan Harga per Segmen</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={priceData.segments}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                          <XAxis dataKey="segment_name" className="text-xs" />
                          <YAxis tickFormatter={(v) => `${(v / 1e6).toFixed(1)}jt`} className="text-xs" />
                          <Tooltip formatter={(v: number) => formatRupiah(v)} />
                          <Bar dataKey="avg_price" name="Rata-rata" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Outliers */}
                {priceData.outliers.length > 0 && (
                  <Card className="rounded-2xl border-destructive/30" role="alert" aria-label="Peringatan Anomali Harga">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" /> Anomali Harga (Outliers)</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2">
                      {priceData.outliers.map((o, i) => (
                        <div key={i} className="p-3 rounded-xl border border-border/40 bg-muted/30">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{o.unit_number || o.unit_id.slice(0, 8)}</span>
                            <Badge variant={o.severity === "high" ? "destructive" : "secondary"} className="text-xs rounded-full">
                              {o.anomaly_type === "overpriced" ? "↑ Terlalu Mahal" : "↓ Terlalu Murah"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Saat ini: {formatRupiah(o.current_price)} | Seharusnya: {formatRupiah(o.expected_range.min)} - {formatRupiah(o.expected_range.max)}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Tab 2: Optimal Pricing */}
          <TabsContent value="optimal" className="space-y-4">
            {!priceData ? (
              <Card className="rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground/40 mb-4" aria-hidden="true" />
                  <p className="text-muted-foreground mb-4">Dapatkan rekomendasi harga optimal untuk setiap unit Anda.</p>
                  <Button onClick={() => priceIntel.mutate(propertyId)} disabled={priceIntel.isPending} className="gradient-cta rounded-xl">
                    {priceIntel.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />}
                    Buat Rekomendasi
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {priceData.summary && (
                  <Card className="rounded-2xl bg-primary/5 border-primary/20" role="region" aria-label="Ringkasan Analisis Harga">
                    <CardContent className="py-4">
                      <p className="text-sm font-medium">Ringkasan Analisis:</p>
                      <p className="text-sm mt-1">{priceData.summary}</p>
                      {priceData.market_context && (
                        <p className="text-xs text-muted-foreground mt-2">{priceData.market_context}</p>
                      )}
                    </CardContent>
                  </Card>
                )}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {priceData.recommendations.map((rec, i) => {
                    const diff = rec.optimal_price - rec.current_price;
                    const pct = rec.current_price > 0 ? (diff / rec.current_price) * 100 : 0;
                    return (
                      <Card key={i} className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                        <CardContent className="pt-5 pb-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{rec.unit_number || rec.unit_id.slice(0, 8)}</span>
                            <Badge variant={diff > 0 ? "default" : "secondary"} className="text-xs rounded-full">
                              {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-muted-foreground text-xs line-through">{formatRupiah(rec.current_price)}</span>
                            <span className="font-bold text-primary">{formatRupiah(rec.optimal_price)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{rec.reason}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>Tingkat Kepercayaan:</span>
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${rec.confidence * 100}%` }} />
                            </div>
                            <span>{(rec.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab 3: Price Trends */}
          <TabsContent value="trends" className="space-y-4">
            {!priceData ? (
              <Card className="rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <LineChart className="h-12 w-12 text-muted-foreground/40 mb-4" aria-hidden="true" />
                  <p className="text-muted-foreground mb-4">Lihat tren harga 6-12 bulan terakhir.</p>
                  <Button onClick={() => priceIntel.mutate(propertyId)} disabled={priceIntel.isPending} className="gradient-cta rounded-xl">
                    {priceIntel.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />}
                    Analisis Tren
                  </Button>
                </CardContent>
              </Card>
            ) : priceData.price_trends.length > 0 ? (
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40" role="region" aria-label="Grafik Tren Harga">
                <CardHeader><CardTitle className="text-base">Tren Harga Bulanan</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <ReLineChart data={priceData.price_trends}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis tickFormatter={(v) => `${(v / 1e6).toFixed(1)}jt`} className="text-xs" />
                      <Tooltip formatter={(v: number) => formatRupiah(v)} />
                      <Legend />
                      <Line type="monotone" dataKey="avg_price" name="Rata-rata" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="median_price" name="Median" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                    </ReLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Data tren harga tidak tersedia.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 4: Occupancy Forecast */}
          <TabsContent value="occupancy" className="space-y-4">
            {!occData ? (
              <Card className="rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground/40 mb-4" aria-hidden="true" />
                  <p className="text-muted-foreground mb-4">Prediksi okupansi 3-6 bulan ke depan dengan AI.</p>
                  <Button
                    onClick={() => occForecast.mutate({ forecastMonths: 6, propertyId })}
                    disabled={occForecast.isPending}
                    className="gradient-cta rounded-xl"
                  >
                    {occForecast.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />}
                    Buat Prediksi
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary */}
                {occData.summary && (
                  <Card className="rounded-2xl bg-primary/5 border-primary/20" role="region" aria-label="Ringkasan Prediksi Okupansi">
                    <CardContent className="py-4">
                      <p className="text-sm font-medium">Analisis Prediksi:</p>
                      <p className="text-sm mt-1">{occData.summary}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Turnover KPI Strip */}
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                  <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Turnover Saat Ini</p>
                      <p className="text-2xl font-bold">{(occData.turnover_metrics.current_turnover_rate * 100).toFixed(1)}%</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Prediksi Turnover</p>
                      <p className="text-2xl font-bold">{(occData.turnover_metrics.predicted_turnover_rate * 100).toFixed(1)}%</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Rata-rata Kekosongan</p>
                      <p className="text-2xl font-bold">{occData.turnover_metrics.avg_vacancy_days}<span className="text-sm font-normal text-muted-foreground"> hari</span></p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Tren</p>
                      <Badge variant={occData.turnover_metrics.trend === "improving" ? "default" : occData.turnover_metrics.trend === "worsening" ? "destructive" : "secondary"} className="rounded-full mt-1">
                        {occData.turnover_metrics.trend === "improving" ? "↗ Membaik" : occData.turnover_metrics.trend === "worsening" ? "↘ Menurun" : "→ Stabil"}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                {/* Occupancy Prediction Chart */}
                {occData.monthly_predictions.length > 0 && (
                  <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40" role="region" aria-label="Grafik Prediksi Okupansi">
                    <CardHeader><CardTitle className="text-base">Prediksi Okupansi Bulanan</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={320}>
                        <AreaChart data={occData.monthly_predictions.map(p => ({
                          ...p,
                          rate_pct: +(p.predicted_occupancy_rate * 100).toFixed(1),
                          upper: +((p.predicted_occupancy_rate + (1 - p.confidence) * 0.1) * 100).toFixed(1),
                          lower: +((p.predicted_occupancy_rate - (1 - p.confidence) * 0.1) * 100).toFixed(1),
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} className="text-xs" />
                          <Tooltip formatter={(v: number) => `${v}%`} />
                          <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(var(--primary) / 0.1)" />
                          <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(var(--background))" />
                          <Line type="monotone" dataKey="rate_pct" name="Okupansi" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Seasonal Patterns */}
                {occData.seasonal_patterns.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Pola Musiman</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {occData.seasonal_patterns.map((sp, i) => (
                        <Card key={i} className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                          <CardContent className="pt-4 pb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={sp.pattern_type === "peak" ? "default" : sp.pattern_type === "low" ? "destructive" : "secondary"} className="text-xs rounded-full">
                                {sp.pattern_type === "peak" ? "🔥 Puncak" : sp.pattern_type === "low" ? "❄️ Rendah" : "🔄 Transisi"}
                              </Badge>
                              <span className="font-medium text-sm">{sp.period}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{sp.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {occData.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" /> Peringatan
                    </h3>
                    {occData.warnings.map((w, i) => (
                      <Card key={i} className={`rounded-2xl border-l-4 ${
                        w.severity === "critical" || w.severity === "high" ? "border-l-destructive bg-destructive/5"
                          : w.severity === "medium" ? "border-l-warning bg-warning/5"
                          : "border-l-muted-foreground bg-muted/30"
                      }`} role="alert">
                        <CardContent className="py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={w.severity === "critical" || w.severity === "high" ? "destructive" : "secondary"} className="text-xs rounded-full">
                              {w.severity === "critical" ? "Kritis" : w.severity === "high" ? "Tinggi" : w.severity === "medium" ? "Sedang" : "Rendah"}
                            </Badge>
                            <span className="font-medium text-sm">{w.type}</span>
                          </div>
                          <p className="text-sm">{w.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">💡 Saran: {w.recommended_action}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* What-If Price Elasticity Simulator */}
                <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40" role="region" aria-label="Simulasi Elastisitas Harga">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden="true" />
                      Simulasi Elastisitas Harga
                    </CardTitle>
                    <CardDescription>
                      Jika harga berubah, bagaimana dampak terhadap okupansi dan pendapatan?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {(() => {
                      const currentOcc = occData.monthly_predictions?.[0]?.predicted_occupancy_rate ?? 0.85;
                      const newOcc = Math.min(1, Math.max(0, currentOcc * (1 + elasticity * (priceChangePct / 100))));
                      const baseRevenue = currentOcc * 100; // normalized
                      const newRevenue = newOcc * (100 + priceChangePct);
                      const revenueDiff = newRevenue - baseRevenue;
                      return (
                        <>
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium">Perubahan Harga</span>
                              <Badge variant={priceChangePct === 0 ? 'secondary' : priceChangePct > 0 ? 'default' : 'destructive'} className="rounded-full text-sm px-3">
                                {priceChangePct > 0 ? '+' : ''}{priceChangePct}%
                              </Badge>
                            </div>
                            <Slider
                              value={[priceChangePct]}
                              onValueChange={(v) => setPriceChangePct(v[0])}
                              min={-20}
                              max={20}
                              step={1}
                              aria-label="Slider perubahan harga"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                              <span>-20%</span><span>0%</span><span>+20%</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 rounded-xl bg-muted/50">
                              <p className="text-xs text-muted-foreground mb-1">Okupansi Saat Ini</p>
                              <p className="text-xl font-bold">{(currentOcc * 100).toFixed(1)}%</p>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/20">
                              <p className="text-xs text-muted-foreground mb-1">Prediksi Okupansi</p>
                              <p className="text-xl font-bold text-primary">{(newOcc * 100).toFixed(1)}%</p>
                              <p className="text-[10px] text-muted-foreground">
                                {((newOcc - currentOcc) * 100) > 0 ? '+' : ''}{((newOcc - currentOcc) * 100).toFixed(1)}pp
                              </p>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-muted/50">
                              <p className="text-xs text-muted-foreground mb-1">Dampak Revenue</p>
                              <p className={`text-xl font-bold ${revenueDiff >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                                {revenueDiff >= 0 ? '+' : ''}{revenueDiff.toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          {/* Visual comparison bar */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-20">Saat Ini</span>
                              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-muted-foreground/40 rounded-full transition-all" style={{ width: `${currentOcc * 100}%` }} />
                              </div>
                              <span className="text-xs w-12 text-right">{(currentOcc * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-20">Prediksi</span>
                              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${newOcc * 100}%` }} />
                              </div>
                              <span className="text-xs w-12 text-right">{(newOcc * 100).toFixed(0)}%</span>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground">
                            💡 Elastisitas harga: {elasticity} — Setiap 10% penurunan harga meningkatkan okupansi ~5%.
                          </p>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Anomalies */}
                {(occData.anomalies || []).length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Activity className="h-4 w-4 text-warning" aria-hidden="true" /> Anomali Terdeteksi
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(occData.anomalies as OccupancyAnomaly[]).map((a, i) => (
                        <Card key={i} className={`rounded-2xl border-l-4 ${
                          a.severity === "high" ? "border-l-destructive bg-destructive/5"
                            : a.severity === "medium" ? "border-l-warning bg-warning/5"
                            : "border-l-muted-foreground bg-muted/30"
                        }`}>
                          <CardContent className="py-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={a.severity === "high" ? "destructive" : "secondary"} className="text-xs rounded-full">
                                {a.anomaly_type === "spike" ? "📈 Lonjakan" : a.anomaly_type === "drop" ? "📉 Penurunan" : a.anomaly_type === "off_season" ? "🔀 Di Luar Musim" : "⚡ Perubahan Tren"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{a.period}</span>
                            </div>
                            <p className="text-sm">{a.description}</p>
                            {a.expected_value != null && a.actual_value != null && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Ekspektasi: {(a.expected_value * 100).toFixed(0)}% | Aktual: {(a.actual_value * 100).toFixed(0)}%
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </TierGate>
    </div>
  );
}
