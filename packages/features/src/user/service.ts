import { isOurStorage, extractKeyFromUrl, deleteFile } from '@_/lib.storage';
import type { AuthenticatedContext } from '../lib/context';

export type UpdateAvatarInput = {
  imageUrl: string;
  oldImageUrl?: string | null;
};

export type UpdateAvatarResult = {
  image: string;
};

export const UserService = {
  async updateAvatar(
    ctx: AuthenticatedContext,
    input: UpdateAvatarInput
  ): Promise<UpdateAvatarResult> {
    // Delete old avatar if it's in our storage
    if (input.oldImageUrl && isOurStorage(input.oldImageUrl)) {
      const key = extractKeyFromUrl(input.oldImageUrl);
      if (key) {
        try {
          await deleteFile(key);
        } catch {
          // Best effort - don't fail the update if delete fails
        }
      }
    }

    // Update user in database
    const updated = await ctx.db.user.update({
      where: { id: ctx.user.id },
      data: { image: input.imageUrl },
      select: { image: true },
    });

    return { image: updated.image! };
  },
};
