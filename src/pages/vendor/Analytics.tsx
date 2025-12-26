import { useState } from 'react';
import { VendorLayout } from '@/components/layouts/VendorLayout';
import { useAuth } from '@/hooks/useAuth';
import { SalesAnalytics } from '@/components/vendor/SalesAnalytics';
import { CustomerInsights } from '@/components/vendor/CustomerInsights';
import { AnalyticsExport } from '@/components/vendor/AnalyticsExport';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

type DateRange = '7d' | '30d' | '90d' | 'all';

export default function VendorAnalytics() {
  const { vendor } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  if (!vendor) {
    return (
      <VendorLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[400px]" />
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Track your sales performance and customer insights</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Updated: {format(lastUpdated, 'HH:mm')}</span>
            </div>

            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>

            <AnalyticsExport vendorId={vendor.id} />
          </div>
        </div>

        <SalesAnalytics vendorId={vendor.id} dateRange={dateRange} />
        <CustomerInsights vendorId={vendor.id} dateRange={dateRange} />
      </div>
    </VendorLayout>
  );
}