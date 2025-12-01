# @_/api.trpc

tRPC router with type-safe procedures.

## Purpose

Thin wrapper layer over services. Handles input validation and auth middleware.

## Exports

```typescript
import { appRouter, type AppRouter } from '@_/api.trpc';
import { router, Procedure } from '@_/api.trpc/init';
import { createTRPCHandler } from '@_/api.trpc/handler';
```

## Usage

```typescript
// Define a router
export const userRouter = router({
  me: Procedure.protected.query(({ ctx }) => UserService.me(ctx)),

  updateProfile: Procedure.protected
    .input(z.object({ name: z.string().optional() }))
    .mutation(({ ctx, input }) => UserService.updateProfile(ctx, input)),
});
```

**Procedure types:**
- `Procedure.public` - No auth required
- `Procedure.protected` - Requires authenticated user

## See Also

- [ARCHITECTURE.md](../../ARCHITECTURE.md) for data flow and service patterns
