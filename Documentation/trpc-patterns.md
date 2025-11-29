# tRPC v11 + TanStack React Query v5 Integration

This document covers the correct patterns for using tRPC v11 with TanStack React Query v5 in this template.

## Overview

tRPC v11 introduces a new TanStack React Query integration that uses native `queryOptions` and `mutationOptions` patterns instead of wrapped hooks. This provides better TypeScript inference, React Compiler compatibility, and follows TanStack Query's official patterns.

## Setup

### Dependencies

```bash
pnpm add @trpc/server@^11 @trpc/client@^11 @trpc/tanstack-react-query @tanstack/react-query@^5
```

### Create tRPC Context (lib.client)

```typescript
// packages/lib.client/src/trpc.ts
import { createTRPCContext } from '@trpc/tanstack-react-query';
import type { AppRouter } from '@_/api.trpc';

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();
```

### App Provider Setup

```typescript
// apps/web/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { TRPCProvider } from '@_/features.client/lib';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url: '/api/trpc' })],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
```

## Usage Patterns

### Queries

Always use `useQuery` with `trpc.route.queryOptions()`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@_/features.client/lib';

function UserProfile() {
  const trpc = useTRPC();

  // Basic query
  const userQuery = useQuery(trpc.user.me.queryOptions());

  // Query with input
  const postsQuery = useQuery(trpc.posts.list.queryOptions({ limit: 10 }));

  // With TanStack Query options
  const expensiveQuery = useQuery(trpc.analytics.compute.queryOptions(
    { range: '7d' },
    { staleTime: 5 * 60 * 1000 } // 5 minutes
  ));

  return (
    <div>
      {userQuery.isLoading && <p>Loading...</p>}
      {userQuery.data && <p>Hello, {userQuery.data.name}</p>}
    </div>
  );
}
```

### Conditional Queries (skipToken)

```typescript
import { useQuery, skipToken } from '@tanstack/react-query';
import { useTRPC } from '@_/features.client/lib';

function UserDetails({ userId }: { userId?: string }) {
  const trpc = useTRPC();

  // Query only runs when userId is defined
  const userQuery = useQuery(
    trpc.user.getById.queryOptions(userId ? { id: userId } : skipToken)
  );

  return <div>{userQuery.data?.name}</div>;
}
```

### Mutations

Always use `useMutation` with `trpc.route.mutationOptions()`:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@_/features.client/lib';

function CreatePost() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Basic mutation
  const createMutation = useMutation(trpc.posts.create.mutationOptions());

  // Mutation with callbacks
  const updateMutation = useMutation(trpc.posts.update.mutationOptions({
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: trpc.posts.list.queryKey() });
    },
    onError: (error) => {
      console.error('Update failed:', error.message);
    },
  }));

  const handleCreate = () => {
    createMutation.mutate({ title: 'New Post', content: '...' });
  };

  return (
    <button
      onClick={handleCreate}
      disabled={createMutation.isPending}
    >
      {createMutation.isPending ? 'Creating...' : 'Create Post'}
    </button>
  );
}
```

### Cache Invalidation

```typescript
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useTRPC } from '@_/features.client/lib';

function ProfileEditor() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateProfile = useMutation(trpc.user.updateProfile.mutationOptions({
    onSuccess: () => {
      // Invalidate specific query
      queryClient.invalidateQueries({ queryKey: trpc.user.me.queryKey() });

      // Invalidate all queries under a path
      queryClient.invalidateQueries({ queryKey: trpc.user.pathKey() });

      // Invalidate everything
      queryClient.invalidateQueries({ queryKey: trpc.pathKey() });
    },
  }));

  return <form onSubmit={() => updateProfile.mutate({ name: 'New Name' })} />;
}
```

### Query Keys

```typescript
const trpc = useTRPC();

// Full query key for specific query
const userQueryKey = trpc.user.me.queryKey();

// Path key for all queries under user.*
const userPathKey = trpc.user.pathKey();

// Root key for all tRPC queries
const rootKey = trpc.pathKey();
```

### Prefetching

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@_/features.client/lib';

function PostsList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const prefetchPost = (id: string) => {
    queryClient.prefetchQuery(trpc.posts.getById.queryOptions({ id }));
  };

  return (
    <ul>
      {posts.map(post => (
        <li
          key={post.id}
          onMouseEnter={() => prefetchPost(post.id)}
        >
          {post.title}
        </li>
      ))}
    </ul>
  );
}
```

### Suspense Queries

```typescript
import { useSuspenseQuery } from '@tanstack/react-query';
import { useTRPC } from '@_/features.client/lib';

function UserProfile() {
  const trpc = useTRPC();

  // This will suspend until data is loaded
  const { data: user } = useSuspenseQuery(trpc.user.me.queryOptions());

  return <p>Hello, {user.name}</p>;
}
```

### Infinite Queries

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTRPC } from '@_/features.client/lib';

function InfinitePosts() {
  const trpc = useTRPC();

  const postsQuery = useInfiniteQuery(
    trpc.posts.infinite.infiniteQueryOptions(
      { limit: 10 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
    )
  );

  return (
    <div>
      {postsQuery.data?.pages.flatMap(page => page.items).map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
      <button
        onClick={() => postsQuery.fetchNextPage()}
        disabled={!postsQuery.hasNextPage}
      >
        Load More
      </button>
    </div>
  );
}
```

## Type Inference

```typescript
import type { inferInput, inferOutput } from '@trpc/tanstack-react-query';
import type { useTRPC } from '@_/features.client/lib';

// Infer input type for a procedure
type CreatePostInput = inferInput<ReturnType<typeof useTRPC>['posts']['create']>;

// Infer output type for a procedure
type UserOutput = inferOutput<ReturnType<typeof useTRPC>['user']['me']>;
```

## Direct Client Access

For server-side or non-React contexts:

```typescript
import { useTRPCClient } from '@_/features.client/lib';

function Component() {
  const client = useTRPCClient();

  const handleAction = async () => {
    // Direct client call (no React Query caching)
    const result = await client.user.me.query();
    const created = await client.posts.create.mutate({ title: 'Hello' });
  };
}
```

## Feature Provider Pattern

Use this pattern in `features.client` for composable feature contexts:

```typescript
import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@_/features.client/lib';

type ProfileFeaturesValue = {
  profile: User | undefined;
  isLoadingProfile: boolean;
  updateProfileMutation: ReturnType<typeof useMutation>;
};

const ProfileFeaturesContext = createContext<ProfileFeaturesValue | null>(null);

export function useProfileFeatures() {
  const ctx = useContext(ProfileFeaturesContext);
  if (!ctx) throw new Error('useProfileFeatures must be used within ProfileFeaturesProvider');
  return ctx;
}

export function createProfileFeatures() {
  return function ProfileFeaturesProvider({ children }: { children: ReactNode }) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    // Queries - use queryOptions pattern
    const profileQuery = useQuery(trpc.user.me.queryOptions());

    // Mutations - use mutationOptions pattern
    const updateProfileMutation = useMutation(trpc.user.updateProfile.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.user.me.queryKey() });
      },
    }));

    return (
      <ProfileFeaturesContext.Provider value={{
        profile: profileQuery.data,
        isLoadingProfile: profileQuery.isLoading,
        updateProfileMutation,
      }}>
        {children}
      </ProfileFeaturesContext.Provider>
    );
  };
}
```

## Migration Notes

If migrating from tRPC v10 or the classic React Query integration:

1. Replace `trpc.user.me.useQuery()` with `useQuery(trpc.user.me.queryOptions())`
2. Replace `trpc.posts.create.useMutation()` with `useMutation(trpc.posts.create.mutationOptions())`
3. Replace `isLoading` with `isPending` (TanStack Query v5 change)
4. Import hooks from `@tanstack/react-query` directly, not from tRPC

## Sources

- [Introducing the new TanStack React Query integration](https://trpc.io/blog/introducing-tanstack-react-query-client)
- [TanStack React Query Usage](https://trpc.io/docs/client/tanstack-react-query/usage)
- [TanStack React Query Setup](https://trpc.io/docs/client/tanstack-react-query/setup)
- [Migrate from v10 to v11](https://trpc.io/docs/migrate-from-v10-to-v11)
