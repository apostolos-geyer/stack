'use client';

import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '../lib';
import type { UploadResult, UploadStatus, PreparedUpload } from '@_/features/upload';

export type UseUploadOptions = {
  /** Called when upload completes successfully */
  onSuccess?: (result: UploadResult) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Called during upload with progress percentage */
  onProgress?: (progress: number) => void;
};

/**
 * Upload a file to S3 using XHR for progress tracking
 */
async function uploadToS3(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    xhr.open('PUT', url);

    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

    xhr.send(file);
  });
}

/**
 * Hook for uploading files to S3 with full control over the upload lifecycle.
 *
 * @example
 * // Simple upload
 * const { upload, status, progress, result } = useUpload();
 * const handleFile = async (file: File) => {
 *   const uploaded = await upload(file);
 *   console.log('Uploaded to:', uploaded.url);
 * };
 *
 * @example
 * // Controlled upload (prepare first, execute later)
 * const { prepare, execute, prepared, status } = useUpload();
 * // Step 1: Prepare (gets presigned URL)
 * await prepare(file);
 * // Step 2: Execute when ready (actually uploads to S3)
 * const result = await execute();
 */
export function useUpload(options: UseUploadOptions = {}) {
  const trpc = useTRPC();
  const presignedUrlMutation = useMutation(trpc.upload.getPresignedUrl.mutationOptions());
  const deleteMutation = useMutation(trpc.upload.delete.mutationOptions());

  const [status, setStatus] = useState<UploadStatus>('idle');
  const [prepared, setPrepared] = useState<PreparedUpload | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Prepare an upload by getting a presigned URL
   * Does not actually upload the file - call execute() for that
   */
  const prepare = useCallback(
    async (file: File): Promise<PreparedUpload> => {
      setStatus('preparing');
      setError(null);
      setProgress(0);
      setResult(null);

      try {
        const response = await presignedUrlMutation.mutateAsync({
          filename: file.name,
          contentType: file.type,
        });

        const prep: PreparedUpload = {
          file,
          key: response.key,
          uploadUrl: response.uploadUrl,
          publicUrl: response.publicUrl,
          headers: response.headers,
        };

        setPrepared(prep);
        setStatus('ready');
        return prep;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to prepare upload';
        setError(message);
        setStatus('error');
        options.onError?.(message);
        throw err;
      }
    },
    [presignedUrlMutation, options]
  );

  /**
   * Execute a prepared upload
   * Must call prepare() first, or pass the prepared object directly
   */
  const execute = useCallback(async (preparedUpload?: PreparedUpload): Promise<UploadResult> => {
    const toUpload = preparedUpload ?? prepared;
    if (!toUpload) {
      throw new Error('Must call prepare() before execute()');
    }

    setStatus('uploading');
    setError(null);

    try {
      await uploadToS3(toUpload.uploadUrl, toUpload.file, toUpload.headers, (p) => {
        setProgress(p);
        options.onProgress?.(p);
      });

      const uploadResult: UploadResult = {
        key: toUpload.key,
        url: toUpload.publicUrl,
        filename: toUpload.file.name,
        size: toUpload.file.size,
        mimeType: toUpload.file.type,
      };

      setResult(uploadResult);
      setStatus('uploaded');
      options.onSuccess?.(uploadResult);
      return uploadResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      setStatus('error');
      options.onError?.(message);
      throw err;
    }
  }, [prepared, options]);

  /**
   * Convenience method: prepare + execute in one call
   */
  const upload = useCallback(
    async (file: File): Promise<UploadResult> => {
      const prep = await prepare(file);
      return execute(prep);
    },
    [prepare, execute]
  );

  /**
   * Cancel the current upload and optionally delete the uploaded file
   * Useful when a related operation fails and you want to clean up
   */
  const cancel = useCallback(async () => {
    // Abort any in-progress upload
    abortControllerRef.current?.abort();

    // If already uploaded, delete the file
    if (prepared && status === 'uploaded') {
      try {
        await deleteMutation.mutateAsync({ key: prepared.key });
      } catch {
        // Ignore delete errors - best effort cleanup
      }
    }

    setPrepared(null);
    setResult(null);
    setProgress(0);
    setError(null);
    setStatus('idle');
  }, [prepared, status, deleteMutation]);

  /**
   * Reset the upload state without deleting any files
   */
  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setPrepared(null);
    setResult(null);
    setProgress(0);
    setError(null);
    setStatus('idle');
  }, []);

  return {
    // State
    status,
    progress,
    result,
    error,
    prepared,

    // Derived state
    isIdle: status === 'idle',
    isPreparing: status === 'preparing',
    isReady: status === 'ready',
    isUploading: status === 'uploading',
    isUploaded: status === 'uploaded',
    isError: status === 'error',

    // Actions
    prepare,
    execute,
    upload,
    cancel,
    reset,
  };
}
