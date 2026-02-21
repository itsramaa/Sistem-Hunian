import { DocumentLightbox } from "@/features/contracts/components/DocumentLightbox";
import { STATUS_COLORS } from "@/features/users/constants/merchant";
import { useMerchantVerifications } from "@/features/verification/hooks/useMerchantVerifications";
import { Badge } from "@/shared/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

interface MerchantDocumentsTabProps {
  merchantId: string;
}

export function MerchantDocumentsTab({ merchantId }: MerchantDocumentsTabProps) {
  const { verifications, loading: verificationsLoading, error: verificationsError } = useMerchantVerifications(merchantId);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxInitialIndex(index);
    setShowLightbox(true);
  };

  if (verificationsLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="p-3 rounded-lg bg-muted/50 flex gap-3">
            <div className="h-12 w-12 rounded bg-muted animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
              <div className="h-3 w-1/4 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (verificationsError) {
    return (
      <div className="text-center py-8 text-destructive">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Gagal memuat dokumen</p>
        <p className="text-xs text-muted-foreground mt-1">{(verificationsError as Error).message}</p>
      </div>
    );
  }

  if (verifications.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No documents uploaded yet
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {verifications.map((doc, index) => (
          <div 
            key={doc.id} 
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 cursor-pointer transition-colors"
            onClick={() => openLightbox(index)}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-background border overflow-hidden">
                <img 
                  src={doc.document_url} 
                  alt={doc.document_type}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-medium capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                <p className="text-xs text-muted-foreground">
                  Uploaded {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={STATUS_COLORS[doc.status]}>
                {doc.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {showLightbox && verifications.length > 0 && (
        <DocumentLightbox
          open={showLightbox}
          onOpenChange={setShowLightbox}
          documents={verifications.map(v => ({ id: v.id, document_type: v.document_type, document_url: v.document_url }))}
          initialIndex={lightboxInitialIndex}
        />
      )}
    </>
  );
}
