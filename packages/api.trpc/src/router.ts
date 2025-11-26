import { router, Procedure } from "./init";
export const appRouter = router({
  helloQuery: Procedure.public.query(() => "hello"),
  helloMutation: Procedure.public.mutation(() => `Hello at ${new Date()}`),
});
export type AppRouter = typeof appRouter;
