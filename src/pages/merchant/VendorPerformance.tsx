import { useAuth } from '@/features/auth/hooks/useAuth';
import { useVendorPerformance, useVendorHistory, useTogglePreferred } from '@/features/vendor-management/hooks/useVendorPerformance';
import type { VendorPerformanceData } from '@/features/vendor-management/services/vendorPerformanceService';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { formatCurrency } from '@/shared/utils/currency';
import { useToast } from '@/shared/hooks/use-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Clock, Loader2, Star, StarOff, TrendingUp, Users, Wallet, Wrench,
} from 'lucide-react';
import { useState } from 'react';

export default function VendorPerformance() {
  const { merchant } = useAuth();
  const { data: vendors = [], isLoading } = useVendorPerformance(merchant?.id);
  const togglePref = useTogglePreferred();
  const { toast } = useToast();

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [historyVendorId, setHistoryVendorId] = useState<string>('');

  const totalVendors = vendors.length;
  const avgRating = vendors.length > 0
    ? vendors.reduce((s, v) => s + (v.rating || 0), 0) / vendors.length
    : 0;
  const avgResponse = vendors.filter(v => v.avg_response_hours != null).length > 0
    ? vendors.reduce((s, v) => s + (v.avg_response_hours || 0), 0) / vendors.filter(v => v.avg_response_hours != null).length
    : 0;
  const totalSpend = vendors.reduce((s, v) => s + v.total_cost, 0);

  const handleTogglePreferred = (v: VendorPerformanceData) => {
    if (!merchant?.id) return;
    togglePref.mutate(
      { vendorId: v.vendor_id, merchantId: merchant.id, isPreferred: !v.is_preferred },
      { onSuccess: () => toast({ title: v.is_preferred ? 'Vendor dihapus dari favorit' : 'Vendor ditandai favorit' }) }
    );
  };

  // Comparison data
  const compVendors = vendors.filter(v => compareIds.includes(v.vendor_id));
  const compData = compVendors.map(v => ({
    name: v.business_name,
    'Waktu Respon (jam)': Math.round(v.avg_response_hours || 0),
    'Biaya per Job': Math.round(v.cost_per_job),
    'Rating': Number((v.rating || 0).toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      <PageHeader icon={TrendingUp} title="Performa Vendor" description="Analisis performa, biaya, dan keandalan vendor Anda." />

      {/* Stats Strip */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { icon: Users, label: 'Total Vendor', value: totalVendors, color: 'from-primary/20 to-primary/5' },
          { icon: Star, label: 'Rata-rata Rating', value: avgRating.toFixed(1), color: 'from-warning/20 to-warning/5' },
          { icon: Clock, label: 'Rata-rata Respon', value: `${Math.round(avgResponse)} jam`, color: 'from-success/20 to-success/5' },
          { icon: Wallet, label: 'Total Pengeluaran', value: formatCurrency(totalSpend), color: 'from-accent/20 to-accent/5' },
        ].map(s => (
          <Card key={s.label} className="rounded-2xl border-border/40">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="rounded-xl">
            <TabsTrigger value="summary" className="rounded-lg">Ringkasan</TabsTrigger>
            <TabsTrigger value="compare" className="rounded-lg">Perbandingan</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg">Riwayat</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary">
            <Card className="rounded-2xl border-border/40">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Spesialisasi</TableHead>
                      <TableHead className="text-center">Rating</TableHead>
                      <TableHead className="text-center">Job</TableHead>
                      <TableHead className="text-right">Respon (jam)</TableHead>
                      <TableHead className="text-right">Total Biaya</TableHead>
                      <TableHead className="text-center">Favorit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada data vendor.</TableCell></TableRow>
                    ) : vendors.map(v => (
                      <TableRow key={v.vendor_id}>
                        <TableCell className="font-medium">{v.business_name}</TableCell>
                        <TableCell>
                          {v.service_categories?.slice(0, 2).map(c => (
                            <Badge key={c} variant="secondary" className="mr-1 text-xs">{c}</Badge>
                          ))}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="flex items-center justify-center gap-1">
                            <Star className="h-3 w-3 text-warning fill-warning" />
                            {(v.rating || 0).toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{v.total_jobs}</TableCell>
                        <TableCell className="text-right">{v.avg_response_hours != null ? Math.round(v.avg_response_hours) : '-'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(v.total_cost)}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTogglePreferred(v)}
                            className="h-8 w-8"
                          >
                            {v.is_preferred ? <Star className="h-4 w-4 text-warning fill-warning" /> : <StarOff className="h-4 w-4 text-muted-foreground" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="compare">
            <Card className="rounded-2xl border-border/40">
              <CardHeader>
                <CardTitle>Perbandingan Vendor</CardTitle>
                <CardDescription>Pilih 2-3 vendor untuk dibandingkan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {vendors.map(v => (
                    <Button
                      key={v.vendor_id}
                      variant={compareIds.includes(v.vendor_id) ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-xl"
                      onClick={() => {
                        setCompareIds(prev =>
                          prev.includes(v.vendor_id)
                            ? prev.filter(id => id !== v.vendor_id)
                            : prev.length < 3
                              ? [...prev, v.vendor_id]
                              : prev
                        );
                      }}
                    >
                      {v.business_name}
                    </Button>
                  ))}
                </div>
                {compData.length >= 2 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={compData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Waktu Respon (jam)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Rating" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Pilih minimal 2 vendor untuk melihat perbandingan.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="rounded-2xl border-border/40">
              <CardHeader>
                <CardTitle>Riwayat Pekerjaan</CardTitle>
                <CardDescription>Pilih vendor untuk melihat riwayat</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={historyVendorId} onValueChange={setHistoryVendorId}>
                  <SelectTrigger className="rounded-xl w-64"><SelectValue placeholder="Pilih vendor" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {vendors.map(v => (
                      <SelectItem key={v.vendor_id} value={v.vendor_id}>{v.business_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {historyVendorId && <VendorHistoryTable vendorId={historyVendorId} merchantId={merchant?.id || ''} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function VendorHistoryTable({ vendorId, merchantId }: { vendorId: string; merchantId: string }) {
  const { data: history = [], isLoading } = useVendorHistory(vendorId, merchantId);

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pekerjaan</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Biaya</TableHead>
          <TableHead className="text-center">Rating</TableHead>
          <TableHead>Tanggal</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.length === 0 ? (
          <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Belum ada riwayat.</TableCell></TableRow>
        ) : history.map(j => (
          <TableRow key={j.id}>
            <TableCell className="font-medium">{j.title}</TableCell>
            <TableCell><Badge variant="secondary" className="capitalize text-xs">{j.status}</Badge></TableCell>
            <TableCell className="text-right">{j.agreed_price ? formatCurrency(j.agreed_price) : '-'}</TableCell>
            <TableCell className="text-center">
              {j.rating ? (
                <span className="flex items-center justify-center gap-1"><Star className="h-3 w-3 text-warning fill-warning" />{j.rating}</span>
              ) : '-'}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{new Date(j.created_at).toLocaleDateString('id-ID')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
