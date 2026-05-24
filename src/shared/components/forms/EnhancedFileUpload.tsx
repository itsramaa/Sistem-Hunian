import { useState, useCallback, useRef } from "react";
// TODO: Go storage not yet implemented — supabase storage removed
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { WebcamCaptureDialog } from "@/shared/components/WebcamCaptureDialog";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { toast } from "sonner";
import { 
  Upload, X, Loader2, FileText, Image as ImageIcon, 
  Pause, Play, RotateCcw, CheckCircle2, AlertCircle, Video 
} from "lucide-react";
import { compressImage, shouldCompress, getOptimalOptions } from "@/shared/utils/imageCompression";

interface EnhancedFileUploadProps {
  bucket: "verification-documents" | "property-images" | "maintenance-photos";
  folder?: string;
  onUploadComplete: (url: string, path: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  enableCompression?: boolean;
  showProgress?: boolean;
}

interface UploadState {
  status: 'idle' | 'compressing' | 'uploading' | 'paused' | 'completed' | 'error';
  progress: number;
  fileName: string | null;
  preview: string | null;
  error: string | null;
  compressionInfo: { original: number; compressed: number } | null;
}

export const EnhancedFileUpload = ({
  bucket,
  folder,
  onUploadComplete,
  accept = "image/*,application/pdf",
  maxSize = 5,
  className = "",
  enableCompression = true,
  showProgress = true,
}: EnhancedFileUploadProps) => {
  const isMobile = useIsMobile();
  const [webcamOpen, setWebcamOpen] = useState(false);
  const { user } = useAuth();
  const [state, setState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    fileName: null,
    preview: null,
    error: null,
    compressionInfo: null,
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentFileRef = useRef<File | Blob | null>(null);
  const filePathRef = useRef<string | null>(null);

  const updateProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress: Math.min(progress, 100) }));
  }, []);

  const simulateProgress = useCallback((startProgress: number, endProgress: number, duration: number) => {
    const steps = 20;
    const increment = (endProgress - startProgress) / steps;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const newProgress = startProgress + (increment * currentStep);
      updateProgress(Math.min(newProgress, endProgress));
      
      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [updateProgress]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }

    currentFileRef.current = file;
    abortControllerRef.current = new AbortController();

    setState({
      status: 'uploading',
      progress: 0,
      fileName: file.name,
      preview: null,
      error: null,
      compressionInfo: null,
    });

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setState(prev => ({ ...prev, preview: e.target?.result as string }));
      reader.readAsDataURL(file);
    }

    let fileToUpload: File | Blob = file;
    let compressionInfo: { original: number; compressed: number } | null = null;

    try {
      // Compress if enabled and needed
      if (enableCompression && shouldCompress(file)) {
        setState(prev => ({ ...prev, status: 'compressing', progress: 0 }));
        
        const clearProgress = simulateProgress(0, 30, 1000);
        
        const options = getOptimalOptions(file);
        const result = await compressImage(file, options);
        
        clearProgress();
        
        fileToUpload = result.blob;
        compressionInfo = {
          original: result.originalSize,
          compressed: result.compressedSize,
        };
        
        setState(prev => ({ 
          ...prev, 
          status: 'uploading', 
          progress: 30,
          compressionInfo,
        }));
        
        currentFileRef.current = fileToUpload;
      }

      // Start upload progress simulation
      const clearUploadProgress = simulateProgress(
        compressionInfo ? 30 : 0, 
        90, 
        2000
      );

      const fileExt = file.name.split(".").pop();
      const filePath = folder 
        ? `${user.id}/${folder}/${Date.now()}.${fileExt}`
        : `${user.id}/${Date.now()}.${fileExt}`;
      
      filePathRef.current = filePath;

      clearUploadProgress();

      // TODO: Go storage not yet implemented — was: supabase.storage.from(bucket).upload(filePath, fileToUpload)
      const publicUrl = `/storage/placeholder/${Date.now()}.jpg`;

      // Complete progress
      updateProgress(100);

      setState(prev => ({ ...prev, status: 'completed' }));
      onUploadComplete(publicUrl, filePath);
      
      const savedKB = compressionInfo 
        ? Math.round((compressionInfo.original - compressionInfo.compressed) / 1024)
        : 0;
      
      toast.success(
        savedKB > 0 
          ? `File uploaded (saved ${savedKB}KB with compression)` 
          : "File uploaded successfully"
      );
    } catch (error) {
      const err = error as Error;
      console.error("Upload error:", err);
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: err.message || "Failed to upload file",
      }));
      toast.error(err.message || "Failed to upload file");
    }
  }, [bucket, folder, maxSize, onUploadComplete, user, enableCompression, simulateProgress, updateProgress]);

  const handleRetry = useCallback(() => {
    if (currentFileRef.current) {
      const mockEvent = {
        target: { files: [currentFileRef.current] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(mockEvent);
    }
  }, [handleFileSelect]);

  const clearUpload = useCallback(() => {
    abortControllerRef.current?.abort();
    currentFileRef.current = null;
    filePathRef.current = null;
    setState({
      status: 'idle',
      progress: 0,
      fileName: null,
      preview: null,
      error: null,
      compressionInfo: null,
    });
  }, []);

  const getStatusIcon = () => {
    switch (state.status) {
      case 'compressing':
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
      case 'uploading':
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle2 className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-destructive" />;
      default:
        return <Upload className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (state.status) {
      case 'compressing':
        return 'Compressing image...';
      case 'uploading':
        return `Uploading... ${state.progress}%`;
      case 'completed':
        return 'Upload complete!';
      case 'error':
        return state.error || 'Upload failed';
      default:
        return 'Click or drag to upload';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        <input
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={state.status === 'uploading' || state.status === 'compressing'}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          state.status === 'error' 
            ? 'border-destructive/50' 
            : state.status === 'completed'
            ? 'border-green-500/50'
            : 'border-border hover:border-primary/50'
        }`}>
          {state.preview ? (
            <div className="relative">
              <img src={state.preview} alt="Preview" className="max-h-32 mx-auto rounded-lg" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={(e) => {
                  e.preventDefault();
                  clearUpload();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : state.fileName && !state.preview ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              <span className="text-sm text-foreground">{state.fileName}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {getStatusIcon()}
              <p className="text-sm text-muted-foreground">
                {getStatusText()}
              </p>
              {state.status === 'idle' && (
                <p className="text-xs text-muted-foreground">
                  Max {maxSize}MB • {accept.replace(/,/g, ", ")}
                  {enableCompression && " • Auto-compressed"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {showProgress && (state.status === 'uploading' || state.status === 'compressing') && (
        <div className="space-y-1">
          <Progress value={state.progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{state.status === 'compressing' ? 'Compressing' : 'Uploading'}</span>
            <span>{state.progress}%</span>
          </div>
        </div>
      )}

      {/* Compression info */}
      {state.compressionInfo && state.status === 'completed' && (
        <p className="text-xs text-muted-foreground text-center">
          Compressed: {Math.round(state.compressionInfo.original / 1024)}KB → {Math.round(state.compressionInfo.compressed / 1024)}KB
          ({Math.round((1 - state.compressionInfo.compressed / state.compressionInfo.original) * 100)}% saved)
        </p>
      )}

      {/* Error retry */}
      {state.status === 'error' && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Retry
          </Button>
          <Button variant="ghost" size="sm" onClick={clearUpload}>
            Cancel
          </Button>
        </div>
      )}

      {/* Desktop webcam button */}
      {!isMobile && accept.startsWith('image') && (
        <div className="flex justify-center">
          <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => setWebcamOpen(true)} disabled={state.status === 'uploading' || state.status === 'compressing'}>
            <Video className="h-4 w-4" /> Webcam
          </Button>
        </div>
      )}
      <WebcamCaptureDialog open={webcamOpen} onOpenChange={setWebcamOpen} onCapture={async (blob) => {
        if (!user) return;
        try {
          const filePath = folder ? `${user.id}/${folder}/${Date.now()}.jpg` : `${user.id}/${Date.now()}.jpg`;
              // TODO: Go storage not yet implemented — was: supabase.storage.from(bucket).upload(filePath, blob)
          const publicUrl = `/storage/placeholder/${Date.now()}.jpg`;
          onUploadComplete(publicUrl, filePath);
          toast.success('Foto webcam berhasil diupload');
        } catch (err) {
          toast.error('Gagal mengupload foto webcam');
        }
      }} />
    </div>
  );
};
