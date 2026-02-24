import { useState } from "react";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { useDssHealthMetrics } from "@/features/dss/hooks/useDssHealthMetrics";
import { useRlsMonitor } from "@/features/dss/hooks/useRlsMonitor";
import { useRlsAlertSettings } from "@/features/dss/hooks/useRlsAlertSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Progress } from "@/shared/components/ui/progress";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Loader2, Activity, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Brain, ScanText, BarChart3, Clock, Bell, Settings2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/shared/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  completed: "hsl(var(--success))",
  failed: "hsl(var(--destructive))",
  requires_review: "hsl(var(--warning))",
  processing: "hsl(var(--info))",
};

const chartConfig: ChartConfig = {
  count: { label: "Jumlah", color: "hsl(var(--primary))" },
  errors: { label: "Error", color: "hsl(var(--destructive))" },
};

function DssHealth() {
  const { data: metrics, isLoading: metricsLoading } = useDssHealthMetrics();
  const { data: rlsData, isLoading: rlsLoading } = useRlsMonitor(7);
  const { data: alertSettings, isLoading: alertLoading, updateSetting } = useRlsAlertSettings();
  const [editingAlert, setEditingAlert] = useState(false);
  const [alertForm, setAlertForm] = useState({ denial_threshold: 10, window_minutes: 60, alert_cooldown_minutes: 30 });

  if (metricsLoading || rlsLoading) {
    return (
      <AdminLayout title="Monitor Kesehatan DSS" description="Kesehatan layer DSS dan pemantauan RLS waktu nyata">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Monitor Kesehatan DSS" description="Kesehatan layer DSS, metrik, dan pemantauan keamanan">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="ocr">Performa OCR</TabsTrigger>
          <TabsTrigger value="models">Eksekusi Model</TabsTrigger>
          <TabsTrigger value="validation">Audit Validasi</TabsTrigger>
          <TabsTrigger value="rls">Monitor RLS</TabsTrigger>
        </TabsList>

        {/* ── Overview ────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Tingkat Keberhasilan OCR"
              value={`${metrics?.ocrSuccessRate.toFixed(1)}%`}
              icon={<ScanText className="h-4 w-4" />}
              description={`${metrics?.totalOcrRuns || 0} total eksekusi (30h)`}
              status={getHealthStatus(metrics?.ocrSuccessRate || 0, 90, 70)}
            />
            <MetricCard
              title="Rata-rata Waktu Proses"
              value={`${((metrics?.ocrAvgProcessingMs || 0) / 1000).toFixed(1)}s`}
              icon={<Clock className="h-4 w-4" />}
              description="Target: < 3d"
              status={getHealthStatus(3000 - (metrics?.ocrAvgProcessingMs || 0), 0, -2000)}
            />
            <MetricCard
              title="Tingkat Kesalahan Model"
              value={`${metrics?.modelErrorRate.toFixed(1)}%`}
              icon={<Brain className="h-4 w-4" />}
              description={`${metrics?.totalModelRuns || 0} eksekusi model (30h)`}
              status={getHealthStatus(100 - (metrics?.modelErrorRate || 0), 95, 85)}
            />
            <MetricCard
              title="Kegagalan Validasi"
              value={`${metrics?.validationStats.failed || 0}`}
              icon={<ShieldAlert className="h-4 w-4" />}
              description={`${metrics?.validationStats.total || 0} total validasi`}
              status={(metrics?.validationStats.failed || 0) === 0 ? "healthy" : "warning"}
            />
          </div>

          {/* RLS Security Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Penolakan RLS (7h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rlsData?.deniedRequests || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {rlsData?.denialRate.toFixed(2)}% tingkat penolakan
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tabel Paling Sering Ditolak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rlsData?.denialsByTable[0]?.table || "None"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {rlsData?.denialsByTable[0]?.count || 0} penolakan
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rata-rata Kepercayaan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics?.ocrAvgConfidence || 0).toFixed(1)}%
                </div>
                <Progress value={metrics?.ocrAvgConfidence || 0} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── OCR Performance ─────────────────────────────────── */}
        <TabsContent value="ocr" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* OCR by Type Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">OCR Berdasarkan Tipe Dokumen</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics?.ocrByType && metrics.ocrByType.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <BarChart data={metrics.ocrByType.map(d => ({ name: d.type, count: d.count, confidence: d.avgConfidence.toFixed(0) }))}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">Belum ada data OCR</p>
                )}
              </CardContent>
            </Card>

            {/* OCR Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribusi Status OCR</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics?.recentOcrResults && metrics.recentOcrResults.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <PieChart>
                      <Pie
                        data={Object.entries(
                          metrics.recentOcrResults.reduce((acc: Record<string, number>, r) => {
                            acc[r.status] = (acc[r.status] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([name, value]) => ({ name, value }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {Object.entries(
                          metrics.recentOcrResults.reduce((acc: Record<string, number>, r) => {
                            acc[r.status] = (acc[r.status] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([name]) => (
                          <Cell key={name} fill={STATUS_COLORS[name] || "hsl(var(--muted))"} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">Belum ada data OCR</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent OCR Results Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hasil OCR Terakhir</CardTitle>
              <CardDescription>20 proses OCR terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kepercayaan</TableHead>
                    <TableHead>Pemrosesan</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(metrics?.recentOcrResults || []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.document_type}</TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell>{(r.confidence_score || 0).toFixed(1)}%</TableCell>
                      <TableCell>{((r.processing_time_ms || 0) / 1000).toFixed(1)}s</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {format(new Date(r.created_at), "dd/MM HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!metrics?.recentOcrResults || metrics.recentOcrResults.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Belum ada hasil OCR
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Model Runs ──────────────────────────────────────── */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Eksekusi Model per Fungsi</CardTitle>
              <CardDescription>Rincian performa per fungsi AI (30h)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fungsi</TableHead>
                    <TableHead>Eksekusi</TableHead>
                    <TableHead>Waktu Rata-rata</TableHead>
                    <TableHead>Kesalahan</TableHead>
                    <TableHead>Tingkat Kesalahan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(metrics?.modelRunsByFunction || []).map((m) => (
                    <TableRow key={m.function_name}>
                      <TableCell className="font-medium font-mono text-xs">{m.function_name}</TableCell>
                      <TableCell>{m.count}</TableCell>
                      <TableCell>{(m.avgTime / 1000).toFixed(1)}s</TableCell>
                      <TableCell>{m.errorCount}</TableCell>
                      <TableCell>
                        <Badge variant={m.errorCount === 0 ? "default" : "destructive"}>
                          {m.count > 0 ? ((m.errorCount / m.count) * 100).toFixed(1) : 0}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!metrics?.modelRunsByFunction || metrics.modelRunsByFunction.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Belum ada eksekusi model
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Validation Audit ────────────────────────────────── */}
        <TabsContent value="validation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.validationStats.total || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-4 w-4" /> Lulus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{metrics?.validationStats.passed || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" /> Gagal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{metrics?.validationStats.failed || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-4 w-4" /> Peringatan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{metrics?.validationStats.warnings || 0}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── RLS Monitor ─────────────────────────────────────── */}
        <TabsContent value="rls" className="space-y-4">
          {/* Alert Settings Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Pengaturan Alert RLS</CardTitle>
                </div>
                {alertSettings?.[0] && (
                  <Badge variant={alertSettings[0].is_active ? "default" : "secondary"}>
                    {alertSettings[0].is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                )}
              </div>
              <CardDescription>Konfigurasi threshold dan cooldown untuk alert denial RLS</CardDescription>
            </CardHeader>
            <CardContent>
              {alertLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : alertSettings?.[0] ? (
                <div className="space-y-4">
                  {!editingAlert ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Threshold Denial</p>
                        <p className="text-lg font-semibold">{alertSettings[0].denial_threshold}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Window (menit)</p>
                        <p className="text-lg font-semibold">{alertSettings[0].window_minutes}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cooldown (menit)</p>
                        <p className="text-lg font-semibold">{alertSettings[0].alert_cooldown_minutes}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Alert Terakhir</p>
                        <p className="text-sm font-medium">
                          {alertSettings[0].last_alert_at
                            ? format(new Date(alertSettings[0].last_alert_at), "dd/MM/yy HH:mm")
                            : "Belum pernah"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="threshold">Threshold Denial</Label>
                        <Input id="threshold" type="number" min={1} value={alertForm.denial_threshold}
                          onChange={(e) => setAlertForm(p => ({ ...p, denial_threshold: +e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="window">Window (menit)</Label>
                        <Input id="window" type="number" min={1} value={alertForm.window_minutes}
                          onChange={(e) => setAlertForm(p => ({ ...p, window_minutes: +e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="cooldown">Cooldown (menit)</Label>
                        <Input id="cooldown" type="number" min={1} value={alertForm.alert_cooldown_minutes}
                          onChange={(e) => setAlertForm(p => ({ ...p, alert_cooldown_minutes: +e.target.value }))} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alertSettings[0].is_active}
                        onCheckedChange={(checked) =>
                          updateSetting.mutate({ id: alertSettings[0].id, is_active: checked })
                        }
                      />
                      <span className="text-sm">{alertSettings[0].is_active ? "Alert Aktif" : "Alert Nonaktif"}</span>
                    </div>
                    <div className="flex-1" />
                    {editingAlert ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setEditingAlert(false)}>Batal</Button>
                        <Button size="sm" onClick={() => {
                          updateSetting.mutate({ id: alertSettings[0].id, ...alertForm });
                          setEditingAlert(false);
                        }}>Simpan</Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => {
                        setAlertForm({
                          denial_threshold: alertSettings[0].denial_threshold,
                          window_minutes: alertSettings[0].window_minutes,
                          alert_cooldown_minutes: alertSettings[0].alert_cooldown_minutes,
                        });
                        setEditingAlert(true);
                      }}>
                        <Settings2 className="h-3 w-3" /> Edit
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada pengaturan alert</p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Denials by Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Denials by Table</CardTitle>
              </CardHeader>
              <CardContent>
                {rlsData?.denialsByTable && rlsData.denialsByTable.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <BarChart data={rlsData.denialsByTable.slice(0, 10)} layout="vertical">
                      <XAxis type="number" />
                      <YAxis dataKey="table" type="category" width={120} className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="hsl(var(--destructive))" radius={4} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">No RLS denials recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Denials by Operation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Denials by Operation</CardTitle>
              </CardHeader>
              <CardContent>
                {rlsData?.denialsByOperation && rlsData.denialsByOperation.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <BarChart data={rlsData.denialsByOperation}>
                      <XAxis dataKey="operation" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="hsl(var(--warning))" radius={4} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">No RLS denials recorded</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Denials Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-destructive" />
                Recent Access Denials
              </CardTitle>
              <CardDescription>Unauthorized access attempts (7d)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>User Role</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(rlsData?.recentDenials || []).slice(0, 20).map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.table_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{d.operation}</Badge>
                      </TableCell>
                      <TableCell>{d.user_role || "unknown"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {d.error_message || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(d.created_at), "dd/MM HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!rlsData?.recentDenials || rlsData.recentDenials.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No access denials recorded — good news!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}

// ── Helper Components ─────────────────────────────────────────────────

function MetricCard({ title, value, icon, description, status }: {
  title: string; value: string; icon: React.ReactNode; description: string;
  status: "healthy" | "warning" | "critical";
}) {
  const statusColor = status === "healthy" ? "text-success" : status === "warning" ? "text-warning" : "text-destructive";
  const statusIcon = status === "healthy" ? <CheckCircle2 className="h-4 w-4" /> : status === "warning" ? <AlertTriangle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className={statusColor}>{statusIcon}</span>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-2xl font-bold">{value}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "completed" ? "default" : status === "failed" ? "destructive" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

function getHealthStatus(value: number, goodThreshold: number, badThreshold: number): "healthy" | "warning" | "critical" {
  if (value >= goodThreshold) return "healthy";
  if (value >= badThreshold) return "warning";
  return "critical";
}

export default DssHealth;
