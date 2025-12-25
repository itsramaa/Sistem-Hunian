import { VendorLayout } from '@/components/layouts/VendorLayout';
import { useAuth } from '@/hooks/useAuth';
import { SalesAnalytics } from '@/components/vendor/SalesAnalytics';
import { CustomerInsights } from '@/components/vendor/CustomerInsights';
import { Skeleton } from '@/components/ui/skeleton';

export default function VendorAnalytics() {
  const { vendor } = useAuth();

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
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track your sales performance and customer insights</p>
        </div>

        <SalesAnalytics vendorId={vendor.id} />
        <CustomerInsights vendorId={vendor.id} />
      </div>
    </VendorLayout>
  );
}
