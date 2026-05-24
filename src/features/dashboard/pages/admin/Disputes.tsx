import { useAdminGuard } from "@/features/auth/hooks/useAdminGuard";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdminDisputeFilters } from "@/features/disputes/components/admin/AdminDisputeFilters";
import { AdminDisputeStats } from "@/features/disputes/components/admin/AdminDisputeStats";
import { AdminDisputesTable } from "@/features/disputes/components/admin/AdminDisputesTable";
import { DisputeResolutionDialog } from "@/features/disputes/components/admin/DisputeResolutionDialog";
import { useDisputes } from "@/features/disputes/hooks/useDisputes";
import { Dispute } from "@/features/disputes/types";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";

const AdminDisputes = () => {
  const { user } = useAuth();
  const { isLoading: guardLoading, isAdmin } = useAdminGuard();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolution, setResolution] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const {
    disputes,
    totalCount,
    hasMore,
    isLoading,
    error,
    refetch,
    resolveDispute
  } = useDisputes(page, PAGE_SIZE, isAdmin);

  const handleResolve = (status: string, resolutionText: string) => {
    if (!selectedDispute || !user) return;
    
    resolveDispute.mutate({
      params: {
        id: selectedDispute.id,
        status,
        resolution: resolutionText,
        resolved_by: user.id
      },
      currentStatus: selectedDispute.status || 'open'
    }, {
      onSuccess: () => {
        setShowResolveDialog(false);
        setSelectedDispute(null);
        setResolution("");
      }
    });
  };

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = dispute.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCount = disputes.filter(d => d.status === 'open').length;
  const inProgressCount = disputes.filter(d => d.status === 'in_progress').length;
  const urgentCount = disputes.filter(d => d.priority === 'urgent' || d.priority === 'high').length;
  const resolvedCount = disputes.filter(d => d.status === 'resolved').length;

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
      title="Sengketa"
      description="Kelola dan selesaikan sengketa antar pihak"
    >
      <div className="space-y-6">
        <AdminDisputeStats
          totalCount={totalCount}
          openCount={openCount}
          inProgressCount={inProgressCount}
          urgentCount={urgentCount}
          resolvedCount={resolvedCount}
        />

        <Card>
          <AdminDisputeFilters
            searchTerm={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
          <CardContent>
            {error ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
                <p className="text-destructive mb-4">Gagal memuat data sengketa</p>
                <Button variant="outline" onClick={() => refetch()}>Coba Lagi</Button>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredDisputes.length > 0 ? (
              <>
                <AdminDisputesTable
                  disputes={filteredDisputes}
                  onReview={(dispute) => {
                    setSelectedDispute(dispute);
                    setShowResolveDialog(true);
                  }}
                />

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
                      Berikutnya
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada sengketa ditemukan</p>
              </div>
            )}
          </CardContent>
        </Card>

        <DisputeResolutionDialog
          open={showResolveDialog}
          onOpenChange={setShowResolveDialog}
          selectedDispute={selectedDispute}
          resolution={resolution}
          onResolutionChange={setResolution}
          onResolve={handleResolve}
          isPending={resolveDispute.isPending}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminDisputes;
