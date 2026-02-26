import { useAuth } from "@/features/auth/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFinancialSummary } from "@/features/finance/hooks/useFinancialReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Loader2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--accent))",
];

function useMerchantId(userId?: string) {
  return useQuery({
    queryKey: ["merchant-id", userId],
    queryFn: async () => {
      const { data } = await supabase.from("merchants").select("id").eq("user_id", userId!).single();
      return data?.id as string;
    },
    enabled: !!userId,
  });
}

const fmtIDR = (v: number) => `Rp ${(v / 1_000_000).toFixed(1)}jt`;

export default function FinancialReports() {
  const { user } = useAuth();
  const { data: merchantId } = useMerchantId(user?.id);
  const { data: summary, isLoading } = useFinancialSummary(merchantId);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!summary) {
    return <p className="text-muted-foreground text-center py-12">Data belum tersedia.</p>;
  }

  const margin = summary.totalRevenue > 0 ? ((summary.netIncome / summary.totalRevenue) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          Laporan Keuangan
        </h1>
        <p className="text-muted-foreground">Ringkasan pendapatan, pengeluaran, dan laba rugi 6 bulan terakhir.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Pendapatan</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">Rp {summary.totalRevenue.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Pengeluaran</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">Rp {summary.totalExpenses.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Laba Bersih</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${summary.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
              Rp {summary.netIncome.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Margin Laba</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${Number(margin) >= 0 ? "text-green-600" : "text-red-600"}`}>{margin}%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pl">
        <TabsList>
          <TabsTrigger value="pl">Laba Rugi</TabsTrigger>
          <TabsTrigger value="revenue">Pendapatan per Properti</TabsTrigger>
          <TabsTrigger value="expense">Pengeluaran per Kategori</TabsTrigger>
        </TabsList>

        <TabsContent value="pl" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Tren Pendapatan vs Pengeluaran</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={summary.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={fmtIDR} />
                  <Tooltip formatter={(v: number) => `Rp ${v.toLocaleString("id-ID")}`} />
                  <Legend />
                  <Bar dataKey="revenue" name="Pendapatan" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Pengeluaran" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader><CardTitle>Tren Laba Bersih</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={summary.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={fmtIDR} />
                  <Tooltip formatter={(v: number) => `Rp ${v.toLocaleString("id-ID")}`} />
                  <Line type="monotone" dataKey="netIncome" name="Laba Bersih" stroke="hsl(var(--primary))" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Pendapatan per Properti</CardTitle></CardHeader>
            <CardContent>
              {summary.revenueByProperty.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Belum ada data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie data={summary.revenueByProperty} dataKey="revenue" nameKey="property_name" cx="50%" cy="50%" outerRadius={120} label={(e) => e.property_name}>
                      {summary.revenueByProperty.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `Rp ${v.toLocaleString("id-ID")}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expense" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Pengeluaran per Kategori</CardTitle></CardHeader>
            <CardContent>
              {summary.expenseByCategory.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Belum ada data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie data={summary.expenseByCategory} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={120} label={(e) => e.category}>
                      {summary.expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `Rp ${v.toLocaleString("id-ID")}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
