'use client';

import { useMutation } from '@tanstack/react-query';
import { useUpload } from '../upload';
import { useAuthFeatures } from '../auth';
import { useTRPC } from '../lib';

export type UseAvatarUploadOptions = {
  /** Called when avatar upload completes successfully */
  onSuccess?: (imageUrl: string) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
};

/**
 * Hook for uploading user avatars
 *
 * Handles the full flow:
 * 1. Upload file to S3
 * 2. Update user.image in DB
 * 3. Delete old avatar (if it was in our storage)
 * 4. Refresh session
 *
 * @example
 * const { uploadAvatar, isUploading, progress } = useAvatarUpload();
 *
 * <input
 *   type="file"
 *   accept="image/*"
 *   onChange={(e) => {
 *     const file = e.target.files?.[0];
 *     if (file) uploadAvatar(file);
 *   }}
 * />
 */
export function useAvatarUpload(options: UseAvatarUploadOptions = {}) {
  const { upload, status, progress, error, reset } = useUpload();
  const { session } = useAuthFeatures();
  const trpc = useTRPC();

  const updateAvatarMutation = useMutation(
    trpc.user.updateAvatar.mutationOptions({
      onSuccess: () => {
        // Refresh session to get updated user data
        session.refetch();
      },
    })
  );

  const uploadAvatar = async (file: File) => {
    // Validate image type
    if (!file.type.startsWith('image/')) {
      const message = 'File must be an image';
      options.onError?.(message);
      throw new Error(message);
    }

    try {
      // Upload to S3
      const result = await upload(file);

      // Update user and cleanup old avatar
      await updateAvatarMutation.mutateAsync({
        imageUrl: result.url,
        oldImageUrl: session.data?.user?.image,
      });

      options.onSuccess?.(result.url);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Avatar upload failed';
      options.onError?.(message);
      throw err;
    }
  };

  return {
    uploadAvatar,
    status,
    progress,
    error,
    reset,
    isUploading: status === 'uploading' || status === 'preparing',
    isUpdating: updateAvatarMutation.isPending,
    isBusy: status === 'uploading' || status === 'preparing' || updateAvatarMutation.isPending,
  };
}
