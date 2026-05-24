import { useRef, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Camera, ImageIcon, Loader2, ScanLine, CheckCircle, AlertTriangle, Video } from 'lucide-react';
import { supabase } from '@/lib/integrations/supabase/client';
import { WebcamCaptureDialog } from '@/shared/components/WebcamCaptureDialog';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/utils';

interface OcrCameraButtonProps {
  label: string;
  description?: string;
  bucket: string;
  edgeFunction: string;
  extraPayload?: Record<string, any>;
  onExtracted: (data: Record<string, any>) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  icon?: React.ReactNode;
  useCapture?: boolean;
  disabled?: boolean;
}

export function OcrCameraButton({
  label,
  description,
  bucket,
  edgeFunction,
  extraPayload = {},
  onExtracted,
  variant = 'outline',
  size = 'default',
  className,
  icon,
  disabled = false,
}: OcrCameraButtonProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<Record<string, any> | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [webcamOpen, setWebcamOpen] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File terlalu besar (maks 10MB)');
      return;
    }

    setIsProcessing(true);

    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      console.warn('OCR feature not available in this version');
      return null;
    } catch (err) {
      console.error('OCR error:', err);
      toast.error(err instanceof Error ? err.message : 'OCR gagal memproses dokumen');
    } finally {
      setIsProcessing(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleWebcamCapture = async (blob: Blob) => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const filePath = `${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, blob);
      if (uploadError) throw uploadError;

      console.warn('OCR feature not available in this version');
      return null;
    } catch (err) {
      console.error('OCR webcam error:', err);
      toast.error(err instanceof Error ? err.message : 'OCR gagal memproses');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (results) {
      onExtracted(results);
      setShowResults(false);
      toast.success('Data berhasil diterapkan');
    }
  };

  const renderFieldValue = (key: string, value: any) => {
    if (key === 'confidence' || key === 'field_confidences') return null;
    if (Array.isArray(value)) {
      return (
        <div key={key} className="space-y-1">
          <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
          <div className="text-sm bg-muted/30 rounded-lg p-2 space-y-1">
            {value.map((item, i) => (
              <p key={i} className="text-xs">
                {typeof item === 'object' ? JSON.stringify(item) : String(item)}
              </p>
            ))}
          </div>
        </div>
      );
    }
    if (typeof value === 'object' && value !== null) return null;
    
    const fieldConfidences = results?.field_confidences as Record<string, number> | undefined;
    const fieldConf = fieldConfidences?.[key];

    return (
      <div key={key} className="flex items-start justify-between gap-2 py-1.5 border-b border-border/20 last:border-0">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
          <p className="text-sm font-medium truncate">{String(value)}</p>
        </div>
        {fieldConf !== undefined && (
          <Badge variant="secondary" className={cn(
            "text-[10px] shrink-0",
            fieldConf >= 80 ? 'bg-success/10 text-success' : fieldConf >= 50 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'
          )}>
            {fieldConf}%
          </Badge>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Hidden file inputs - one for camera, one for gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant={variant}
            size={size}
            className={cn("gap-2 rounded-xl", className)}
            disabled={disabled || isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              icon || <ScanLine className="h-4 w-4" />
            )}
            {isProcessing ? 'Memproses...' : label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="rounded-xl">
          <DropdownMenuItem onClick={() => cameraInputRef.current?.click()}>
            <Camera className="mr-2 h-4 w-4" />
            Kamera
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => galleryInputRef.current?.click()}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Galeri / Dokumen
          </DropdownMenuItem>
          {!isMobile && (
            <DropdownMenuItem onClick={() => setWebcamOpen(true)}>
              <Video className="mr-2 h-4 w-4" />
              Webcam
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <WebcamCaptureDialog open={webcamOpen} onOpenChange={setWebcamOpen} onCapture={handleWebcamCapture} />

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="rounded-2xl max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-primary" />
              Hasil OCR
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-xl border",
              confidence >= 80 
                ? 'bg-success/10 border-success/20' 
                : confidence >= 50 
                  ? 'bg-warning/10 border-warning/20' 
                  : 'bg-destructive/10 border-destructive/20'
            )}>
              {confidence >= 80 ? (
                <CheckCircle className="h-4 w-4 text-success shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium">
                  Akurasi: {confidence}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {confidence >= 80 ? 'Hasil dengan akurasi tinggi' : 'Periksa kembali hasil ekstraksi'}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              {results && Object.entries(results).map(([key, value]) => renderFieldValue(key, value))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowResults(false)}
              >
                Batal
              </Button>
              <Button
                className="flex-1 rounded-xl gradient-cta"
                onClick={handleApply}
              >
                Terapkan Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
