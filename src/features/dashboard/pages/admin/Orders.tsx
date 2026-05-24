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
    filteredOrders,
    stats,
    monthlyStats,
    topVendors,
    orderStatusData,
    reviews,
    isLoading,
    error,
    refetch,
    setSearchTerm: setOrderSearchTerm,
    setStatusFilter: setOrderStatusFilter,
  } = useOrders();

  const totalCount = filteredOrders.length;
  const hasMore = page * PAGE_SIZE < totalCount;

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
      title="Manajemen Pesanan"
      description="Pantau pesanan marketplace dan performa vendor"
    >
      <div className="space-y-6">
        <AdminOrderStats stats={stats} />

        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Daftar Pesanan</TabsTrigger>
            <TabsTrigger value="analytics">Analitik & Tren</TabsTrigger>
            <TabsTrigger value="vendors">Performa Vendor</TabsTrigger>
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
                <p className="text-destructive mb-4">Gagal memuat pesanan</p>
                <Button variant="outline" onClick={() => refetch()}>Coba Lagi</Button>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <AdminOrdersTable orders={orders} />
                
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Menampilkan {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, totalCount)} dari {totalCount}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasMore}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Selanjutnya
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
