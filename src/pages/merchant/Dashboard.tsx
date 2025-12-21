import { 
  TrendingUp,
  Home,
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Bell,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MerchantLayout } from '@/components/layouts/MerchantLayout';
import { useAuth } from '@/hooks/useAuth';

const stats = [
  {
    title: 'Occupancy Rate',
    value: '87%',
    change: '+3%',
    changeType: 'positive' as const,
    icon: Home,
    description: '26 of 30 units occupied',
  },
  {
    title: 'Monthly Revenue',
    value: 'Rp 156.5M',
    change: '+12.5%',
    changeType: 'positive' as const,
    icon: TrendingUp,
    description: 'This month',
  },
  {
    title: 'Escrow Balance',
    value: 'Rp 45.2M',
    change: '',
    changeType: 'neutral' as const,
    icon: Wallet,
    description: 'Available for disbursement',
  },
  {
    title: 'Active Tenants',
    value: '26',
    change: '+2',
    changeType: 'positive' as const,
    icon: Users,
    description: 'Across 3 properties',
  },
];

const upcomingPayments = [
  { id: 1, tenant: 'John Doe', unit: 'Unit A-101', amount: 'Rp 5.500.000', dueDate: '25 Dec 2024', status: 'upcoming' },
  { id: 2, tenant: 'Jane Smith', unit: 'Unit B-203', amount: 'Rp 4.200.000', dueDate: '28 Dec 2024', status: 'upcoming' },
  { id: 3, tenant: 'Ahmad Rizki', unit: 'Unit A-105', amount: 'Rp 6.000.000', dueDate: '01 Jan 2025', status: 'upcoming' },
];

const recentPayments = [
  { id: 1, tenant: 'Maria Garcia', unit: 'Unit C-301', amount: 'Rp 5.000.000', date: '20 Dec 2024', status: 'paid' },
  { id: 2, tenant: 'Budi Santoso', unit: 'Unit A-102', amount: 'Rp 4.800.000', date: '19 Dec 2024', status: 'paid' },
  { id: 3, tenant: 'Lisa Chen', unit: 'Unit B-205', amount: 'Rp 5.200.000', date: '18 Dec 2024', status: 'paid' },
];

export default function MerchantDashboard() {
  const { merchant } = useAuth();

  return (
    <MerchantLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's an overview of your properties.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>
        </div>

        {/* Verification Banner */}
        {merchant?.verification_status === 'pending' && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium">Complete your verification</p>
                  <p className="text-sm text-muted-foreground">Upload required documents to start receiving payments</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Complete Now</Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-card-hover transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {stat.changeType === 'positive' && stat.change && (
                    <span className="flex items-center text-sm text-success">
                      <ArrowUpRight className="h-4 w-4" />
                      {stat.change}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Occupancy Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Property Occupancy</CardTitle>
            <CardDescription>Current occupancy across all your properties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Kost Harmoni</span>
                <span className="text-sm text-muted-foreground">10/12 units</span>
              </div>
              <Progress value={83} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Apartemen Sudirman</span>
                <span className="text-sm text-muted-foreground">14/15 units</span>
              </div>
              <Progress value={93} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Rumah Kontrakan Menteng</span>
                <span className="text-sm text-muted-foreground">2/3 units</span>
              </div>
              <Progress value={66} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming Payments</CardTitle>
                <CardDescription>Expected payments this week</CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{payment.tenant}</p>
                      <p className="text-xs text-muted-foreground">{payment.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{payment.amount}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{payment.dueDate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Latest received payments</CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{payment.tenant}</p>
                      <p className="text-xs text-muted-foreground">{payment.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm text-success">{payment.amount}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge variant="outline" className="text-xs text-success border-success/30">
                          Paid
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MerchantLayout>
  );
}
