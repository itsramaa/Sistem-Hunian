import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, Search, CheckCircle, XCircle, Clock, Star, Loader2, Eye, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { logStatusChange } from "@/lib/auditLog";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  contact_email: string;
  contact_phone: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  service_categories: string[] | null;
  rating: number | null;
  total_jobs: number | null;
  verification_status: string;
  created_at: string;
}

const PAGE_SIZE = 20;

const AdminVendors = () => {
  const { isLoading: guardLoading, isAdmin } = useAdminGuard();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [documentsViewed, setDocumentsViewed] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [page, setPage] = useState(1);

  const { data: vendorsData, isLoading, error } = useQuery({
    queryKey: ['admin-vendors', page],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('vendors')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      if (error) throw new Error(`Failed to load vendors: ${error.message}`);
      return { vendors: data as Vendor[], total: count || 0 };
    },
    enabled: isAdmin,
  });

  const vendors = vendorsData?.vendors || [];
  const totalCount = vendorsData?.total || 0;
  const hasMore = page * PAGE_SIZE < totalCount;

  // Fetch vendor documents
  const { data: vendorDocuments = [] } = useQuery({
    queryKey: ['vendor-documents', selectedVendor?.id],
    queryFn: async () => {
      if (!selectedVendor?.id) return [];
      const { data, error } = await supabase
        .from('vendor_verifications')
        .select('*')
        .eq('vendor_id', selectedVendor.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedVendor?.id,
  });

  const updateVendorStatus = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const oldStatus = selectedVendor?.verification_status || 'pending';
      
      const updateData: { verification_status: string; rejection_reason?: string | null } = {
        verification_status: status,
      };

      if (status === 'rejected' && reason) {
        updateData.rejection_reason = reason;
      } else if (status === 'verified') {
        updateData.rejection_reason = null;
      }

      const { error } = await supabase
        .from('vendors')
        .update(updateData)
        .eq('id', id);
      if (error) throw new Error(`Failed to update vendor: ${error.message}`);

      await logStatusChange('vendor', id, oldStatus, status, reason);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast.success(`Vendor ${variables.status === 'verified' ? 'approved' : 'rejected'} successfully`);
      setShowReviewDialog(false);
      setShowApproveConfirm(false);
      setShowRejectConfirm(false);
      setSelectedVendor(null);
      setRejectionReason("");
      setDocumentsViewed(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

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
      updateVendorStatus.mutate({ id: selectedVendor.id, status: 'verified' });
    }
  };

  const confirmReject = () => {
    if (selectedVendor) {
      updateVendorStatus.mutate({ id: selectedVendor.id, status: 'rejected', reason: rejectionReason });
    }
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

  const filteredVendors = vendors.filter(vendor =>
    vendor.business_name.toLowerCase().includes(search.toLowerCase()) ||
    vendor.contact_email.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = vendors.filter(v => v.verification_status === 'pending').length;
  const verifiedCount = vendors.filter(v => v.verification_status === 'verified').length;

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

        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="py-4">
              <p className="text-sm text-destructive">{(error as Error).message}</p>
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
                <p className="text-2xl font-bold">{totalCount}</p>
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
                <p className="text-2xl font-bold">{pendingCount}</p>
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
                <p className="text-2xl font-bold">{verifiedCount}</p>
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
                <CardDescription>Page {page} of {Math.ceil(totalCount / PAGE_SIZE)}</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredVendors.length > 0 ? (
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
                    {filteredVendors.map((vendor) => (
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
                  disabled={updateVendorStatus.isPending}
                >
                  Reject
                </Button>
              )}
              {selectedVendor?.verification_status !== 'verified' && (
                <Button
                  onClick={handleApprove}
                  disabled={updateVendorStatus.isPending}
                >
                  {updateVendorStatus.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Approve
                </Button>
              )}
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
                <p className="text-muted-foreground text-center py-8">No documents uploaded</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialogs */}
        <ConfirmDialog
          open={showApproveConfirm}
          onOpenChange={setShowApproveConfirm}
          title="Approve Vendor"
          description={`Are you sure you want to approve "${selectedVendor?.business_name}"? They will be able to receive job assignments.`}
          confirmLabel="Approve"
          isLoading={updateVendorStatus.isPending}
          onConfirm={confirmApprove}
        />

        <ConfirmDialog
          open={showRejectConfirm}
          onOpenChange={setShowRejectConfirm}
          title="Reject Vendor"
          description={`Are you sure you want to reject "${selectedVendor?.business_name}"? They will be notified of the rejection.`}
          confirmLabel="Reject"
          variant="destructive"
          isLoading={updateVendorStatus.isPending}
          onConfirm={confirmReject}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminVendors;
