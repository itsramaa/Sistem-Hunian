import { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Camera, RefreshCw, Check, X } from 'lucide-react';

interface WebcamCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (blob: Blob) => void;
}

export function WebcamCaptureDialog({ open, onOpenChange, onCapture }: WebcamCaptureDialogProps) {
  const webcamRef = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) setCapturedImage(imageSrc);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!capturedImage) return;
    const res = await fetch(capturedImage);
    const blob = await res.blob();
    onCapture(blob);
    setCapturedImage(null);
    onOpenChange(false);
  }, [capturedImage, onCapture, onOpenChange]);

  const handleRetake = () => setCapturedImage(null);

  const toggleCamera = () => setFacingMode(f => f === 'user' ? 'environment' : 'user');

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setCapturedImage(null); onOpenChange(v); }}>
      <DialogContent className="max-w-lg rounded-2xl p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" /> Webcam
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {capturedImage ? (
            <img src={capturedImage} alt="Captured" className="w-full rounded-xl" />
          ) : (
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode }}
              className="w-full rounded-xl"
              audio={false}
            />
          )}
          <div className="flex gap-2 justify-center">
            {capturedImage ? (
              <>
                <Button variant="outline" className="rounded-xl gap-2" onClick={handleRetake}>
                  <RefreshCw className="h-4 w-4" /> Ulang
                </Button>
                <Button className="rounded-xl gap-2 gradient-cta" onClick={handleConfirm}>
                  <Check className="h-4 w-4" /> Gunakan
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="icon" className="rounded-xl" onClick={toggleCamera}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button className="rounded-xl gap-2 gradient-cta" onClick={capture}>
                  <Camera className="h-4 w-4" /> Ambil Foto
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
