/**
 * Client-side image compression utility
 * Uses canvas to resize and compress images before upload
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

interface CompressionResult {
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  mimeType: 'image/jpeg',
};

/**
 * Compress an image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Only compress images
  if (!file.type.startsWith('image/')) {
    throw new Error('File is not an image');
  }

  // Skip compression for small files (< 100KB)
  if (file.size < 100 * 1024) {
    return {
      blob: file,
      width: 0,
      height: 0,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      const aspectRatio = width / height;

      if (width > opts.maxWidth) {
        width = opts.maxWidth;
        height = width / aspectRatio;
      }

      if (height > opts.maxHeight) {
        height = opts.maxHeight;
        width = height * aspectRatio;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw image with smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          resolve({
            blob,
            width,
            height,
            originalSize: file.size,
            compressedSize: blob.size,
            compressionRatio: blob.size / file.size,
          });
        },
        opts.mimeType,
        opts.quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load image from file
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compress multiple images
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const result = await compressImage(files[i], options);
    results.push(result);
    onProgress?.(i + 1, files.length);
  }
  
  return results;
}

/**
 * Check if file needs compression
 */
export function shouldCompress(file: File, maxSizeKB: number = 500): boolean {
  return file.type.startsWith('image/') && file.size > maxSizeKB * 1024;
}

/**
 * Get optimal compression options based on file
 */
export function getOptimalOptions(file: File): CompressionOptions {
  const sizeMB = file.size / (1024 * 1024);
  
  if (sizeMB > 5) {
    return { quality: 0.6, maxWidth: 1280, maxHeight: 720 };
  } else if (sizeMB > 2) {
    return { quality: 0.7, maxWidth: 1600, maxHeight: 900 };
  } else {
    return { quality: 0.8, maxWidth: 1920, maxHeight: 1080 };
  }
}
