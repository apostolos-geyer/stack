import 'server-only';
import { appRouter, type ContextSource } from '@_/api.trpc';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import {
  createTRPCOptionsProxy,
  type TRPCQueryOptions,
} from '@trpc/tanstack-react-query';
import { cache } from 'react';
import { makeQueryClient } from './query-client';

type Opts = ReturnType<TRPCQueryOptions<any>>;

const getQueryClient = cache(makeQueryClient);

export const CreateTRPCOptionsProxy = cache((ctx: ContextSource) =>
  createTRPCOptionsProxy({
    ctx,
    router: appRouter,
    queryClient: getQueryClient,
  }),
);

const isInfinite = <T extends Opts>(opts: T) =>
  opts.queryKey[1]?.type === 'infinite';

export const prefetch = <T extends Opts>(...opts: T[]) =>
  Promise.all(
    opts.map((opt) =>
      isInfinite(opt)
        ? getQueryClient().prefetchInfiniteQuery(opt as any)
        : getQueryClient().prefetchQuery(opt),
    ),
  );

export type HydrateClientProps = Omit<
  React.ComponentProps<typeof HydrationBoundary>,
  'state'
>;

export function HydrateClient({ queryClient, ...props }: HydrateClientProps) {
  const _queryClient = queryClient ?? getQueryClient();
  return <HydrationBoundary state={dehydrate(_queryClient)} {...props} />;
}

export type HydrateQueriesProps<T extends Opts> = Omit<
  HydrateClientProps,
  'queryClient'
> & {
  queryOptions: T[];
};

export function HydrateQueries<T extends Opts>({
  queryOptions,
  ...props
}: HydrateQueriesProps<T>) {
  void prefetch(...queryOptions);
  return <HydrateClient {...props} />;
}
