import { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { getDocumentPreviewUrl } from "../services/ocrDocumentService";

interface OcrDocumentViewerProps {
  documentUrl: string;
  extractedFields?: Record<string, unknown>;
}

export function OcrDocumentViewer({ documentUrl, extractedFields }: OcrDocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isPdf = documentUrl.toLowerCase().endsWith(".pdf");

  useEffect(() => {
    setLoading(true);
    getDocumentPreviewUrl(documentUrl)
      .then(setPreviewUrl)
      .catch(() => setPreviewUrl(null))
      .finally(() => setLoading(false));
  }, [documentUrl]);

  const fieldNames = extractedFields
    ? Object.keys(extractedFields).filter(
        (k) => !k.startsWith("field_confidences") && k !== "confidence"
      )
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg">
        <p className="text-sm text-muted-foreground">Memuat dokumen...</p>
      </div>
    );
  }

  if (!previewUrl) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg">
        <p className="text-sm text-muted-foreground">Gagal memuat dokumen</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Zoom controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setZoom((z) => Math.max(50, z - 25))}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground w-12 text-center">{zoom}%</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setZoom((z) => Math.min(200, z + 25))}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setZoom(100)}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Document preview */}
      <div className="relative overflow-auto rounded-lg border border-border bg-muted/20 max-h-[500px]">
        {isPdf ? (
          <iframe
            src={previewUrl}
            className="w-full border-0"
            style={{
              height: `${Math.round(500 * (zoom / 100))}px`,
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top left",
              width: `${Math.round(100 / (zoom / 100))}%`,
            }}
            title="PDF Preview"
          />
        ) : (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Dokumen"
              className="w-full object-contain"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top left",
              }}
            />
            {/* Field overlay badges */}
            {fieldNames.length > 0 && (
              <div className="absolute top-2 right-2 flex flex-wrap gap-1 max-w-[50%]">
                {fieldNames.slice(0, 8).map((field) => (
                  <span
                    key={field}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-primary/80 text-primary-foreground font-medium"
                  >
                    {field.replace(/_/g, " ")}
                  </span>
                ))}
                {fieldNames.length > 8 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    +{fieldNames.length - 8} lainnya
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
