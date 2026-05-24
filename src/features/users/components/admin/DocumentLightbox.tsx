import { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';

interface DocumentLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: Array<{
    id: string;
    document_type: string;
    document_url: string;
  }>;
  initialIndex?: number;
}

export function DocumentLightbox({ open, onOpenChange, documents, initialIndex = 0 }: DocumentLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const currentDoc = documents[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : documents.length - 1));
    resetTransforms();
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < documents.length - 1 ? prev + 1 : 0));
    resetTransforms();
  };

  const resetTransforms = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (currentDoc?.document_url) {
      window.open(currentDoc.document_url, '_blank');
    }
  };

  const documentTypeLabels: Record<string, string> = {
    identity_card: 'Kartu Identitas',
    family_card: 'Kartu Keluarga',
    contract_agreement: 'Perjanjian Kontrak',
    payment_receipt: 'Kuitansi Pembayaran',
    other: 'Dokumen Lainnya'
  };

  if (!currentDoc) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-background/95 backdrop-blur-sm" aria-describedby="lightbox-description">
        <p id="lightbox-description" className="sr-only">Penampil dokumen interaktif dengan fitur zoom dan rotasi</p>
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-background to-transparent">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium capitalize">
              {documentTypeLabels[currentDoc.document_type] || currentDoc.document_type.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-muted-foreground">
              ({currentIndex + 1} / {documents.length})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.5} aria-label="Perkecil">
              <ZoomOut className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="text-xs w-12 text-center" role="status" aria-live="polite">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 3} aria-label="Perbesar">
              <ZoomIn className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRotate} aria-label="Putar">
              <RotateCw className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownload} aria-label="Unduh">
              <Download className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Tutup">
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center w-full h-full overflow-auto p-16">
          <img
            src={currentDoc.document_url}
            alt={documentTypeLabels[currentDoc.document_type] || currentDoc.document_type}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          />
        </div>

        {documents.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 hover:bg-background"
              onClick={handlePrev}
              aria-label="Dokumen sebelumnya"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 hover:bg-background"
              onClick={handleNext}
              aria-label="Dokumen berikutnya"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </Button>
          </>
        )}

        {documents.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 p-4 bg-gradient-to-t from-background to-transparent" role="listbox" aria-label="Daftar dokumen">
            {documents.map((doc, index) => (
              <button
                key={doc.id}
                role="option"
                aria-selected={index === currentIndex}
                onClick={() => {
                  setCurrentIndex(index);
                  resetTransforms();
                }}
                aria-label={`Lihat dokumen ${index + 1}`}
                className={`w-12 h-12 rounded border-2 overflow-hidden transition-[border-color,box-shadow] ${
                  index === currentIndex
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-border opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={doc.document_url}
                  alt={documentTypeLabels[doc.document_type] || doc.document_type}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
