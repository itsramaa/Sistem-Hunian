import { VendorLayout } from '@/shared/components/layouts/VendorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { 
  Wallet, 
  TrendingUp, 
  Download,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format, startOfMonth, startOfWeek, isAfter } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatCurrency } from '@/shared/utils/currency';
import { formatFeePercentage, VENDOR_PLATFORM_FEE_PERCENT } from '@/constants/platformFees';
import { getPaymentStatusColor } from '@/shared/utils/statusColors';

interface VendorEarning {
  id: string;
  vendor_id: string;
  vendor_job_id: string;
  amount: number;
  fee_amount: number;
  net_amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  vendor_jobs: {
    id: string;
    maintenance_requests: {
      title: string;
    };
  };
}

export default function VendorEarnings() {
  const { vendor } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  // Fetch vendor earnings from database
  const { data: earnings = [], isLoading, error } = useQuery({
    queryKey: ['vendor-earnings', vendor?.id],
    queryFn: async () => {
      if (!vendor) return [];

      const { data, error } = await supabase
        .from('vendor_earnings')
        .select(`
          *,
          vendor_jobs (
            id,
            maintenance_requests (
              title
            )
          )
        `)
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VendorEarning[];
    },
    enabled: !!vendor,
  });

  // Fetch completed jobs count
  const { data: completedJobsCount = 0 } = useQuery({
    queryKey: ['vendor-completed-jobs', vendor?.id],
    queryFn: async () => {
      if (!vendor) return 0;

      const { count, error } = await supabase
        .from('vendor_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendor.id)
        .eq('status', 'completed');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!vendor,
  });

  // Calculate stats - Fixed balance calculation to include pending
  const totalEarnings = earnings.reduce((sum, e) => sum + e.net_amount, 0);
  const paidAmount = earnings
    .filter(e => e.status === 'paid')
    .reduce((sum, e) => sum + e.net_amount, 0);
  const pendingPayouts = earnings
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + e.net_amount, 0);
  const processingAmount = earnings
    .filter(e => e.status === 'processing')
    .reduce((sum, e) => sum + e.net_amount, 0);
  
  // Available balance = total - paid - processing (pending is available)
  const availableBalance = totalEarnings - paidAmount - processingAmount;
  
  const thisMonthStart = startOfMonth(new Date());
  const thisMonthEarnings = earnings
    .filter(e => isAfter(new Date(e.created_at), thisMonthStart))
    .reduce((sum, e) => sum + e.net_amount, 0);

  // Filter earnings by period
  const filteredEarnings = earnings.filter(earning => {
    if (selectedPeriod === 'all') return true;
    
    const earningDate = new Date(earning.created_at);
    if (selectedPeriod === 'month') {
      return isAfter(earningDate, thisMonthStart);
    }
    if (selectedPeriod === 'week') {
      return isAfter(earningDate, startOfWeek(new Date()));
    }
    return true;
  });

  // Export statement as CSV
  const handleExportStatement = () => {
    if (filteredEarnings.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const headers = ['Date', 'Description', 'Gross Amount', 'Fee', 'Net Amount', 'Status'];
    const rows = filteredEarnings.map(earning => [
      format(new Date(earning.created_at), 'yyyy-MM-dd'),
      earning.vendor_jobs?.maintenance_requests?.title || 'Job Completion',
      earning.amount.toString(),
      earning.fee_amount.toString(),
      earning.net_amount.toString(),
      earning.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `earnings-statement-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Statement exported successfully');
  };

  const stats = [
    {
      title: 'Available Balance',
      value: formatCurrency(availableBalance),
      icon: Wallet,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Pending Payouts',
      value: formatCurrency(pendingPayouts),
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'This Month',
      value: formatCurrency(thisMonthEarnings),
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Jobs Completed',
      value: completedJobsCount,
      icon: Wallet,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ];

  const getStatusBadge = (status: string) => {
    const variant = getPaymentStatusColor(status);
    return (
      <Badge variant={variant} className="capitalize">
        {status}
      </Badge>
    );
  };

  // Loading skeleton
  const StatsSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map(i => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const TableSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );

  return (
    <VendorLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Earnings</h1>
            <p className="text-muted-foreground">Track your income and payouts</p>
          </div>
          <Button variant="outline" onClick={handleExportStatement} disabled={filteredEarnings.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export Statement
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Failed to load earnings</p>
                  <p className="text-sm text-muted-foreground">Please try refreshing the page.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your earnings from completed jobs</CardDescription>
              </div>
              <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="month">This Month</TabsTrigger>
                  <TabsTrigger value="week">This Week</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton />
            ) : filteredEarnings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>Fee ({formatFeePercentage()})</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEarnings.map((earning) => (
                    <TableRow key={earning.id}>
                      <TableCell className="font-medium">
                        {format(new Date(earning.created_at), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        {earning.vendor_jobs?.maintenance_requests?.title || 'Job Completion'}
                      </TableCell>
                      <TableCell>{formatCurrency(earning.amount)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        -{formatCurrency(earning.fee_amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(earning.status)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(earning.net_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transactions yet</p>
                <p className="text-sm">Complete jobs to start earning</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout Information */}
        <Card>
          <CardHeader>
            <CardTitle>Payout Information</CardTitle>
            <CardDescription>How and when you get paid</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Payment Schedule</h4>
                <p className="text-sm text-muted-foreground">
                  Earnings are processed and paid out weekly on Fridays. Minimum payout is Rp 50,000.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Platform Fee</h4>
                <p className="text-sm text-muted-foreground">
                  A {formatFeePercentage()} platform fee is deducted from each completed job to cover payment processing and platform services.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  );
}
