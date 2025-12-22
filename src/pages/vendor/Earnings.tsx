import { VendorLayout } from '@/components/layouts/VendorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  DollarSign,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

// Mock earnings data - in production this would come from a proper earnings table
const mockEarnings = {
  totalEarnings: 0,
  pendingPayouts: 0,
  thisMonth: 0,
  lastMonth: 0,
  transactions: [] as Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    status: 'completed' | 'pending' | 'processing';
    jobId: string;
  }>,
};

export default function VendorEarnings() {
  const { vendor } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      title: 'Total Earnings',
      value: formatCurrency(mockEarnings.totalEarnings),
      icon: Wallet,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Pending Payouts',
      value: formatCurrency(mockEarnings.pendingPayouts),
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'This Month',
      value: formatCurrency(mockEarnings.thisMonth),
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
      trend: mockEarnings.lastMonth > 0 
        ? ((mockEarnings.thisMonth - mockEarnings.lastMonth) / mockEarnings.lastMonth * 100).toFixed(1)
        : '0',
    },
    {
      title: 'Jobs Completed',
      value: vendor?.total_jobs || 0,
      icon: DollarSign,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-success border-success">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'processing':
        return <Badge variant="default">Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <VendorLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Earnings</h1>
            <p className="text-muted-foreground">Track your income and payouts</p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Statement
          </Button>
        </div>

        {/* Stats Grid */}
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
                {stat.trend && (
                  <div className="flex items-center text-sm mt-1">
                    {parseFloat(stat.trend) >= 0 ? (
                      <>
                        <ArrowUpRight className="h-4 w-4 text-success mr-1" />
                        <span className="text-success">{stat.trend}%</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-4 w-4 text-destructive mr-1" />
                        <span className="text-destructive">{Math.abs(parseFloat(stat.trend))}%</span>
                      </>
                    )}
                    <span className="text-muted-foreground ml-1">vs last month</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

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
            {mockEarnings.transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockEarnings.transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {format(new Date(transaction.date), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(transaction.amount)}
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
                <h4 className="font-medium mb-2">Payment Method</h4>
                <p className="text-sm text-muted-foreground">
                  Payments are sent to your registered bank account. Update your bank details in Settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  );
}
