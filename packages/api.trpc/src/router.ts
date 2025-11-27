console.log("[TRACE] @_/api.trpc/router - START", Date.now());
import { router, Procedure } from "./init";
console.log("[TRACE] @_/api.trpc/router - after init import", Date.now());
export const appRouter = router({
  helloQuery: Procedure.public.query(() => "hello"),
  helloMutation: Procedure.public.mutation(() => `Hello at ${new Date()}`),
});
export type AppRouter = typeof appRouter;
