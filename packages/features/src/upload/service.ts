import {
  createPresignedUpload as createPresigned,
  deleteFile,
  getPublicUrl,
} from '@_/lib.storage';
import type { PresignedUploadInput, PresignedUploadResult } from './types';

export const UploadService = {
  async getPresignedUrl(
    input: PresignedUploadInput,
  ): Promise<PresignedUploadResult> {
    const result = await createPresigned({
      filename: input.filename,
      contentType: input.contentType,
      directory: input.directory ?? 'uploads',
    });

    return {
      uploadUrl: result.url,
      key: result.key,
      publicUrl: getPublicUrl(result.key),
      headers: result.headers,
    };
  },

  async delete(key: string): Promise<void> {
    await deleteFile(key);
  },
};
