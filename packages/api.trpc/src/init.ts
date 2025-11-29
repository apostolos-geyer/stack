import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { InnerContext, AuthenticatedContext } from "@_/features/context";

// Re-export context types for convenience
export type { InnerContext as Context, AuthenticatedContext };
export type ContextSource =
  | InnerContext
  | (() => InnerContext)
  | (() => Promise<InnerContext>);

const t = initTRPC.context<InnerContext>().create({
  transformer: superjson,
});

export const { router, createCallerFactory, middleware } = t;

/**
 * Middleware that enforces authentication
 * Throws UNAUTHORIZED if no user/session in context
 */
const enforceAuth = middleware(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      session: ctx.session,
    } satisfies AuthenticatedContext,
  });
});

export const Procedure = {
  /** Public procedure - no authentication required */
  public: t.procedure,
  /** Protected procedure - requires authenticated user */
  protected: t.procedure.use(enforceAuth),
};
