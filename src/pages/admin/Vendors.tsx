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
import { Wrench, Search, CheckCircle, XCircle, Clock, Star, Loader2, Eye } from "lucide-react";
import { format } from "date-fns";

const AdminVendors = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: vendors, isLoading } = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateVendorStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('vendors')
        .update({ verification_status: status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast.success('Vendor status updated');
      setShowReviewDialog(false);
      setSelectedVendor(null);
      setRejectionReason("");
    },
    onError: () => toast.error('Failed to update vendor'),
  });

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

  const filteredVendors = vendors?.filter(vendor =>
    vendor.business_name.toLowerCase().includes(search.toLowerCase()) ||
    vendor.contact_email.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const pendingCount = vendors?.filter(v => v.verification_status === 'pending').length || 0;
  const verifiedCount = vendors?.filter(v => v.verification_status === 'verified').length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vendors</h1>
            <p className="text-muted-foreground">Manage service vendors and verifications</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Wrench className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vendors</p>
                <p className="text-2xl font-bold">{vendors?.length || 0}</p>
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
              <CardTitle>All Vendors</CardTitle>
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
                          {vendor.service_categories?.length > 2 && (
                            <Badge variant="outline" className="text-xs">+{vendor.service_categories.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-warning fill-warning" />
                          <span>{vendor.rating || '0.0'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{vendor.total_jobs || 0}</TableCell>
                      <TableCell>{getStatusBadge(vendor.verification_status || 'pending')}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setShowReviewDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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

                {selectedVendor.verification_status !== 'verified' && (
                  <div className="space-y-2">
                    <Label>Rejection Reason (if rejecting)</Label>
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
                  onClick={() => updateVendorStatus.mutate({ id: selectedVendor.id, status: 'rejected' })}
                  disabled={updateVendorStatus.isPending}
                >
                  Reject
                </Button>
              )}
              {selectedVendor?.verification_status !== 'verified' && (
                <Button
                  onClick={() => updateVendorStatus.mutate({ id: selectedVendor.id, status: 'verified' })}
                  disabled={updateVendorStatus.isPending}
                >
                  {updateVendorStatus.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Approve
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminVendors;
