
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { cn } from '@/shared/utils/utils';
import { Activity, DollarSign, Users, Wallet } from 'lucide-react';

interface StatsData {
  totalGMV: number;
  totalMerchants: number;
  totalEscrow: number;
  pendingVerifications: number;
}

interface AdminStatsCardsProps {
  statsData?: StatsData;
  isLoading: boolean;
  className?: string;
}

export function AdminStatsCards({ statsData, isLoading, className }: AdminStatsCardsProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `Rp ${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(0)}M`;
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const stats = [
    {
      title: 'Total Revenue',
      value: isLoading ? '...' : formatCurrency(statsData?.totalGMV || 0),
      change: '+20.1%',
      changeType: 'positive' as const,
      icon: DollarSign,
      description: 'from last month',
    },
    {
      title: 'Active Merchants',
      value: isLoading ? '...' : statsData?.totalMerchants.toString() || '0',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
      description: 'active on platform',
    },
    {
      title: 'Escrow Balance',
      value: isLoading ? '...' : formatCurrency(statsData?.totalEscrow || 0),
      change: '-2.1%',
      changeType: 'negative' as const,
      icon: Wallet,
      description: 'held in escrow',
    },
    {
      title: 'Pending Verifications',
      value: isLoading ? '...' : statsData?.pendingVerifications.toString() || '0',
      change: '+5',
      changeType: 'neutral' as const,
      icon: Activity,
      description: 'awaiting review',
    },
  ];

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className={stat.changeType === 'positive' ? 'text-green-500' : stat.changeType === 'negative' ? 'text-red-500' : 'text-yellow-500'}>
                {stat.change}
              </span>
              {' '}{stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
