import { VendorVerification } from "@/features/verification/types";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/utils/utils";
import { format } from "date-fns";
import { CheckCircle, Eye, Loader2, XCircle } from "lucide-react";
import { useState } from "react";

interface VendorVerificationTableProps {
  verifications: VendorVerification[];
  isLoading: boolean;
  onApprove: (verification: VendorVerification) => void;
  onReject: (verification: VendorVerification) => void;
}

export function VendorVerificationTable({
  verifications,
  isLoading,
  onApprove,
  onReject,
}: VendorVerificationTableProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const getDocumentLabel = (type: string) => {
    const labels: Record<string, string> = {
      ktp: "KTP (ID Card)",
      npwp: "NPWP (Tax ID)",
      nib: "NIB (Business License)",
      siup: "SIUP (Trading License)",
      sk_domisili: "Domicile Letter",
      certifications: "Professional Certifications",
    };
    return labels[type] || type.toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className={cn("bg-green-100 text-green-800 hover:bg-green-200")}>Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-md">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (verifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-md text-muted-foreground">
        No verification requests found.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead className="hidden md:table-cell">Document Type</TableHead>
              <TableHead className="hidden lg:table-cell">Submitted Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Document</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {verifications.map((verification) => (
              <TableRow key={verification.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {verification.vendor?.business_name?.substring(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{verification.vendor?.business_name || "Unknown Vendor"}</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {verification.vendor?.contact_email}
                      </span>
                      {/* Mobile-only fallback for Document Type */}
                      <span className="text-xs text-muted-foreground md:hidden mt-0.5">
                        {getDocumentLabel(verification.document_type)}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{getDocumentLabel(verification.document_type)}</TableCell>
                <TableCell className="hidden lg:table-cell">{format(new Date(verification.created_at), "MMM dd, yyyy")}</TableCell>
                <TableCell>{getStatusBadge(verification.status)}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-blue-600"
                    onClick={() => setPreviewUrl(verification.document_url)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline">View</span>
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  {verification.status === "pending" && (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => onApprove(verification)}
                        title="Approve"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onReject(verification)}
                        title="Reject"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {verification.status === "rejected" && verification.rejection_reason && (
                    <span className="text-xs text-red-500 italic">
                      Reason: {verification.rejection_reason}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-slate-100 rounded-md flex items-center justify-center min-h-[400px]">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Document Preview"
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewUrl(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
