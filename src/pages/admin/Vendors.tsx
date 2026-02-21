import { useVendorStats } from "@/features/analytics/hooks/useVendorStats";
import { useAdminGuard } from "@/features/auth/hooks/useAdminGuard";
import { AdminVendorFilters } from "@/features/users/components/admin/AdminVendorFilters";
import { AdminVendorsTable } from "@/features/users/components/admin/AdminVendorsTable";
import { AdminVendorStats } from "@/features/users/components/admin/AdminVendorStats";
import { useVendors } from "@/features/users/hooks/useVendors";
import { Vendor } from "@/features/users/types/admin-vendor";
import { VendorActionDialog } from "@/features/vendors/components/admin/VendorActionDialog";
import { VendorDocumentsDialog } from "@/features/vendors/components/admin/VendorDocumentsDialog";
import { VendorReviewDialog } from "@/features/vendors/components/admin/VendorReviewDialog";
import { useVendorDocuments } from "@/features/verification/hooks/useVendorDocuments";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

const AdminVendors = () => {
  const { isLoading: guardLoading } = useAdminGuard();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [documentsViewed, setDocumentsViewed] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const { 
    vendors, 
    totalCount, 
    isLoading: vendorsLoading, 
    error: vendorsError, 
    updateStatus, 
    isUpdating 
  } = useVendors({ 
    page, 
    pageSize: PAGE_SIZE, 
    search: debouncedSearch,
    status: statusFilter !== 'all' ? statusFilter : undefined
  });

  const { data: stats, isLoading: statsLoading } = useVendorStats();
  
  const { data: vendorDocuments = [] } = useVendorDocuments(selectedVendor?.id);

  const handleApproveAction = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    if (!documentsViewed && vendorDocuments.length > 0) {
      toast.error("Please review the vendor's documents before approving");
      return;
    }
    setShowApproveConfirm(true);
  };

  const handleRejectAction = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setRejectionReason("");
    setShowRejectConfirm(true);
  };

  const confirmApprove = () => {
    if (selectedVendor) {
      updateStatus(
        { 
          id: selectedVendor.id, 
          status: 'verified',
          oldStatus: selectedVendor.verification_status 
        },
        {
          onSuccess: () => {
            toast.success(`Vendor approved successfully`);
            resetDialogs();
          },
          onError: (error: Error) => {
            toast.error(error.message);
          }
        }
      );
    }
  };

  const confirmReject = () => {
    if (selectedVendor) {
      updateStatus(
        { 
          id: selectedVendor.id, 
          status: 'rejected', 
          reason: rejectionReason,
          oldStatus: selectedVendor.verification_status
        },
        {
          onSuccess: () => {
            toast.success(`Vendor rejected successfully`);
            resetDialogs();
          },
          onError: (error: Error) => {
            toast.error(error.message);
          }
        }
      );
    }
  };

  const resetDialogs = () => {
    setShowReviewDialog(false);
    setShowApproveConfirm(false);
    setShowRejectConfirm(false);
    setSelectedVendor(null);
    setRejectionReason("");
    setDocumentsViewed(false);
  };

  const openReviewDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setRejectionReason("");
    setDocumentsViewed(false);
    setShowReviewDialog(true);
  };

  const viewDocuments = () => {
    setDocumentsViewed(true);
    setShowDocumentDialog(true);
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
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vendors</h1>
            <p className="text-muted-foreground">Manage service vendors and verifications</p>
          </div>
        </div>

        {vendorsError && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="py-4">
              <p className="text-sm text-destructive">{(vendorsError as Error).message}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <AdminVendorStats stats={stats} isLoading={statsLoading} />

        {/* Main Content */}
        <div className="space-y-4">
          <AdminVendorFilters
            searchQuery={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vendors Directory</CardTitle>
                  <CardDescription>
                    Manage vendor accounts and verification requests
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AdminVendorsTable
                vendors={vendors}
                isLoading={vendorsLoading}
                onViewDetails={openReviewDialog}
                onApprove={handleApproveAction}
                onReject={handleRejectAction}
                page={page}
                totalCount={totalCount}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </CardContent>
          </Card>
        </div>

        {/* Review Dialog */}
        <VendorReviewDialog 
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
          vendor={selectedVendor}
          documentsCount={vendorDocuments.length}
          documentsViewed={documentsViewed}
          onViewDocuments={viewDocuments}
          onApprove={() => selectedVendor && handleApproveAction(selectedVendor)}
          onReject={() => selectedVendor && handleRejectAction(selectedVendor)}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          isUpdating={isUpdating}
        />

        {/* Confirmation Dialogs */}
        <VendorActionDialog
          open={showApproveConfirm}
          onOpenChange={setShowApproveConfirm}
          title="Approve Vendor?"
          description="Are you sure you want to approve this vendor? They will be marked as verified and can start accepting jobs."
          actionLabel="Approve"
          onConfirm={confirmApprove}
          isUpdating={isUpdating}
        />

        <VendorActionDialog
          open={showRejectConfirm}
          onOpenChange={setShowRejectConfirm}
          title="Reject Vendor?"
          description="Are you sure you want to reject this vendor? They will be notified with the reason provided."
          actionLabel="Reject"
          onConfirm={confirmReject}
          isUpdating={isUpdating}
          variant="destructive"
        />

        {/* Document Viewer Dialog */}
        <VendorDocumentsDialog
          open={showDocumentDialog}
          onOpenChange={setShowDocumentDialog}
          documents={vendorDocuments}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminVendors;
