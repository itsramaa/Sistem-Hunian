import { useAdminGuard } from "@/features/auth/hooks/useAdminGuard";
import { AdminOrderFilters } from "@/features/orders/components/admin/AdminOrderFilters";
import { AdminOrderStats } from "@/features/orders/components/admin/AdminOrderStats";
import { AdminOrderTrends } from "@/features/orders/components/admin/AdminOrderTrends";
import { AdminOrdersTable } from "@/features/orders/components/admin/AdminOrdersTable";
import { AdminVendorPerformance } from "@/features/orders/components/admin/AdminVendorPerformance";
import { useOrders } from "@/features/orders/hooks/useOrders";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";

const AdminOrders = () => {
  const { isLoading: guardLoading } = useAdminGuard();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const {
    orders,
    stats,
    monthlyStats,
    topVendors,
    orderStatusData,
    reviews,
    isLoading,
    error,
    refetch,
    totalCount,
    hasMore,
  } = useOrders(page, PAGE_SIZE, searchTerm, statusFilter);

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
      title="Order Management"
      description="Monitor marketplace orders and vendor performance"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <AdminOrderStats stats={stats} />

        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Orders List</TabsTrigger>
            <TabsTrigger value="analytics">Analytics & Trends</TabsTrigger>
            <TabsTrigger value="vendors">Vendor Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <AdminOrderFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />

            {error ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
                <p className="text-destructive mb-4">Failed to load orders</p>
                <Button variant="outline" onClick={() => refetch()}>Retry</Button>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <AdminOrdersTable orders={orders} />
                
                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasMore}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AdminOrderTrends monthlyStats={monthlyStats} orderStatusData={orderStatusData} />
          </TabsContent>

          <TabsContent value="vendors" className="space-y-4">
            <AdminVendorPerformance topVendors={topVendors} reviews={reviews} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
