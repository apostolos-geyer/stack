import type { User } from "@_/infra.db";
import type { InnerContext, AuthenticatedContext } from "@_/lib.server";

/**
 * User service - all user-related business logic
 *
 * Convention:
 * - Services are plain objects with async functions
 * - First parameter is always context
 * - Functions are pure (no side effects except DB)
 */
export const UserService = {
  /**
   * Get a user by ID
   */
  async getById(ctx: InnerContext, id: string): Promise<User | null> {
    return ctx.db.user.findUnique({ where: { id } });
  },

  /**
   * Get a user by email
   */
  async getByEmail(ctx: InnerContext, email: string): Promise<User | null> {
    return ctx.db.user.findUnique({ where: { email } });
  },

  /**
   * Get current authenticated user
   */
  async me(ctx: AuthenticatedContext): Promise<User> {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
    });
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  },

  /**
   * Update user profile
   * Only the authenticated user can update their own profile
   */
  async updateProfile(
    ctx: AuthenticatedContext,
    data: { name?: string; image?: string }
  ): Promise<User> {
    return ctx.db.user.update({
      where: { id: ctx.user.id },
      data,
    });
  },

  /**
   * Delete user account
   * Cascades to delete sessions and accounts
   */
  async deleteAccount(ctx: AuthenticatedContext): Promise<void> {
    const userId = ctx.user.id;

    // Delete in transaction to ensure consistency
    await ctx.db.$transaction([
      ctx.db.session.deleteMany({ where: { userId } }),
      ctx.db.account.deleteMany({ where: { userId } }),
      ctx.db.user.delete({ where: { id: userId } }),
    ]);
  },
};
