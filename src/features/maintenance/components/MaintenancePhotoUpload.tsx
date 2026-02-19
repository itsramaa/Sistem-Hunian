import { useState } from 'react';
import { FileUpload } from '@/shared/components/FileUpload';
import { Label } from '@/shared/components/ui/label';
import { X, ImagePlus } from 'lucide-react';

interface MaintenancePhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  label?: string;
  description?: string;
}

export function MaintenancePhotoUpload({
  photos,
  onChange,
  maxPhotos = 5,
  label = 'Issue Photos',
  description = 'Upload photos to help describe the issue (max 5)',
}: MaintenancePhotoUploadProps) {
  const handleUploadComplete = (url: string) => {
    if (photos.length < maxPhotos) {
      onChange([...photos, url]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-sm text-muted-foreground">{description}</p>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={photo}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border"
              />
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

      {/* Upload Button */}
      {photos.length < maxPhotos && (
        <div className="flex items-center gap-2">
          <FileUpload
            bucket="maintenance-photos"
            onUploadComplete={handleUploadComplete}
            accept="image/*"
            maxSize={5}
          />
          <span className="text-xs text-muted-foreground">
            {photos.length}/{maxPhotos} photos
          </span>
        </div>
      )}
    </div>
  );
}
