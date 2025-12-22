import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/FileUpload";
import { toast } from "sonner";
import { Loader2, Send, Image, X } from "lucide-react";

interface MaintenanceReplyFormProps {
  maintenanceRequestId: string;
  authorRole: "tenant" | "merchant" | "vendor";
  currentStatus?: string;
  onSuccess?: () => void;
}

export function MaintenanceReplyForm({
  maintenanceRequestId,
  authorRole,
  currentStatus = "pending",
  onSuccess,
}: MaintenanceReplyFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [statusChange, setStatusChange] = useState<string>("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  const addReplyMutation = useMutation({
    mutationFn: async () => {
      // Insert the update
      const { error: updateError } = await supabase
        .from("maintenance_updates")
        .insert({
          maintenance_request_id: maintenanceRequestId,
          author_id: user!.id,
          author_role: authorRole,
          content,
          status_change_to: statusChange || null,
          photos: photos.length > 0 ? photos : null,
        });

      if (updateError) throw updateError;

      // Update status if changed
      if (statusChange && authorRole !== "tenant") {
        const updateData: Record<string, unknown> = { status: statusChange };
        if (statusChange === "completed") {
          updateData.resolved_at = new Date().toISOString();
        }
        const { error: statusError } = await supabase
          .from("maintenance_requests")
          .update(updateData)
          .eq("id", maintenanceRequestId);

        if (statusError) throw statusError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-updates", maintenanceRequestId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-request", maintenanceRequestId] });
      setContent("");
      setStatusChange("");
      setPhotos([]);
      setShowPhotoUpload(false);
      toast.success("Reply added successfully");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(`Failed to add reply: ${error.message}`);
    },
  });

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const canChangeStatus = authorRole === "merchant" || authorRole === "vendor";

  const statusOptions = [
    { value: "", label: "No status change" },
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
      <div className="space-y-2">
        <Label>Your Reply</Label>
        <Textarea
          placeholder="Add your update or reply..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
      </div>

      {/* Photo Upload */}
      <div className="space-y-2">
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo}
                  alt={`Upload ${index + 1}`}
                  className="h-16 w-16 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showPhotoUpload ? (
          <div className="space-y-2">
            <FileUpload
              bucket="maintenance-photos"
              folder="updates"
              accept="image/*"
              maxSize={5}
              onUploadComplete={(url) => {
                setPhotos([...photos, url]);
                setShowPhotoUpload(false);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPhotoUpload(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPhotoUpload(true)}
            className="gap-2"
          >
            <Image className="h-4 w-4" />
            Add Photo
          </Button>
        )}
      </div>

      {/* Status Change (only for merchant/vendor) */}
      {canChangeStatus && (
        <div className="space-y-2">
          <Label>Update Status (Optional)</Label>
          <Select value={statusChange} onValueChange={setStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Keep current status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => addReplyMutation.mutate()}
          disabled={!content.trim() || addReplyMutation.isPending}
          className="gap-2"
        >
          {addReplyMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send Reply
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
