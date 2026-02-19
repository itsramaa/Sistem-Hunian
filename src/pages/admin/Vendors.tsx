import { useAdminGuard } from "@/features/auth/hooks/useAdminGuard";
import { useVendorStats } from "@/features/analytics/hooks/useVendorStats";
import { useVendors } from "@/features/users/hooks/useVendors";
import { useVendorDocuments } from "@/features/verification/hooks/useVendorDocuments";
import { Vendor } from "@/features/users/types/admin-vendor";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Textarea } from "@/shared/components/ui/textarea";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { format } from "date-fns";
import { CheckCircle, ChevronLeft, ChevronRight, Clock, Eye, FileText, Loader2, Search, Star, Wrench, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

const AdminVendors = () => {
  const { isLoading: guardLoading } = useAdminGuard();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
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
    search: debouncedSearch 
  });

  const { data: stats, isLoading: statsLoading } = useVendorStats();
  
  const { data: vendorDocuments = [] } = useVendorDocuments(selectedVendor?.id);

  const hasMore = page * PAGE_SIZE < totalCount;

  const handleApprove = () => {
    if (!documentsViewed && vendorDocuments.length > 0) {
      toast.error("Please review the vendor's documents before approving");
      return;
    }
    setShowApproveConfirm(true);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/10 text-warning"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Wrench className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vendors</p>
                {statsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                {statsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                {statsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.verified || 0}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Vendors</CardTitle>
                <CardDescription>Page {page} of {Math.ceil(totalCount / PAGE_SIZE) || 1}</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1); // Reset page on search
                  }}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {vendorsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : vendors.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Jobs</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.business_name}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{vendor.contact_email}</p>
                            <p className="text-xs text-muted-foreground">{vendor.contact_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {vendor.service_categories?.slice(0, 2).map((cat: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{cat}</Badge>
                            ))}
                            {(vendor.service_categories?.length || 0) > 2 && (
                              <Badge variant="outline" className="text-xs">+{(vendor.service_categories?.length || 0) - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-warning fill-warning" />
                            <span>{vendor.rating?.toFixed(1) || '0.0'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{vendor.total_jobs || 0}</TableCell>
                        <TableCell>{getStatusBadge(vendor.verification_status || 'pending')}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReviewDialog(vendor)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={!hasMore}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No vendors found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Review Vendor</DialogTitle>
            </DialogHeader>
            {selectedVendor && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Business Name</Label>
                    <p className="font-medium">{selectedVendor.business_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div>{getStatusBadge(selectedVendor.verification_status)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p>{selectedVendor.contact_email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p>{selectedVendor.contact_phone || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Services</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedVendor.service_categories?.map((cat: string, i: number) => (
                        <Badge key={i} variant="outline">{cat}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="text-sm">{selectedVendor.description || 'No description provided'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Location</Label>
                    <p className="text-sm">
                      {[selectedVendor.address, selectedVendor.city, selectedVendor.province].filter(Boolean).join(', ') || '-'}
                    </p>
                  </div>
                </div>

                {/* Documents Section */}
                {vendorDocuments.length > 0 && (
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {vendorDocuments.length} Document(s)
                        </span>
                        {documentsViewed && (
                          <Badge variant="secondary" className="text-xs">Viewed</Badge>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={viewDocuments}>
                        View Documents
                      </Button>
                    </div>
                  </div>
                )}

                {selectedVendor.verification_status !== 'verified' && (
                  <div className="space-y-2">
                    <Label>Rejection Reason {selectedVendor.verification_status === 'pending' && '(required if rejecting)'}</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide a reason for rejection..."
                    />
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                Cancel
              </Button>
              {selectedVendor?.verification_status !== 'rejected' && (
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isUpdating}
                >
                  Reject
                </Button>
              )}
              {selectedVendor?.verification_status !== 'verified' && (
                <Button
                  onClick={handleApprove}
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Approve
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialogs */}
        <Dialog open={showApproveConfirm} onOpenChange={setShowApproveConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Vendor?</DialogTitle>
              <CardDescription>
                Are you sure you want to approve this vendor? They will be marked as verified and can start accepting jobs.
              </CardDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveConfirm(false)}>Cancel</Button>
              <Button onClick={confirmApprove} disabled={isUpdating}>
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Vendor?</DialogTitle>
              <CardDescription>
                Are you sure you want to reject this vendor? They will be notified with the reason provided.
              </CardDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectConfirm(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmReject} disabled={isUpdating}>
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Document Viewer Dialog */}
        <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Vendor Documents</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {vendorDocuments.map((doc: any) => (
                <div key={doc.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{doc.document_type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Uploaded {format(new Date(doc.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {doc.document_url && (
                    <a
                      href={doc.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      View Document
                    </a>
                  )}
                </div>
              ))}
              {vendorDocuments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No documents found for this vendor.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminVendors;
