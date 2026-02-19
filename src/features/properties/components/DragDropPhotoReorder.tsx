import { useState, useCallback } from 'react';
import { GripVertical, X, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/utils';

interface DragDropPhotoReorderProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  onUpload?: (files: File[]) => Promise<string[]>;
  maxPhotos?: number;
  disabled?: boolean;
  className?: string;
}

export function DragDropPhotoReorder({
  photos,
  onPhotosChange,
  onUpload,
  maxPhotos = 10,
  disabled = false,
  className,
}: DragDropPhotoReorderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newPhotos = [...photos];
    const [draggedPhoto] = newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(targetIndex, 0, draggedPhoto);
    
    onPhotosChange(newPhotos);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, photos, onPhotosChange]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleRemove = useCallback((index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  }, [photos, onPhotosChange]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !onUpload) return;

    const remainingSlots = maxPhotos - photos.length;
    const filesToUpload = files.slice(0, remainingSlots);

    if (filesToUpload.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls = await onUpload(filesToUpload);
      onPhotosChange([...photos, ...uploadedUrls]);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  }, [photos, onPhotosChange, onUpload, maxPhotos]);

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Drag to reorder • {photos.length}/{maxPhotos} photos
        </p>
        {photos.length > 0 && (
          <p className="text-xs text-muted-foreground">First photo is the cover image</p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {photos.map((photo, index) => (
          <div
            key={`${photo}-${index}`}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing group",
              index === 0 && "ring-2 ring-primary ring-offset-2",
              draggedIndex === index && "opacity-50 scale-95",
              dragOverIndex === index && "border-primary border-dashed scale-105",
              disabled && "cursor-default"
            )}
          >
            <img
              src={photo}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
            
            {/* Cover label */}
            {index === 0 && (
              <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                Cover
              </div>
            )}

            {/* Order number */}
            <div className="absolute bottom-1 left-1 bg-background/80 text-xs px-1.5 py-0.5 rounded">
              {index + 1}
            </div>

            {/* Actions overlay */}
            {!disabled && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <div className="flex flex-col items-center">
                  <GripVertical className="h-6 w-6 text-white" />
                  <span className="text-xs text-white">Drag</span>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}

        {/* Upload placeholder */}
        {canAddMore && onUpload && !disabled && (
          <label
            className={cn(
              "aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors",
              uploading && "pointer-events-none"
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                <span className="text-xs text-muted-foreground">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground text-center px-2">
                  Add Photo
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {photos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">No photos added yet</p>
          {onUpload && (
            <label className="cursor-pointer">
              <Button variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photos
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}
