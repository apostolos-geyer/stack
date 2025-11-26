import {
  fetchRequestHandler,
  FetchCreateContextFn,
} from "@trpc/server/adapters/fetch";

import { appRouter, type AppRouter } from "./router";

type FetchHandlerConfig = {
  ctx: FetchCreateContextFn<AppRouter>;
  endpoint?: string;
};

export const CreateFetchHandler =
  ({ ctx, endpoint = "/api/trpc" }: FetchHandlerConfig) =>
  async (req: Request) =>
    fetchRequestHandler({
      endpoint,
      req,
      createContext: ctx,
      router: appRouter,
    });
