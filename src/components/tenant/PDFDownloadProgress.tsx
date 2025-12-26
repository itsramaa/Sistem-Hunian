import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PDFDownloadProgressProps {
  fileName: string;
  fileSize?: string;
  onDownload: (
    onProgress: (progress: number) => void
  ) => Promise<Blob | string>;
  className?: string;
}

type DownloadStatus = "idle" | "downloading" | "success" | "error";

export function PDFDownloadProgress({
  fileName,
  fileSize,
  onDownload,
  className,
}: PDFDownloadProgressProps) {
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setStatus("downloading");
    setProgress(0);
    setError(null);

    try {
      const result = await onDownload((p) => {
        setProgress(p);
      });

      // Handle the result
      if (typeof result === "string") {
        // URL - open in new tab or trigger download
        const link = document.createElement("a");
        link.href = result;
        link.download = fileName;
        link.click();
      } else {
        // Blob - create object URL and download
        const url = URL.createObjectURL(result);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      }

      setProgress(100);
      setStatus("success");

      // Reset after 3 seconds
      setTimeout(() => {
        setStatus("idle");
        setProgress(0);
      }, 3000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Gagal mengunduh file");
    }
  };

  const handleCancel = () => {
    setStatus("idle");
    setProgress(0);
    setError(null);
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={cn(
              "shrink-0 w-12 h-12 rounded-lg flex items-center justify-center",
              status === "idle" && "bg-muted",
              status === "downloading" && "bg-primary/10",
              status === "success" && "bg-green-500/10",
              status === "error" && "bg-destructive/10"
            )}
          >
            {status === "idle" && <FileText className="h-6 w-6 text-muted-foreground" />}
            {status === "downloading" && (
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle className="h-6 w-6 text-green-600" />
            )}
            {status === "error" && (
              <AlertCircle className="h-6 w-6 text-destructive" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{fileName}</p>
                {fileSize && (
                  <p className="text-sm text-muted-foreground">{fileSize}</p>
                )}
              </div>

              {status === "idle" && (
                <Button size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Unduh
                </Button>
              )}

              {status === "downloading" && (
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Batal
                </Button>
              )}

              {status === "success" && (
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Unduh Lagi
                </Button>
              )}

              {status === "error" && (
                <Button size="sm" variant="destructive" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Coba Lagi
                </Button>
              )}
            </div>

            {/* Progress bar */}
            {status === "downloading" && (
              <div className="mt-3 space-y-1">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mengunduh...</span>
                  <span>{progress}%</span>
                </div>
              </div>
            )}

            {/* Success message */}
            {status === "success" && (
              <p className="mt-2 text-sm text-green-600">
                File berhasil diunduh!
              </p>
            )}

            {/* Error message */}
            {status === "error" && error && (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Utility hook for simulating download progress
export function useSimulatedDownload() {
  const simulateProgress = (
    onProgress: (progress: number) => void,
    durationMs: number = 2000
  ): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = durationMs / 100;
      
      const timer = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(timer);
          onProgress(100);
          resolve();
        } else {
          onProgress(Math.floor(progress));
        }
      }, interval);
    });
  };

  return { simulateProgress };
}
