import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { FileUpload } from "@/shared/components/FileUpload";
import { WebcamCaptureDialog } from "@/shared/components/WebcamCaptureDialog";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { toast } from "sonner";
import { Loader2, Send, Image, Video, X } from "lucide-react";

interface MaintenanceReplyFormProps {
  maintenanceRequestId: string;
  authorRole: "tenant" | "merchant" | "vendor";
  currentStatus?: string;
  onSuccess?: () => void;
}

export function MaintenanceReplyForm({ maintenanceRequestId, authorRole, currentStatus = "pending", onSuccess }: MaintenanceReplyFormProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [statusChange, setStatusChange] = useState<string>("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [webcamOpen, setWebcamOpen] = useState(false);

  const handleWebcamCapture = async (blob: Blob) => {
    if (!user) return;
    try {
      // TODO: Go storage endpoint not yet implemented — was: supabase.storage.from('maintenance-photos').upload(...)
      const publicUrl = `/storage/placeholder/${Date.now()}.jpg`;
      setPhotos([...photos, publicUrl]);
      toast.success('Foto berhasil diambil');
    } catch {
      toast.error('Gagal mengupload foto webcam');
    }
  };

  const addReplyMutation = useMutation({
    mutationFn: async () => {
      // TODO: Go endpoint not yet implemented — was: supabase.from('maintenance_updates').insert(...)
      // TODO: Go endpoint not yet implemented — was: supabase.from('maintenance_requests').update(...)
      // No-op stub
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-updates", maintenanceRequestId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-request", maintenanceRequestId] });
      setContent(""); setStatusChange(""); setPhotos([]); setShowPhotoUpload(false);
      toast.success("Reply added successfully");
      onSuccess?.();
    },
    onError: (error: Error) => { toast.error(`Failed to add reply: ${error.message}`); },
  });

  const removePhoto = (index: number) => { setPhotos(photos.filter((_, i) => i !== index)); };
  const canChangeStatus = authorRole === "merchant" || authorRole === "vendor";
  const statusOptions = [
    { value: "", label: "No status change" },
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40">
      <div className="space-y-2">
        <Label>Your Reply</Label>
        <Textarea placeholder="Add your update or reply..." value={content} onChange={(e) => setContent(e.target.value)} rows={3} className="rounded-xl bg-background/60 border-border/50" />
      </div>

      <div className="space-y-2">
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img src={photo} alt={`Upload ${index + 1}`} className="h-16 w-16 object-cover rounded-xl border border-border/40" />
                <button type="button" onClick={() => removePhoto(index)} className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {showPhotoUpload ? (
          <div className="space-y-2">
            <FileUpload bucket="maintenance-photos" folder="updates" accept="image/*" maxSize={5} onUploadComplete={(url) => { setPhotos([...photos, url]); setShowPhotoUpload(false); }} />
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowPhotoUpload(false)}>Cancel</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowPhotoUpload(true)} className="gap-2 rounded-xl">
              <Image className="h-4 w-4" />Add Photo
            </Button>
            {!isMobile && (
              <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => setWebcamOpen(true)}>
                <Video className="h-4 w-4" /> Webcam
              </Button>
            )}
          </div>
        )}
        <WebcamCaptureDialog open={webcamOpen} onOpenChange={setWebcamOpen} onCapture={handleWebcamCapture} />
      </div>

      {canChangeStatus && (
        <div className="space-y-2">
          <Label>Update Status (Optional)</Label>
          <Select value={statusChange} onValueChange={setStatusChange}>
            <SelectTrigger className="rounded-xl bg-background/60 border-border/50"><SelectValue placeholder="Keep current status" /></SelectTrigger>
            <SelectContent className="rounded-xl">
              {statusOptions.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={() => addReplyMutation.mutate()} disabled={!content.trim() || addReplyMutation.isPending} className="gap-2 gradient-cta text-primary-foreground rounded-xl">
          {addReplyMutation.isPending ? (<><Loader2 className="h-4 w-4 animate-spin" />Sending...</>) : (<><Send className="h-4 w-4" />Send Reply</>)}
        </Button>
      </div>
    </div>
  );
}