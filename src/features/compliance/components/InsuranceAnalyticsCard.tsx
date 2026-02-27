import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, DollarSign, Shield, TrendingUp } from 'lucide-react';
import type { InsuranceClaim, InsurancePolicy } from '../types';
import { getCoverageGaps } from '../services/insuranceRenewalService';
import { formatCurrency } from '@/shared/utils/currency';

interface InsuranceAnalyticsCardProps {
  policies: InsurancePolicy[];
  claims: InsuranceClaim[];
}

export function InsuranceAnalyticsCard({ policies, claims }: InsuranceAnalyticsCardProps) {
  const activePolicies = policies.filter(p => p.status === 'active');
  const totalCoverage = activePolicies.reduce((s, p) => s + p.coverage_amount, 0);
  const totalPremium = activePolicies.reduce((s, p) => s + p.premium_amount, 0);
  const totalClaimed = claims.reduce((s, c) => s + c.claim_amount, 0);
  const totalApproved = claims.reduce((s, c) => s + (c.approved_amount || 0), 0);
  const claimsRatio = totalPremium > 0 ? ((totalClaimed / totalPremium) * 100).toFixed(1) : '0';
  const gaps = getCoverageGaps(policies);

  // Build yearly chart data
  const yearMap = new Map<number, { premium: number; claimed: number }>();
  for (const p of activePolicies) {
    const year = new Date(p.start_date).getFullYear();
    const entry = yearMap.get(year) || { premium: 0, claimed: 0 };
    entry.premium += p.premium_amount;
    yearMap.set(year, entry);
  }
  for (const c of claims) {
    const year = new Date(c.claim_date).getFullYear();
    const entry = yearMap.get(year) || { premium: 0, claimed: 0 };
    entry.claimed += c.claim_amount;
    yearMap.set(year, entry);
  }
  const chartData = Array.from(yearMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, data]) => ({ year: String(year), Premi: data.premium, Klaim: data.claimed }));

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Analitik Asuransi</CardTitle>
        <CardDescription>Ringkasan biaya, klaim, dan cakupan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox icon={<Shield className="h-4 w-4" />} label="Total Cakupan" value={formatCurrency(totalCoverage)} color="text-primary" />
          <StatBox icon={<DollarSign className="h-4 w-4" />} label="Total Premi/Tahun" value={formatCurrency(totalPremium)} color="text-warning" />
          <StatBox icon={<TrendingUp className="h-4 w-4" />} label="Total Klaim" value={formatCurrency(totalClaimed)} color="text-destructive" />
          <StatBox icon={<TrendingUp className="h-4 w-4" />} label="Rasio Klaim" value={`${claimsRatio}%`} color={Number(claimsRatio) > 80 ? 'text-destructive' : 'text-success'} />
        </div>

        {/* Coverage Gaps */}
        {gaps.length > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning">Celah Cakupan Terdeteksi</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tidak ada polis aktif untuk: {gaps.join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-3">Premi vs Klaim per Tahun</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="Premi" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Klaim" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {totalApproved > 0 && (
          <p className="text-xs text-muted-foreground">Total klaim disetujui: {formatCurrency(totalApproved)}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded-xl bg-muted/50 space-y-1">
      <div className={`flex items-center gap-1.5 ${color}`}>{icon}<span className="text-xs">{label}</span></div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
