import { 
  Users, 
  Building2, 
  Wallet, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useAnalytics } from '@/hooks/useAnalytics';

const stats = [
  {
    title: 'Active Merchants',
    value: '248',
    change: '+12%',
    changeType: 'positive' as const,
    icon: Building2,
    description: 'From last month',
  },
  {
    title: 'Total GMV',
    value: 'Rp 2.4B',
    change: '+8.2%',
    changeType: 'positive' as const,
    icon: TrendingUp,
    description: 'Monthly transaction volume',
  },
  {
    title: 'Escrow Balance',
    value: 'Rp 890M',
    change: '-2.1%',
    changeType: 'negative' as const,
    icon: Wallet,
    description: 'Total held funds',
  },
  {
    title: 'Pending Verifications',
    value: '23',
    change: '+5',
    changeType: 'neutral' as const,
    icon: Clock,
    description: 'Awaiting review',
  },
];

const pendingVerifications = [
  { id: 1, name: 'PT Graha Sejahtera', type: 'Merchant', submitted: '2 hours ago', documents: 3 },
  { id: 2, name: 'Kost Putri Melati', type: 'Merchant', submitted: '5 hours ago', documents: 2 },
  { id: 3, name: 'CV Bersih Jaya', type: 'Vendor', submitted: '1 day ago', documents: 4 },
  { id: 4, name: 'Apartemen Sudirman', type: 'Merchant', submitted: '1 day ago', documents: 3 },
];

const recentActivity = [
  { id: 1, action: 'Merchant verified', target: 'Kost Harmoni', time: '10 min ago', status: 'success' },
  { id: 2, action: 'Disbursement completed', target: 'Rp 45.5M to 12 merchants', time: '1 hour ago', status: 'success' },
  { id: 3, action: 'Dispute opened', target: 'Invoice #INV-2024-1234', time: '2 hours ago', status: 'warning' },
  { id: 4, action: 'New subscription', target: 'PT Griya Mandiri upgraded to Pro', time: '3 hours ago', status: 'info' },
];

export default function AdminDashboard() {
  useAnalytics(); // Track page views automatically
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
        </div>

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
                  {stat.changeType === 'positive' && (
                    <span className="flex items-center text-sm text-success">
                      <ArrowUpRight className="h-4 w-4" />
                      {stat.change}
                    </span>
                  )}
                  {stat.changeType === 'negative' && (
                    <span className="flex items-center text-sm text-destructive">
                      <ArrowDownRight className="h-4 w-4" />
                      {stat.change}
                    </span>
                  )}
                  {stat.changeType === 'neutral' && (
                    <span className="text-sm text-muted-foreground">{stat.change}</span>
                  )}
                  <span className="text-xs text-muted-foreground">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Verifications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Verifications</CardTitle>
                <CardDescription>Review and approve merchant/vendor applications</CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingVerifications.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-xs">{item.type}</Badge>
                          <span className="text-xs text-muted-foreground">{item.documents} documents</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{item.submitted}</p>
                      <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs">
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform events and actions</CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-full ${
                      item.status === 'success' ? 'bg-success/10' :
                      item.status === 'warning' ? 'bg-warning/10' : 'bg-info/10'
                    }`}>
                      {item.status === 'success' && <CheckCircle className="h-4 w-4 text-success" />}
                      {item.status === 'warning' && <AlertCircle className="h-4 w-4 text-warning" />}
                      {item.status === 'info' && <TrendingUp className="h-4 w-4 text-info" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.action}</p>
                      <p className="text-sm text-muted-foreground truncate">{item.target}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
