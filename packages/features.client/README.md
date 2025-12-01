# @_/features.client

Client-side React hooks, providers, and mutations.

## Purpose

Cross-platform feature logic for web and native. Provides React Context providers with hooks for auth, uploads, admin, etc.

## Exports

```typescript
// tRPC + React Query
import { TRPCQueryClientProvider, useTRPC } from '@_/features.client/lib';
import { Provide } from '@_/features.client/lib';

// Auth features
import { createAuthFeatures, useAuthFeatures } from '@_/features.client/auth';
import { useSignInMutation, useSignOutMutation } from '@_/features.client/auth/hooks';

// Upload
import { useUpload } from '@_/features.client/upload';
```

## Usage

```typescript
// Wrap page with feature providers
const Page = Provide(
  [createAuthFeatures(authClient)],
  function Page() {
    const { session } = useAuthFeatures();
    const trpc = useTRPC();
    const user = useQuery(trpc.user.me.queryOptions());
  }
);
```

## See Also

- [ARCHITECTURE.md](../../ARCHITECTURE.md) for Feature Provider pattern and tRPC client usage
