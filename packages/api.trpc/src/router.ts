console.log("[TRACE] @_/api.trpc/router - START", Date.now());
import { router, Procedure } from "./init";
import { uploadRouter } from "./routers/upload";
import { userRouter } from "./routers/user";
console.log("[TRACE] @_/api.trpc/router - after init import", Date.now());
export const appRouter = router({
  helloQuery: Procedure.public.query(() => "hello"),
  helloMutation: Procedure.public.mutation(() => `Hello at ${new Date()}`),
  upload: uploadRouter,
  user: userRouter,
});
export type AppRouter = typeof appRouter;
