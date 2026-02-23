import { useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';

interface UnitPhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export const UnitPhotoUpload = ({ 
  photos, 
  onPhotosChange, 
  maxPhotos = 10 
}: UnitPhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!user) {
      toast.error('You must be logged in to upload photos');
      return;
    }

    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 5MB limit`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `unit-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/units/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.length > 0) {
        onPhotosChange([...photos, ...uploadedUrls]);
        toast.success(`${uploadedUrls.length} photo(s) uploaded`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {photos.map((photo, index) => (
          <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-border/40">
            <img
              src={photo}
              alt={`Unit photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute top-1 right-1 p-1 bg-destructive/90 backdrop-blur-sm text-destructive-foreground rounded-full hover:bg-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        {photos.length < maxPhotos && (
          <label className="aspect-square rounded-xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesSelect}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground mt-1">Add</span>
              </>
            )}
          </label>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        {photos.length}/{maxPhotos} photos • Max 5MB each
      </p>
    </div>
  );
};
