import { useAdminGuard } from '@/features/auth/hooks/useAdminGuard';
import { AdminRecentActivityList } from '@/features/dashboard/components/AdminRecentActivityList';
import { AdminRevenueChart } from '@/features/dashboard/components/AdminRevenueChart';
import { AdminStatsCards } from '@/features/dashboard/components/AdminStatsCards';
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardStats';
import { AdminLayout } from '@/shared/components/layouts/AdminLayout';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useState } from 'react';

export default function AdminDashboard() {
  const { isLoading: guardLoading, isAdmin } = useAdminGuard();
  
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  
  const { 
    statsData, 
    pendingVerifications, 
    recentActivity, 
    isLoading, 
    refresh 
  } = useDashboardStats(dateRange, isAdmin);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  if (guardLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Dashboard"
      description="Overview of your platform's performance and recent activities."
      actions={
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button>Download Report</Button>
        </div>
      }
    >
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <AdminStatsCards statsData={statsData} isLoading={isLoading} />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <AdminRevenueChart />
            <AdminRecentActivityList />
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
