import { z } from 'zod';
import { router, Procedure } from '../init';
import { UploadService } from '@_/features/upload';

export const uploadRouter = router({
  /**
   * Get a presigned URL for uploading a file
   * Returns the upload URL, storage key, and public URL
   */
  getPresignedUrl: Procedure.protected
    .input(
      z.object({
        filename: z.string().min(1).max(255),
        contentType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return UploadService.getPresignedUrl({
        filename: input.filename,
        contentType: input.contentType,
        directory: `uploads/${ctx.user.id}`,
      });
    }),

  /**
   * Delete a file from storage
   * Only allows deleting files in the user's upload directory
   */
  delete: Procedure.protected
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Security: Only allow deleting files in the user's directory
      const userPrefix = `uploads/${ctx.user.id}/`;
      if (!input.key.startsWith(userPrefix)) {
        throw new Error('Cannot delete files outside your upload directory');
      }

      await UploadService.delete(input.key);
      return { success: true };
    }),
});
