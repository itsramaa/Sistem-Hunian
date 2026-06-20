import { FileUpload } from '@/shared/components/FileUpload';
import { WebcamCaptureDialog } from '@/shared/components/WebcamCaptureDialog';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { X, Video } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import { useIsMobile } from '@/shared/hooks/use-mobile';

interface MaintenancePhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  label?: string;
  description?: string;
}

export function MaintenancePhotoUpload({ photos, onChange, maxPhotos = 5, label = 'Issue Photos', description = 'Upload photos to help describe the issue (max 5)' }: MaintenancePhotoUploadProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [webcamOpen, setWebcamOpen] = useState(false);

  const handleRemovePhoto = (index: number) => { onChange(photos.filter((_, i) => i !== index)); };

  const handleWebcamCapture = async (blob: Blob) => {
    if (!user || photos.length >= maxPhotos) return;
    try {
      // TODO: Go storage endpoint not yet implemented — was: supabase.storage.from('maintenance-photos').upload(...)
      const publicUrl = `/storage/placeholder/${Date.now()}.jpg`;
      onChange([...photos, publicUrl]);
      toast.success('Foto berhasil diambil');
    } catch (err) {
      toast.error('Gagal mengupload foto webcam');
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-sm text-muted-foreground">{description}</p>

      {photos.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative group aspect-square">
              <img src={photo} alt={`Upload ${index + 1}`} className="w-full h-full object-cover rounded-xl border border-border/40 hover:opacity-80 transition-opacity" />
              <button
                type="button"
                onClick={() => handleRemovePhoto(index)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length < maxPhotos && (
        <div className="flex items-center gap-2">
          <FileUpload bucket="maintenance-photos" onUploadComplete={(url) => { if (photos.length < maxPhotos) onChange([...photos, url]); }} accept="image/*" maxSize={5} capture="environment" buttonLabel="Kamera" buttonIcon="camera" />
          <FileUpload bucket="maintenance-photos" onUploadComplete={(url) => { if (photos.length < maxPhotos) onChange([...photos, url]); }} accept="image/*" maxSize={5} buttonLabel="Galeri" buttonIcon="gallery" />
          {!isMobile && (
            <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => setWebcamOpen(true)}>
              <Video className="h-4 w-4" /> Webcam
            </Button>
          )}
          <span className="text-xs text-muted-foreground">{photos.length}/{maxPhotos}</span>
        </div>
      )}

      <WebcamCaptureDialog open={webcamOpen} onOpenChange={setWebcamOpen} onCapture={handleWebcamCapture} />
    </div>
  );
}
