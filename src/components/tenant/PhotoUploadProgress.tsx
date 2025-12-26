import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Image, Loader2, Upload, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  previewUrl?: string;
}

interface PhotoUploadProgressProps {
  files: UploadingFile[];
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
  className?: string;
}

export function PhotoUploadProgress({
  files,
  onRemove,
  onRetry,
  className,
}: PhotoUploadProgressProps) {
  if (files.length === 0) return null;

  const completedCount = files.filter((f) => f.status === "success").length;
  const totalProgress =
    files.reduce((sum, f) => sum + f.progress, 0) / files.length;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Overall progress */}
      <div className="flex items-center gap-3">
        <Progress value={totalProgress} className="flex-1" />
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {completedCount}/{files.length} selesai
        </span>
      </div>

      {/* Individual file progress */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {files.map((file) => (
          <Card key={file.id} className="relative overflow-hidden">
            <CardContent className="p-2">
              {/* Preview */}
              <div className="relative aspect-square rounded-md overflow-hidden bg-muted mb-2">
                {file.previewUrl ? (
                  <img
                    src={file.previewUrl}
                    alt={file.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Image className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                {/* Overlay based on status */}
                {file.status === "uploading" && (
                  <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs font-medium">{file.progress}%</span>
                  </div>
                )}

                {file.status === "success" && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                )}

                {file.status === "error" && (
                  <div className="absolute inset-0 bg-destructive/20 flex flex-col items-center justify-center gap-1">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                    <span className="text-xs text-destructive text-center px-2">
                      {file.error || "Gagal"}
                    </span>
                  </div>
                )}

                {/* Remove button */}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => onRemove(file.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* File info */}
              <div className="space-y-1">
                <p className="text-xs font-medium truncate" title={file.file.name}>
                  {file.file.name}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  {file.status === "error" && onRetry && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => onRetry(file.id)}
                    >
                      Coba Lagi
                    </Button>
                  )}
                </div>

                {/* Progress bar for uploading */}
                {file.status === "uploading" && (
                  <Progress value={file.progress} className="h-1" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Hook for managing upload state
export function usePhotoUpload() {
  const [files, setFiles] = useState<UploadingFile[]>([]);

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadingFile[] = newFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: "pending" as const,
      previewUrl: URL.createObjectURL(file),
    }));
    setFiles((prev) => [...prev, ...uploadFiles]);
    return uploadFiles;
  };

  const updateProgress = (id: string, progress: number) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, progress, status: "uploading" as const } : f
      )
    );
  };

  const setSuccess = (id: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, progress: 100, status: "success" as const } : f
      )
    );
  };

  const setError = (id: string, error: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: "error" as const, error } : f
      )
    );
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const clearAll = () => {
    files.forEach((file) => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });
    setFiles([]);
  };

  return {
    files,
    addFiles,
    updateProgress,
    setSuccess,
    setError,
    removeFile,
    clearAll,
  };
}
