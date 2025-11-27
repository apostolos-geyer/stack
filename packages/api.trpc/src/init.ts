console.log("[TRACE] @_/api.trpc/init - START", Date.now());
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
console.log("[TRACE] @_/api.trpc/init - before lib.server import", Date.now());
import type { InnerContext, AuthenticatedContext } from "@_/lib.server";
console.log("[TRACE] @_/api.trpc/init - after lib.server import", Date.now());

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
