# @_/features

Server-side features: services, context, and auth configuration.

## Purpose

Contains business logic (services), context types, and better-auth setup. Used by `api.trpc` and `api.http`.

## Exports

```typescript
// Context
import { createInnerContext, type InnerContext, type AuthenticatedContext } from '@_/features/context';

// Auth
import { auth } from '@_/features/auth';
import { authClient } from '@_/features/auth/client';

// Services
import { UserService } from '@_/features/core/services/user.service';
```

## Usage

```typescript
// Service pattern - first param is always context
const user = await UserService.getById(ctx, userId);
const me = await UserService.me(ctx); // requires AuthenticatedContext
```

## See Also

- [ARCHITECTURE.md](../../ARCHITECTURE.md) for context system and service patterns
