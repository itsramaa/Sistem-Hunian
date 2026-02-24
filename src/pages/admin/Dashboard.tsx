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
      description="Ringkasan performa platform dan aktivitas terbaru Anda."
      actions={
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih rentang waktu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hari Ini</SelectItem>
              <SelectItem value="7d">7 Hari Terakhir</SelectItem>
              <SelectItem value="30d">30 Hari Terakhir</SelectItem>
              <SelectItem value="all">Semua Waktu</SelectItem>
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
          <Button>Unduh Laporan</Button>
        </div>
      }
    >
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
          <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
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
