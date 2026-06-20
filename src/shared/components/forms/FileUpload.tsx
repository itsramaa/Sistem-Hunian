import { useAuth } from "@/features/auth/hooks/useAuth";
import { apiClient } from "@/shared/lib/axios";
import { Button } from "@/shared/components/ui/button";
import { WebcamCaptureDialog } from "@/shared/components/WebcamCaptureDialog";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Camera, FileText, Image as ImageIcon, Loader2, Upload, Video, X } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface FileUploadProps {
  bucket: "verification-documents" | "property-images" | "maintenance-photos" | "payment-proofs" | "contract-documents";
  folder?: string;
  onUploadComplete: (url: string, path: string) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
  capture?: "environment" | "user";
  buttonLabel?: string;
  buttonIcon?: "camera" | "gallery" | "upload";
}

export const FileUpload = ({
  bucket,
  folder,
  onUploadComplete,
  accept = "image/*,application/pdf",
  maxSize = 5,
  className = "",
  capture,
  buttonLabel,
  buttonIcon,
}: FileUploadProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [webcamOpen, setWebcamOpen] = useState(false);

  const uploadBlob = useCallback(async (blob: Blob, ext: string = 'jpg') => {
    if (!user) return;
    setIsUploading(true);
    try {
      const filePath = folder
        ? `${user.id}/${folder}/${Date.now()}.${ext}`
        : `${user.id}/${Date.now()}.${ext}`;

      // TODO: implement file storage endpoint — was: supabase.storage.from(bucket).upload(filePath, blob)
      const formData = new FormData();
      formData.append('file', blob, `upload.${ext}`);
      formData.append('bucket', bucket);
      formData.append('path', filePath);

      const r = await apiClient.post('/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const publicUrl: string = r.data?.url ?? '';

      onUploadComplete(publicUrl, filePath);
      toast.success("File uploaded successfully");
    } catch (error) {
      const err = error as Error;
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  }, [bucket, folder, onUploadComplete, user]);

  const handleWebcamCapture = useCallback(async (blob: Blob) => {
    if (blob.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(blob);
    }
    await uploadBlob(blob, 'jpg');
  }, [uploadBlob]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }

    setIsUploading(true);
    setFileName(file.name);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = folder
        ? `${user.id}/${folder}/${Date.now()}.${fileExt}`
        : `${user.id}/${Date.now()}.${fileExt}`;

      // TODO: implement file storage endpoint — was: supabase.storage.from(bucket).upload(filePath, file)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('path', filePath);

      const r = await apiClient.post('/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const publicUrl: string = r.data?.url ?? '';

      onUploadComplete(publicUrl, filePath);
      toast.success("File uploaded successfully");
    } catch (error) {
      const err = error as Error;
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload file");
      setPreview(null);
      setFileName(null);
    } finally {
      setIsUploading(false);
    }
  }, [bucket, folder, maxSize, onUploadComplete, user]);

  const clearPreview = () => {
    setPreview(null);
    setFileName(null);
  };

  // Compact button mode
  if (buttonLabel || buttonIcon) {
    const IconComp = buttonIcon === 'camera' ? Camera : buttonIcon === 'gallery' ? ImageIcon : Upload;
    return (
      <>
        <div className={`relative inline-block ${className}`}>
          <input
            type="file"
            accept={accept}
            capture={capture}
            onChange={handleFileSelect}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5 pointer-events-none" disabled={isUploading}>
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconComp className="h-4 w-4" />}
            {buttonLabel || (buttonIcon === 'camera' ? 'Kamera' : buttonIcon === 'gallery' ? 'Galeri' : 'Upload')}
          </Button>
        </div>
        {/* Show webcam button alongside camera on desktop */}
        {buttonIcon === 'camera' && !isMobile && (
          <>
            <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => setWebcamOpen(true)} disabled={isUploading}>
              <Video className="h-4 w-4" /> Webcam
            </Button>
            <WebcamCaptureDialog open={webcamOpen} onOpenChange={setWebcamOpen} onCapture={handleWebcamCapture} />
          </>
        )}
      </>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        <input
          type="file"
          accept={accept}
          capture={capture}
          onChange={handleFileSelect}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="max-h-32 mx-auto rounded-lg" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={(e) => {
                  e.preventDefault();
                  clearPreview();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : fileName ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              <span className="text-sm text-foreground">{fileName}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {capture ? <Camera className="h-8 w-8 text-muted-foreground" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
              <p className="text-sm text-muted-foreground">
                {capture ? 'Tap to take photo' : 'Click or drag to upload'}
              </p>
              <p className="text-xs text-muted-foreground">
                Max {maxSize}MB • {accept.replace(/,/g, ", ")}
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Desktop webcam button for drop-zone mode */}
      {!isMobile && accept.startsWith('image') && (
        <div className="flex justify-center">
          <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => setWebcamOpen(true)} disabled={isUploading}>
            <Video className="h-4 w-4" /> Webcam
          </Button>
        </div>
      )}
      <WebcamCaptureDialog open={webcamOpen} onOpenChange={setWebcamOpen} onCapture={handleWebcamCapture} />
    </div>
  );
};

interface ImageGalleryUploadProps {
  bucket: "property-images";
  folder: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export const ImageGalleryUpload = ({
  bucket,
  folder,
  images,
  onImagesChange,
  maxImages = 10,
}: ImageGalleryUploadProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isUploading, setIsUploading] = useState(false);
  const [webcamOpen, setWebcamOpen] = useState(false);

  const handleFilesSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setIsUploading(true);
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        // TODO: implement file storage endpoint — was: supabase.storage.from(bucket).upload(filePath, file)
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', bucket);
        formData.append('path', filePath);

        const r = await apiClient.post('/storage/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        newImages.push(r.data?.url ?? '');
      }

      onImagesChange([...images, ...newImages]);
      toast.success(`${newImages.length} image(s) uploaded`);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Failed to upload images");
    } finally {
      setIsUploading(false);
    }
  };

  const handleWebcamCapture = async (blob: Blob) => {
    if (!user || images.length >= maxImages) return;
    setIsUploading(true);
    try {
      const filePath = `${user.id}/${folder}/${Date.now()}.jpg`;
      // TODO: implement file storage endpoint — was: supabase.storage.from(bucket).upload(filePath, blob)
      const formData = new FormData();
      formData.append('file', blob, 'webcam.jpg');
      formData.append('bucket', bucket);
      formData.append('path', filePath);

      const r = await apiClient.post('/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onImagesChange([...images, r.data?.url ?? '']);
      toast.success('Photo captured and uploaded');
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Failed to upload webcam photo");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
            <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={() => removeImage(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {images.length < maxImages && (
          <div className="relative aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesSelect}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <>
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">
          {images.length}/{maxImages} images
        </p>
        {!isMobile && images.length < maxImages && (
          <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5 h-7 text-xs" onClick={() => setWebcamOpen(true)} disabled={isUploading}>
            <Video className="h-3.5 w-3.5" /> Webcam
          </Button>
        )}
      </div>
      <WebcamCaptureDialog open={webcamOpen} onOpenChange={setWebcamOpen} onCapture={handleWebcamCapture} />
    </div>
  );
};
