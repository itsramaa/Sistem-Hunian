import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { SignaturePad } from "./SignaturePad";
import { Check, RotateCcw } from "lucide-react";

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (dataUrl: string) => void;
  title?: string;
  description?: string;
}

export function SignatureDialog({
  open,
  onOpenChange,
  onSave,
  title = "Tanda Tangan Digital",
  description = "Gambar tanda tangan Anda di area di bawah ini",
}: SignatureDialogProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const handlePadSave = (dataUrl: string) => {
    setPreview(dataUrl);
  };

  const handleConfirm = () => {
    if (preview) {
      onSave(preview);
      setPreview(null);
      onOpenChange(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setPreview(null); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {preview ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-4 bg-white flex items-center justify-center">
              <img src={preview} alt="Preview tanda tangan" className="max-h-[200px] object-contain" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Ulangi
              </Button>
              <Button className="flex-1 gradient-cta rounded-xl" onClick={handleConfirm}>
                <Check className="h-4 w-4 mr-2" />
                Konfirmasi
              </Button>
            </div>
          </div>
        ) : (
          <SignaturePad onSave={handlePadSave} />
        )}
      </DialogContent>
    </Dialog>
  );
}
