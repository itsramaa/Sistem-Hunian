
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { FileText } from "lucide-react";
import { format } from "date-fns";

interface VendorDocument {
  id: string;
  document_type: string;
  document_url: string;
  created_at: string;
}

interface VendorDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: VendorDocument[];
}

export const VendorDocumentsDialog = ({
  open,
  onOpenChange,
  documents
}: VendorDocumentsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Vendor Documents</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {documents.map((doc) => (
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
          {documents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No documents found for this vendor.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
