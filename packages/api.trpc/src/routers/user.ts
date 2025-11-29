import { z } from 'zod';
import { router, Procedure } from '../init';
import { UserService } from '@_/features/user';

export const userRouter = router({
  /**
   * Update user avatar
   * Uploads go to S3 via useUpload hook, then this mutation:
   * 1. Updates user.image in DB
   * 2. Deletes old avatar if it was in our storage
   */
  updateAvatar: Procedure.protected
    .input(
      z.object({
        imageUrl: z.string().url(),
        oldImageUrl: z.string().url().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return UserService.updateAvatar(ctx, {
        imageUrl: input.imageUrl,
        oldImageUrl: input.oldImageUrl,
      });
    }),
});
