'use client';

import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/store/useToastStore';
import { API_URL } from '@/lib/env';

interface UseCoverImageUploadOptions {
  onSuccess: (url: string) => void;
}

/**
 * Handles cover image file selection, drag-and-drop state, and upload
 * request to `/upload`.
 */
export function useCoverImageUpload({ onSuccess }: UseCoverImageUploadOptions) {
  const token = useAppStore((state) => state.token);
  const pushToast = useToastStore((state) => state.push);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        pushToast({ variant: 'error', title: 'Please select an image file.' });
        return;
      }

      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.data?.url) {
          onSuccess(data.data.url);
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } catch (err: unknown) {
        pushToast({
          variant: 'error',
          title: 'Failed to upload image',
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setUploadingImage(false);
      }
    },
    [token, pushToast, onSuccess],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        await uploadFile(file);
      }
    },
    [uploadFile],
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await uploadFile(file);
      }
    },
    [uploadFile],
  );

  return {
    uploadingImage,
    isDragging,
    uploadFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileChange,
  };
}
