
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Textarea } from "@/shared/components/ui/textarea";
import { CheckCircle, Clock, FileText, Loader2, XCircle } from "lucide-react";
import { Vendor } from "@/features/users/types/admin-vendor";

interface VendorReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: Vendor | null;
  documentsCount: number;
  documentsViewed: boolean;
  onViewDocuments: () => void;
  onApprove: () => void;
  onReject: () => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  isUpdating: boolean;
}

export const VendorReviewDialog = ({
  open,
  onOpenChange,
  vendor,
  documentsCount,
  documentsViewed,
  onViewDocuments,
  onApprove,
  onReject,
  rejectionReason,
  setRejectionReason,
  isUpdating
}: VendorReviewDialogProps) => {
  if (!vendor) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Vendor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Business Name</Label>
              <p className="font-medium">{vendor.business_name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div>{getStatusBadge(vendor.verification_status)}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p>{vendor.contact_email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Phone</Label>
              <p>{vendor.contact_phone || '-'}</p>
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground">Services</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {vendor.service_categories?.map((cat: string, i: number) => (
                  <Badge key={i} variant="outline">{cat}</Badge>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground">Description</Label>
              <p className="text-sm">{vendor.description || 'No description provided'}</p>
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground">Location</Label>
              <p className="text-sm">
                {[vendor.address, vendor.city, vendor.province].filter(Boolean).join(', ') || '-'}
              </p>
            </div>
          </div>

          {/* Documents Section */}
          {documentsCount > 0 && (
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {documentsCount} Document(s)
                  </span>
                  {documentsViewed && (
                    <Badge variant="secondary" className="text-xs">Viewed</Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={onViewDocuments}>
                  View Documents
                </Button>
              </div>
            </div>
          )}

          {vendor.verification_status !== 'verified' && (
            <div className="space-y-2">
              <Label>Rejection Reason {vendor.verification_status === 'pending' && '(required if rejecting)'}</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
              />
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {vendor.verification_status !== 'rejected' && (
            <Button
              variant="destructive"
              onClick={onReject}
              disabled={isUpdating}
            >
              Reject
            </Button>
          )}
          {vendor.verification_status !== 'verified' && (
            <Button
              onClick={onApprove}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Approve
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
