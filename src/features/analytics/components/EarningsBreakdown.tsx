import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/shared/utils/currency';
import { formatFeePercentage, VENDOR_PLATFORM_FEE_PERCENT } from '@/constants/platformFees';
import { TrendingUp, TrendingDown, Minus, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/shared/utils/utils';

interface EarningsData {
  totalGross: number;
  totalFees: number;
  totalNet: number;
  byCategory: Array<{ name: string; value: number }>;
  byMonth: Array<{ month: string; gross: number; net: number }>;
  comparison?: {
    previousPeriod: number;
    currentPeriod: number;
    percentChange: number;
  };
}

interface EarningsBreakdownProps {
  data: EarningsData;
  isLoading?: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function EarningsBreakdown({ data, isLoading }: EarningsBreakdownProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Memuat...</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Memuat data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pieData = [
    { name: 'Penghasilan Neto', value: data.totalNet },
    { name: 'Biaya Platform', value: data.totalFees },
  ];
  const keepPercent = 100 - VENDOR_PLATFORM_FEE_PERCENT * 100;

  const getTrendIcon = () => {
    if (!data.comparison) return null;
    if (data.comparison.percentChange > 0) {
      return <TrendingUp className="h-5 w-5 text-success" aria-hidden="true" />;
    } else if (data.comparison.percentChange < 0) {
      return <TrendingDown className="h-5 w-5 text-destructive" aria-hidden="true" />;
    }
    return <Minus className="h-5 w-5 text-muted-foreground" aria-hidden="true" />;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Penghasilan Bruto</p>
                <p className="text-2xl font-bold">{formatCurrency(data.totalGross)}</p>
              </div>
              <div className="p-3 rounded-full bg-muted">
                <DollarSign className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Biaya Platform ({formatFeePercentage()})</p>
                <p className="text-2xl font-bold text-destructive">-{formatCurrency(data.totalFees)}</p>
              </div>
              <div className="p-3 rounded-full bg-destructive/10">
                <ArrowDownRight className="h-5 w-5 text-destructive" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Penghasilan Neto</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(data.totalNet)}</p>
              </div>
              <div className="p-3 rounded-full bg-success/10">
                <ArrowUpRight className="h-5 w-5 text-success" aria-hidden="true" />
              </div>
            </div>
            {data.comparison && (
              <div className={cn(
                'flex items-center gap-1 mt-2 text-sm',
                data.comparison.percentChange >= 0 ? 'text-success' : 'text-destructive'
              )} role="status" aria-live="polite">
                {getTrendIcon()}
                <span>
                  {data.comparison.percentChange >= 0 ? '+' : ''}
                  {data.comparison.percentChange.toFixed(1)}% vs periode sebelumnya
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pie Chart - Earnings vs Fees */}
        <Card role="region" aria-label="Distribusi Penghasilan">
          <CardHeader>
            <CardTitle>Distribusi Penghasilan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="hsl(var(--success))" />
                  <Cell fill="hsl(var(--muted-foreground))" />
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                Anda menyimpan <span className="font-semibold text-success">{keepPercent.toFixed(0)}%</span> dari setiap transaksi
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart - By Category */}
        {data.byCategory.length > 0 && (
          <Card role="region" aria-label="Penghasilan Berdasarkan Kategori">
            <CardHeader>
              <CardTitle>Penghasilan Berdasarkan Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.byCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Monthly Trend */}
      {data.byMonth.length > 0 && (
        <Card role="region" aria-label="Tren Bulanan">
          <CardHeader>
            <CardTitle>Tren Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.byMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="gross" name="Bruto" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net" name="Neto" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
