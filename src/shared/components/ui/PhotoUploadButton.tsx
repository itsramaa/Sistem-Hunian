import { useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Camera, Upload } from "lucide-react";
import { cn } from "@/shared/utils/utils";

const MAX_SIZE = 6 * 1024 * 1024;

interface PhotoUploadButtonProps {
  /** Called when user selects and confirms a file */
  onUpload: (file: File) => void;
  /** Whether upload is in progress */
  isUploading?: boolean;
  /** Button label */
  label?: string;
  /** Whether to show camera capture option */
  showCamera?: boolean;
  /** Accepted file types */
  accept?: string;
  className?: string;
}

export function PhotoUploadButton({
  onUpload,
  isUploading,
  label = "Upload Foto",
  showCamera = true,
  accept = "image/*",
  className,
}: PhotoUploadButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE) {
      alert("Ukuran foto maksimal 6 MB");
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setDialogOpen(true);
    e.target.value = "";
  };

  const handleConfirm = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
    setDialogOpen(false);
    setPreview(null);
    setSelectedFile(null);
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setPreview(null);
    setSelectedFile(null);
  };

  return (
    <>
      <div className={cn("flex gap-2", className)}>
        {showCamera && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg cursor-pointer hover:bg-primary/5 hover:text-primary"
              onClick={() => cameraRef.current?.click()}
              disabled={isUploading}
            >
              <Camera className="h-4 w-4 mr-1" />
              Kamera
            </Button>
            <input
              ref={cameraRef}
              type="file"
              accept={accept}
              capture="environment"
              className="hidden"
              onChange={handleFile}
            />
          </>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg cursor-pointer hover:bg-primary/5 hover:text-primary"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-1" />
          {label}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFile}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && handleCancel()}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Pratinjau Foto</DialogTitle>
          </DialogHeader>
          <div className="relative rounded-xl overflow-hidden bg-muted">
            {preview && (
              <img
                src={preview}
                alt="Pratinjau"
                className="w-full h-auto max-h-64 object-contain"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="rounded-lg"
            >
              Batal
            </Button>
            <Button onClick={handleConfirm} className="rounded-lg">
              Gunakan Foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
