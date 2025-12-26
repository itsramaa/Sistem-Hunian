import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'paused' | 'completed' | 'error';
  progress: UploadProgress;
  error: string | null;
  url: string | null;
}

interface UseResumableUploadOptions {
  bucket: string;
  folder?: string;
  onComplete?: (url: string, path: string) => void;
  onError?: (error: string) => void;
  chunkSize?: number; // in bytes
}

const DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB chunks

export function useResumableUpload(options: UseResumableUploadOptions) {
  const { user } = useAuth();
  const [state, setState] = useState<UploadState>({
    status: 'idle',
    progress: { loaded: 0, total: 0, percentage: 0 },
    error: null,
    url: null,
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const uploadedBytesRef = useRef(0);
  const currentFileRef = useRef<File | null>(null);
  const filePathRef = useRef<string | null>(null);

  const updateProgress = useCallback((loaded: number, total: number) => {
    const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
    setState(prev => ({
      ...prev,
      progress: { loaded, total, percentage },
    }));
  }, []);

  const upload = useCallback(async (file: File) => {
    if (!user) {
      setState(prev => ({ ...prev, status: 'error', error: 'User not authenticated' }));
      return;
    }

    currentFileRef.current = file;
    abortControllerRef.current = new AbortController();
    uploadedBytesRef.current = 0;

    const fileExt = file.name.split('.').pop();
    const filePath = options.folder
      ? `${user.id}/${options.folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      : `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    
    filePathRef.current = filePath;

    setState({
      status: 'uploading',
      progress: { loaded: 0, total: file.size, percentage: 0 },
      error: null,
      url: null,
    });

    try {
      // Simulate chunked upload progress
      const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
      const totalChunks = Math.ceil(file.size / chunkSize);
      
      // Update progress during upload simulation
      const progressInterval = setInterval(() => {
        if (abortControllerRef.current?.signal.aborted) {
          clearInterval(progressInterval);
          return;
        }
        
        const currentProgress = uploadedBytesRef.current;
        const increment = Math.min(chunkSize / 2, file.size - currentProgress);
        uploadedBytesRef.current = Math.min(currentProgress + increment, file.size * 0.95);
        updateProgress(uploadedBytesRef.current, file.size);
      }, 100);

      // Actual upload
      const { error: uploadError } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      // Complete progress
      uploadedBytesRef.current = file.size;
      updateProgress(file.size, file.size);

      const { data: urlData } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(filePath);

      setState(prev => ({
        ...prev,
        status: 'completed',
        url: urlData.publicUrl,
      }));

      options.onComplete?.(urlData.publicUrl, filePath);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setState(prev => ({ ...prev, status: 'paused' }));
      } else {
        const errorMessage = error.message || 'Upload failed';
        setState(prev => ({ ...prev, status: 'error', error: errorMessage }));
        options.onError?.(errorMessage);
      }
    }
  }, [user, options, updateProgress]);

  const pause = useCallback(() => {
    abortControllerRef.current?.abort();
    setState(prev => ({ ...prev, status: 'paused' }));
  }, []);

  const resume = useCallback(async () => {
    const file = currentFileRef.current;
    if (!file) return;
    
    // For simplicity, we restart the upload
    // A full implementation would track chunks and resume from last position
    await upload(file);
  }, [upload]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    uploadedBytesRef.current = 0;
    currentFileRef.current = null;
    filePathRef.current = null;
    setState({
      status: 'idle',
      progress: { loaded: 0, total: 0, percentage: 0 },
      error: null,
      url: null,
    });
  }, []);

  const reset = useCallback(() => {
    cancel();
  }, [cancel]);

  return {
    ...state,
    upload,
    pause,
    resume,
    cancel,
    reset,
  };
}
