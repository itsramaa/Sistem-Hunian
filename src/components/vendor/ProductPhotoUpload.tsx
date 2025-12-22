import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X, Loader2, ImageIcon } from "lucide-react";

interface ProductPhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export const ProductPhotoUpload = ({
  photos,
  onPhotosChange,
  maxPhotos = 5,
}: ProductPhotoUploadProps) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const handleFilesSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    if (photos.length + files.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setIsUploading(true);
    const newPhotos: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/products/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error } = await supabase.storage.from("product-photos").upload(filePath, file);
        if (error) throw error;

        const { data: urlData } = supabase.storage.from("product-photos").getPublicUrl(filePath);
        newPhotos.push(urlData.publicUrl);
      }

      onPhotosChange([...photos, ...newPhotos]);
      if (newPhotos.length > 0) {
        toast.success(`${newPhotos.length} photo(s) uploaded`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload photos");
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {photos.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
            <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-5 w-5"
              onClick={() => removePhoto(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        
        {photos.length < maxPhotos && (
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
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <>
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {photos.length}/{maxPhotos} photos • Max 5MB each
      </p>
    </div>
  );
};